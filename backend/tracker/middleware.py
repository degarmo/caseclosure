# middleware.py - Tracking Middleware for Processing Events and Detecting Suspicious Behavior

import json
import uuid
import hashlib
import time
from datetime import datetime, timedelta
from typing import Dict, Any, Optional, List
from django.utils import timezone
from django.core.cache import cache
from django.http import HttpRequest, HttpResponse, JsonResponse
from django.utils.deprecation import MiddlewareMixin
from django.conf import settings
from user_agents import parse
import logging
import re
from ipaddress import ip_address, ip_network

from .models import (
    TrackingEvent, UserSession, SuspiciousActivity,
    DeviceFingerprint, Alert, Case
)

logger = logging.getLogger(__name__)


class TrackingMiddleware(MiddlewareMixin):
    """
    Main tracking middleware that processes all requests and tracks user behavior
    """
    
    def __init__(self, get_response):
        self.get_response = get_response
        
        # Suspicious behavior thresholds
        self.thresholds = {
            'requests_per_minute': 60,
            'requests_per_second': 10,
            'failed_attempts': 5,
            'page_views_per_session': 100,
            'forms_per_minute': 5,
            'copy_events_threshold': 20,
        }
        
        # Paths to exclude from tracking
        self.excluded_paths = [
            '/admin/',
            '/static/',
            '/media/',
            '/__debug__/',
            '/favicon.ico',
            '/robots.txt',
        ]
        
        # API endpoints that need special handling
        self.api_endpoints = [
            '/api/track',
            '/api/dashboard/',
            '/api/suspicious/',
        ]
        
        # Initialize VPN/Proxy detection lists (would be loaded from external source)
        self.vpn_ranges = self.load_vpn_ranges()
        self.known_proxies = self.load_known_proxies()
        
    def __call__(self, request):
        """Process the request through middleware"""
        # Skip excluded paths
        if self.should_exclude_path(request.path):
            return self.get_response(request)
        
        # Process tracking before request
        self.process_request(request)
        
        # Get response
        response = self.get_response(request)
        
        # Process tracking after response
        self.process_response(request, response)
        
        return response
    
    def process_request(self, request: HttpRequest) -> None:
        """
        Process incoming request and attach tracking data
        """
        start_time = time.time()
        
        # Get or create session
        session_data = self.get_or_create_session(request)
        request.tracking_session = session_data
        
        # Extract tracking information
        tracking_info = self.extract_tracking_info(request)
        request.tracking_info = tracking_info
        
        # Check for suspicious patterns
        suspicious_indicators = self.detect_suspicious_patterns(request, tracking_info)
        request.suspicious_indicators = suspicious_indicators
        
        # Rate limiting check
        if self.check_rate_limits(request, tracking_info):
            request.rate_limited = True
            suspicious_indicators['rate_limit_exceeded'] = True
        
        # Store request start time
        request.tracking_start_time = start_time
        
        # Log tracking data
        self.log_tracking_data(request, tracking_info, suspicious_indicators)
    
    def process_response(self, request: HttpRequest, response: HttpResponse) -> HttpResponse:
        """
        Process response and create tracking event
        """
        # Skip if path is excluded or no tracking info
        if self.should_exclude_path(request.path) or not hasattr(request, 'tracking_info'):
            return response
        
        # Calculate request duration
        duration = time.time() - getattr(request, 'tracking_start_time', time.time())
        
        # Create tracking event if this is a page view or API call
        if self.should_create_event(request, response):
            event = self.create_tracking_event(request, response, duration)
            
            # Run suspicious behavior analysis
            if event and hasattr(request, 'suspicious_indicators'):
                self.analyze_suspicious_behavior(event, request.suspicious_indicators)
        
        # Add tracking headers to response
        if hasattr(request, 'tracking_session'):
            response['X-Session-ID'] = request.tracking_session.get('session_id', '')
            response['X-Request-ID'] = str(uuid.uuid4())
        
        # Add security headers
        self.add_security_headers(response)
        
        return response
    
    def get_or_create_session(self, request: HttpRequest) -> Dict[str, Any]:
        """
        Get or create user session based on fingerprint and session ID
        """
        # Get session ID from cookie or create new one
        session_id = request.COOKIES.get('tracking_session_id')
        if not session_id:
            session_id = str(uuid.uuid4())
        
        # Get fingerprint from request
        fingerprint = self.extract_fingerprint(request)
        
        # Check cache first
        cache_key = f'session:{session_id}'
        cached_session = cache.get(cache_key)
        if cached_session:
            return cached_session
        
        # Get or create database session
        try:
            # Try to get case from request
            case = self.get_case_from_request(request)
            
            session, created = UserSession.objects.get_or_create(
                session_id=session_id,
                defaults={
                    'case': case,
                    'fingerprint_hash': fingerprint,
                    'ip_address': self.get_client_ip(request),
                    'user_agent': request.META.get('HTTP_USER_AGENT', ''),
                    'timezone': request.META.get('HTTP_TIMEZONE', ''),
                }
            )
            
            # Update last activity
            session.last_activity = timezone.now()
            session.page_views += 1
            session.save(update_fields=['last_activity', 'page_views'])
            
            session_data = {
                'session_id': session_id,
                'fingerprint': fingerprint,
                'created': created,
                'db_session': session,
            }
            
            # Cache for 5 minutes
            cache.set(cache_key, session_data, 300)
            
            return session_data
            
        except Exception as e:
            logger.error(f"Error creating session: {e}")
            return {
                'session_id': session_id,
                'fingerprint': fingerprint,
                'created': False,
                'error': str(e)
            }
    
    def extract_tracking_info(self, request: HttpRequest) -> Dict[str, Any]:
        """
        Extract comprehensive tracking information from request
        """
        # Get user agent data
        user_agent_string = request.META.get('HTTP_USER_AGENT', '')
        user_agent = parse(user_agent_string)
        
        # Get IP and location data
        ip = self.get_client_ip(request)
        
        tracking_info = {
            # Network information
            'ip_address': ip,
            'is_vpn': self.is_vpn(ip),
            'is_proxy': self.is_proxy(ip),
            'is_tor': self.is_tor(request),
            
            # Device information
            'user_agent': user_agent_string,
            'browser': user_agent.browser.family,
            'browser_version': user_agent.browser.version_string,
            'os': user_agent.os.family,
            'os_version': user_agent.os.version_string,
            'device_type': self.get_device_type(user_agent),
            'is_bot': user_agent.is_bot,
            'is_mobile': user_agent.is_mobile,
            'is_tablet': user_agent.is_tablet,
            
            # Request information
            'method': request.method,
            'path': request.path,
            'referrer': request.META.get('HTTP_REFERER', ''),
            'accept_language': request.META.get('HTTP_ACCEPT_LANGUAGE', ''),
            
            # Time information
            'timestamp': timezone.now(),
            'timezone': request.META.get('HTTP_TIMEZONE', ''),
            
            # Security checks
            'has_suspicious_headers': self.check_suspicious_headers(request),
            'has_malicious_payload': self.check_malicious_payload(request),
        }
        
        return tracking_info
    
    def extract_fingerprint(self, request: HttpRequest) -> str:
        """
        Generate device fingerprint from request
        """
        # Collect fingerprint components
        components = [
            request.META.get('HTTP_USER_AGENT', ''),
            request.META.get('HTTP_ACCEPT_LANGUAGE', ''),
            request.META.get('HTTP_ACCEPT_ENCODING', ''),
            request.META.get('HTTP_ACCEPT', ''),
            request.META.get('HTTP_DNT', ''),
            # Add more stable headers
        ]
        
        # Add canvas fingerprint if provided
        if 'HTTP_X_CANVAS_FINGERPRINT' in request.META:
            components.append(request.META['HTTP_X_CANVAS_FINGERPRINT'])
        
        # Generate hash
        fingerprint_string = '|'.join(components)
        return hashlib.sha256(fingerprint_string.encode()).hexdigest()
    
    def detect_suspicious_patterns(self, request: HttpRequest, tracking_info: Dict[str, Any]) -> Dict[str, bool]:
        """
        Detect various suspicious behavior patterns
        """
        indicators = {
            'rapid_requests': False,
            'unusual_hour': False,
            'vpn_usage': False,
            'proxy_usage': False,
            'tor_usage': False,
            'bot_detected': False,
            'malicious_payload': False,
            'suspicious_headers': False,
            'rate_limit_exceeded': False,
            'geo_inconsistency': False,
            'device_inconsistency': False,
            'referrer_spoofing': False,
            'session_hijacking': False,
        }
        
        # Check for rapid requests
        indicators['rapid_requests'] = self.check_rapid_requests(request)
        
        # Check for unusual access time
        hour = tracking_info['timestamp'].hour
        indicators['unusual_hour'] = 2 <= hour < 5
        
        # Network anomalies
        indicators['vpn_usage'] = tracking_info.get('is_vpn', False)
        indicators['proxy_usage'] = tracking_info.get('is_proxy', False)
        indicators['tor_usage'] = tracking_info.get('is_tor', False)
        
        # Bot detection
        indicators['bot_detected'] = tracking_info.get('is_bot', False)
        
        # Security threats
        indicators['malicious_payload'] = tracking_info.get('has_malicious_payload', False)
        indicators['suspicious_headers'] = tracking_info.get('has_suspicious_headers', False)
        
        # Check for geographic inconsistency
        if hasattr(request, 'tracking_session'):
            indicators['geo_inconsistency'] = self.check_geo_inconsistency(
                request.tracking_session.get('db_session'),
                tracking_info['ip_address']
            )
        
        # Check for device inconsistency
        if hasattr(request, 'tracking_session'):
            indicators['device_inconsistency'] = self.check_device_inconsistency(
                request.tracking_session.get('db_session'),
                tracking_info
            )
        
        # Check for referrer spoofing
        indicators['referrer_spoofing'] = self.check_referrer_spoofing(request)
        
        # Check for session hijacking attempts
        indicators['session_hijacking'] = self.check_session_hijacking(request)
        
        return indicators
    
    def check_rapid_requests(self, request: HttpRequest) -> bool:
        """
        Check if user is making requests too rapidly
        """
        ip = self.get_client_ip(request)
        cache_key = f'rapid_check:{ip}'
        
        # Get request timestamps from cache
        timestamps = cache.get(cache_key, [])
        now = time.time()
        
        # Remove old timestamps (older than 1 minute)
        timestamps = [t for t in timestamps if now - t < 60]
        
        # Add current timestamp
        timestamps.append(now)
        
        # Update cache
        cache.set(cache_key, timestamps, 60)
        
        # Check if exceeding threshold
        return len(timestamps) > self.thresholds['requests_per_minute']
    
    def check_rate_limits(self, request: HttpRequest, tracking_info: Dict[str, Any]) -> bool:
        """
        Check and enforce rate limits
        """
        ip = tracking_info['ip_address']
        
        # Check per-second rate limit
        second_key = f'rate_limit:second:{ip}:{int(time.time())}'
        second_count = cache.get(second_key, 0)
        
        if second_count >= self.thresholds['requests_per_second']:
            return True
        
        cache.set(second_key, second_count + 1, 2)
        
        # Check per-minute rate limit
        minute = int(time.time() / 60)
        minute_key = f'rate_limit:minute:{ip}:{minute}'
        minute_count = cache.get(minute_key, 0)
        
        if minute_count >= self.thresholds['requests_per_minute']:
            return True
        
        cache.set(minute_key, minute_count + 1, 62)
        
        return False
    
    def check_geo_inconsistency(self, session: Optional[UserSession], current_ip: str) -> bool:
        """
        Check for impossible travel / geographic inconsistencies
        """
        if not session or not session.ip_address:
            return False
        
        # If IP changed
        if session.ip_address != current_ip:
            # Check if the change happened too quickly for physical travel
            time_diff = (timezone.now() - session.last_activity).total_seconds() / 3600  # hours
            
            # This would use actual geo distance calculation in production
            # For now, just flag any IP change within 1 hour as suspicious
            if time_diff < 1:
                return True
        
        return False
    
    def check_device_inconsistency(self, session: Optional[UserSession], tracking_info: Dict[str, Any]) -> bool:
        """
        Check for device/browser inconsistencies
        """
        if not session:
            return False
        
        # Check if browser or OS changed mid-session
        if session.browser and session.browser != tracking_info['browser']:
            return True
        
        if session.os and session.os != tracking_info['os']:
            return True
        
        return False
    
    def check_referrer_spoofing(self, request: HttpRequest) -> bool:
        """
        Check for referrer spoofing attempts
        """
        referrer = request.META.get('HTTP_REFERER', '')
        
        if not referrer:
            return False
        
        # Check for suspicious referrer patterns
        suspicious_patterns = [
            r'https?://localhost',
            r'https?://127\.0\.0\.1',
            r'https?://192\.168\.',
            r'https?://10\.',
            r'file://',
            r'data:',
        ]
        
        for pattern in suspicious_patterns:
            if re.search(pattern, referrer, re.IGNORECASE):
                return True
        
        return False
    
    def check_session_hijacking(self, request: HttpRequest) -> bool:
        """
        Check for potential session hijacking
        """
        if not hasattr(request, 'tracking_session'):
            return False
        
        session_data = request.tracking_session
        
        # Check if fingerprint changed for same session ID
        if 'db_session' in session_data:
            db_session = session_data['db_session']
            current_fingerprint = session_data.get('fingerprint', '')
            
            if db_session.fingerprint_hash and db_session.fingerprint_hash != current_fingerprint:
                return True
        
        return False
    
    def check_suspicious_headers(self, request: HttpRequest) -> bool:
        """
        Check for suspicious HTTP headers
        """
        suspicious_headers = [
            'HTTP_X_FORWARDED_HOST',  # Potential host header injection
            'HTTP_X_ORIGINAL_URL',    # IIS specific, potential bypass
            'HTTP_X_REWRITE_URL',     # URL rewriting attempts
            'HTTP_PROXY_CONNECTION',  # Proxy header injection
        ]
        
        for header in suspicious_headers:
            if header in request.META:
                return True
        
        # Check for abnormal Accept headers
        accept = request.META.get('HTTP_ACCEPT', '')
        if accept and len(accept) > 500:  # Abnormally long
            return True
        
        return False
    
    def check_malicious_payload(self, request: HttpRequest) -> bool:
        """
        Check for malicious payloads in request data
        """
        patterns = [
            # SQL Injection
            r"(\bUNION\b.*\bSELECT\b|\bDROP\b.*\bTABLE\b)",
            r"(\bOR\b|\bAND\b)\s+[\'\"]?\d+[\'\"]?\s*=\s*[\'\"]?\d+",
            
            # XSS
            r"<script[^>]*>.*?</script>",
            r"javascript:",
            r"on\w+\s*=",
            
            # Command Injection
            r";\s*(ls|cat|wget|curl|nc|bash|sh)\s",
            r"\$\(.*\)",
            r"`.*`",
            
            # Path Traversal
            r"\.\./",
            r"\.\.\\",
            
            # XXE
            r"<!DOCTYPE[^>]*\[",
            r"<!ENTITY",
        ]
        
        # Check GET parameters
        for param in request.GET.values():
            for pattern in patterns:
                if re.search(pattern, str(param), re.IGNORECASE):
                    return True
        
        # Check POST data
        if request.method == 'POST' and hasattr(request, 'body'):
            try:
                body = request.body.decode('utf-8')
                for pattern in patterns:
                    if re.search(pattern, body, re.IGNORECASE):
                        return True
            except:
                pass
        
        return False
    
    def create_tracking_event(self, request: HttpRequest, response: HttpResponse, duration: float) -> Optional[TrackingEvent]:
        """
        Create a tracking event record
        """
        try:
            # Skip if no tracking info
            if not hasattr(request, 'tracking_info'):
                return None
            
            tracking_info = request.tracking_info
            session_data = getattr(request, 'tracking_session', {})
            
            # Determine event type
            event_type = self.determine_event_type(request, response)
            
            # Get case
            case = self.get_case_from_request(request)
            
            # Create event
            event = TrackingEvent.objects.create(
                case=case,
                session=session_data.get('db_session'),
                session_identifier=session_data.get('session_id', ''),
                fingerprint_hash=session_data.get('fingerprint', ''),
                event_type=event_type,
                page_url=request.path,
                referrer_url=tracking_info.get('referrer', ''),
                
                # Network info
                ip_address=tracking_info['ip_address'],
                is_vpn=tracking_info.get('is_vpn', False),
                is_proxy=tracking_info.get('is_proxy', False),
                is_tor=tracking_info.get('is_tor', False),
                
                # Device info
                user_agent=tracking_info['user_agent'],
                browser=tracking_info.get('browser', ''),
                browser_version=tracking_info.get('browser_version', ''),
                os=tracking_info.get('os', ''),
                os_version=tracking_info.get('os_version', ''),
                device_type=tracking_info.get('device_type', ''),
                
                # Time info
                timestamp=tracking_info['timestamp'],
                timezone=tracking_info.get('timezone', ''),
                is_unusual_hour=getattr(request, 'suspicious_indicators', {}).get('unusual_hour', False),
                
                # Response info
                time_on_page=int(duration),
            )
            
            return event
            
        except Exception as e:
            logger.error(f"Error creating tracking event: {e}")
            return None
    
    def analyze_suspicious_behavior(self, event: TrackingEvent, indicators: Dict[str, bool]) -> None:
        """
        Analyze and record suspicious behavior
        """
        # Count active indicators
        active_indicators = sum(1 for v in indicators.values() if v)
        
        if active_indicators == 0:
            return
        
        # Calculate severity based on indicators
        severity = self.calculate_severity(indicators)
        
        # Calculate confidence score
        confidence = min(active_indicators * 0.15, 1.0)
        
        # Update event with suspicious score
        event.suspicious_score = confidence
        event.is_suspicious = confidence > 0.5
        event.flags = indicators
        event.save(update_fields=['suspicious_score', 'is_suspicious', 'flags'])
        
        # Create suspicious activity record if warranted
        if confidence > 0.5 or severity >= 3:
            self.create_suspicious_activity(event, indicators, severity, confidence)
        
        # Create alert if critical
        if severity >= 4 or confidence > 0.8:
            self.create_security_alert(event, indicators, severity, confidence)
    
    def calculate_severity(self, indicators: Dict[str, bool]) -> int:
        """
        Calculate severity level based on indicators
        """
        severity_weights = {
            'malicious_payload': 5,
            'session_hijacking': 5,
            'bot_detected': 3,
            'tor_usage': 3,
            'geo_inconsistency': 4,
            'device_inconsistency': 3,
            'vpn_usage': 2,
            'proxy_usage': 2,
            'rapid_requests': 2,
            'rate_limit_exceeded': 3,
            'suspicious_headers': 3,
            'referrer_spoofing': 2,
            'unusual_hour': 1,
        }
        
        total_weight = sum(
            severity_weights.get(indicator, 1)
            for indicator, active in indicators.items()
            if active
        )
        
        # Convert to 1-5 scale
        if total_weight >= 10:
            return 5  # Critical
        elif total_weight >= 7:
            return 4  # High
        elif total_weight >= 4:
            return 3  # Medium
        elif total_weight >= 2:
            return 2  # Low
        else:
            return 1  # Minimal
    
    def create_suspicious_activity(self, event: TrackingEvent, indicators: Dict[str, bool], 
                                  severity: int, confidence: float) -> None:
        """
        Create suspicious activity record
        """
        # Determine primary activity type
        activity_type = self.determine_activity_type(indicators)
        
        SuspiciousActivity.objects.create(
            case=event.case,
            session=event.session,
            session_identifier=event.session_identifier,
            fingerprint_hash=event.fingerprint_hash,
            ip_address=event.ip_address,
            activity_type=activity_type,
            severity_level=severity,
            confidence_score=confidence,
            details={
                'indicators': indicators,
                'event_id': str(event.id),
                'path': event.page_url,
                'timestamp': event.timestamp.isoformat(),
            },
            evidence={
                'user_agent': event.user_agent,
                'referrer': event.referrer_url,
                'active_indicators': [k for k, v in indicators.items() if v],
            }
        )
    
    def create_security_alert(self, event: TrackingEvent, indicators: Dict[str, bool],
                             severity: int, confidence: float) -> None:
        """
        Create security alert for critical suspicious activity
        """
        Alert.objects.create(
            case=event.case,
            alert_type='suspicious_user',
            priority='critical' if severity == 5 else 'high',
            title=f"Critical Suspicious Activity Detected",
            message=f"User {event.fingerprint_hash[:16]} triggered {sum(indicators.values())} suspicious indicators",
            fingerprint_hash=event.fingerprint_hash,
            data={
                'event_id': str(event.id),
                'indicators': indicators,
                'severity': severity,
                'confidence': confidence,
                'ip_address': event.ip_address,
                'path': event.page_url,
            },
            recommended_actions=[
                'Review user activity history',
                'Check for data exfiltration attempts',
                'Consider blocking IP address' if severity == 5 else 'Monitor user closely',
                'Document incident for law enforcement' if severity >= 4 else 'Flag for review',
            ]
        )
    
    def determine_event_type(self, request: HttpRequest, response: HttpResponse) -> str:
        """
        Determine the type of tracking event
        """
        path = request.path.lower()
        method = request.method
        
        # API endpoints
        if '/api/' in path:
            if 'track' in path:
                return 'tracking_api'
            elif 'tip' in path:
                return 'tip_submit'
            elif 'contact' in path:
                return 'contact_submit'
            return 'api_call'
        
        # Form submissions
        if method == 'POST':
            if 'login' in path:
                return 'login_attempt'
            elif 'tip' in path:
                return 'tip_submit'
            elif 'contact' in path:
                return 'contact_submit'
            return 'form_submit'
        
        # Failed requests
        if response.status_code >= 400:
            if response.status_code == 404:
                return 'page_not_found'
            elif response.status_code >= 500:
                return 'server_error'
            return 'error_page'
        
        # Default to page view
        return 'page_view'
    
    def determine_activity_type(self, indicators: Dict[str, bool]) -> str:
        """
        Determine primary suspicious activity type from indicators
        """
        # Priority order for activity types
        if indicators.get('malicious_payload'):
            return 'sql_injection' if 'sql' in str(indicators) else 'xss_attempt'
        elif indicators.get('session_hijacking'):
            return 'credential_stuffing'
        elif indicators.get('bot_detected'):
            return 'bot_behavior'
        elif indicators.get('geo_inconsistency'):
            return 'geo_jump'
        elif indicators.get('rapid_requests') or indicators.get('rate_limit_exceeded'):
            return 'rapid_visits'
        elif indicators.get('tor_usage'):
            return 'tor_usage'
        elif indicators.get('vpn_usage') or indicators.get('proxy_usage'):
            return 'vpn_usage'
        elif indicators.get('unusual_hour'):
            return 'unusual_hour'
        else:
            return 'suspicious_pattern'
    
    def get_case_from_request(self, request: HttpRequest) -> Optional[Case]:
        """
        Extract case from request path or subdomain
        """
        # Try to get from path
        path_parts = request.path.strip('/').split('/')
        if len(path_parts) >= 2 and path_parts[0] == 'case':
            try:
                return Case.objects.get(slug=path_parts[1])
            except Case.DoesNotExist:
                pass
        
        # Try to get from subdomain
        host = request.get_host()
        if '.' in host:
            subdomain = host.split('.')[0]
            if subdomain not in ['www', 'api', 'admin']:
                try:
                    return Case.objects.get(slug=subdomain)
                except Case.DoesNotExist:
                    pass
        
        return None
    
    def get_client_ip(self, request: HttpRequest) -> str:
        """
        Get real client IP address
        """
        # Check for forwarded IP
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            return x_forwarded_for.split(',')[0].strip()
        
        # Check for real IP
        x_real_ip = request.META.get('HTTP_X_REAL_IP')
        if x_real_ip:
            return x_real_ip
        
        # Fall back to remote addr
        return request.META.get('REMOTE_ADDR', '0.0.0.0')
    
    def get_device_type(self, user_agent) -> str:
        """
        Determine device type from user agent
        """
        if user_agent.is_mobile:
            return 'mobile'
        elif user_agent.is_tablet:
            return 'tablet'
        elif user_agent.is_bot:
            return 'bot'
        else:
            return 'desktop'
    
    def is_vpn(self, ip: str) -> bool:
        """
        Check if IP is from known VPN service
        """
        # Check against VPN ranges
        try:
            ip_obj = ip_address(ip)
            for vpn_range in self.vpn_ranges:
                if ip_obj in ip_network(vpn_range):
                    return True
        except:
            pass
        
        return False
    
    def is_proxy(self, ip: str) -> bool:
        """
        Check if IP is from known proxy
        """
        return ip in self.known_proxies
    
    def is_tor(self, request: HttpRequest) -> bool:
        """
        Check if request is from Tor network
        """
        # Check for Tor exit node IPs
        # In production, this would check against Tor exit node list
        ip = self.get_client_ip(request)
        
        # Check for common Tor patterns
        if '.onion' in request.META.get('HTTP_HOST', ''):
            return True
        
        # Check user agent for Tor browser
        user_agent = request.META.get('HTTP_USER_AGENT', '').lower()
        if 'tor' in user_agent:
            return True
        
        return False
    
    def should_exclude_path(self, path: str) -> bool:
        """
        Check if path should be excluded from tracking
        """
        for excluded in self.excluded_paths:
            if path.startswith(excluded):
                return True
        return False
    
    def should_create_event(self, request: HttpRequest, response: HttpResponse) -> bool:
        """
        Determine if tracking event should be created
        """
        # Don't track static files
        if request.path.startswith('/static/') or request.path.startswith('/media/'):
            return False
        
        # Don't track health checks
        if request.path in ['/health/', '/ping/']:
            return False
        
        # Track everything else
        return True
    
    def add_security_headers(self, response: HttpResponse) -> None:
        """
        Add security headers to response
        """
        # Content Security Policy
        response['Content-Security-Policy'] = "default-src 'self'; script-src 'self' 'unsafe-inline';"
        
        # XSS Protection
        response['X-XSS-Protection'] = '1; mode=block'
        
        # Content Type Options
        response['X-Content-Type-Options'] = 'nosniff'
        
        # Frame Options
        response['X-Frame-Options'] = 'SAMEORIGIN'
        
        # Referrer Policy
        response['Referrer-Policy'] = 'strict-origin-when-cross-origin'
    
    def log_tracking_data(self, request: HttpRequest, tracking_info: Dict[str, Any], 
                         indicators: Dict[str, bool]) -> None:
        """
        Log tracking data for debugging
        """
        if settings.DEBUG:
            active_indicators = [k for k, v in indicators.items() if v]
            if active_indicators:
                logger.warning(
                    f"Suspicious indicators detected: {active_indicators} "
                    f"for IP {tracking_info['ip_address']} on path {request.path}"
                )
    
    def load_vpn_ranges(self) -> List[str]:
        """
        Load known VPN IP ranges
        """
        # In production, this would load from a database or external service
        return [
            '10.0.0.0/8',      # Example private range
            '172.16.0.0/12',   # Example private range
            # Add actual VPN ranges
        ]
    
    def load_known_proxies(self) -> set:
        """
        Load known proxy IP addresses
        """
        # In production, this would load from a database or external service
        return set()


class RateLimitMiddleware(MiddlewareMixin):
    """
    Specialized middleware for rate limiting
    """
    
    def __init__(self, get_response):
        self.get_response = get_response
        
        # Rate limit configurations
        self.limits = {
            'default': (100, 60),     # 100 requests per 60 seconds
            'api': (1000, 60),        # 1000 API requests per 60 seconds
            'auth': (5, 300),         # 5 auth attempts per 5 minutes
            'form': (10, 60),         # 10 form submissions per minute
        }
    
    def process_request(self, request):
        """
        Check rate limits before processing request
        """
        # Get rate limit key
        limit_type = self.get_limit_type(request)
        limit, window = self.limits[limit_type]
        
        # Get client identifier
        client_id = self.get_client_id(request)
        
        # Check rate limit
        if self.is_rate_limited(client_id, limit_type, limit, window):
            return JsonResponse(
                {'error': 'Rate limit exceeded. Please try again later.'},
                status=429
            )
        
        return None
    
    def get_limit_type(self, request):
        """
        Determine which rate limit to apply
        """
        path = request.path.lower()
        
        if '/api/' in path:
            return 'api'
        elif '/login' in path or '/auth' in path:
            return 'auth'
        elif request.method == 'POST':
            return 'form'
        else:
            return 'default'
    
    def get_client_id(self, request):
        """
        Get unique client identifier
        """
        # Use IP address as primary identifier
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0].strip()
        else:
            ip = request.META.get('REMOTE_ADDR', '0.0.0.0')
        
        # Add user ID if authenticated
        if request.user and request.user.is_authenticated:
            return f"{ip}:user:{request.user.id}"
        
        return f"{ip}:anon"
    
    def is_rate_limited(self, client_id, limit_type, limit, window):
        """
        Check if client has exceeded rate limit
        """
        cache_key = f'rate_limit:{limit_type}:{client_id}'
        
        # Get current request count
        request_count = cache.get(cache_key, 0)
        
        if request_count >= limit:
            return True
        
        # Increment counter
        cache.set(cache_key, request_count + 1, window)
        
        return False
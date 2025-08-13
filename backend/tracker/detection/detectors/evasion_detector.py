"""
Evasion Detection Module
Detects advanced evasion and anti-forensics techniques
"""

from datetime import datetime, timedelta
from typing import Dict, List, Any
from collections import defaultdict
import logging

logger = logging.getLogger(__name__)


class EvasionDetector:
    """Detects evasion and anti-forensic techniques"""
    
    def __init__(self, parent_detector):
        self.parent = parent_detector
        self.thresholds = parent_detector.thresholds
    
    def check_geographic_evasion(self, event, history: List[Dict]) -> Dict[str, Any]:
        """Enhanced geographic anomaly detection for criminal evasion"""
        result = {'triggered': False, 'score': 0.0, 'severity': 0, 'details': {}}
        
        if not history:
            return result
        
        evasion_score = 0.0
        evasion_details = {}
        
        # Check for impossible travel (lowered threshold)
        for h in history[:10]:
            if h.get('city') and event.ip_city and h['city'] != event.ip_city:
                time_diff = (event.timestamp - datetime.fromisoformat(h['timestamp'])).total_seconds() / 3600
                
                if time_diff > 0:
                    distance = self._calculate_precise_distance(
                        h.get('city'), h.get('country'),
                        event.ip_city, event.ip_country
                    )
                    
                    if distance > 0:
                        speed = distance / time_diff
                        
                        if speed > self.thresholds['geo_jump_speed']:
                            evasion_score += 8.0
                            evasion_details['impossible_travel'] = {
                                'speed_mph': speed,
                                'from': f"{h.get('city')}, {h.get('country')}",
                                'to': f"{event.ip_city}, {event.ip_country}",
                                'time_hours': time_diff
                            }
                            break
        
        # Check for systematic location hopping
        unique_countries = set(h.get('country') for h in history[:20] if h.get('country'))
        if len(unique_countries) > 5:
            evasion_score += 6.0
            evasion_details['country_hopping'] = list(unique_countries)
        
        # Check for border proximity patterns (near case location)
        if self._is_near_case_location(event) and self._has_evasion_pattern(history):
            evasion_score += 5.0
            evasion_details['border_evasion'] = True
        
        # Check for rural/remote access patterns
        if self._is_remote_location(event.ip_city, event.ip_country):
            evasion_score += 2.0
            evasion_details['remote_access'] = True
        
        if evasion_score > 0:
            result['triggered'] = True
            result['score'] = min(evasion_score, 10.0)
            result['severity'] = min(int(evasion_score / 2), 5)
            result['details'] = evasion_details
        
        return result
    
    def check_identity_manipulation(self, event, history: List[Dict]) -> Dict[str, Any]:
        """Detect identity manipulation attempts"""
        result = {'triggered': False, 'score': 0.0, 'severity': 0, 'details': {}}
        
        manipulation_score = 0.0
        manipulation_details = {}
        
        # Check for fingerprint spoofing
        if self._detect_fingerprint_spoofing(event, history):
            manipulation_score += 4.0
            manipulation_details['fingerprint_spoofing'] = True
        
        # Check for user agent rotation
        if self._detect_user_agent_rotation(history):
            manipulation_score += 3.0
            manipulation_details['user_agent_rotation'] = True
        
        # Check for identity splitting across platforms
        matches = self._find_fingerprint_matches(self._create_cross_platform_fingerprint(event))
        if self._detect_identity_splitting(matches):
            manipulation_score += 4.0
            manipulation_details['identity_splitting'] = True
        
        if manipulation_score > 0:
            result['triggered'] = True
            result['score'] = min(manipulation_score, 10.0)
            result['severity'] = min(int(manipulation_score / 2), 5)
            result['details'] = manipulation_details
        
        return result
    
    def check_advanced_evasion(self, event, history: List[Dict]) -> Dict[str, Any]:
        """Detect advanced technical evasion techniques"""
        result = {'triggered': False, 'score': 0.0, 'severity': 0, 'details': {}}
        
        evasion_techniques = []
        evasion_score = 0.0
        
        # Browser fingerprint evasion
        if self._detect_fingerprint_spoofing(event, history):
            evasion_techniques.append('fingerprint_spoofing')
            evasion_score += 3.0
        
        # Canvas fingerprinting evasion
        if self._detect_canvas_evasion(event):
            evasion_techniques.append('canvas_evasion')
            evasion_score += 2.0
        
        # Timezone manipulation
        if self._detect_timezone_spoofing(event, history):
            evasion_techniques.append('timezone_spoofing')
            evasion_score += 2.0
        
        # Header manipulation
        if self._detect_header_manipulation(event):
            evasion_techniques.append('header_manipulation')
            evasion_score += 2.0
        
        # Automation detection evasion
        if self._detect_automation_evasion(event, history):
            evasion_techniques.append('automation_evasion')
            evasion_score += 4.0
        
        # Cookie and tracking evasion
        cookie_clearing_ratio = self._calculate_cookie_clearing_ratio(history)
        if cookie_clearing_ratio > self.thresholds['cookie_clearing_frequency']:
            evasion_techniques.append('systematic_cookie_clearing')
            evasion_score += 2.0
        
        if evasion_techniques:
            result['triggered'] = True
            result['score'] = min(evasion_score, 10.0)
            result['severity'] = min(len(evasion_techniques), 5)
            result['details'] = {
                'techniques': evasion_techniques,
                'sophistication_level': 'HIGH' if len(evasion_techniques) > 3 else 'MEDIUM'
            }
        
        return result
    
    def check_criminal_vpn_usage(self, event, history: List[Dict]) -> Dict[str, Any]:
        """Enhanced VPN detection for criminal cases with lower threshold"""
        result = {'triggered': False, 'score': 0.0, 'severity': 0, 'details': {}}
        
        vpn_score = 0.0
        vpn_details = {}
        
        # Current event VPN check
        if event.is_vpn:
            vpn_score += 4.0
            vpn_details['current_vpn_usage'] = True
        
        # Historical VPN usage ratio (lower threshold for criminal cases)
        if history:
            vpn_count = sum(1 for h in history if h.get('is_vpn', False))
            vpn_ratio = vpn_count / len(history)
            
            if vpn_ratio > self.thresholds['vpn_usage_ratio']:
                vpn_score += 3.0 + (vpn_ratio * 2.0)
                vpn_details['vpn_ratio'] = vpn_ratio
        
        # Check for VPN provider switching
        if self._detect_vpn_provider_switching(history):
            vpn_score += 2.0
            vpn_details['vpn_switching'] = True
        
        if vpn_score > 0:
            result['triggered'] = True
            result['score'] = min(vpn_score, 10.0)
            result['severity'] = min(int(vpn_score / 2), 5)
            result['details'] = vpn_details
        
        return result
    
    def check_device_manipulation(self, event, history: List[Dict]) -> Dict[str, Any]:
        """Enhanced device switching detection for criminal evasion"""
        result = {'triggered': False, 'score': 0.0, 'severity': 0, 'details': {}}
        
        manipulation_score = 0.0
        manipulation_details = {}
        
        # Check rapid device switching
        if len(history) > 5:
            devices = []
            device_switches = 0
            last_device = None
            
            for h in history[:30]:  # Check more events
                device_id = f"{h.get('browser', '')}_{h.get('os', '')}_{h.get('device_type', '')}"
                devices.append(device_id)
                
                if last_device and last_device != device_id:
                    device_switches += 1
                last_device = device_id
            
            unique_devices = len(set(devices))
            
            if device_switches > self.thresholds['device_switches']:
                manipulation_score += min(device_switches * 0.8, 6.0)
                manipulation_details['device_switches'] = device_switches
                manipulation_details['unique_devices'] = unique_devices
        
        # Check for systematic device rotation
        if self._detect_systematic_device_rotation(history):
            manipulation_score += 3.0
            manipulation_details['systematic_rotation'] = True
        
        if manipulation_score > 0:
            result['triggered'] = True
            result['score'] = min(manipulation_score, 10.0)
            result['severity'] = min(int(manipulation_score / 2), 5)
            result['details'] = manipulation_details
        
        return result
    
    def check_proxy_chains(self, event, history: List[Dict]) -> Dict[str, Any]:
        """Enhanced proxy detection including proxy chains"""
        result = {'triggered': False, 'score': 0.0, 'severity': 0, 'details': {}}
        
        proxy_score = 0.0
        proxy_details = {}
        
        if event.is_proxy:
            proxy_score += 3.0
            proxy_details['proxy_detected'] = True
        
        # Check for proxy chain indicators
        if self._detect_proxy_chain(event, history):
            proxy_score += 4.0
            proxy_details['proxy_chain'] = True
        
        # Check for proxy provider switching
        if self._detect_proxy_switching(history):
            proxy_score += 2.0
            proxy_details['proxy_switching'] = True
        
        if proxy_score > 0:
            result['triggered'] = True
            result['score'] = min(proxy_score, 10.0)
            result['severity'] = min(int(proxy_score / 2), 5)
            result['details'] = proxy_details
        
        return result
    
    def detect_anti_forensic_behavior(self, event, history: List[Dict]) -> Dict[str, Any]:
        """Detect sophisticated anti-forensic techniques"""
        result = {'triggered': False, 'score': 0.0, 'severity': 0, 'details': {}}
        
        forensic_score = 0.0
        forensic_details = {}
        
        # BROWSER MANIPULATION
        if event.event_data:
            browser_data = event.event_data.get('browser_profile', {})
            
            # User agent rotation
            if self._detect_user_agent_rotation(history):
                forensic_score += 4.0
                forensic_details['user_agent_rotation'] = True
            
            # Referrer spoofing
            if self._detect_referrer_spoofing(event, history):
                forensic_score += 3.0
                forensic_details['referrer_spoofing'] = True
            
            # Header injection
            if self._detect_header_injection(event):
                forensic_score += 5.0
                forensic_details['header_injection'] = True
        
        # TIMING ATTACKS
        if self._detect_timing_attacks(event, history):
            forensic_score += 6.0
            forensic_details['timing_attacks'] = True
        
        # FINGERPRINT POISONING
        if self._detect_fingerprint_poisoning(event):
            forensic_score += 7.0
            forensic_details['fingerprint_poisoning'] = True
        
        # CACHE ANALYSIS
        if self._detect_cache_timing_analysis(event, history):
            forensic_score += 4.0
            forensic_details['cache_analysis'] = True
        
        if forensic_score > 0:
            result['triggered'] = True
            result['score'] = min(forensic_score, 10.0)
            result['severity'] = min(int(forensic_score / 2), 5)
            result['details'] = forensic_details
        
        return result
    
    # Helper methods
    
    def _calculate_precise_distance(self, city1: str, country1: str, city2: str, country2: str) -> float:
        """Calculate more precise distance estimation"""
        if country1 != country2:
            # International distances
            distance_map = {
                ('US', 'CA'): 500,   # US-Canada
                ('US', 'MX'): 1200,  # US-Mexico
                ('US', 'UK'): 4000,  # US-UK
                ('US', 'DE'): 4500,  # US-Germany
            }
            return distance_map.get((country1, country2), 5000)  # Default international
        elif city1 != city2:
            return 300  # Average domestic travel distance
        else:
            return 0
    
    def _is_near_case_location(self, event) -> bool:
        """Check if access is near case location"""
        case_country = "US"  # Example - would be configured
        case_state = "IL"    # Example
        return event.ip_country == case_country
    
    def _has_evasion_pattern(self, history: List[Dict]) -> bool:
        """Check for location evasion patterns"""
        countries = [h.get('country') for h in history[:20] if h.get('country')]
        unique_countries = set(countries)
        return len(unique_countries) > 3
    
    def _is_remote_location(self, city: str, country: str) -> bool:
        """Check if location is remote/rural"""
        remote_indicators = ['rural', 'village', 'remote']
        if city:
            return any(indicator in city.lower() for indicator in remote_indicators)
        return False
    
    def _detect_fingerprint_spoofing(self, event, history: List[Dict]) -> bool:
        """Detect browser fingerprint manipulation"""
        if len(history) < 5:
            return False
        
        fingerprint_changes = 0
        last_fingerprint = None
        
        for h in history[:10]:
            current_fp = f"{h.get('browser', '')}_{h.get('os', '')}_{h.get('device_type', '')}"
            if last_fingerprint and last_fingerprint != current_fp:
                fingerprint_changes += 1
            last_fingerprint = current_fp
        
        return fingerprint_changes > self.thresholds['fingerprint_changes']
    
    def _detect_user_agent_rotation(self, history: List[Dict]) -> bool:
        """Detect systematic user agent changes"""
        user_agents = [h.get('user_agent', '') for h in history[:20] if h.get('user_agent')]
        unique_agents = set(user_agents)
        return len(unique_agents) > 5
    
    def _create_cross_platform_fingerprint(self, event) -> Dict[str, Any]:
        """Create fingerprint that persists across platforms"""
        fingerprint = {
            'screen_resolution': event.event_data.get('screen_resolution') if event.event_data else None,
            'timezone': event.event_data.get('timezone') if event.event_data else None,
            'language': event.event_data.get('language') if event.event_data else None,
            'color_depth': event.event_data.get('color_depth') if event.event_data else None,
            'platform': event.event_data.get('platform') if event.event_data else None,
            'hardware_concurrency': event.event_data.get('hardware_concurrency') if event.event_data else None,
            'device_memory': event.event_data.get('device_memory') if event.event_data else None,
        }
        return fingerprint
    
    def _find_fingerprint_matches(self, fingerprint: Dict) -> List[str]:
        """Find matching fingerprints across platforms"""
        # Would query database for similar fingerprints
        matches = []
        return matches
    
    def _detect_identity_splitting(self, matches: List[str]) -> bool:
        """Detect if user is splitting identity across platforms"""
        return len(matches) > 2
    
    def _detect_canvas_evasion(self, event) -> bool:
        """Detect canvas fingerprinting evasion"""
        if not event.event_data:
            return False
        
        canvas_data = event.event_data.get('canvas_fingerprint', {})
        
        if isinstance(canvas_data, dict):
            if canvas_data.get('is_blank'):
                return True
            if canvas_data.get('has_noise'):
                return True
            if canvas_data.get('changes_per_request'):
                return True
        
        return False
    
    def _detect_timezone_spoofing(self, event, history: List[Dict]) -> bool:
        """Detect timezone manipulation"""
        if not event.event_data:
            return False
        
        current_timezone = event.event_data.get('timezone')
        
        # Check for timezone inconsistency with IP location
        if current_timezone and event.ip_country:
            if event.ip_country == 'US' and current_timezone not in ['EST', 'CST', 'MST', 'PST']:
                return True
        
        # Check for timezone changes
        if history:
            timezones = [h.get('timezone') for h in history[:10] if h.get('timezone')]
            unique_timezones = set(timezones)
            if len(unique_timezones) > 2:
                return True
        
        return False
    
    def _detect_header_manipulation(self, event) -> bool:
        """Detect HTTP header manipulation"""
        if not event.event_data:
            return False
        
        headers = event.event_data.get('headers', {})
        
        if isinstance(headers, dict):
            # Check for suspicious header combinations
            if 'User-Agent' in headers:
                ua = headers['User-Agent']
                if 'Windows' in ua and 'Mac' in str(event.os):
                    return True
                if 'Mobile' in ua and event.device_type == 'desktop':
                    return True
            
            # Check for privacy-focused headers
            privacy_headers = ['DNT', 'X-Do-Not-Track', 'X-Requested-With']
            privacy_count = sum(1 for h in privacy_headers if h in headers)
            if privacy_count > 2:
                return True
        
        return False
    
    def _detect_automation_evasion(self, event, history: List[Dict]) -> bool:
        """Detect automation detection evasion"""
        if not event.event_data:
            return False
        
        automation_data = event.event_data.get('automation_detection', {})
        
        if isinstance(automation_data, dict):
            if automation_data.get('puppeteer_stealth'):
                return True
            if automation_data.get('webdriver_hidden'):
                return True
            if automation_data.get('navigator_modified'):
                return True
        
        return False
    
    def _calculate_cookie_clearing_ratio(self, history: List[Dict]) -> float:
        """Calculate ratio of sessions with cleared cookies"""
        if not history:
            return 0.0
        
        sessions_with_cleared_cookies = 0
        total_sessions = 0
        
        last_session_id = None
        for h in history:
            session_id = h.get('session_identifier')
            if session_id != last_session_id:
                total_sessions += 1
                event_data = h.get('event_data', {})
                if isinstance(event_data, dict) and event_data.get('cookies_cleared'):
                    sessions_with_cleared_cookies += 1
                last_session_id = session_id
        
        if total_sessions > 0:
            return sessions_with_cleared_cookies / total_sessions
        return 0.0
    
    def _detect_vpn_provider_switching(self, history: List[Dict]) -> bool:
        """Detect switching between different VPN providers"""
        vpn_ips = [h.get('ip_address') for h in history if h.get('is_vpn')]
        if len(vpn_ips) < 3:
            return False
        
        # Check for different IP ranges
        ip_ranges = set()
        for ip in vpn_ips:
            if ip:
                parts = ip.split('.')
                if len(parts) >= 2:
                    ip_ranges.add(f"{parts[0]}.{parts[1]}")
        
        return len(ip_ranges) > 2
    
    def _detect_systematic_device_rotation(self, history: List[Dict]) -> bool:
        """Detect systematic rotation through devices"""
        devices = []
        for h in history[:30]:
            device_id = f"{h.get('browser', '')}_{h.get('os', '')}_{h.get('device_type', '')}"
            devices.append(device_id)
        
        # Check for repeating pattern
        if len(devices) > 10:
            # Look for ABCABC pattern
            pattern_length = 3
            for i in range(len(devices) - pattern_length * 2):
                pattern = devices[i:i+pattern_length]
                next_pattern = devices[i+pattern_length:i+pattern_length*2]
                if pattern == next_pattern:
                    return True
        
        return False
    
    def _detect_proxy_chain(self, event, history: List[Dict]) -> bool:
        """Detect use of proxy chains"""
        if not event.event_data:
            return False
        
        headers = event.event_data.get('headers', {})
        proxy_headers = ['X-Forwarded-For', 'Via', 'X-Real-IP']
        proxy_count = sum(1 for h in proxy_headers if h in headers)
        
        # Multiple proxy headers suggest chaining
        if proxy_count > 1:
            forwarded = headers.get('X-Forwarded-For', '')
            if ',' in forwarded:
                return True
        
        return False
    
    def _detect_proxy_switching(self, history: List[Dict]) -> bool:
        """Detect switching between proxy services"""
        proxy_ips = [h.get('ip_address') for h in history if h.get('is_proxy')]
        
        if len(proxy_ips) < 3:
            return False
        
        unique_proxies = set(proxy_ips)
        return len(unique_proxies) > 3
    
    def _detect_referrer_spoofing(self, event, history: List[Dict]) -> bool:
        """Detect referrer spoofing attempts"""
        if not event.referrer_url:
            return False
        
        # Check for impossible referrers
        if 'internal.admin' in event.referrer_url:
            return True
        
        # Check for referrer that doesn't match navigation flow
        if history and history[0].get('page_url'):
            last_page = history[0]['page_url']
            if event.referrer_url and last_page not in event.referrer_url:
                return True
        
        return False
    
    def _detect_header_injection(self, event) -> bool:
        """Detect header injection attempts"""
        if not event.event_data:
            return False
        
        headers = event.event_data.get('headers', {})
        
        # Check for suspicious headers
        suspicious_headers = ['X-Forwarded-For', 'X-Real-IP', 'X-Original-IP']
        for header in suspicious_headers:
            if header in headers and headers[header] != event.ip_address:
                return True
        
        return False
    
    def _detect_timing_attacks(self, event, history: List[Dict]) -> bool:
        """Detect timing-based attacks"""
        if len(history) < 10:
            return False
        
        # Check for requests at exact intervals
        timestamps = [datetime.fromisoformat(h['timestamp']) for h in history[:10]]
        intervals = []
        
        for i in range(1, len(timestamps)):
            interval = (timestamps[i] - timestamps[i-1]).total_seconds()
            intervals.append(interval)
        
        if intervals:
            avg_interval = sum(intervals) / len(intervals)
            variance = sum((i - avg_interval) ** 2 for i in intervals) / len(intervals)
            
            # Very low variance suggests automated timing attack
            return variance < 1.0
        
        return False
    
    def _detect_fingerprint_poisoning(self, event) -> bool:
        """Detect attempts to poison browser fingerprint"""
        if not event.event_data:
            return False
        
        fingerprint_data = event.event_data.get('fingerprint', {})
        
        # Check for impossible combinations
        if fingerprint_data.get('screen_resolution') == '9999x9999':
            return True
        
        if fingerprint_data.get('color_depth') not in [8, 16, 24, 32]:
            return True
        
        return False
    
    def _detect_cache_timing_analysis(self, event, history: List[Dict]) -> bool:
        """Detect cache timing analysis attempts"""
        if len(history) < 5:
            return False
        
        # Group requests by URL
        url_timings = defaultdict(list)
        for h in history:
            if h.get('page_url'):
                timing = h.get('response_time') or h.get('load_time') or 0
                url_timings[h['page_url']].append(timing)
        
        # Check for cache timing attack patterns
        for url, timings in url_timings.items():
            if len(timings) >= 3:
                timing_diffs = [abs(timings[i] - timings[i-1]) for i in range(1, len(timings))]
                
                # If timing differences are suspiciously consistent, might be cache analysis
                if timing_diffs and max(timing_diffs) < 50:  # Less than 50ms variance
                    return True
                
                # Check for binary search pattern in timings
                if len(timings) >= 4:
                    # Cache hits are typically much faster than cache misses
                    fast_times = [t for t in timings if t < 100]
                    slow_times = [t for t in timings if t > 500]
                    
                    # If we see both very fast and very slow times, could be cache probing
                    if len(fast_times) >= 2 and len(slow_times) >= 2:
                        return True
        
        return False
"""
Session Analysis Module
Analyzes session patterns, authentication behavior, and access patterns
"""

from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional
from collections import defaultdict
import logging

logger = logging.getLogger(__name__)


class SessionAnalyzer:
    """Analyzes user sessions and authentication patterns"""
    
    def __init__(self, parent_detector):
        self.parent = parent_detector
        self.thresholds = parent_detector.thresholds
    
    def check_criminal_session_patterns(self, event, session) -> Dict[str, Any]:
        """Enhanced session analysis for criminal behavior"""
        result = {'triggered': False, 'score': 0.0, 'severity': 0, 'details': {}}
        
        if not session:
            return result
        
        session_score = 0.0
        session_details = {}
        
        # Check for unusually long sessions
        if session.created_at:
            session_duration = (datetime.now() - session.created_at).total_seconds() / 3600
            if session_duration > self.thresholds['session_duration_suspicious']:
                session_score += 2.0
                session_details['long_session'] = session_duration
        
        # Check for micro-sessions (very short, frequent)
        if hasattr(session, 'duration') and session.duration and session.duration < 30:
            session_score += 1.0
            session_details['micro_session'] = True
        
        # Check for session with high activity but no meaningful interaction
        if (hasattr(session, 'page_views') and session.page_views > 15 and 
            hasattr(session, 'forms_submitted') and session.forms_submitted == 0):
            session_score += 2.0
            session_details['no_interaction'] = True
        
        # Check for session hopping
        if self._detect_session_hopping(session):
            session_score += 3.0
            session_details['session_hopping'] = True
        
        # Check for session replay attacks
        if self._detect_session_replay(session):
            session_score += 4.0
            session_details['session_replay'] = True
        
        # Check for abnormal session patterns
        abnormal_patterns = self._detect_abnormal_session_patterns(session)
        if abnormal_patterns:
            session_score += abnormal_patterns['score']
            session_details['abnormal_patterns'] = abnormal_patterns['patterns']
        
        if session_score > 0:
            result['triggered'] = True
            result['score'] = min(session_score, 10.0)
            result['severity'] = min(int(session_score / 2), 5)
            result['details'] = session_details
        
        return result
    
    def check_auth_evasion(self, event, history: List[Dict]) -> Dict[str, Any]:
        """Check for authentication evasion attempts"""
        result = {'triggered': False, 'score': 0.0, 'severity': 0, 'details': {}}
        
        evasion_score = 0.0
        evasion_details = {}
        
        # Check for failed login attempts (lower threshold)
        time_window = datetime.now() - timedelta(seconds=self.thresholds['failed_login_time'])
        failed_attempts = [
            h for h in history 
            if h.get('event_type') == 'login_fail' and 
            datetime.fromisoformat(h['timestamp']) > time_window
        ]
        
        if len(failed_attempts) >= self.thresholds['failed_login_attempts']:
            evasion_score += 4.0
            evasion_details['failed_logins'] = len(failed_attempts)
            
            # Check for credential stuffing patterns
            if self._detect_credential_stuffing(failed_attempts):
                evasion_score += 3.0
                evasion_details['credential_stuffing'] = True
        
        # Check for password reset abuse
        reset_attempts = [h for h in history if 'password_reset' in h.get('event_type', '')]
        if len(reset_attempts) > self.thresholds['password_reset_attempts']:
            evasion_score += 3.0
            evasion_details['password_reset_abuse'] = len(reset_attempts)
        
        # Check for multiple account creation attempts
        account_attempts = [h for h in history if 'account_create' in h.get('event_type', '')]
        if len(account_attempts) > self.thresholds['account_creation_attempts']:
            evasion_score += 2.0
            evasion_details['multiple_accounts'] = len(account_attempts)
        
        # Check for authentication bypass attempts
        if self._detect_auth_bypass_attempts(event, history):
            evasion_score += 5.0
            evasion_details['auth_bypass_attempt'] = True
        
        # Check for session fixation attempts
        if self._detect_session_fixation(event, history):
            evasion_score += 4.0
            evasion_details['session_fixation'] = True
        
        if evasion_score > 0:
            result['triggered'] = True
            result['score'] = min(evasion_score, 10.0)
            result['severity'] = min(int(evasion_score / 2), 5)
            result['details'] = evasion_details
        
        return result
    
    def analyze_session_lifecycle(self, session_id: str, history: List[Dict]) -> Dict[str, Any]:
        """Analyze complete session lifecycle for anomalies"""
        result = {
            'session_id': session_id,
            'anomalies': [],
            'risk_score': 0.0,
            'session_profile': {}
        }
        
        session_events = [h for h in history if h.get('session_identifier') == session_id]
        
        if not session_events:
            return result
        
        # Sort events by timestamp
        session_events.sort(key=lambda x: x['timestamp'])
        
        # Analyze session start
        start_anomalies = self._analyze_session_start(session_events[0])
        if start_anomalies:
            result['anomalies'].extend(start_anomalies)
            result['risk_score'] += len(start_anomalies) * 2
        
        # Analyze session progression
        progression_anomalies = self._analyze_session_progression(session_events)
        if progression_anomalies:
            result['anomalies'].extend(progression_anomalies)
            result['risk_score'] += len(progression_anomalies) * 1.5
        
        # Analyze session end
        if len(session_events) > 1:
            end_anomalies = self._analyze_session_end(session_events[-1])
            if end_anomalies:
                result['anomalies'].extend(end_anomalies)
                result['risk_score'] += len(end_anomalies) * 1
        
        # Build session profile
        result['session_profile'] = self._build_session_profile(session_events)
        
        # Cap risk score
        result['risk_score'] = min(result['risk_score'], 10.0)
        
        return result
    
    def detect_multi_session_patterns(self, fingerprint_hash: str, history: List[Dict]) -> Dict[str, Any]:
        """Detect patterns across multiple sessions"""
        result = {'triggered': False, 'score': 0.0, 'severity': 0, 'details': {}}
        
        # Group events by session
        sessions = defaultdict(list)
        for h in history:
            session_id = h.get('session_identifier')
            if session_id:
                sessions[session_id].append(h)
        
        if len(sessions) < 2:
            return result
        
        pattern_score = 0.0
        pattern_details = {}
        
        # Check for session chaining
        if self._detect_session_chaining(sessions):
            pattern_score += 4.0
            pattern_details['session_chaining'] = True
        
        # Check for parallel sessions
        if self._detect_parallel_sessions(sessions):
            pattern_score += 5.0
            pattern_details['parallel_sessions'] = True
        
        # Check for session timing patterns
        timing_pattern = self._analyze_session_timing(sessions)
        if timing_pattern['suspicious']:
            pattern_score += timing_pattern['score']
            pattern_details['timing_pattern'] = timing_pattern['pattern']
        
        # Check for session fingerprint consistency
        if self._detect_fingerprint_inconsistency(sessions):
            pattern_score += 3.0
            pattern_details['fingerprint_inconsistency'] = True
        
        if pattern_score > 0:
            result['triggered'] = True
            result['score'] = min(pattern_score, 10.0)
            result['severity'] = min(int(pattern_score / 2), 5)
            result['details'] = pattern_details
        
        return result
    
    # Helper methods
    
    def _detect_session_hopping(self, session) -> bool:
        """Detect session hopping behavior"""
        if not hasattr(session, 'ip_addresses'):
            return False
        
        # Check for multiple IPs in single session
        if hasattr(session, 'ip_addresses') and len(session.ip_addresses) > 3:
            return True
        
        # Check for rapid device changes
        if hasattr(session, 'device_changes') and session.device_changes > 2:
            return True
        
        return False
    
    def _detect_session_replay(self, session) -> bool:
        """Detect session replay attacks"""
        if not session:
            return False
        
        # Check for duplicate session tokens
        if hasattr(session, 'token_reuse_count') and session.token_reuse_count > 0:
            return True
        
        # Check for time anomalies
        if hasattr(session, 'time_anomalies') and session.time_anomalies:
            return True
        
        return False
    
    def _detect_abnormal_session_patterns(self, session) -> Dict[str, Any]:
        """Detect abnormal session patterns"""
        result = {'score': 0, 'patterns': []}
        
        if not session:
            return result
        
        # Check for automated patterns
        if hasattr(session, 'automation_score') and session.automation_score > 0.7:
            result['score'] += 3.0
            result['patterns'].append('automated_behavior')
        
        # Check for exploration patterns
        if hasattr(session, 'unique_pages') and session.unique_pages > 50:
            result['score'] += 2.0
            result['patterns'].append('extensive_exploration')
        
        # Check for focused patterns
        if hasattr(session, 'page_revisits') and session.page_revisits > 20:
            result['score'] += 2.0
            result['patterns'].append('obsessive_revisiting')
        
        return result
    
    def _detect_credential_stuffing(self, failed_attempts: List[Dict]) -> bool:
        """Detect credential stuffing patterns"""
        if len(failed_attempts) < 3:
            return False
        
        # Check for rapid attempts
        time_diffs = []
        for i in range(1, len(failed_attempts)):
            diff = (datetime.fromisoformat(failed_attempts[i]['timestamp']) - 
                   datetime.fromisoformat(failed_attempts[i-1]['timestamp'])).total_seconds()
            time_diffs.append(diff)
        
        # If attempts are very rapid and regular, likely credential stuffing
        if time_diffs:
            avg_diff = sum(time_diffs) / len(time_diffs)
            if avg_diff < 5:  # Less than 5 seconds between attempts
                return True
        
        # Check for different username attempts
        usernames = set()
        for attempt in failed_attempts:
            if attempt.get('event_data') and 'username' in attempt['event_data']:
                usernames.add(attempt['event_data']['username'])
        
        # Multiple usernames suggest credential stuffing
        return len(usernames) > 3
    
    def _detect_auth_bypass_attempts(self, event, history: List[Dict]) -> bool:
        """Detect authentication bypass attempts"""
        bypass_indicators = 0
        
        # Check for direct admin page access without auth
        admin_access = [h for h in history if 
                       'admin' in h.get('page_url', '').lower() and
                       h.get('authenticated') is False]
        if admin_access:
            bypass_indicators += 1
        
        # Check for parameter manipulation
        if event.event_data:
            params = event.event_data.get('url_parameters', {})
            if any(key in params for key in ['admin', 'auth', 'bypass', 'debug']):
                bypass_indicators += 1
        
        # Check for cookie manipulation
        cookie_events = [h for h in history if h.get('event_type') == 'cookie_modified']
        if len(cookie_events) > 2:
            bypass_indicators += 1
        
        return bypass_indicators >= 2
    
    def _detect_session_fixation(self, event, history: List[Dict]) -> bool:
        """Detect session fixation attempts"""
        # Check for session ID in URL
        if 'session=' in event.page_url or 'sid=' in event.page_url:
            return True
        
        # Check for session manipulation events
        session_events = [h for h in history if 
                         h.get('event_type') in ['session_modified', 'session_injected']]
        
        return len(session_events) > 0
    
    def _analyze_session_start(self, first_event: Dict) -> List[str]:
        """Analyze session start for anomalies"""
        anomalies = []
        
        # Check for direct deep link access
        if 'evidence' in first_event.get('page_url', '') or 'private' in first_event.get('page_url', ''):
            anomalies.append('direct_sensitive_access')
        
        # Check for missing referrer on first visit
        if not first_event.get('referrer_url'):
            anomalies.append('no_referrer')
        
        # Check for suspicious user agent
        if first_event.get('user_agent'):
            ua = first_event['user_agent'].lower()
            if any(bot in ua for bot in ['bot', 'crawler', 'spider', 'scraper']):
                anomalies.append('bot_user_agent')
        
        return anomalies
    
    def _analyze_session_progression(self, events: List[Dict]) -> List[str]:
        """Analyze session progression for anomalies"""
        anomalies = []
        
        # Check for non-human navigation patterns
        page_times = [e.get('time_on_page', 0) for e in events if e.get('time_on_page')]
        if page_times and all(t < 1 for t in page_times):
            anomalies.append('no_reading_time')
        
        # Check for systematic crawling
        pages = [e.get('page_url', '') for e in events]
        if self._is_systematic_crawl(pages):
            anomalies.append('systematic_crawling')
        
        # Check for impossible navigation
        if self._has_impossible_navigation(events):
            anomalies.append('impossible_navigation')
        
        return anomalies
    
    def _analyze_session_end(self, last_event: Dict) -> List[str]:
        """Analyze session end for anomalies"""
        anomalies = []
        
        # Check for abrupt end after sensitive content
        if 'evidence' in last_event.get('page_url', '') and last_event.get('time_on_page', 0) < 2:
            anomalies.append('abrupt_sensitive_exit')
        
        # Check for logout bypass
        if last_event.get('event_type') != 'logout' and last_event.get('authenticated'):
            anomalies.append('no_proper_logout')
        
        return anomalies
    
    def _build_session_profile(self, events: List[Dict]) -> Dict[str, Any]:
        """Build comprehensive session profile"""
        profile = {
            'duration': 0,
            'page_count': len(events),
            'unique_pages': len(set(e.get('page_url', '') for e in events)),
            'avg_time_per_page': 0,
            'interaction_types': [],
            'devices_used': [],
            'ips_used': [],
            'peak_activity_time': None
        }
        
        if events:
            # Calculate duration
            start = datetime.fromisoformat(events[0]['timestamp'])
            end = datetime.fromisoformat(events[-1]['timestamp'])
            profile['duration'] = (end - start).total_seconds()
            
            # Calculate average time per page
            page_times = [e.get('time_on_page', 0) for e in events if e.get('time_on_page')]
            if page_times:
                profile['avg_time_per_page'] = sum(page_times) / len(page_times)
            
            # Collect interaction types
            profile['interaction_types'] = list(set(e.get('event_type', '') for e in events))
            
            # Collect devices and IPs
            profile['devices_used'] = list(set(f"{e.get('browser')}_{e.get('os')}" for e in events))
            profile['ips_used'] = list(set(e.get('ip_address', '') for e in events))
            
            # Find peak activity
            profile['peak_activity_time'] = self._find_peak_activity(events)
        
        return profile
    
    def _detect_session_chaining(self, sessions: Dict[str, List]) -> bool:
        """Detect session chaining patterns"""
        # Look for sessions that start immediately after another ends
        session_times = []
        
        for session_id, events in sessions.items():
            if events:
                start = datetime.fromisoformat(events[0]['timestamp'])
                end = datetime.fromisoformat(events[-1]['timestamp'])
                session_times.append((start, end))
        
        session_times.sort(key=lambda x: x[0])
        
        # Check for chaining
        for i in range(1, len(session_times)):
            gap = (session_times[i][0] - session_times[i-1][1]).total_seconds()
            if 0 <= gap < 10:  # Less than 10 seconds gap
                return True
        
        return False
    
    def _detect_parallel_sessions(self, sessions: Dict[str, List]) -> bool:
        """Detect parallel session usage"""
        # Check for overlapping sessions
        session_times = []
        
        for session_id, events in sessions.items():
            if events:
                start = datetime.fromisoformat(events[0]['timestamp'])
                end = datetime.fromisoformat(events[-1]['timestamp'])
                session_times.append((start, end))
        
        # Check for overlaps
        for i in range(len(session_times)):
            for j in range(i+1, len(session_times)):
                # Check if sessions overlap
                if (session_times[i][0] <= session_times[j][0] <= session_times[i][1] or
                    session_times[j][0] <= session_times[i][0] <= session_times[j][1]):
                    return True
        
        return False
    
    def _analyze_session_timing(self, sessions: Dict[str, List]) -> Dict[str, Any]:
        """Analyze timing patterns across sessions"""
        result = {'suspicious': False, 'score': 0, 'pattern': None}
        
        # Get session start times
        start_times = []
        for events in sessions.values():
            if events:
                start_times.append(datetime.fromisoformat(events[0]['timestamp']))
        
        if len(start_times) < 3:
            return result
        
        # Check for regular intervals
        start_times.sort()
        intervals = []
        for i in range(1, len(start_times)):
            intervals.append((start_times[i] - start_times[i-1]).total_seconds())
        
        if intervals:
            avg_interval = sum(intervals) / len(intervals)
            
            # Check for automated patterns
            if all(abs(i - avg_interval) < 60 for i in intervals):  # Within 1 minute
                result['suspicious'] = True
                result['score'] = 4.0
                result['pattern'] = 'regular_intervals'
        
        return result
    
    def _detect_fingerprint_inconsistency(self, sessions: Dict[str, List]) -> bool:
        """Detect fingerprint inconsistencies across sessions"""
        fingerprints = set()
        
        for events in sessions.values():
            for event in events:
                fp = f"{event.get('browser')}_{event.get('os')}_{event.get('device_type')}"
                fingerprints.add(fp)
        
        # Multiple fingerprints suggest evasion
        return len(fingerprints) > 3
    
    def _is_systematic_crawl(self, pages: List[str]) -> bool:
        """Check if pages suggest systematic crawling"""
        if len(pages) < 10:
            return False
        
        # Check for alphabetical or numerical order
        sorted_pages = sorted(pages)
        if pages == sorted_pages:
            return True
        
        # Check for pattern in URLs
        # Look for incrementing numbers
        import re
        numbers = []
        for page in pages:
            nums = re.findall(r'\d+', page)
            if nums:
                numbers.extend([int(n) for n in nums])
        
        if numbers and numbers == sorted(numbers):
            return True
        
        return False
    
    def _has_impossible_navigation(self, events: List[Dict]) -> bool:
        """Check for impossible navigation sequences"""
        for i in range(1, len(events)):
            curr_page = events[i].get('page_url', '')
            prev_page = events[i-1].get('page_url', '')
            
            # Check for direct access to pages that require navigation
            if 'step3' in curr_page and 'step2' not in prev_page:
                return True
            
            if 'confirm' in curr_page and 'submit' not in prev_page:
                return True
        
        return False
    
    def _find_peak_activity(self, events: List[Dict]) -> Optional[str]:
        """Find peak activity time in session"""
        if not events:
            return None
        
        # Group events by minute
        minute_counts = defaultdict(int)
        
        for event in events:
            timestamp = datetime.fromisoformat(event['timestamp'])
            minute_key = timestamp.replace(second=0, microsecond=0)
            minute_counts[minute_key] += 1
        
        if minute_counts:
            peak_minute = max(minute_counts, key=minute_counts.get)
            return peak_minute.isoformat()
        
        return None
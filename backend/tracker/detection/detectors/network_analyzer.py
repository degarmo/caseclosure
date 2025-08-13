"""
Network Analysis Module
Detects coordinated activity, cross-platform tracking, and contact probing
"""

from datetime import datetime, timedelta
from typing import Dict, List, Any
from collections import defaultdict
import logging

logger = logging.getLogger(__name__)


class NetworkAnalyzer:
    """Analyzes network patterns and coordinated activities"""
    
    def __init__(self, parent_detector):
        self.parent = parent_detector
        self.thresholds = parent_detector.thresholds
    
    def detect_coordinated_activity(self, event, all_recent_events: List) -> Dict[str, Any]:
        """Detect multiple people coordinating"""
        result = {'triggered': False, 'score': 0.0, 'severity': 0, 'details': {}}
        
        coordination_score = 0.0
        coordination_details = {}
        
        # Get events within 5 minutes
        time_window = event.timestamp - timedelta(minutes=5)
        nearby_events = [e for e in all_recent_events if e.timestamp > time_window]
        
        # SYNCHRONIZED VISITS
        unique_ips = set(e.ip_address for e in nearby_events)
        if len(unique_ips) > self.thresholds['synchronized_visit_threshold']:
            # Multiple IPs visiting within minutes
            coordination_score += 5.0
            coordination_details['synchronized_visits'] = len(unique_ips)
        
        # INFORMATION RELAY PATTERN
        if self._detect_information_relay(nearby_events):
            coordination_score += 6.0
            coordination_details['information_relay'] = True
        
        # DISTRIBUTED RECONNAISSANCE
        if self._detect_distributed_recon(nearby_events):
            coordination_score += 7.0
            coordination_details['distributed_reconnaissance'] = True
        
        # COMMUNICATION PATTERNS
        if self._detect_external_communication_correlation(nearby_events):
            coordination_score += 4.0
            coordination_details['communication_correlation'] = True
        
        # TIME COORDINATION
        if self._detect_time_coordination(nearby_events):
            coordination_score += 3.0
            coordination_details['time_synchronized'] = True
        
        # ROLE-BASED COORDINATION
        roles = self._identify_coordination_roles(nearby_events)
        if roles:
            coordination_score += 4.0
            coordination_details['identified_roles'] = roles
        
        if coordination_score > 0:
            result['triggered'] = True
            result['score'] = min(coordination_score, 10.0)
            result['severity'] = min(int(coordination_score / 2), 5)
            result['details'] = coordination_details
        
        return result
    
    def correlate_cross_platform(self, fingerprint_hash: str, event) -> Dict[str, Any]:
        """Track same user across different platforms"""
        result = {'triggered': False, 'score': 0.0, 'severity': 0, 'details': {}}
        
        correlation_score = 0.0
        correlation_details = {}
        
        # Create cross-platform fingerprint
        cross_fingerprint = self._create_cross_platform_fingerprint(event)
        
        # Check for matching fingerprints across platforms
        matches = self._find_fingerprint_matches(cross_fingerprint)
        
        if matches:
            correlation_score += 4.0
            correlation_details['cross_platform_matches'] = len(matches)
            
            # Check if trying to hide identity across platforms
            if self._detect_identity_splitting(matches):
                correlation_score += 5.0
                correlation_details['identity_splitting'] = True
        
        # Check for consistent behavioral patterns
        if self._detect_behavioral_consistency(fingerprint_hash, cross_fingerprint):
            correlation_score += 3.0
            correlation_details['behavioral_match'] = True
        
        # Check for timing correlations across platforms
        if self._detect_cross_platform_timing(fingerprint_hash):
            correlation_score += 2.0
            correlation_details['timing_correlation'] = True
        
        if correlation_score > 0:
            result['triggered'] = True
            result['score'] = min(correlation_score, 10.0)
            result['severity'] = min(int(correlation_score / 2), 5)
            result['details'] = correlation_details
        
        return result
    
    def check_contact_probing(self, event, history: List[Dict]) -> Dict[str, Any]:
        """Detect probing of contact forms and communication channels"""
        result = {'triggered': False, 'score': 0.0, 'severity': 0, 'details': {}}
        
        probing_score = 0.0
        probing_details = {}
        
        # Check for contact form testing
        contact_attempts = [h for h in history if 'contact' in h.get('page_url', '').lower()]
        if len(contact_attempts) > self.thresholds['contact_form_probing']:
            probing_score += 4.0
            probing_details['contact_form_testing'] = len(contact_attempts)
        
        # Check for tip submission failures
        tip_failures = [h for h in history if h.get('event_type') == 'tip_submission_fail']
        if len(tip_failures) > self.thresholds['tip_submission_failures']:
            probing_score += 3.0
            probing_details['tip_submission_probing'] = len(tip_failures)
        
        # Check for phone number harvesting
        if self._detect_phone_harvesting(history):
            probing_score += 5.0
            probing_details['phone_harvesting'] = True
        
        # Check for email validation attempts
        email_attempts = [h for h in history if 'email' in str(h.get('event_data', {}))]
        if len(email_attempts) > self.thresholds['email_validation_attempts']:
            probing_score += 3.0
            probing_details['email_probing'] = len(email_attempts)
        
        # Check for social media link exploration
        if self._detect_social_media_probing(history):
            probing_score += 2.0
            probing_details['social_media_probing'] = True
        
        # Check for communication channel testing
        if self._detect_channel_testing(event, history):
            probing_score += 3.0
            probing_details['channel_testing'] = True
        
        if probing_score > 0:
            result['triggered'] = True
            result['score'] = min(probing_score, 10.0)
            result['severity'] = min(int(probing_score / 2), 5)
            result['details'] = probing_details
        
        return result
    
    def analyze_network_patterns(self, event, history: List[Dict]) -> Dict[str, Any]:
        """Analyze broader network access patterns"""
        result = {'triggered': False, 'score': 0.0, 'severity': 0, 'details': {}}
        
        pattern_score = 0.0
        pattern_details = {}
        
        # Check for proxy/VPN network patterns
        network_hops = self._analyze_network_hops(event, history)
        if network_hops['suspicious']:
            pattern_score += network_hops['score']
            pattern_details['network_hops'] = network_hops['details']
        
        # Check for distributed access pattern
        if self._detect_distributed_access(history):
            pattern_score += 4.0
            pattern_details['distributed_access'] = True
        
        # Check for botnet-like patterns
        if self._detect_botnet_patterns(event, history):
            pattern_score += 6.0
            pattern_details['botnet_indicators'] = True
        
        if pattern_score > 0:
            result['triggered'] = True
            result['score'] = min(pattern_score, 10.0)
            result['severity'] = min(int(pattern_score / 2), 5)
            result['details'] = pattern_details
        
        return result
    
    # Helper methods
    
    def _detect_information_relay(self, events: List) -> bool:
        """Detect information relay pattern between users"""
        if len(events) < 2:
            return False
        
        # Check for sequential access to same content
        page_sequence = defaultdict(list)
        for e in events:
            page_sequence[e.page_url].append({
                'ip': e.ip_address,
                'time': e.timestamp
            })
        
        # Check if different IPs access same pages in sequence
        for page, accesses in page_sequence.items():
            if len(accesses) > 1:
                unique_ips = set(a['ip'] for a in accesses)
                if len(unique_ips) > 1:
                    # Check if access times suggest information relay
                    sorted_accesses = sorted(accesses, key=lambda x: x['time'])
                    for i in range(1, len(sorted_accesses)):
                        time_diff = (sorted_accesses[i]['time'] - sorted_accesses[i-1]['time']).total_seconds()
                        if time_diff < self.thresholds['coordination_time_window']:
                            return True
        return False
    
    def _detect_distributed_recon(self, events: List) -> bool:
        """Detect distributed reconnaissance pattern"""
        # Different IPs checking different aspects
        ip_pages = defaultdict(set)
        for e in events:
            ip_pages[e.ip_address].add(e.page_url)
        
        if len(ip_pages) < 2:
            return False
        
        # Check for non-overlapping page sets (division of labor)
        page_sets = list(ip_pages.values())
        for i in range(len(page_sets)):
            for j in range(i+1, len(page_sets)):
                # If sets don't overlap, might be coordinated recon
                if len(page_sets[i].intersection(page_sets[j])) == 0:
                    # But they should at least be accessing the same site
                    if len(page_sets[i]) > 2 and len(page_sets[j]) > 2:
                        return True
        return False
    
    def _detect_external_communication_correlation(self, events: List) -> bool:
        """Detect correlation with external communication"""
        if len(events) < 5:
            return False
        
        # Check for synchronized timing
        timestamps = [e.timestamp for e in events]
        time_diffs = []
        
        for i in range(1, len(timestamps)):
            diff = (timestamps[i] - timestamps[i-1]).total_seconds()
            time_diffs.append(diff)
        
        # Look for regular intervals (suggesting scheduled coordination)
        if time_diffs:
            avg_diff = sum(time_diffs) / len(time_diffs)
            variance = sum((d - avg_diff) ** 2 for d in time_diffs) / len(time_diffs)
            
            # Low variance suggests coordination
            return variance < 100
        
        return False
    
    def _detect_time_coordination(self, events: List) -> bool:
        """Detect if events are time-coordinated"""
        if len(events) < 3:
            return False
        
        # Group events by timestamp (within 1 second)
        time_groups = defaultdict(list)
        for e in events:
            time_key = e.timestamp.replace(microsecond=0)
            time_groups[time_key].append(e)
        
        # Check for multiple IPs acting at exact same time
        for time_key, group_events in time_groups.items():
            unique_ips = set(e.ip_address for e in group_events)
            if len(unique_ips) > 2:
                return True
        
        return False
    
    def _identify_coordination_roles(self, events: List) -> List[str]:
        """Identify potential roles in coordinated activity"""
        roles = []
        
        # Analyze event patterns for each IP
        ip_behaviors = defaultdict(list)
        for e in events:
            ip_behaviors[e.ip_address].append(e.event_type)
        
        for ip, behaviors in ip_behaviors.items():
            # Scout role - mostly viewing/reconnaissance
            if behaviors.count('page_view') > 5 and behaviors.count('form_submit') == 0:
                roles.append('scout')
            
            # Harvester role - downloading/copying
            elif any(b in ['download', 'copy', 'screenshot'] for b in behaviors):
                roles.append('harvester')
            
            # Prober role - testing forms/contacts
            elif any(b in ['form_submit', 'contact_attempt'] for b in behaviors):
                roles.append('prober')
            
            # Coordinator role - minimal activity but present
            elif len(behaviors) < 3:
                roles.append('coordinator')
        
        return list(set(roles))
    
    def _create_cross_platform_fingerprint(self, event) -> Dict[str, Any]:
        """Create fingerprint that persists across platforms"""
        fingerprint = {}
        
        if event.event_data:
            fingerprint = {
                'screen_resolution': event.event_data.get('screen_resolution'),
                'timezone': event.event_data.get('timezone'),
                'language': event.event_data.get('language'),
                'color_depth': event.event_data.get('color_depth'),
                'platform': event.event_data.get('platform'),
                'hardware_concurrency': event.event_data.get('hardware_concurrency'),
                'device_memory': event.event_data.get('device_memory'),
                'webgl_vendor': event.event_data.get('webgl_vendor'),
                'webgl_renderer': event.event_data.get('webgl_renderer'),
            }
        
        return fingerprint
    
    def _find_fingerprint_matches(self, fingerprint: Dict) -> List[str]:
        """Find matching fingerprints across platforms"""
        # In production, would query database for similar fingerprints
        # Placeholder implementation
        matches = []
        
        # Would compare against stored fingerprints
        # Looking for matching screen resolution, timezone, hardware, etc.
        
        return matches
    
    def _detect_identity_splitting(self, matches: List[str]) -> bool:
        """Detect if user is splitting identity across platforms"""
        # Check if matches show different personas but same fingerprint
        return len(matches) > 2
    
    def _detect_behavioral_consistency(self, fingerprint_hash: str, cross_fingerprint: Dict) -> bool:
        """Check for consistent behavior across platforms"""
        # Would compare behavioral patterns across different sessions
        # Placeholder implementation
        
        # In production, would check:
        # - Similar navigation patterns
        # - Similar timing patterns
        # - Similar content focus
        
        return False
    
    def _detect_cross_platform_timing(self, fingerprint_hash: str) -> bool:
        """Detect timing correlations across platforms"""
        # Would check if user accesses different platforms in sequence
        # Placeholder implementation
        return False
    
    def _detect_phone_harvesting(self, history: List[Dict]) -> bool:
        """Detect phone number harvesting"""
        import re
        phone_pattern = re.compile(r'\b\d{3}[-.]?\d{3}[-.]?\d{4}\b')
        
        phone_events = 0
        for h in history:
            if h.get('event_type') == 'copy':
                event_data = h.get('event_data', {})
                if isinstance(event_data, dict):
                    text = str(event_data.get('text', ''))
                    if phone_pattern.search(text):
                        phone_events += 1
        
        return phone_events > 2
    
    def _detect_social_media_probing(self, history: List[Dict]) -> bool:
        """Detect social media link exploration"""
        social_platforms = ['facebook', 'twitter', 'instagram', 'linkedin', 'tiktok']
        
        social_clicks = 0
        for h in history:
            if h.get('event_type') == 'external_link_click':
                url = h.get('event_data', {}).get('url', '').lower()
                if any(platform in url for platform in social_platforms):
                    social_clicks += 1
        
        return social_clicks > 3
    
    def _detect_channel_testing(self, event, history: List[Dict]) -> bool:
        """Detect testing of communication channels"""
        channel_tests = 0
        
        # Check for multiple contact form submissions
        form_submits = [h for h in history if h.get('event_type') == 'form_submit']
        if len(form_submits) > 2:
            channel_tests += 1
        
        # Check for chat/message system testing
        chat_events = [h for h in history if 'chat' in h.get('page_url', '').lower()]
        if len(chat_events) > 3:
            channel_tests += 1
        
        return channel_tests >= 2
    
    def _analyze_network_hops(self, event, history: List[Dict]) -> Dict[str, Any]:
        """Analyze network hop patterns"""
        result = {'suspicious': False, 'score': 0, 'details': {}}
        
        # Check for multiple proxy layers
        if event.event_data:
            headers = event.event_data.get('headers', {})
            
            # Check X-Forwarded-For for multiple IPs
            forwarded = headers.get('X-Forwarded-For', '')
            if ',' in forwarded:
                hop_count = len(forwarded.split(','))
                if hop_count > 2:
                    result['suspicious'] = True
                    result['score'] = min(hop_count * 2, 8)
                    result['details'] = {'hop_count': hop_count}
        
        return result
    
    def _detect_distributed_access(self, history: List[Dict]) -> bool:
        """Detect distributed access pattern"""
        # Check for access from multiple countries in short time
        countries = set()
        for h in history[:20]:
            if h.get('country'):
                countries.add(h['country'])
        
        return len(countries) > 4
    
    def _detect_botnet_patterns(self, event, history: List[Dict]) -> bool:
        """Detect botnet-like access patterns"""
        # Check for:
        # - Multiple IPs with identical user agents
        # - Synchronized actions
        # - Identical navigation patterns
        
        user_agents = defaultdict(set)
        for h in history:
            if h.get('user_agent'):
                user_agents[h['user_agent']].add(h.get('ip_address'))
        
        # If same user agent from many IPs, might be botnet
        for ua, ips in user_agents.items():
            if len(ips) > 5:
                return True
        
        return False
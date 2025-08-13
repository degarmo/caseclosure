"""
Criminal Indicator Detection Module
Detects critical criminal behavior patterns
"""

from datetime import datetime
from typing import Dict, List, Any
import logging

logger = logging.getLogger(__name__)


class CriminalIndicatorDetector:
    """Detects critical criminal behavior indicators"""
    
    def __init__(self, parent_detector):
        self.parent = parent_detector
        self.thresholds = parent_detector.thresholds
        self.risk_weights = parent_detector.risk_weights
    
    def check_tor_usage_criminal(self, event) -> Dict[str, Any]:
        """Enhanced Tor detection with zero tolerance for criminal cases"""
        result = {'triggered': False, 'score': 0.0, 'severity': 0, 'details': {}}
        
        if event.is_tor or self._is_tor_exit_node(event.ip_address):
            result['triggered'] = True
            result['score'] = 10.0  # Maximum score for Tor usage
            result['severity'] = 5
            result['details'] = {
                'tor_detected': True,
                'ip_address': event.ip_address,
                'risk_level': 'CRITICAL',
                'law_enforcement_flag': True
            }
        
        # Additional Tor detection methods
        if self._detect_tor_bridge(event) or self._detect_tor_obfuscation(event):
            result['triggered'] = True
            result['score'] = 10.0
            result['severity'] = 5
            result['details']['advanced_tor_usage'] = True
        
        return result
    
    def check_evidence_tampering(self, event, history: List[Dict]) -> Dict[str, Any]:
        """Detect attempts to tamper with or manipulate evidence"""
        result = {'triggered': False, 'score': 0.0, 'severity': 0, 'details': {}}
        
        tampering_indicators = []
        
        # Check for evidence page manipulation
        evidence_pages = [h for h in history if 'evidence' in h.get('page_url', '').lower()]
        if len(evidence_pages) > 5:
            # Check for suspicious interaction patterns
            for page in evidence_pages[-10:]:  # Last 10 evidence page visits
                if self._detect_tampering_behavior(page):
                    tampering_indicators.append('evidence_manipulation')
        
        # Check for timeline modification attempts
        timeline_events = [h for h in history if 'timeline' in h.get('page_url', '').lower()]
        if self._detect_timeline_tampering(timeline_events):
            tampering_indicators.append('timeline_tampering')
        
        # Check for photo/document manipulation attempts
        if self._detect_media_tampering(event, history):
            tampering_indicators.append('media_tampering')
        
        if tampering_indicators:
            result['triggered'] = True
            result['score'] = 10.0  # Critical score
            result['severity'] = 5
            result['details'] = {
                'tampering_types': tampering_indicators,
                'law_enforcement_alert': True,
                'preserve_evidence': True
            }
        
        return result
    
    def check_admin_probing(self, event, history: List[Dict]) -> Dict[str, Any]:
        """Detect admin access attempts"""
        result = {'triggered': False, 'score': 0.0, 'severity': 0, 'details': {}}
        
        admin_indicators = []
        admin_score = 0.0
        
        # Check current event
        admin_paths = ['/admin', '/wp-admin', '/administrator', '/backend', '/panel']
        for path in admin_paths:
            if path in event.page_url.lower():
                admin_score = 9.0
                admin_indicators.append(f'admin_access_{path}')
                break
        
        # Check history
        admin_attempts = [h for h in history if any(path in h.get('page_url', '').lower() for path in admin_paths)]
        if len(admin_attempts) >= self.thresholds['admin_page_probing']:
            admin_score = max(admin_score, 9.0)
            admin_indicators.append('repeated_admin_attempts')
        
        if admin_score > 0:
            result['triggered'] = True
            result['score'] = admin_score
            result['severity'] = 5
            result['details'] = {
                'admin_indicators': admin_indicators,
                'attempts_count': len(admin_attempts)
            }
        
        return result
    
    def check_victim_obsession(self, event, history: List[Dict]) -> Dict[str, Any]:
        """Detect obsessive focus on victim information"""
        result = {'triggered': False, 'score': 0.0, 'severity': 0, 'details': {}}
        
        # Calculate victim-related page ratio
        victim_pages = [h for h in history if self._is_victim_related_page(h.get('page_url', ''))]
        victim_ratio = len(victim_pages) / len(history) if history else 0
        
        # Check for victim photo obsession
        photo_views = [h for h in history if 'photo' in h.get('page_url', '').lower() or 'image' in h.get('page_url', '').lower()]
        
        # Check for victim name searches
        victim_searches = self._count_victim_name_searches(history)
        
        # Calculate obsession score
        obsession_score = 0.0
        obsession_details = {}
        
        if victim_ratio > self.thresholds['victim_info_focus_ratio']:
            obsession_score += 6.0
            obsession_details['high_victim_focus'] = victim_ratio
        
        if len(photo_views) > self.thresholds['victim_photo_downloads']:
            obsession_score += 3.0
            obsession_details['photo_obsession'] = len(photo_views)
        
        if victim_searches > self.thresholds['victim_name_searches']:
            obsession_score += 2.0
            obsession_details['name_searches'] = victim_searches
        
        # Check for victim personal info collection
        if self._detect_personal_info_collection(history):
            obsession_score += 4.0
            obsession_details['personal_info_collection'] = True
        
        if obsession_score > 0:
            result['triggered'] = True
            result['score'] = min(obsession_score, 10.0)
            result['severity'] = min(int(obsession_score / 2), 5)
            result['details'] = obsession_details
        
        return result
    
    def check_stalking_patterns(self, event, history: List[Dict]) -> Dict[str, Any]:
        """Detect stalking behavior patterns"""
        result = {'triggered': False, 'score': 0.0, 'severity': 0, 'details': {}}
        
        stalking_indicators = []
        stalking_score = 0.0
        
        # Check for night stalking pattern (11pm-4am)
        night_visits = [h for h in history if self._is_night_stalking_hour(h.get('timestamp'))]
        night_ratio = len(night_visits) / len(history) if history else 0
        
        if night_ratio > self.thresholds['night_stalking_ratio']:
            stalking_indicators.append('night_stalking')
            stalking_score += 5.0
        
        # Check for location obsession
        location_pages = [h for h in history if self._is_location_related(h.get('page_url', ''))]
        if len(location_pages) > self.thresholds['location_obsession_count']:
            stalking_indicators.append('location_obsession')
            stalking_score += 4.0
        
        # Check for family/friend targeting
        if self._detect_family_targeting(history):
            stalking_indicators.append('family_targeting')
            stalking_score += 6.0
        
        # Check for social media correlation
        if self._detect_social_media_stalking(event, history):
            stalking_indicators.append('social_media_stalking')
            stalking_score += 3.0
        
        # Check for repetitive visit patterns
        if self._detect_compulsive_checking(history):
            stalking_indicators.append('compulsive_checking')
            stalking_score += 2.0
        
        if stalking_indicators:
            result['triggered'] = True
            result['score'] = min(stalking_score, 10.0)
            result['severity'] = min(len(stalking_indicators) + 1, 5)
            result['details'] = {
                'patterns': stalking_indicators,
                'night_ratio': night_ratio,
                'risk_assessment': 'HIGH' if stalking_score > 7 else 'MEDIUM'
            }
        
        return result
    
    def check_witness_targeting(self, event, history: List[Dict]) -> Dict[str, Any]:
        """Detect targeting of witnesses or family members"""
        result = {'triggered': False, 'score': 0.0, 'severity': 0, 'details': {}}
        
        # Check for witness-related page focus
        witness_pages = [h for h in history if self._is_witness_related_page(h.get('page_url', ''))]
        witness_ratio = len(witness_pages) / len(history) if history else 0
        
        targeting_score = 0.0
        targeting_details = {}
        
        if witness_ratio > self.thresholds['witness_info_focus']:
            targeting_score += 7.0
            targeting_details['witness_focus_ratio'] = witness_ratio
        
        # Check for contact information harvesting
        if self._detect_contact_harvesting(history):
            targeting_score += 5.0
            targeting_details['contact_harvesting'] = True
        
        # Check for family member targeting
        if self._detect_family_targeting(history):
            targeting_score += 6.0
            targeting_details['family_targeting'] = True
        
        # Check for intimidation patterns
        if self._detect_intimidation_attempts(event, history):
            targeting_score += 8.0
            targeting_details['intimidation_detected'] = True
        
        if targeting_score > 0:
            result['triggered'] = True
            result['score'] = min(targeting_score, 10.0)
            result['severity'] = min(int(targeting_score / 2), 5)
            result['details'] = targeting_details
        
        return result
    
    # Helper methods
    
    def _is_tor_exit_node(self, ip_address: str) -> bool:
        """Check if IP is a known Tor exit node"""
        if not ip_address:
            return False
        # In production, would query Tor exit node database
        return False
    
    def _detect_tor_bridge(self, event) -> bool:
        """Detect Tor bridge usage"""
        # Would check for Tor bridge patterns
        return False
    
    def _detect_tor_obfuscation(self, event) -> bool:
        """Detect obfuscated Tor usage"""
        # Would check for obfuscated Tor patterns
        return False
    
    def _detect_tampering_behavior(self, page_data: Dict) -> bool:
        """Detect evidence tampering behavior"""
        if not page_data:
            return False
        
        event_type = page_data.get('event_type', '')
        
        # Check for form manipulation on evidence pages
        if event_type in ['form_modify', 'console_open', 'debugger_detected']:
            return True
        
        # Check for attempts to modify page content
        event_data = page_data.get('event_data', {})
        if isinstance(event_data, dict):
            if event_data.get('content_editable_modified'):
                return True
            if event_data.get('dom_manipulation_detected'):
                return True
        
        return False
    
    def _detect_timeline_tampering(self, timeline_events: List[Dict]) -> bool:
        """Detect timeline tampering attempts"""
        if len(timeline_events) < 3:
            return False
        
        tampering_indicators = 0
        
        for event in timeline_events:
            event_data = event.get('event_data', {})
            if not isinstance(event_data, dict):
                continue
                
            # Check for console usage on timeline pages
            if event_data.get('console_opened'):
                tampering_indicators += 1
            
            # Check for inspect element usage
            if event_data.get('inspect_element'):
                tampering_indicators += 1
            
            # Check for unusual interactions
            if event.get('event_type') in ['right_click', 'select_text', 'copy']:
                tampering_indicators += 1
        
        return tampering_indicators >= 3
    
    def _detect_media_tampering(self, event, history: List[Dict]) -> bool:
        """Detect media tampering attempts"""
        media_events = [h for h in history if 
                       any(term in h.get('page_url', '').lower() for term in ['photo', 'image', 'video'])]
        
        tampering_score = 0
        
        for media_event in media_events:
            event_data = media_event.get('event_data', {})
            
            if media_event.get('event_type') == 'download':
                tampering_score += 1
            
            if isinstance(event_data, dict):
                if event_data.get('right_click_on_image'):
                    tampering_score += 1
                if event_data.get('save_as_attempt'):
                    tampering_score += 1
        
        return tampering_score >= 3
    
    def _is_victim_related_page(self, url: str) -> bool:
        """Check if page is related to victim information"""
        if not url:
            return False
        
        victim_indicators = [
            'victim', 'missing', 'disappeared', 'last_seen', 
            'biography', 'personal', 'family', 'friends'
        ]
        
        url_lower = url.lower()
        return any(indicator in url_lower for indicator in victim_indicators)
    
    def _count_victim_name_searches(self, history: List[Dict]) -> int:
        """Count searches for victim names"""
        search_count = 0
        for h in history:
            event_data = h.get('event_data', {})
            if isinstance(event_data, dict) and 'search' in str(event_data).lower():
                search_count += 1
        return search_count
    
    def _detect_personal_info_collection(self, history: List[Dict]) -> bool:
        """Detect collection of personal information"""
        personal_pages = ['profile', 'about', 'bio', 'personal', 'details', 'information']
        
        personal_access = 0
        for h in history:
            page_url = h.get('page_url', '').lower()
            if any(term in page_url for term in personal_pages):
                personal_access += 1
                
                # Extra weight for download/copy events
                if h.get('event_type') in ['download', 'copy', 'screenshot']:
                    personal_access += 2
        
        return personal_access > 5
    
    def _is_night_stalking_hour(self, timestamp_str: str) -> bool:
        """Check if timestamp falls in stalking hours (11pm-4am)"""
        try:
            dt = datetime.fromisoformat(timestamp_str)
            hour = dt.hour
            return hour >= 23 or hour < 4
        except:
            return False
    
    def _is_location_related(self, url: str) -> bool:
        """Check if page is location-related"""
        if not url:
            return False
        
        location_indicators = ['location', 'address', 'map', 'coordinates', 'place', 'where']
        url_lower = url.lower()
        return any(indicator in url_lower for indicator in location_indicators)
    
    def _detect_family_targeting(self, history: List[Dict]) -> bool:
        """Detect targeting of family members"""
        family_related = [h for h in history if 'family' in h.get('page_url', '').lower()]
        return len(family_related) > 5
    
    def _detect_social_media_stalking(self, event, history: List[Dict]) -> bool:
        """Detect correlation with social media activity"""
        social_referrers = ['facebook.com', 'twitter.com', 'instagram.com', 'tiktok.com']
        
        if event.referrer_url:
            return any(social in event.referrer_url.lower() for social in social_referrers)
        
        return False
    
    def _detect_compulsive_checking(self, history: List[Dict]) -> bool:
        """Detect compulsive checking behavior"""
        page_visits = {}
        for h in history[:50]:  # Check last 50 events
            page = h.get('page_url', '')
            if page:
                page_visits[page] = page_visits.get(page, 0) + 1
        
        # If any page visited more than 10 times, it's compulsive
        return any(count > 10 for count in page_visits.values())
    
    def _is_witness_related_page(self, url: str) -> bool:
        """Check if page is related to witness information"""
        if not url:
            return False
        
        witness_indicators = ['witness', 'testimony', 'statement', 'contact', 'family', 'friend']
        url_lower = url.lower()
        return any(indicator in url_lower for indicator in witness_indicators)
    
    def _detect_contact_harvesting(self, history: List[Dict]) -> bool:
        """Detect contact information harvesting"""
        contact_events = 0
        
        for h in history:
            page_url = h.get('page_url', '').lower()
            event_data = h.get('event_data', {})
            
            # Check for contact-related pages
            if any(term in page_url for term in ['contact', 'phone', 'email', 'address']):
                contact_events += 1
            
            # Check for copy events on contact info
            if h.get('event_type') == 'copy' and isinstance(event_data, dict):
                copied_text = str(event_data.get('text', '')).lower()
                if any(term in copied_text for term in ['phone', 'email', '@', 'address']):
                    contact_events += 2
        
        return contact_events > 5
    
    def _detect_intimidation_attempts(self, event, history: List[Dict]) -> bool:
        """Detect attempts at witness intimidation"""
        intimidation_score = 0
        
        # Check for downloading witness photos
        witness_downloads = [h for h in history if 
                            'witness' in h.get('page_url', '').lower() and 
                            h.get('event_type') in ['download', 'screenshot']]
        if witness_downloads:
            intimidation_score += 1
        
        # Check for contact form abuse
        failed_contacts = [h for h in history if 
                          h.get('event_type') == 'form_submit_fail' and
                          'contact' in h.get('page_url', '').lower()]
        if len(failed_contacts) > 3:
            intimidation_score += 1
        
        # Check for aggressive search terms
        for h in history:
            if h.get('event_type') == 'search':
                event_data = h.get('event_data', {})
                if isinstance(event_data, dict):
                    query = event_data.get('query', '').lower()
                    if any(term in query for term in ['address', 'home', 'work', 'school', 'family']):
                        intimidation_score += 1
                        break
        
        return intimidation_score >= 2
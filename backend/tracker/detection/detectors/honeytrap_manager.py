"""
Honeytrap Management Module
Manages honey traps, canary tokens, and deception systems
"""

from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional
import hashlib
import json
import logging

logger = logging.getLogger(__name__)


class HoneytrapManager:
    """Manages honey trap systems for detecting suspicious activity"""
    
    def __init__(self, parent_detector):
        self.parent = parent_detector
        self.thresholds = parent_detector.thresholds
        
        # Initialize honey trap configurations
        self.honey_traps = self._initialize_honey_traps()
        self.canary_tokens = self._initialize_canary_tokens()
        self.fake_updates = self._initialize_fake_updates()
    
    def check_honey_trap_interaction(self, event) -> Dict[str, Any]:
        """Check if user triggered any honey traps"""
        result = {'triggered': False, 'score': 0.0, 'severity': 0, 'details': {}}
        
        trap_score = 0.0
        trap_details = {}
        
        # HIDDEN PAGE ACCESS
        hidden_page_score = self._check_hidden_page_access(event)
        if hidden_page_score['triggered']:
            trap_score = max(trap_score, hidden_page_score['score'])
            trap_details['hidden_page_accessed'] = hidden_page_score['details']
        
        # CANARY TOKEN DETECTION
        canary_score = self._check_canary_token(event)
        if canary_score['triggered']:
            trap_score = max(trap_score, canary_score['score'])
            trap_details['canary_token_triggered'] = canary_score['details']
        
        # FAKE DOCUMENT ACCESS
        fake_doc_score = self._check_fake_document_access(event)
        if fake_doc_score['triggered']:
            trap_score = max(trap_score, fake_doc_score['score'])
            trap_details['honeypot_document'] = fake_doc_score['details']
        
        # BEHAVIORAL TRIGGER RESPONSE
        behavior_score = self._check_behavioral_triggers(event)
        if behavior_score['triggered']:
            trap_score = max(trap_score, behavior_score['score'])
            trap_details['behavioral_trigger'] = behavior_score['details']
        
        # FAKE UPDATE RESPONSE
        update_score = self._check_fake_update_response(event)
        if update_score['triggered']:
            trap_score = max(trap_score, update_score['score'])
            trap_details['fake_update_response'] = update_score['details']
        
        # INVISIBLE LINK CLICK
        invisible_score = self._check_invisible_links(event)
        if invisible_score['triggered']:
            trap_score = max(trap_score, invisible_score['score'])
            trap_details['invisible_link_clicked'] = invisible_score['details']
        
        if trap_score > 0:
            result['triggered'] = True
            result['score'] = trap_score
            result['severity'] = 5  # Always high severity for honey traps
            result['details'] = trap_details
            
            # Log honey trap trigger
            self._log_honeytrap_trigger(event, trap_details)
        
        return result
    
    def deploy_dynamic_honeytrap(self, case_id: str, trap_type: str) -> Dict[str, Any]:
        """Deploy a new dynamic honey trap"""
        trap_id = self._generate_trap_id(case_id, trap_type)
        
        trap_config = {
            'id': trap_id,
            'type': trap_type,
            'case_id': case_id,
            'deployed_at': datetime.now().isoformat(),
            'status': 'active',
            'trigger_count': 0
        }
        
        if trap_type == 'fake_evidence':
            trap_config.update(self._create_fake_evidence_trap())
        elif trap_type == 'canary_document':
            trap_config.update(self._create_canary_document())
        elif trap_type == 'behavioral_trigger':
            trap_config.update(self._create_behavioral_trigger())
        
        # Store trap configuration
        self.honey_traps[trap_id] = trap_config
        
        return trap_config
    
    def monitor_trap_effectiveness(self, case_id: str) -> Dict[str, Any]:
        """Monitor effectiveness of deployed honey traps"""
        case_traps = {k: v for k, v in self.honey_traps.items() 
                     if v.get('case_id') == case_id}
        
        effectiveness = {
            'total_traps': len(case_traps),
            'triggered_traps': 0,
            'total_triggers': 0,
            'most_effective': None,
            'least_effective': None,
            'recommendations': []
        }
        
        trap_stats = []
        
        for trap_id, trap in case_traps.items():
            triggers = trap.get('trigger_count', 0)
            effectiveness['total_triggers'] += triggers
            
            if triggers > 0:
                effectiveness['triggered_traps'] += 1
            
            trap_stats.append({
                'id': trap_id,
                'type': trap['type'],
                'triggers': triggers,
                'effectiveness_score': self._calculate_trap_effectiveness(trap)
            })
        
        if trap_stats:
            trap_stats.sort(key=lambda x: x['effectiveness_score'], reverse=True)
            effectiveness['most_effective'] = trap_stats[0]
            effectiveness['least_effective'] = trap_stats[-1]
        
        # Generate recommendations
        effectiveness['recommendations'] = self._generate_trap_recommendations(
            case_traps, effectiveness
        )
        
        return effectiveness
    
    # Helper methods - Trap Checking
    
    def _check_hidden_page_access(self, event) -> Dict[str, Any]:
        """Check for access to hidden pages"""
        result = {'triggered': False, 'score': 0.0, 'details': {}}
        
        hidden_pages = {
            '/admin': 10.0,
            '/evidence/unreleased/': 10.0,
            '/.git/': 8.0,
            '/wp-admin': 7.0,
            '/backup/': 6.0,
            '/private/': 8.0,
            '/internal/': 8.0,
            '/test/': 5.0,
            '/dev/': 5.0,
            '/stage/': 5.0,
            '/.env': 9.0,
            '/config/': 7.0,
            '/api/admin': 9.0,
            '/debug/': 6.0,
        }
        
        for page, score in hidden_pages.items():
            if page in event.page_url.lower():
                result['triggered'] = True
                result['score'] = score
                result['details'] = {
                    'page': page,
                    'url': event.page_url,
                    'trap_type': 'hidden_page'
                }
                break
        
        return result
    
    def _check_canary_token(self, event) -> Dict[str, Any]:
        """Check for canary token triggers"""
        result = {'triggered': False, 'score': 0.0, 'details': {}}
        
        if event.event_data and 'canary_token' in event.event_data:
            token = event.event_data['canary_token']
            
            # Verify token is valid
            if token in self.canary_tokens:
                result['triggered'] = True
                result['score'] = 10.0
                result['details'] = {
                    'token_id': token,
                    'token_type': self.canary_tokens[token].get('type'),
                    'trap_type': 'canary_token'
                }
                
                # Update token trigger count
                self.canary_tokens[token]['triggers'] = \
                    self.canary_tokens[token].get('triggers', 0) + 1
        
        # Check URL parameters for canary tokens
        if '?token=' in event.page_url or '&token=' in event.page_url:
            token_value = self._extract_token_from_url(event.page_url)
            if token_value in self.canary_tokens:
                result['triggered'] = True
                result['score'] = 10.0
                result['details'] = {
                    'token_id': token_value,
                    'token_type': 'url_parameter',
                    'trap_type': 'canary_token'
                }
        
        return result
    
    def _check_fake_document_access(self, event) -> Dict[str, Any]:
        """Check for fake document access"""
        result = {'triggered': False, 'score': 0.0, 'details': {}}
        
        honeypot_documents = [
            'evidence_unreleased.pdf',
            'witness_list_confidential.doc',
            'investigation_notes_private.txt',
            'suspect_database.xlsx',
            'case_files_backup.zip',
            'forensic_report_draft.pdf',
            'interview_transcripts.docx'
        ]
        
        url_lower = event.page_url.lower()
        
        for doc in honeypot_documents:
            if doc in url_lower:
                result['triggered'] = True
                result['score'] = 9.0
                result['details'] = {
                    'document': doc,
                    'url': event.page_url,
                    'trap_type': 'honeypot_document'
                }
                break
        
        # Check for honeypot indicators in URL
        if self._is_honeypot_document(event.page_url):
            result['triggered'] = True
            result['score'] = 9.0
            result['details'] = {
                'document': 'detected_honeypot',
                'url': event.page_url,
                'trap_type': 'honeypot_document'
            }
        
        return result
    
    def _check_behavioral_triggers(self, event) -> Dict[str, Any]:
        """Check for behavioral honey trap triggers"""
        result = {'triggered': False, 'score': 0.0, 'details': {}}
        
        # Check for specific behavioral patterns that indicate trap interaction
        if event.event_type == 'rapid_navigation':
            # User rapidly navigating after seeing something suspicious
            if event.event_data and event.event_data.get('pages_per_minute', 0) > 20:
                result['triggered'] = True
                result['score'] = 6.0
                result['details'] = {
                    'behavior': 'panic_navigation',
                    'trap_type': 'behavioral'
                }
        
        # Check for immediate exit after specific content
        elif event.event_type == 'page_exit':
            if event.time_on_page and event.time_on_page < 1:
                if 'trap' in event.page_url or 'honey' in event.page_url:
                    result['triggered'] = True
                    result['score'] = 7.0
                    result['details'] = {
                        'behavior': 'trap_recognition',
                        'trap_type': 'behavioral'
                    }
        
        return result
    
    def _check_fake_update_response(self, event) -> Dict[str, Any]:
        """Check if user responded to fake update"""
        result = {'triggered': False, 'score': 0.0, 'details': {}}
        
        # Check if accessing page after fake update was posted
        for update_id, update in self.fake_updates.items():
            if update['status'] == 'active':
                # Check if user accessed the fake update URL
                if update['trigger_url'] in event.page_url:
                    result['triggered'] = True
                    result['score'] = 7.0
                    result['details'] = {
                        'update_id': update_id,
                        'update_type': update['type'],
                        'trap_type': 'fake_update'
                    }
                    
                    # Mark update as triggered
                    update['triggers'] = update.get('triggers', 0) + 1
                    break
        
        return result
    
    def _check_invisible_links(self, event) -> Dict[str, Any]:
        """Check for clicks on invisible/hidden links"""
        result = {'triggered': False, 'score': 0.0, 'details': {}}
        
        if event.event_type == 'click' and event.event_data:
            click_data = event.event_data.get('click_details', {})
            
            # Check if clicked element was invisible
            if click_data.get('element_visibility') == 'hidden':
                result['triggered'] = True
                result['score'] = 8.0
                result['details'] = {
                    'element': click_data.get('element_id'),
                    'trap_type': 'invisible_link'
                }
            
            # Check for clicks on 1x1 pixel links
            elif (click_data.get('element_width') == 1 and 
                  click_data.get('element_height') == 1):
                result['triggered'] = True
                result['score'] = 8.0
                result['details'] = {
                    'element': click_data.get('element_id'),
                    'trap_type': 'pixel_link'
                }
        
        return result
    
    # Helper methods - Trap Management
    
    def _initialize_honey_traps(self) -> Dict[str, Dict]:
        """Initialize honey trap configurations"""
        return {}
    
    def _initialize_canary_tokens(self) -> Dict[str, Dict]:
        """Initialize canary token system"""
        return {}
    
    def _initialize_fake_updates(self) -> Dict[str, Dict]:
        """Initialize fake update system"""
        return {}
    
    def _generate_trap_id(self, case_id: str, trap_type: str) -> str:
        """Generate unique trap ID"""
        timestamp = datetime.now().isoformat()
        raw = f"{case_id}_{trap_type}_{timestamp}"
        return hashlib.md5(raw.encode()).hexdigest()[:16]
    
    def _create_fake_evidence_trap(self) -> Dict[str, Any]:
        """Create fake evidence honey trap"""
        return {
            'trap_subtype': 'fake_evidence',
            'trigger_url': f'/evidence/item_{self._generate_random_id()}.html',
            'content': 'Fabricated evidence to detect unauthorized access',
            'metadata': {
                'created': datetime.now().isoformat(),
                'visibility': 'hidden',
                'indexable': False
            }
        }
    
    def _create_canary_document(self) -> Dict[str, Any]:
        """Create canary document trap"""
        token = self._generate_random_id()
        return {
            'trap_subtype': 'canary_document',
            'token': token,
            'document_url': f'/documents/confidential_{token}.pdf',
            'tracking_enabled': True,
            'alert_on_access': True
        }
    
    def _create_behavioral_trigger(self) -> Dict[str, Any]:
        """Create behavioral trigger trap"""
        return {
            'trap_subtype': 'behavioral_trigger',
            'trigger_conditions': {
                'rapid_navigation': True,
                'panic_exit': True,
                'screenshot_attempt': True
            },
            'monitoring_enabled': True
        }
    
    def _is_honeypot_document(self, url: str) -> bool:
        """Check if document is a honeypot"""
        honeypot_indicators = ['trap', 'honeypot', 'canary', 'fake_evidence', 'decoy']
        url_lower = url.lower()
        return any(indicator in url_lower for indicator in honeypot_indicators)
    
    def _extract_token_from_url(self, url: str) -> Optional[str]:
        """Extract token value from URL parameters"""
        import re
        
        # Look for token parameter
        token_pattern = r'[?&]token=([a-zA-Z0-9]+)'
        match = re.search(token_pattern, url)
        
        if match:
            return match.group(1)
        return None
    
    def _generate_random_id(self) -> str:
        """Generate random ID for traps"""
        import random
        import string
        return ''.join(random.choices(string.ascii_lowercase + string.digits, k=8))
    
    def _log_honeytrap_trigger(self, event, trap_details: Dict) -> None:
        """Log honey trap trigger for analysis"""
        log_entry = {
            'timestamp': datetime.now().isoformat(),
            'event_id': str(event.id) if hasattr(event, 'id') else None,
            'fingerprint': event.fingerprint_hash,
            'ip_address': event.ip_address,
            'trap_details': trap_details,
            'user_agent': event.user_agent,
            'page_url': event.page_url
        }
        
        # Log to security monitoring system
        logger.warning(f"HONEYTRAP TRIGGERED: {json.dumps(log_entry)}")
        
        # Store for analysis
        if self.parent.redis_available:
            key = f"honeytrap_triggers:{event.case_id}"
            self.parent.redis_client.lpush(key, json.dumps(log_entry))
            self.parent.redis_client.expire(key, 86400 * 30)  # Keep for 30 days
    
    def _calculate_trap_effectiveness(self, trap: Dict) -> float:
        """Calculate effectiveness score for a trap"""
        triggers = trap.get('trigger_count', 0)
        age_hours = (datetime.now() - datetime.fromisoformat(trap['deployed_at'])).total_seconds() / 3600
        
        if age_hours == 0:
            return 0.0
        
        # Triggers per hour, normalized
        effectiveness = (triggers / age_hours) * 100
        
        # Adjust for trap type value
        trap_type_multipliers = {
            'hidden_page': 1.5,
            'canary_token': 2.0,
            'fake_evidence': 1.8,
            'behavioral_trigger': 1.2
        }
        
        multiplier = trap_type_multipliers.get(trap['type'], 1.0)
        
        return min(effectiveness * multiplier, 100.0)
    
    def _generate_trap_recommendations(self, traps: Dict, stats: Dict) -> List[str]:
        """Generate recommendations for trap deployment"""
        recommendations = []
        
        # Check trap coverage
        if stats['total_traps'] < 5:
            recommendations.append("Deploy more honey traps for better coverage")
        
        # Check effectiveness
        if stats['triggered_traps'] == 0 and stats['total_traps'] > 0:
            recommendations.append("Current traps are not effective, consider different types")
        
        # Check for specific trap types
        trap_types = set(t['type'] for t in traps.values())
        
        if 'canary_token' not in trap_types:
            recommendations.append("Deploy canary tokens for document tracking")
        
        if 'behavioral_trigger' not in trap_types:
            recommendations.append("Add behavioral triggers to detect suspicious patterns")
        
        # Check trigger patterns
        if stats['total_triggers'] > 10:
            recommendations.append("High trap activity detected - possible active threat")
        
        return recommendations
    
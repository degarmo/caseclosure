"""
Biometric Profiling Module
Analyzes mouse movements, keystroke dynamics, and creates behavioral fingerprints
"""

from typing import Dict, List, Any
import logging

logger = logging.getLogger(__name__)


class BiometricProfiler:
    """Creates behavioral fingerprints from mouse and keyboard patterns"""
    
    def __init__(self, parent_detector):
        self.parent = parent_detector
        self.thresholds = parent_detector.thresholds
    
    def profile_mouse_personality(self, event, history: List[Dict]) -> Dict[str, Any]:
        """Create behavioral fingerprint from mouse movements"""
        result = {'triggered': False, 'score': 0.0, 'severity': 0, 'details': {}}
        
        if not event.event_data or 'mouse_metrics' not in event.event_data:
            return result
        
        mouse_data = event.event_data['mouse_metrics']
        profile_score = 0.0
        profile_type = None
        
        # CALCULATED OBSERVER PROFILE
        if (mouse_data.get('movement_speed', 0) < 100 and 
            mouse_data.get('hover_duration', 0) > 3000 and
            mouse_data.get('precision', 0) > 0.9):
            profile_type = 'calculated_observer'
            profile_score = 6.0
            
            # Extra score for hovering over faces in photos
            if 'face_hover' in mouse_data:
                profile_score += 2.0
        
        # IMPULSIVE CHECKER PROFILE
        elif (mouse_data.get('movement_speed', 0) > 500 and
              mouse_data.get('click_count', 0) > 20 and
              mouse_data.get('trajectory_changes', 0) > 30):
            profile_type = 'impulsive_checker'
            profile_score = 5.0
        
        # PROFESSIONAL INVESTIGATOR PROFILE
        elif (mouse_data.get('systematic_scanning', False) and
              mouse_data.get('pause_pattern', '') == 'note_taking'):
            profile_type = 'professional_investigator'
            profile_score = 2.0  # Lower score as could be legitimate
        
        # STALKER PROFILE
        if self._detect_stalker_mouse_pattern(mouse_data, history):
            profile_type = 'stalker_pattern'
            profile_score = 8.0
        
        # NERVOUS PROFILE
        if self._detect_nervous_mouse_pattern(mouse_data):
            if profile_type:
                profile_type += '_nervous'
            else:
                profile_type = 'nervous_user'
            profile_score += 2.0
        
        if profile_score > 0:
            result['triggered'] = True
            result['score'] = min(profile_score, 10.0)
            result['severity'] = min(int(profile_score / 2), 5)
            result['details'] = {
                'profile_type': profile_type,
                'confidence': mouse_data.get('pattern_confidence', 0),
                'unique_characteristics': self._extract_mouse_characteristics(mouse_data)
            }
        
        return result
    
    def analyze_keystroke_dynamics(self, event) -> Dict[str, Any]:
        """Identify users by typing patterns"""
        result = {'triggered': False, 'score': 0.0, 'severity': 0, 'details': {}}
        
        if event.event_type != 'typing' or not event.event_data:
            return result
        
        typing_data = event.event_data.get('keystroke_dynamics', {})
        suspicious_score = 0.0
        suspicious_patterns = {}
        
        # DWELL TIME ANALYSIS (How long keys are pressed)
        dwell_times = typing_data.get('dwell_times', [])
        if dwell_times:
            avg_dwell = sum(dwell_times) / len(dwell_times)
            if avg_dwell < 50:  # Very fast typing
                suspicious_score += 2.0
                suspicious_patterns['rapid_typing'] = True
            elif avg_dwell > 200:  # Very slow typing (hesitation)
                suspicious_score += 1.5
                suspicious_patterns['hesitant_typing'] = True
        
        # FLIGHT TIME ANALYSIS (Time between keystrokes)
        flight_times = typing_data.get('flight_times', [])
        if flight_times:
            # Check for memorized typing (very consistent flight times)
            if self._is_memorized_typing(flight_times):
                suspicious_score += 4.0
                suspicious_patterns['memorized_content'] = True
            
            # Check for copy-paste patterns
            if self._detect_paste_pattern(flight_times):
                suspicious_score += 3.0
                suspicious_patterns['paste_detected'] = True
        
        # SPECIFIC PATTERN DETECTION
        typed_content = typing_data.get('content_hash', '')  # Hashed for privacy
        
        # Victim name typing pattern
        if typing_data.get('typing_speed_wpm', 0) > 100 and 'victim_field' in typing_data:
            suspicious_score += 5.0
            suspicious_patterns['familiar_with_victim'] = True
        
        # Address typing without hesitation
        if 'address_field' in typing_data and typing_data.get('hesitation_count', 0) == 0:
            suspicious_score += 4.0
            suspicious_patterns['knows_location'] = True
        
        # Alibi construction (slow, careful typing)
        if 'statement_field' in typing_data and typing_data.get('typing_speed_wpm', 0) < 20:
            suspicious_score += 3.0
            suspicious_patterns['constructing_narrative'] = True
        
        # RHYTHM ANALYSIS
        rhythm_profile = self._analyze_typing_rhythm(typing_data)
        if rhythm_profile['suspicious']:
            suspicious_score += rhythm_profile['score']
            suspicious_patterns['rhythm_anomaly'] = rhythm_profile['type']
        
        if suspicious_score > 0:
            result['triggered'] = True
            result['score'] = min(suspicious_score, 10.0)
            result['severity'] = min(int(suspicious_score / 2), 5)
            result['details'] = suspicious_patterns
        
        return result
    
    def create_behavioral_fingerprint(self, event, history: List[Dict]) -> Dict[str, Any]:
        """Create a unique behavioral fingerprint for the user"""
        fingerprint = {
            'mouse_profile': None,
            'typing_profile': None,
            'interaction_style': None,
            'stress_indicators': [],
            'unique_behaviors': []
        }
        
        # Analyze mouse behavior
        if event.event_data and 'mouse_metrics' in event.event_data:
            mouse_analysis = self.profile_mouse_personality(event, history)
            if mouse_analysis['triggered']:
                fingerprint['mouse_profile'] = mouse_analysis['details'].get('profile_type')
        
        # Analyze typing behavior
        if event.event_type == 'typing':
            typing_analysis = self.analyze_keystroke_dynamics(event)
            if typing_analysis['triggered']:
                fingerprint['typing_profile'] = typing_analysis['details']
        
        # Analyze interaction style
        fingerprint['interaction_style'] = self._determine_interaction_style(event, history)
        
        # Detect stress indicators
        fingerprint['stress_indicators'] = self._detect_biometric_stress(event, history)
        
        # Identify unique behaviors
        fingerprint['unique_behaviors'] = self._identify_unique_behaviors(event, history)
        
        return fingerprint
    
    # Helper methods
    
    def _detect_stalker_mouse_pattern(self, mouse_data: Dict, history: List[Dict]) -> bool:
        """Detect stalker-specific mouse patterns"""
        # Stalkers often exhibit specific patterns:
        # - Slow, deliberate movements over victim photos
        # - Repeated tracing of facial features
        # - Long pauses at specific content
        
        if mouse_data.get('face_trace_count', 0) > 3:
            return True
        if mouse_data.get('photo_hover_duration', 0) > 20000:  # 20+ seconds
            return True
        if mouse_data.get('repetitive_path', False):
            return True
        return False
    
    def _detect_nervous_mouse_pattern(self, mouse_data: Dict) -> bool:
        """Detect nervous mouse movement patterns"""
        nervous_indicators = 0
        
        # Jittery movements
        if mouse_data.get('jitter_score', 0) > 0.7:
            nervous_indicators += 1
        
        # Rapid direction changes
        if mouse_data.get('direction_changes', 0) > 50:
            nervous_indicators += 1
        
        # Overshooting targets
        if mouse_data.get('overshoot_count', 0) > 5:
            nervous_indicators += 1
        
        # Tremor patterns
        if mouse_data.get('tremor_detected', False):
            nervous_indicators += 1
        
        return nervous_indicators >= 2
    
    def _extract_mouse_characteristics(self, mouse_data: Dict) -> Dict[str, Any]:
        """Extract unique mouse movement characteristics"""
        return {
            'avg_velocity': mouse_data.get('avg_velocity', 0),
            'acceleration_pattern': mouse_data.get('acceleration_pattern', ''),
            'curve_preference': mouse_data.get('curve_preference', ''),
            'click_accuracy': mouse_data.get('click_accuracy', 0),
            'hesitation_frequency': mouse_data.get('hesitation_frequency', 0),
            'scroll_behavior': mouse_data.get('scroll_behavior', ''),
            'drag_pattern': mouse_data.get('drag_pattern', ''),
        }
    
    def _is_memorized_typing(self, flight_times: List[float]) -> bool:
        """Check if typing pattern indicates memorized content"""
        if len(flight_times) < 5:
            return False
        
        # Calculate variance in flight times
        avg_time = sum(flight_times) / len(flight_times)
        variance = sum((t - avg_time) ** 2 for t in flight_times) / len(flight_times)
        
        # Low variance indicates memorized/automatic typing
        return variance < 100  # milliseconds squared
    
    def _detect_paste_pattern(self, flight_times: List[float]) -> bool:
        """Detect copy-paste patterns in typing"""
        if len(flight_times) < 2:
            return False
        
        # Paste operations show as instant text appearance (0 or near-0 flight time)
        instant_appearances = sum(1 for t in flight_times if t < 10)
        
        # If multiple characters appear instantly, likely paste
        return instant_appearances > 5
    
    def _analyze_typing_rhythm(self, typing_data: Dict) -> Dict[str, Any]:
        """Analyze typing rhythm for suspicious patterns"""
        result = {'suspicious': False, 'score': 0, 'type': None}
        
        rhythm_data = typing_data.get('rhythm_metrics', {})
        
        # Check for robotic rhythm (too consistent)
        if rhythm_data.get('consistency_score', 0) > 0.95:
            result['suspicious'] = True
            result['score'] = 3.0
            result['type'] = 'robotic_rhythm'
        
        # Check for stress rhythm (irregular bursts)
        elif rhythm_data.get('burst_typing', False):
            result['suspicious'] = True
            result['score'] = 2.0
            result['type'] = 'stress_bursts'
        
        # Check for deceptive rhythm (pauses before key words)
        elif rhythm_data.get('strategic_pauses', 0) > 3:
            result['suspicious'] = True
            result['score'] = 4.0
            result['type'] = 'deceptive_pauses'
        
        return result
    
    def _determine_interaction_style(self, event, history: List[Dict]) -> str:
        """Determine user's interaction style"""
        # Analyze recent interactions
        recent_events = history[:20] if history else []
        
        click_count = sum(1 for h in recent_events if h.get('event_type') == 'click')
        scroll_count = sum(1 for h in recent_events if h.get('event_type') == 'scroll')
        hover_count = sum(1 for h in recent_events if h.get('event_type') == 'hover')
        
        # Determine style based on behavior
        if click_count > 15:
            return 'aggressive_clicker'
        elif scroll_count > 10:
            return 'scanner'
        elif hover_count > 8:
            return 'cautious_explorer'
        elif click_count < 3 and scroll_count < 3:
            return 'passive_observer'
        else:
            return 'balanced'
    
    def _detect_biometric_stress(self, event, history: List[Dict]) -> List[str]:
        """Detect stress through biometric indicators"""
        stress_indicators = []
        
        if event.event_data:
            # Mouse stress indicators
            mouse_data = event.event_data.get('mouse_metrics', {})
            if mouse_data.get('tremor_detected'):
                stress_indicators.append('mouse_tremor')
            if mouse_data.get('erratic_movement'):
                stress_indicators.append('erratic_mouse')
            
            # Typing stress indicators
            typing_data = event.event_data.get('keystroke_dynamics', {})
            if typing_data.get('increased_errors'):
                stress_indicators.append('typing_errors')
            if typing_data.get('irregular_rhythm'):
                stress_indicators.append('rhythm_disruption')
            
            # Touch/mobile stress indicators
            touch_data = event.event_data.get('touch_metrics', {})
            if touch_data.get('pressure_variance_high'):
                stress_indicators.append('variable_pressure')
            if touch_data.get('swipe_velocity_irregular'):
                stress_indicators.append('irregular_swipes')
        
        return stress_indicators
    
    def _identify_unique_behaviors(self, event, history: List[Dict]) -> List[str]:
        """Identify unique behavioral patterns"""
        unique_behaviors = []
        
        # Check for unique mouse patterns
        if event.event_data and 'mouse_metrics' in event.event_data:
            mouse_data = event.event_data['mouse_metrics']
            
            # Circular mouse movements
            if mouse_data.get('circular_pattern_count', 0) > 3:
                unique_behaviors.append('circular_mouse_movement')
            
            # Double-click patterns
            if mouse_data.get('double_click_speed', 0) < 100:
                unique_behaviors.append('rapid_double_click')
            
            # Unique scrolling
            if mouse_data.get('scroll_reversal_count', 0) > 5:
                unique_behaviors.append('scroll_reversal_habit')
        
        # Check for unique interaction sequences
        if history and len(history) > 10:
            sequence = [h.get('event_type', '') for h in history[:10]]
            
            # Check for repetitive patterns
            if self._has_repetitive_pattern(sequence):
                unique_behaviors.append('repetitive_interaction_pattern')
        
        return unique_behaviors
    
    def _has_repetitive_pattern(self, sequence: List[str]) -> bool:
        """Check if sequence has repetitive patterns"""
        if len(sequence) < 4:
            return False
        
        # Look for repeating subsequences
        for pattern_len in range(2, len(sequence) // 2 + 1):
            for i in range(len(sequence) - pattern_len * 2 + 1):
                pattern = sequence[i:i + pattern_len]
                next_pattern = sequence[i + pattern_len:i + pattern_len * 2]
                if pattern == next_pattern:
                    return True
        
        return False
"""
Psychological Detection Module
Analyzes psychological patterns, cognitive states, and behavioral predictions
"""

from datetime import datetime, timedelta
from typing import Dict, List, Any
import logging

logger = logging.getLogger(__name__)


class PsychologicalDetector:
    """Detects psychological patterns and cognitive states"""
    
    def __init__(self, parent_detector):
        self.parent = parent_detector
        self.thresholds = parent_detector.thresholds
    
    def detect_cognitive_overload(self, event, history: List[Dict]) -> Dict[str, Any]:
        """Detect when user is under high cognitive stress"""
        result = {'triggered': False, 'score': 0.0, 'severity': 0, 'details': {}}
        
        overload_score = 0.0
        overload_indicators = {}
        
        # DECISION PARALYSIS
        if event.event_data:
            hover_data = event.event_data.get('hover_metrics', {})
            if hover_data.get('hover_duration', 0) > self.thresholds['decision_paralysis_time']:
                overload_score += 3.0
                overload_indicators['decision_paralysis'] = True
            
            if hover_data.get('repeated_hovers', 0) > self.thresholds['hover_repetition_threshold']:
                overload_score += 2.0
                overload_indicators['indecision'] = True
        
        # INFORMATION OVERLOAD RESPONSE
        rapid_closes = [h for h in history[:10] if 
                        h.get('event_type') == 'page_close' and 
                        h.get('time_on_page', 0) < self.thresholds['rapid_close_threshold']]
        if len(rapid_closes) > 3:
            overload_score += 3.0
            overload_indicators['information_overload'] = True
        
        # SCREENSHOT BEFORE READING
        if event.event_type == 'screenshot' and event.time_on_page and event.time_on_page < 5:
            overload_score += 4.0
            overload_indicators['capture_for_later'] = True
        
        # COGNITIVE RETREAT
        if self._detect_cognitive_retreat_pattern(history):
            overload_score += 3.0
            overload_indicators['cognitive_retreat'] = True
        
        # GUILTY KNOWLEDGE REACTIONS
        if self._detect_guilty_knowledge_pause(event, history):
            overload_score += 6.0
            overload_indicators['guilty_knowledge_reaction'] = True
        
        # ANALYSIS PARALYSIS
        if self._detect_analysis_paralysis(event, history):
            overload_score += 3.0
            overload_indicators['analysis_paralysis'] = True
        
        if overload_score > 0:
            result['triggered'] = True
            result['score'] = min(overload_score, 10.0)
            result['severity'] = min(int(overload_score / 2), 5)
            result['details'] = overload_indicators
        
        return result
    
    def predict_behavior_escalation(self, history: List[Dict]) -> Dict[str, Any]:
        """Predict if behavior will escalate"""
        result = {'triggered': False, 'score': 0.0, 'severity': 0, 'details': {}}
        
        if len(history) < 10:
            return result
        
        escalation_score = 0.0
        escalation_indicators = {}
        
        # INCREASING FREQUENCY
        if self._detect_increasing_frequency(history):
            escalation_score += 3.0
            escalation_indicators['increasing_frequency'] = True
        
        # EXPANDING SCOPE
        if self._detect_expanding_scope(history):
            escalation_score += 4.0
            escalation_indicators['expanding_scope'] = True
        
        # RISK TAKING INCREASE
        if self._detect_increasing_risk_taking(history):
            escalation_score += 5.0
            escalation_indicators['increasing_risk'] = True
        
        # EMOTIONAL INTENSITY
        if self._detect_emotional_intensification(history):
            escalation_score += 4.0
            escalation_indicators['emotional_intensity'] = True
        
        # PLANNING INDICATORS
        if self._detect_planning_behavior(history):
            escalation_score += 6.0
            escalation_indicators['planning_detected'] = True
        
        # DESPERATION INDICATORS
        if self._detect_desperation(history):
            escalation_score += 5.0
            escalation_indicators['desperation'] = True
        
        # Calculate escalation probability
        escalation_probability = min(escalation_score / 10.0, 1.0)
        
        if escalation_score > 0:
            result['triggered'] = True
            result['score'] = escalation_score
            result['severity'] = min(int(escalation_score / 2), 5)
            result['details'] = {
                'indicators': escalation_indicators,
                'escalation_probability': escalation_probability,
                'predicted_timeframe': self._predict_escalation_timeframe(history),
                'intervention_recommended': escalation_probability > self.thresholds['escalation_probability_threshold'],
                'risk_trajectory': self._calculate_risk_trajectory(history)
            }
        
        return result
    
    def analyze_psychological_state(self, event, history: List[Dict]) -> Dict[str, Any]:
        """Comprehensive psychological state analysis"""
        result = {'triggered': False, 'score': 0.0, 'severity': 0, 'details': {}}
        
        psych_score = 0.0
        psych_profile = {
            'emotional_state': None,
            'cognitive_load': None,
            'stress_level': None,
            'deception_indicators': [],
            'psychological_markers': []
        }
        
        # EMOTIONAL STATE ANALYSIS
        emotional_state = self._analyze_emotional_state(event, history)
        if emotional_state['detected']:
            psych_score += emotional_state['score']
            psych_profile['emotional_state'] = emotional_state['state']
        
        # COGNITIVE LOAD ASSESSMENT
        cognitive_load = self._assess_cognitive_load(event, history)
        if cognitive_load['high']:
            psych_score += 3.0
            psych_profile['cognitive_load'] = 'high'
        
        # STRESS LEVEL DETECTION
        stress_level = self._detect_stress_level(event, history)
        if stress_level['elevated']:
            psych_score += stress_level['score']
            psych_profile['stress_level'] = stress_level['level']
        
        # DECEPTION INDICATORS
        deception = self._detect_deception_patterns(event, history)
        if deception['indicators']:
            psych_score += len(deception['indicators']) * 2
            psych_profile['deception_indicators'] = deception['indicators']
        
        # PSYCHOLOGICAL MARKERS
        markers = self._identify_psychological_markers(event, history)
        if markers:
            psych_score += len(markers)
            psych_profile['psychological_markers'] = markers
        
        if psych_score > 0:
            result['triggered'] = True
            result['score'] = min(psych_score, 10.0)
            result['severity'] = min(int(psych_score / 2), 5)
            result['details'] = psych_profile
        
        return result
    
    def detect_guilty_conscience_patterns(self, event, history: List[Dict]) -> Dict[str, Any]:
        """Detect patterns indicating guilty conscience"""
        result = {'triggered': False, 'score': 0.0, 'severity': 0, 'details': {}}
        
        guilt_score = 0.0
        guilt_indicators = []
        
        # CHECKING INVESTIGATION STATUS
        investigation_checks = [h for h in history if 
                               any(term in h.get('page_url', '').lower() 
                                   for term in ['investigation', 'police', 'detective', 'status'])]
        if len(investigation_checks) > 5:
            guilt_score += 4.0
            guilt_indicators.append('investigation_monitoring')
        
        # AVOIDING SPECIFIC CONTENT
        if self._detect_content_avoidance(history):
            guilt_score += 3.0
            guilt_indicators.append('content_avoidance')
        
        # CONFESSION IMPULSES
        if self._detect_confession_impulses(history):
            guilt_score += 5.0
            guilt_indicators.append('confession_impulses')
        
        # SELF-SOOTHING BEHAVIOR
        if self._detect_self_soothing(history):
            guilt_score += 2.0
            guilt_indicators.append('self_soothing')
        
        # RUMINATION PATTERNS
        if self._detect_rumination(history):
            guilt_score += 3.0
            guilt_indicators.append('rumination')
        
        if guilt_score > 0:
            result['triggered'] = True
            result['score'] = min(guilt_score, 10.0)
            result['severity'] = min(int(guilt_score / 2), 5)
            result['details'] = {
                'indicators': guilt_indicators,
                'guilt_level': 'high' if guilt_score > 7 else 'moderate'
            }
        
        return result
    
    # Helper methods
    
    def _detect_cognitive_retreat_pattern(self, history: List[Dict]) -> bool:
        """Detect pattern of cognitive retreat when overwhelmed"""
        complexity_pattern = []
        for h in history[:10]:
            page_url = h.get('page_url', '')
            if 'timeline' in page_url or 'evidence' in page_url:
                complexity_pattern.append('complex')
            elif 'home' in page_url or 'about' in page_url:
                complexity_pattern.append('simple')
        
        # Check for alternating pattern
        retreats = 0
        for i in range(1, len(complexity_pattern)):
            if complexity_pattern[i-1] == 'complex' and complexity_pattern[i] == 'simple':
                retreats += 1
        
        return retreats >= 3
    
    def _detect_guilty_knowledge_pause(self, event, history: List[Dict]) -> bool:
        """Detect pauses at unreleased information"""
        if event.time_on_page and event.time_on_page > 30:
            # Check if page contains unreleased info
            if 'unreleased' in event.page_url or 'confidential' in event.page_url:
                return True
        return False
    
    def _detect_analysis_paralysis(self, event, history: List[Dict]) -> bool:
        """Detect analysis paralysis pattern"""
        if not event.event_data:
            return False
        
        # Multiple hovers without clicking
        hover_count = sum(1 for h in history[:10] if h.get('event_type') == 'hover')
        click_count = sum(1 for h in history[:10] if h.get('event_type') == 'click')
        
        if hover_count > 10 and click_count < 2:
            return True
        
        return False
    
    def _detect_increasing_frequency(self, history: List[Dict]) -> bool:
        """Detect increasing visit frequency"""
        if len(history) < 10:
            return False
        
        time_gaps = []
        for i in range(1, len(history)):
            gap = (datetime.fromisoformat(history[i-1]['timestamp']) - 
                   datetime.fromisoformat(history[i]['timestamp'])).total_seconds()
            time_gaps.append(gap)
        
        # Check if gaps are getting smaller
        first_half_avg = sum(time_gaps[:len(time_gaps)//2]) / (len(time_gaps)//2)
        second_half_avg = sum(time_gaps[len(time_gaps)//2:]) / (len(time_gaps) - len(time_gaps)//2)
        
        return second_half_avg < first_half_avg * 0.5
    
    def _detect_expanding_scope(self, history: List[Dict]) -> bool:
        """Detect if user is expanding their investigation scope"""
        time_periods = self._divide_into_periods(history, 3)
        unique_pages_per_period = []
        
        for period in time_periods:
            unique_pages = set(h.get('page_url', '') for h in period)
            unique_pages_per_period.append(len(unique_pages))
        
        return unique_pages_per_period == sorted(unique_pages_per_period)
    
    def _detect_increasing_risk_taking(self, history: List[Dict]) -> bool:
        """Detect if user is taking more risks over time"""
        time_periods = self._divide_into_periods(history, 3)
        risk_scores = []
        
        for period in time_periods:
            risk = sum(1 for h in period if h.get('is_vpn') or h.get('is_tor') or h.get('is_proxy'))
            risk_scores.append(risk)
        
        # Check if risk-taking is decreasing (getting careless)
        return risk_scores[0] > risk_scores[-1] if len(risk_scores) > 1 else False
    
    def _detect_emotional_intensification(self, history: List[Dict]) -> bool:
        """Detect emotional intensification in behavior"""
        time_periods = self._divide_into_periods(history, 3)
        intensity_scores = []
        
        for period in time_periods:
            rapid_clicks = sum(1 for h in period if h.get('event_type') == 'rapid_click')
            quick_exits = sum(1 for h in period if h.get('time_on_page', 0) < 2)
            intensity = rapid_clicks + quick_exits
            intensity_scores.append(intensity)
        
        return intensity_scores == sorted(intensity_scores)
    
    def _detect_planning_behavior(self, history: List[Dict]) -> bool:
        """Detect systematic planning behavior"""
        planning_indicators = 0
        
        # Check for systematic page access
        pages_accessed = [h.get('page_url', '') for h in history]
        if self._is_systematic_access(pages_accessed):
            planning_indicators += 1
        
        # Check for note-taking pauses
        pause_count = sum(1 for h in history if h.get('time_on_page', 0) > 60)
        if pause_count > self.thresholds['pause_count_threshold']:
            planning_indicators += 1
        
        # Check for information organization
        organization_events = sum(1 for h in history if h.get('event_type') in ['download', 'screenshot', 'print'])
        if organization_events > 5:
            planning_indicators += 1
        
        return planning_indicators >= self.thresholds['planning_indicators_threshold']
    
    def _detect_desperation(self, history: List[Dict]) -> bool:
        """Detect desperation in behavior"""
        desperation_indicators = 0
        
        # Frantic searching
        search_events = [h for h in history[:20] if h.get('event_type') == 'search']
        if len(search_events) > 10:
            desperation_indicators += 1
        
        # Multiple failed attempts
        failures = [h for h in history if 'fail' in h.get('event_type', '').lower()]
        if len(failures) > 5:
            desperation_indicators += 1
        
        # Rapid page changes
        rapid_changes = sum(1 for h in history[:10] if h.get('time_on_page', 0) < 2)
        if rapid_changes > 7:
            desperation_indicators += 1
        
        return desperation_indicators >= 2
    
    def _predict_escalation_timeframe(self, history: List[Dict]) -> str:
        """Predict timeframe for potential escalation"""
        if len(history) < 10:
            return "insufficient_data"
        
        time_gaps = []
        for i in range(1, min(len(history), 20)):
            gap = (datetime.fromisoformat(history[i-1]['timestamp']) - 
                   datetime.fromisoformat(history[i]['timestamp'])).total_seconds() / 3600
            time_gaps.append(gap)
        
        if not time_gaps:
            return "unknown"
        
        avg_gap = sum(time_gaps) / len(time_gaps)
        
        if avg_gap < 1:
            return "imminent_24h"
        elif avg_gap < 24:
            return "within_week"
        elif avg_gap < 168:
            return "within_month"
        else:
            return "long_term"
    
    def _calculate_risk_trajectory(self, history: List[Dict]) -> str:
        """Calculate the trajectory of risk over time"""
        if len(history) < 10:
            return "insufficient_data"
        
        # Analyze risk trend
        early_risk = self._calculate_period_risk(history[len(history)//2:])
        recent_risk = self._calculate_period_risk(history[:len(history)//2])
        
        if recent_risk > early_risk * 1.5:
            return "rapidly_increasing"
        elif recent_risk > early_risk:
            return "increasing"
        elif recent_risk < early_risk * 0.5:
            return "decreasing"
        else:
            return "stable"
    
    def _calculate_period_risk(self, period: List[Dict]) -> float:
        """Calculate risk score for a time period"""
        risk = 0.0
        
        for event in period:
            if event.get('is_tor'):
                risk += 3.0
            if event.get('is_vpn'):
                risk += 1.0
            if event.get('is_proxy'):
                risk += 1.0
            if event.get('event_type') in ['download', 'screenshot']:
                risk += 0.5
        
        return risk
    
    def _analyze_emotional_state(self, event, history: List[Dict]) -> Dict[str, Any]:
        """Analyze emotional state from behavior"""
        result = {'detected': False, 'state': None, 'score': 0}
        
        # Analyze recent behavior patterns
        recent_events = history[:20] if history else []
        
        # Check for anger indicators
        rapid_clicks = sum(1 for h in recent_events if h.get('event_type') == 'rapid_click')
        if rapid_clicks > 5:
            result['detected'] = True
            result['state'] = 'angry'
            result['score'] = 3.0
            return result
        
        # Check for anxiety indicators
        back_navigation = sum(1 for h in recent_events if h.get('event_type') == 'back_navigation')
        if back_navigation > 7:
            result['detected'] = True
            result['state'] = 'anxious'
            result['score'] = 2.5
            return result
        
        # Check for obsession indicators
        same_page_visits = defaultdict(int)
        for h in recent_events:
            same_page_visits[h.get('page_url', '')] += 1
        
        if any(count > 5 for count in same_page_visits.values()):
            result['detected'] = True
            result['state'] = 'obsessive'
            result['score'] = 4.0
        
        return result
    
    def _assess_cognitive_load(self, event, history: List[Dict]) -> Dict[str, Any]:
        """Assess cognitive load level"""
        result = {'high': False, 'indicators': []}
        
        load_indicators = 0
        
        # Check for multiple tab switching
        tab_switches = sum(1 for h in history[:10] if h.get('event_type') == 'tab_switch')
        if tab_switches > 5:
            load_indicators += 1
            result['indicators'].append('excessive_tab_switching')
        
        # Check for long pauses
        long_pauses = sum(1 for h in history if h.get('time_on_page', 0) > 120)
        if long_pauses > 3:
            load_indicators += 1
            result['indicators'].append('processing_pauses')
        
        result['high'] = load_indicators >= 2
        return result
    
    def _detect_stress_level(self, event, history: List[Dict]) -> Dict[str, Any]:
        """Detect stress level from behavioral patterns"""
        result = {'elevated': False, 'level': 'normal', 'score': 0}
        
        stress_indicators = 0
        
        # Check for erratic behavior
        if self._detect_erratic_behavior(history):
            stress_indicators += 2
        
        # Check for repetitive behavior
        if self._detect_repetitive_behavior(history):
            stress_indicators += 1
        
        if stress_indicators >= 2:
            result['elevated'] = True
            result['level'] = 'high' if stress_indicators > 3 else 'moderate'
            result['score'] = min(stress_indicators * 1.5, 5.0)
        
        return result
    
    def _detect_deception_patterns(self, event, history: List[Dict]) -> Dict[str, Any]:
        """Detect patterns indicating deception"""
        result = {'indicators': []}
        
        # Check for clearing traces
        if any(h.get('event_type') == 'clear_history' for h in history):
            result['indicators'].append('clearing_traces')
        
        # Check for false information patterns
        if self._detect_false_info_pattern(history):
            result['indicators'].append('false_information')
        
        return result
    
    def _identify_psychological_markers(self, event, history: List[Dict]) -> List[str]:
        """Identify psychological behavioral markers"""
        markers = []
        
        # Perfectionism
        if self._detect_perfectionism(history):
            markers.append('perfectionism')
        
        # Impulsivity
        if self._detect_impulsivity(history):
            markers.append('impulsivity')
        
        # Paranoia
        if self._detect_paranoia(history):
            markers.append('paranoia')
        
        return markers
    
    def _detect_content_avoidance(self, history: List[Dict]) -> bool:
        """Detect avoidance of specific content"""
        # Check for quick exits from specific pages
        quick_exits = [h for h in history if h.get('time_on_page', 0) < 1]
        return len(quick_exits) > 5
    
    def _detect_confession_impulses(self, history: List[Dict]) -> bool:
        """Detect impulses to confess"""
        # Check for tip form visits without submission
        tip_visits = [h for h in history if 'tip' in h.get('page_url', '').lower()]
        tip_submits = [h for h in history if h.get('event_type') == 'tip_submit']
        
        return len(tip_visits) > 3 and len(tip_submits) == 0
    
    def _detect_self_soothing(self, history: List[Dict]) -> bool:
        """Detect self-soothing behavior patterns"""
        # Repetitive visiting of comfort pages
        home_visits = sum(1 for h in history if 'home' in h.get('page_url', '').lower())
        return home_visits > 10
    
    def _detect_rumination(self, history: List[Dict]) -> bool:
        """Detect rumination patterns"""
        # Circular navigation patterns
        pages = [h.get('page_url', '') for h in history[:20]]
        
        # Check for repeating sequences
        for i in range(len(pages) - 4):
            if pages[i] == pages[i+2] and pages[i+1] == pages[i+3]:
                return True
        return False
    
    def _divide_into_periods(self, history: List[Dict], num_periods: int) -> List[List[Dict]]:
        """Divide history into time periods"""
        if not history:
            return []
        
        period_size = len(history) // num_periods
        periods = []
        
        for i in range(num_periods):
            start = i * period_size
            end = start + period_size if i < num_periods - 1 else len(history)
            periods.append(history[start:end])
        
        return periods
    
    def _is_systematic_access(self, pages: List[str]) -> bool:
        """Check if pages were accessed systematically"""
        if len(pages) < 5:
            return False
        
        # Look for methodical progression
        unique_pages = []
        for page in pages:
            if page not in unique_pages:
                unique_pages.append(page)
        
        return len(unique_pages) >= self.thresholds['systematic_access_threshold']
    
    def _detect_erratic_behavior(self, history: List[Dict]) -> bool:
        """Detect erratic behavioral patterns"""
        # Rapid, inconsistent navigation
        if len(history) < 5:
            return False
        
        page_times = [h.get('time_on_page', 0) for h in history[:10]]
        
        # High variance in page times indicates erratic behavior
        if page_times:
            avg_time = sum(page_times) / len(page_times)
            variance = sum((t - avg_time) ** 2 for t in page_times) / len(page_times)
            return variance > 100
        
        return False
    
    def _detect_repetitive_behavior(self, history: List[Dict]) -> bool:
        """Detect repetitive behavioral patterns"""
        # Check for repeating action sequences
        actions = [h.get('event_type', '') for h in history[:20]]
        
        # Look for repeating patterns
        for pattern_len in range(2, 5):
            for i in range(len(actions) - pattern_len * 2):
                if actions[i:i+pattern_len] == actions[i+pattern_len:i+pattern_len*2]:
                    return True
        
        return False
    
    def _detect_false_info_pattern(self, history: List[Dict]) -> bool:
        """Detect patterns suggesting false information"""
        # Check for form abandonment after partial fill
        form_starts = sum(1 for h in history if h.get('event_type') == 'form_start')
        form_submits = sum(1 for h in history if h.get('event_type') == 'form_submit')
        
        return form_starts > 3 and form_submits < form_starts / 2
    
    def _detect_perfectionism(self, history: List[Dict]) -> bool:
        """Detect perfectionist behavior"""
        # Multiple edits and revisions
        edit_events = sum(1 for h in history if 'edit' in h.get('event_type', '').lower())
        return edit_events > 5
    
    def _detect_impulsivity(self, history: List[Dict]) -> bool:
        """Detect impulsive behavior"""
        # Quick actions without reading
        quick_actions = sum(1 for h in history if h.get('time_on_page', 0) < 1)
        return quick_actions > 10
    
    def _detect_paranoia(self, history: List[Dict]) -> bool:
        """Detect paranoid behavior"""
        # Checking for tracking, clearing cookies frequently
        privacy_actions = sum(1 for h in history if 
                             any(term in h.get('event_type', '').lower() 
                                 for term in ['clear', 'delete', 'privacy']))
        return privacy_actions > 3
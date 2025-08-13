"""
Behavioral Pattern Detection Module
Detects nervous behavior, obsessive patterns, and psychological indicators
"""

from datetime import datetime, timedelta
from typing import Dict, List, Any
from django.utils import timezone
import logging

logger = logging.getLogger(__name__)


class BehavioralPatternDetector:
    """Detects behavioral patterns indicating criminal involvement"""
    
    def __init__(self, parent_detector):
        self.parent = parent_detector
        self.thresholds = parent_detector.thresholds
    
    def check_nervous_behavior_patterns(self, event, history: List[Dict]) -> Dict[str, Any]:
        """Detect nervous and frantic user behavior patterns"""
        result = {'triggered': False, 'score': 0.0, 'severity': 0, 'details': {}}
        
        nervous_score = 0.0
        nervous_indicators = {}
        
        # 1. NERVOUS TYPING DETECTION
        if event.event_type == 'form_interaction' and event.event_data:
            typing_data = event.event_data.get('typing_metrics', {})
            
            # Check for excessive backspacing
            if typing_data.get('backspace_ratio', 0) > self.thresholds['nervous_typing_backspace_ratio']:
                nervous_score += 3.0
                nervous_indicators['excessive_corrections'] = True
            
            # Check for irregular typing rhythm
            if typing_data.get('typing_variance', 0) > self.thresholds['typing_rhythm_variance']:
                nervous_score += 2.0
                nervous_indicators['irregular_typing'] = True
            
            # Check for form field hesitation
            if typing_data.get('field_hover_time', 0) > self.thresholds['field_hover_time']:
                nervous_score += 2.0
                nervous_indicators['form_hesitation'] = True
        
        # 2. FRANTIC MOUSE MOVEMENTS
        if event.event_data and 'mouse_metrics' in event.event_data:
            mouse_data = event.event_data.get('mouse_metrics', {})
            
            # Check for erratic mouse patterns
            if mouse_data.get('direction_changes', 0) > self.thresholds['mouse_direction_changes']:
                nervous_score += 3.0
                nervous_indicators['erratic_mouse'] = True
            
            # Check for panic clicking
            if mouse_data.get('click_rate', 0) > self.thresholds['panic_click_rate']:
                nervous_score += 2.0
                nervous_indicators['panic_clicking'] = True
            
            # Check for mouse velocity spikes
            if mouse_data.get('velocity_spikes', 0) > 20:
                nervous_score += 2.0
                nervous_indicators['frantic_movements'] = True
        
        # 3. PANIC EXIT DETECTION
        if event.event_type == 'page_exit':
            exit_data = event.event_data or {}
            
            # Check for sudden exit patterns
            if exit_data.get('exit_velocity', 0) > self.thresholds['panic_exit_velocity']:
                nervous_score += 4.0
                nervous_indicators['panic_exit'] = True
            
            # Check for tab/window close without interaction
            if event.time_on_page and event.time_on_page < self.thresholds['immediate_exit_threshold'] and not exit_data.get('interactions'):
                nervous_score += 3.0
                nervous_indicators['immediate_exit'] = True
            
            # Check for exit after viewing specific content
            if self._is_sensitive_content(event.page_url) and event.time_on_page < 5:
                nervous_score += 5.0
                nervous_indicators['sensitive_content_flight'] = True
        
        # 4. BEHAVIORAL STRESS INDICATORS
        # Check for rapid tab switching
        tab_switches = [h for h in history[:20] if h.get('event_type') == 'tab_blur']
        if len(tab_switches) > self.thresholds['excessive_tab_switching']:
            nervous_score += 2.0
            nervous_indicators['excessive_tab_switching'] = True
        
        # Check for scroll stuttering (scroll up/down rapidly)
        if self._detect_scroll_stuttering(event, history):
            nervous_score += 2.0
            nervous_indicators['scroll_stuttering'] = True
        
        if nervous_score > 0:
            result['triggered'] = True
            result['score'] = min(nervous_score, 10.0)
            result['severity'] = min(int(nervous_score / 2), 5)
            result['details'] = nervous_indicators
        
        return result
    
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
        
        if overload_score > 0:
            result['triggered'] = True
            result['score'] = min(overload_score, 10.0)
            result['severity'] = min(int(overload_score / 2), 5)
            result['details'] = overload_indicators
        
        return result
    
    def check_obsessive_visits(self, event, history: List[Dict]) -> Dict[str, Any]:
        """Enhanced rapid/obsessive visit detection"""
        result = {'triggered': False, 'score': 0.0, 'severity': 0, 'details': {}}
        
        # Count recent visits in shorter time window
        time_window = timezone.now() - timedelta(seconds=self.thresholds['obsessive_visits_time'])
        recent_visits = [h for h in history if datetime.fromisoformat(h['timestamp']) > time_window]
        
        obsession_score = 0.0
        obsession_details = {}
        
        if len(recent_visits) >= self.thresholds['obsessive_visits_count']:
            obsession_score += min(len(recent_visits) * 0.2, 5.0)
            obsession_details['rapid_visits'] = len(recent_visits)
        
        # Check for compulsive page refreshing
        refresh_count = sum(1 for h in recent_visits if h.get('event_type') == 'page_refresh')
        if refresh_count > 10:
            obsession_score += 2.0
            obsession_details['compulsive_refreshing'] = refresh_count
        
        # Check navigation speed
        if len(recent_visits) > 1:
            nav_speed = self._calculate_navigation_speed(recent_visits)
            if nav_speed > self.thresholds['rapid_navigation_count']:
                obsession_score += 2.0
                obsession_details['navigation_speed'] = nav_speed
        
        if obsession_score > 0:
            result['triggered'] = True
            result['score'] = min(obsession_score, 10.0)
            result['severity'] = min(int(obsession_score / 2), 5)
            result['details'] = obsession_details
        
        return result
    
    def check_criminal_behavioral_anomalies(self, event, history: List[Dict]) -> Dict[str, Any]:
        """Enhanced behavioral anomaly detection for criminal cases"""
        result = {'triggered': False, 'score': 0.0, 'severity': 0, 'details': {}}
        
        anomaly_score = 0.0
        anomalies = {}
        
        # Check for bot-like behavior
        if self._detect_bot_behavior(event, history):
            anomaly_score += 2.0
            anomalies['bot_like_behavior'] = True
        
        # Check for reconnaissance patterns
        if self._detect_reconnaissance(event, history):
            anomaly_score += 4.0
            anomalies['reconnaissance_detected'] = True
        
        # Check for evasive scrolling patterns
        if event.scroll_depth and event.time_on_page:
            if event.time_on_page > 0:
                scroll_speed = (event.scroll_depth * 1000) / event.time_on_page
                if scroll_speed > 3000:  # Very fast scrolling
                    anomaly_score += 1.0
                    anomalies['rapid_scrolling'] = True
        
        if anomaly_score > 0:
            result['triggered'] = True
            result['score'] = min(anomaly_score, 10.0)
            result['severity'] = min(int(anomaly_score / 2), 5)
            result['details'] = anomalies
        
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
                'intervention_recommended': escalation_probability > self.thresholds['escalation_probability_threshold']
            }
        
        return result
    
    # Helper methods
    
    def _is_sensitive_content(self, url: str) -> bool:
        """Check if URL contains sensitive content"""
        sensitive_keywords = ['evidence', 'witness', 'suspect', 'confidential', 'private']
        return any(keyword in url.lower() for keyword in sensitive_keywords)
    
    def _detect_scroll_stuttering(self, event, history: List[Dict]) -> bool:
        """Detect nervous scroll patterns (up/down/up/down)"""
        scroll_events = [h for h in history[:10] if h.get('event_type') == 'scroll']
        
        if len(scroll_events) < 4:
            return False
        
        direction_changes = 0
        last_direction = None
        
        for scroll in scroll_events:
            direction = scroll.get('event_data', {}).get('direction')
            if last_direction and direction != last_direction:
                direction_changes += 1
            last_direction = direction
        
        return direction_changes > self.thresholds['scroll_stutter_threshold']
    
    def _detect_cognitive_retreat_pattern(self, history: List[Dict]) -> bool:
        """Detect pattern of cognitive retreat when overwhelmed"""
        # Look for pattern: complex page → simple page → complex page → simple page
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
        # Check if user paused at content that hasn't been publicly released
        if event.time_on_page and event.time_on_page > 30:
            # Check if page contains unreleased info (would need case configuration)
            if 'unreleased' in event.page_url or 'confidential' in event.page_url:
                return True
        return False
    
    def _calculate_navigation_speed(self, recent_visits: List[Dict]) -> float:
        """Calculate pages per minute navigation speed"""
        if len(recent_visits) < 2:
            return 0
        
        first_time = datetime.fromisoformat(recent_visits[-1]['timestamp'])
        last_time = datetime.fromisoformat(recent_visits[0]['timestamp'])
        time_diff = (last_time - first_time).total_seconds() / 60  # minutes
        
        if time_diff > 0:
            return len(recent_visits) / time_diff
        return 0
    
    def _detect_bot_behavior(self, event, history: List[Dict]) -> bool:
        """Detect bot-like behavior patterns"""
        # Check for automated patterns
        
        # 1. No mouse movement
        if event.event_data and not event.event_data.get('mouse_metrics'):
            return True
        
        # 2. Instant form filling
        if event.event_type == 'form_submit' and event.time_on_page and event.time_on_page < 2:
            return True
        
        # 3. Perfect timing intervals
        if len(history) > 5:
            intervals = []
            for i in range(1, min(6, len(history))):
                interval = (datetime.fromisoformat(history[i-1]['timestamp']) - 
                           datetime.fromisoformat(history[i]['timestamp'])).total_seconds()
                intervals.append(interval)
            
            if intervals:
                # Check if all intervals are identical
                if all(abs(i - intervals[0]) < 1 for i in intervals):
                    return True
        
        return False
    
    def _detect_reconnaissance(self, event, history: List[Dict]) -> bool:
        """Detect reconnaissance behavior"""
        recon_indicators = 0
        
        # Check for systematic URL probing
        url_probes = [h for h in history if any(
            probe in h.get('page_url', '') for probe in 
            ['/admin', '/backup', '/test', '/temp', '/old', '/.git', '/wp-admin']
        )]
        if len(url_probes) > 2:
            recon_indicators += 1
        
        # Check for parameter manipulation
        if event.event_data and 'url_parameters' in event.event_data:
            params = event.event_data['url_parameters']
            if any(suspicious in str(params) for suspicious in ['<script>', 'SELECT', 'UNION', '../']):
                recon_indicators += 1
        
        # Check for systematic enumeration
        if self._detect_enumeration_pattern(history):
            recon_indicators += 1
        
        return recon_indicators >= 2
    
    def _detect_enumeration_pattern(self, history: List[Dict]) -> bool:
        """Detect enumeration attempts"""
        urls = [h.get('page_url', '') for h in history[:20]]
        
        # Look for sequential numbering in URLs
        import re
        number_pattern = re.compile(r'\d+')
        
        numbers_in_urls = []
        for url in urls:
            numbers = number_pattern.findall(url)
            if numbers:
                numbers_in_urls.extend([int(n) for n in numbers])
        
        # Check for sequential numbers (enumeration)
        if len(numbers_in_urls) > 5:
            sorted_nums = sorted(set(numbers_in_urls))
            sequential_count = sum(1 for i in range(1, len(sorted_nums)) 
                                  if sorted_nums[i] == sorted_nums[i-1] + 1)
            
            return sequential_count > 3
        
        return False
    
    def _detect_increasing_frequency(self, history: List[Dict]) -> bool:
        """Detect increasing visit frequency"""
        if len(history) < 10:
            return False
        
        # Calculate time between visits
        time_gaps = []
        for i in range(1, len(history)):
            gap = (datetime.fromisoformat(history[i-1]['timestamp']) - 
                   datetime.fromisoformat(history[i]['timestamp'])).total_seconds()
            time_gaps.append(gap)
        
        # Check if gaps are getting smaller (more frequent visits)
        first_half_avg = sum(time_gaps[:len(time_gaps)//2]) / (len(time_gaps)//2)
        second_half_avg = sum(time_gaps[len(time_gaps)//2:]) / (len(time_gaps) - len(time_gaps)//2)
        
        return second_half_avg < first_half_avg * 0.5  # Visits twice as frequent
    
    def _detect_expanding_scope(self, history: List[Dict]) -> bool:
        """Detect if user is expanding their investigation scope"""
        # Track unique pages accessed over time
        time_periods = self._divide_into_periods(history, 3)
        unique_pages_per_period = []
        
        for period in time_periods:
            unique_pages = set(h.get('page_url', '') for h in period)
            unique_pages_per_period.append(len(unique_pages))
        
        # Check if accessing more diverse content over time
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
        # Look for increasingly frantic behavior
        time_periods = self._divide_into_periods(history, 3)
        intensity_scores = []
        
        for period in time_periods:
            # Calculate emotional intensity indicators
            rapid_clicks = sum(1 for h in period if h.get('event_type') == 'rapid_click')
            quick_exits = sum(1 for h in period if h.get('time_on_page', 0) < 2)
            intensity = rapid_clicks + quick_exits
            intensity_scores.append(intensity)
        
        # Check if emotional intensity is increasing
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
        
        # Check for information organization (downloads, screenshots)
        organization_events = sum(1 for h in history if h.get('event_type') in ['download', 'screenshot', 'print'])
        if organization_events > 5:
            planning_indicators += 1
        
        return planning_indicators >= self.thresholds['planning_indicators_threshold']
    
    def _is_systematic_access(self, pages: List[str]) -> bool:
        """Check if pages were accessed systematically"""
        if len(pages) < 5:
            return False
        
        # Look for pattern in page access
        categories = [self._categorize_page(p) for p in pages]
        
        # Check if accessing categories in order
        unique_categories = []
        for cat in categories:
            if cat not in unique_categories:
                unique_categories.append(cat)
        
        # Systematic if accessing different categories in sequence
        return len(unique_categories) >= self.thresholds['systematic_access_threshold']
    
    def _categorize_page(self, url: str) -> str:
        """Categorize page type from URL"""
        url_lower = url.lower()
        if 'photo' in url_lower or 'image' in url_lower:
            return 'photos'
        elif 'timeline' in url_lower:
            return 'timeline'
        elif 'evidence' in url_lower:
            return 'evidence'
        elif 'witness' in url_lower:
            return 'witnesses'
        elif 'news' in url_lower or 'update' in url_lower:
            return 'news'
        else:
            return 'other'
    
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
    
    def _predict_escalation_timeframe(self, history: List[Dict]) -> str:
        """Predict timeframe for potential escalation"""
        # Calculate acceleration rate
        if len(history) < 10:
            return "insufficient_data"
        
        time_gaps = []
        for i in range(1, min(len(history), 20)):
            gap = (datetime.fromisoformat(history[i-1]['timestamp']) - 
                   datetime.fromisoformat(history[i]['timestamp'])).total_seconds() / 3600  # hours
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
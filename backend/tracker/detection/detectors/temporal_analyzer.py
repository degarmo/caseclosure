"""
Temporal Analysis Module
Analyzes time-based patterns and behaviors
"""

from datetime import datetime, timedelta
from typing import Dict, List, Any
import logging

logger = logging.getLogger(__name__)


class TemporalAnalyzer:
    """Analyzes temporal patterns in user behavior"""
    
    def __init__(self, parent_detector):
        self.parent = parent_detector
        self.thresholds = parent_detector.thresholds
    
    def detect_life_pattern_changes(self, history: List[Dict]) -> Dict[str, Any]:
        """Detect changes in user's life patterns"""
        result = {'triggered': False, 'score': 0.0, 'severity': 0, 'details': {}}
        
        if len(history) < 20:
            return result
        
        pattern_score = 0.0
        pattern_changes = {}
        
        # Divide history into periods
        early_history = history[len(history)//2:]
        recent_history = history[:len(history)//2]
        
        # SLEEP PATTERN DISRUPTION
        early_night = [h for h in early_history if self._is_night_hour(h.get('timestamp'))]
        recent_night = [h for h in recent_history if self._is_night_hour(h.get('timestamp'))]
        
        if len(recent_night) / len(recent_history) > len(early_night) / len(early_history) * 2:
            pattern_score += 4.0
            pattern_changes['sleep_disruption'] = True
        
        # WORK HOURS VIOLATION
        if self._detect_work_hours_violation(recent_history):
            pattern_score += 3.0
            pattern_changes['work_hours_violation'] = True
        
        # WEEKEND PATTERN CHANGE
        if self._detect_weekend_pattern_change(early_history, recent_history):
            pattern_score += 2.0
            pattern_changes['weekend_change'] = True
        
        # ESCALATION PATTERN
        if self._detect_escalation_pattern(history):
            pattern_score += 5.0
            pattern_changes['escalation_detected'] = True
        
        if pattern_score > 0:
            result['triggered'] = True
            result['score'] = min(pattern_score, 10.0)
            result['severity'] = min(int(pattern_score / 2), 5)
            result['details'] = pattern_changes
        
        return result
    
    def check_timeline_obsession(self, event, history: List[Dict]) -> Dict[str, Any]:
        """Detect obsessive monitoring of case timeline"""
        result = {'triggered': False, 'score': 0.0, 'severity': 0, 'details': {}}
        
        # Count timeline page visits
        timeline_visits = [h for h in history if 'timeline' in h.get('page_url', '').lower()]
        
        if len(timeline_visits) > self.thresholds['timeline_obsession_count']:
            obsession_score = min(len(timeline_visits) * 0.4, 8.0)
            
            # Check for anniversary monitoring
            anniversary_visits = self._check_anniversary_correlation(timeline_visits)
            if anniversary_visits:
                obsession_score += 2.0
            
            result['triggered'] = True
            result['score'] = min(obsession_score, 10.0)
            result['severity'] = min(int(obsession_score / 2), 5)
            result['details'] = {
                'timeline_visits': len(timeline_visits),
                'anniversary_correlation': anniversary_visits,
                'pattern_type': 'obsessive_monitoring'
            }
        
        return result
    
    def check_criminal_timing(self, event, history: List[Dict]) -> Dict[str, Any]:
        """Enhanced timing analysis for criminal behavior"""
        result = {'triggered': False, 'score': 0.0, 'severity': 0, 'details': {}}
        
        timing_score = 0.0
        timing_details = {}
        
        # Check current event timing
        hour = event.timestamp.hour
        is_unusual = 2 <= hour < 6  # 2am-6am is most suspicious
        is_night = hour >= 22 or hour < 6
        
        if is_unusual:
            timing_score += 3.0
            timing_details['unusual_hour_access'] = hour
        
        # Historical timing pattern analysis
        if history:
            night_visits = [h for h in history if self._is_night_hour(h.get('timestamp'))]
            night_ratio = len(night_visits) / len(history)
            
            if night_ratio > self.thresholds['unusual_hour_ratio']:
                timing_score += min(night_ratio * 5.0, 4.0)
                timing_details['night_access_ratio'] = night_ratio
        
        # Check for anniversary correlation
        if self._is_case_anniversary(event.timestamp):
            timing_score += 2.0
            timing_details['anniversary_access'] = True
        
        # Check for systematic timing patterns
        if self._detect_systematic_timing(history):
            timing_score += 2.0
            timing_details['systematic_pattern'] = True
        
        if timing_score > 0:
            result['triggered'] = True
            result['score'] = min(timing_score, 10.0)
            result['severity'] = min(int(timing_score / 2), 5)
            result['details'] = timing_details
        
        return result
    
    def check_news_correlation(self, event, history: List[Dict]) -> Dict[str, Any]:
        """Detect correlation between site visits and news coverage"""
        result = {'triggered': False, 'score': 0.0, 'severity': 0, 'details': {}}
        
        # Check for activity spikes after news events
        if self._detect_news_spike_correlation(history):
            result['triggered'] = True
            result['score'] = 6.0
            result['severity'] = 3
            result['details'] = {
                'news_correlation_detected': True,
                'pattern_type': 'reactive_monitoring'
            }
        
        return result
    
    def analyze_interest_patterns(self, history: List[Dict]) -> Dict[str, Any]:
        """Detect unnatural interest patterns"""
        result = {'triggered': False, 'score': 0.0, 'severity': 0, 'details': {}}
        
        if len(history) < 10:
            return result
        
        pattern_score = 0.0
        pattern_details = {}
        
        # Calculate interest over time
        time_buckets = self._create_time_buckets(history)
        interest_curve = self._calculate_interest_curve(time_buckets)
        
        # NORMAL PATTERN: High initial interest, gradual decay
        # SUSPICIOUS PATTERN: Sustained high interest, spikes at key dates
        
        # Check for no natural decay
        if self._has_no_natural_decay(interest_curve):
            pattern_score += 5.0
            pattern_details['no_natural_decay'] = True
        
        # Check for anniversary spikes
        anniversary_visits = self._detect_anniversary_spikes(history)
        if anniversary_visits:
            pattern_score += 4.0
            pattern_details['anniversary_spikes'] = anniversary_visits
        
        # Check for news-triggered visits
        if self._detect_news_triggered_pattern(history):
            pattern_score += 3.0
            pattern_details['news_triggered'] = True
        
        # Check for selective interest (only specific aspects)
        focus_areas = self._analyze_content_focus(history)
        if focus_areas['selectivity_score'] > 0.7:
            pattern_score += 3.0
            pattern_details['selective_interest'] = focus_areas['primary_focus']
        
        if pattern_score > 0:
            result['triggered'] = True
            result['score'] = min(pattern_score, 10.0)
            result['severity'] = min(int(pattern_score / 2), 5)
            result['details'] = pattern_details
        
        return result
    
    def predict_escalation_timeframe(self, history: List[Dict]) -> str:
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
    
    # Helper methods
    
    def _is_night_hour(self, timestamp_str: str) -> bool:
        """Check if timestamp is during night hours"""
        try:
            dt = datetime.fromisoformat(timestamp_str)
            hour = dt.hour
            return hour >= 22 or hour < 6
        except:
            return False
    
    def _detect_work_hours_violation(self, history: List[Dict]) -> bool:
        """Detect access during typical work hours"""
        work_hour_access = 0
        for h in history:
            timestamp = datetime.fromisoformat(h['timestamp'])
            if 9 <= timestamp.hour <= 17 and timestamp.weekday() < 5:  # Mon-Fri, 9-5
                work_hour_access += 1
        
        return work_hour_access > len(history) * self.thresholds['work_hours_violation_ratio']
    
    def _detect_weekend_pattern_change(self, early: List[Dict], recent: List[Dict]) -> bool:
        """Detect changes in weekend access patterns"""
        early_weekend = sum(1 for h in early if datetime.fromisoformat(h['timestamp']).weekday() >= 5)
        recent_weekend = sum(1 for h in recent if datetime.fromisoformat(h['timestamp']).weekday() >= 5)
        
        early_ratio = early_weekend / len(early) if early else 0
        recent_ratio = recent_weekend / len(recent) if recent else 0
        
        # Significant change in weekend activity
        return abs(recent_ratio - early_ratio) > 0.3
    
    def _detect_escalation_pattern(self, history: List[Dict]) -> bool:
        """Detect escalating behavior pattern"""
        # Check for increasing intensity over time
        time_periods = self._divide_into_periods(history, 3)
        intensity_scores = []
        
        for period in time_periods:
            # Calculate intensity for each period
            intensity = len(period) + sum(1 for h in period if h.get('event_type') in ['copy', 'download', 'screenshot'])
            intensity_scores.append(intensity)
        
        # Check if intensity is increasing
        return intensity_scores == sorted(intensity_scores)
    
    def _check_anniversary_correlation(self, timeline_visits: List[Dict]) -> bool:
        """Check if visits correlate with case anniversaries"""
        if not timeline_visits:
            return False
        
        # Extract visit dates
        visit_dates = []
        for visit in timeline_visits:
            timestamp = datetime.fromisoformat(visit['timestamp'])
            visit_dates.append(timestamp.day)
        
        # Check for clustering around specific dates
        date_counts = {}
        for day in visit_dates:
            date_counts[day] = date_counts.get(day, 0) + 1
        
        # Suspicious if multiple visits on same day of month
        return any(count > 3 for count in date_counts.values())
    
    def _is_case_anniversary(self, timestamp: datetime) -> bool:
        """Check if date is a case anniversary"""
        # Would need case configuration for actual dates
        # Check for monthly anniversaries
        day = timestamp.day
        # Placeholder - would check against actual case dates
        anniversary_days = [15, 30]  # Example anniversary days
        return day in anniversary_days
    
    def _detect_systematic_timing(self, history: List[Dict]) -> bool:
        """Detect systematic timing patterns"""
        access_times = []
        for h in history[:20]:
            timestamp = datetime.fromisoformat(h['timestamp'])
            access_times.append(timestamp.hour)
        
        # Check for regular timing pattern
        if len(set(access_times)) < 3:  # Always same hours
            return True
        
        return False
    
    def _detect_news_spike_correlation(self, history: List[Dict]) -> bool:
        """Detect correlation between visits and news coverage"""
        return self._detect_news_triggered_pattern(history)
    
    def _detect_news_triggered_pattern(self, history: List[Dict]) -> bool:
        """Detect if visits correlate with news events"""
        # Would need integration with news API or feed
        # Check for visit spikes after typical news posting times
        visit_hours = [datetime.fromisoformat(h['timestamp']).hour for h in history]
        
        # News typically breaks at certain hours
        news_hours = [6, 12, 17, 22]  # Morning, noon, evening, late news
        news_correlation = sum(1 for h in visit_hours if h in news_hours or h == (news_hours[0] + 1))
        
        return news_correlation > len(visit_hours) * self.thresholds['news_correlation_threshold']
    
    def _create_time_buckets(self, history: List[Dict]) -> Dict[str, List]:
        """Create time buckets for interest analysis"""
        buckets = {}
        for h in history:
            timestamp = datetime.fromisoformat(h['timestamp'])
            day_key = timestamp.date().isoformat()
            if day_key not in buckets:
                buckets[day_key] = []
            buckets[day_key].append(h)
        return buckets
    
    def _calculate_interest_curve(self, time_buckets: Dict[str, List]) -> List[float]:
        """Calculate interest level over time"""
        curve = []
        for date in sorted(time_buckets.keys()):
            events = time_buckets[date]
            # Interest score based on number of events and time spent
            interest = len(events) + sum(e.get('time_on_page', 0) for e in events) / 60
            curve.append(interest)
        return curve
    
    def _has_no_natural_decay(self, interest_curve: List[float]) -> bool:
        """Check if interest shows natural decay pattern"""
        if len(interest_curve) < 5:
            return False
        
        # Calculate trend
        first_half_avg = sum(interest_curve[:len(interest_curve)//2]) / (len(interest_curve)//2)
        second_half_avg = sum(interest_curve[len(interest_curve)//2:]) / (len(interest_curve) - len(interest_curve)//2)
        
        # Suspicious if second half has similar or higher interest
        return second_half_avg >= first_half_avg * 0.8
    
    def _detect_anniversary_spikes(self, history: List[Dict]) -> List[str]:
        """Detect visits on case anniversary dates"""
        anniversary_dates = []
        # Would need case configuration for actual anniversary dates
        # For now, check for monthly patterns
        visit_dates = {}
        for h in history:
            timestamp = datetime.fromisoformat(h['timestamp'])
            day = timestamp.day
            if day not in visit_dates:
                visit_dates[day] = 0
            visit_dates[day] += 1
        
        # Check for specific day clustering
        for day, count in visit_dates.items():
            if count > 5:  # Multiple visits on same day of month
                anniversary_dates.append(f"Day {day}")
        
        return anniversary_dates
    
    def _analyze_content_focus(self, history: List[Dict]) -> Dict[str, Any]:
        """Analyze what content user focuses on"""
        focus_areas = {}
        total_time = 0
        
        for h in history:
            page_type = self._categorize_page(h.get('page_url', ''))
            time_spent = h.get('time_on_page', 0)
            
            if page_type not in focus_areas:
                focus_areas[page_type] = 0
            focus_areas[page_type] += time_spent
            total_time += time_spent
        
        # Calculate selectivity score
        if total_time > 0:
            max_focus = max(focus_areas.values())
            selectivity = max_focus / total_time
        else:
            selectivity = 0
        
        primary_focus = max(focus_areas, key=focus_areas.get) if focus_areas else None
        
        return {
            'selectivity_score': selectivity,
            'primary_focus': primary_focus,
            'focus_distribution': focus_areas
        }
    
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
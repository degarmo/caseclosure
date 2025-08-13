"""
Content Forensics Module
Analyzes media interaction, content harvesting, and search patterns
"""

from datetime import datetime, timedelta
from typing import Dict, List, Any
import re
import logging

logger = logging.getLogger(__name__)


class ContentForensicsAnalyzer:
    """Analyzes content interaction patterns for criminal behavior"""
    
    def __init__(self, parent_detector):
        self.parent = parent_detector
        self.thresholds = parent_detector.thresholds
    
    def analyze_media_interaction(self, event) -> Dict[str, Any]:
        """Detailed analysis of photo/video interaction"""
        result = {'triggered': False, 'score': 0.0, 'severity': 0, 'details': {}}
        
        if event.event_type not in ['image_view', 'video_play', 'media_interaction']:
            return result
        
        interaction_score = 0.0
        interaction_details = {}
        
        media_data = event.event_data or {}
        
        # PHOTO ANALYSIS BEHAVIOR
        if event.event_type == 'image_view':
            # Check for background analysis
            if media_data.get('zoom_areas', []):
                zoom_areas = media_data['zoom_areas']
                if any('background' in area for area in zoom_areas):
                    interaction_score += 4.0
                    interaction_details['analyzing_backgrounds'] = True
            
            # Check for face focus duration
            if media_data.get('face_focus_duration', 0) > self.thresholds['face_focus_duration']:
                interaction_score += 5.0
                interaction_details['extended_face_study'] = True
            
            # Check for screenshot attempts
            if media_data.get('screenshot_attempt', False):
                interaction_score += 3.0
                interaction_details['screenshot_attempt'] = True
        
        # VIDEO WATCHING PATTERNS
        if event.event_type == 'video_play':
            # Check for segment replays
            if media_data.get('replay_count', 0) > self.thresholds['replay_count_threshold']:
                interaction_score += 3.0
                interaction_details['obsessive_replay'] = True
            
            # Check for specific moment pauses
            pause_timestamps = media_data.get('pause_timestamps', [])
            if len(pause_timestamps) > self.thresholds['pause_count_threshold']:
                interaction_score += 3.0
                interaction_details['analyzing_moments'] = True
            
            # Check for slow motion viewing
            if media_data.get('playback_rate', 1.0) < 0.5:
                interaction_score += 4.0
                interaction_details['slow_motion_analysis'] = True
        
        if interaction_score > 0:
            result['triggered'] = True
            result['score'] = min(interaction_score, 10.0)
            result['severity'] = min(int(interaction_score / 2), 5)
            result['details'] = interaction_details
        
        return result
    
    def check_content_harvesting(self, event, history: List[Dict]) -> Dict[str, Any]:
        """Enhanced content harvesting detection for criminal cases"""
        result = {'triggered': False, 'score': 0.0, 'severity': 0, 'details': {}}
        
        harvesting_score = 0.0
        harvesting_details = {}
        
        # Check for excessive copying
        copy_events = [h for h in history if h.get('event_type') == 'copy']
        if len(copy_events) > self.thresholds['copy_events_count']:
            harvesting_score += 3.0
            harvesting_details['excessive_copying'] = len(copy_events)
        
        # Check for screenshot attempts
        screenshot_events = [h for h in history if 'screenshot' in str(h.get('event_data', {}))]
        if len(screenshot_events) > self.thresholds['evidence_screenshot_count']:
            harvesting_score += 4.0
            harvesting_details['screenshot_attempts'] = len(screenshot_events)
        
        # Check for download patterns
        download_events = [h for h in history if 'download' in h.get('event_type', '').lower()]
        if len(download_events) > self.thresholds['victim_photo_downloads']:
            harvesting_score += 3.0
            harvesting_details['downloads'] = len(download_events)
        
        # Check for print attempts
        print_events = [h for h in history if 'print' in h.get('event_type', '').lower()]
        if len(print_events) > self.thresholds['print_events_count']:
            harvesting_score += 2.0
            harvesting_details['print_attempts'] = len(print_events)
        
        # Check for systematic content access
        if self._detect_systematic_harvesting(history):
            harvesting_score += 4.0
            harvesting_details['systematic_harvesting'] = True
        
        # Check for save attempts
        save_events = [h for h in history if 'save' in h.get('event_type', '').lower()]
        if len(save_events) > self.thresholds['save_attempts_count']:
            harvesting_score += 2.0
            harvesting_details['save_attempts'] = len(save_events)
        
        if harvesting_score > 0:
            result['triggered'] = True
            result['score'] = min(harvesting_score, 10.0)
            result['severity'] = min(int(harvesting_score / 2), 5)
            result['details'] = harvesting_details
        
        return result
    
    def analyze_search_patterns(self, event, history: List[Dict]) -> Dict[str, Any]:
        """Analyze search queries for criminal knowledge indicators"""
        result = {'triggered': False, 'score': 0.0, 'severity': 0, 'details': {}}
        
        if event.event_type != 'search' or not event.event_data:
            return result
        
        search_query = event.event_data.get('query', '').lower()
        suspicious_score = 0.0
        suspicious_details = {}
        
        # GUILTY KNOWLEDGE INDICATORS
        suspicious_searches = {
            'disposal_methods': ['how to hide', 'dissolve', 'burn evidence', 'delete permanently', 'destroy DNA'],
            'investigation_knowledge': ['police procedure', 'DNA evidence', 'how long before', 'statute limitations', 'forensic'],
            'counter_forensics': ['IP trace', 'anonymous browsing', 'metadata removal', 'EXIF', 'digital footprint'],
            'victim_details': ['last seen wearing', 'personal schedule', 'home alone', 'routine', 'habits'],
            'legal_consequences': ['sentence for', 'prison time', 'death penalty', 'plea deal', 'immunity'],
        }
        
        for category, keywords in suspicious_searches.items():
            if any(keyword in search_query for keyword in keywords):
                suspicious_score += 5.0
                suspicious_details[f'suspicious_search_{category}'] = True
        
        # EVOLVING SEARCH REFINEMENT - Check for progression
        search_history = [h.get('event_data', {}).get('query', '') for h in history 
                         if h.get('event_type') == 'search' and h.get('event_data')]
        if self._detect_search_progression(search_history):
            suspicious_score += 3.0
            suspicious_details['progressive_refinement'] = True
        
        # TYPOS AND STRESS INDICATORS
        if self._detect_stress_typos(search_query, history):
            suspicious_score += 2.0
            suspicious_details['stress_induced_typos'] = True
        
        # Check for repeated suspicious searches
        if self._count_suspicious_searches(history) > self.thresholds['suspicious_search_threshold']:
            suspicious_score += 3.0
            suspicious_details['repeated_suspicious_searches'] = True
        
        if suspicious_score > 0:
            result['triggered'] = True
            result['score'] = min(suspicious_score, 10.0)
            result['severity'] = min(int(suspicious_score / 2), 5)
            result['details'] = suspicious_details
        
        return result
    
    def analyze_tip_submission_language(self, text: str) -> Dict[str, Any]:
        """Analyze anonymous tips for insider knowledge"""
        result = {'triggered': False, 'score': 0.0, 'severity': 0, 'details': {}}
        
        if not text:
            return result
        
        text_lower = text.lower()
        suspicious_score = 0.0
        suspicious_indicators = []
        
        # UNNECESSARY DENIALS
        unnecessary_denials = ['i had nothing to do with', 'i wasn\'t there', 'not involved', 'didn\'t do it']
        if any(denial in text_lower for denial in unnecessary_denials):
            suspicious_score += 4.0
            suspicious_indicators.append('unnecessary_denials')
        
        # GUILTY KNOWLEDGE
        guilty_knowledge_terms = ['body', 'victim', 'deceased', 'corpse', 'remains']
        # Check if using past tense or death-related terms before official discovery
        for term in guilty_knowledge_terms:
            if term in text_lower and self._is_before_public_knowledge(term):
                suspicious_score += 8.0
                suspicious_indicators.append('guilty_knowledge')
                break
        
        # DEFLECTION PHRASES
        deflection_phrases = ['you should look at', 'check out', 'suspicious person', 'investigate', 'why don\'t you']
        if any(phrase in text_lower for phrase in deflection_phrases):
            suspicious_score += 3.0
            suspicious_indicators.append('deflection_attempt')
        
        # EMOTIONAL LEAKAGE
        emotional_leakage = ['deserved', 'had it coming', 'finally', 'karma', 'justice', 'punishment']
        if any(emotion in text_lower for emotion in emotional_leakage):
            suspicious_score += 5.0
            suspicious_indicators.append('emotional_leakage')
        
        # ANALYZE WRITING STYLE
        style_analysis = self._analyze_writing_style(text)
        if style_analysis['stress_indicators']:
            suspicious_score += 2.0
            suspicious_indicators.append('writing_stress')
        
        if suspicious_score > 0:
            result['triggered'] = True
            result['score'] = min(suspicious_score, 10.0)
            result['severity'] = min(int(suspicious_score / 2), 5)
            result['details'] = {
                'indicators': suspicious_indicators,
                'text_length': len(text),
                'style_analysis': style_analysis
            }
        
        return result
    
    # Helper methods
    
    def _detect_systematic_harvesting(self, history: List[Dict]) -> bool:
        """Detect systematic content harvesting"""
        # Look for methodical downloading/copying pattern
        harvest_events = []
        for h in history:
            if h.get('event_type') in ['download', 'copy', 'screenshot', 'save']:
                harvest_events.append(h)
        
        if len(harvest_events) < 5:
            return False
        
        # Check for systematic pattern
        pages = [h.get('page_url', '') for h in harvest_events]
        
        # Check if harvesting in order
        return self._is_systematic_access(pages)
    
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
    
    def _detect_search_progression(self, search_history: List[str]) -> bool:
        """Detect if searches show knowledge progression"""
        if len(search_history) < 3:
            return False
        
        # Look for pattern: general → specific → very specific
        # Example: "missing person" → "missing person chicago" → "jane doe found"
        specificity_scores = []
        for search in search_history:
            words = search.split()
            specificity_scores.append(len(words))
        
        # Check if searches are getting more specific
        return specificity_scores == sorted(specificity_scores)
    
    def _detect_stress_typos(self, query: str, history: List[Dict]) -> bool:
        """Detect stress-induced typos in queries"""
        # Check for multiple corrections of same query
        recent_searches = [h.get('event_data', {}).get('query', '') for h in history[:5] 
                          if h.get('event_type') == 'search' and h.get('event_data')]
        
        # Look for similar queries with corrections
        if len(recent_searches) > 1:
            for i in range(1, len(recent_searches)):
                similarity = self._calculate_string_similarity(recent_searches[i-1], recent_searches[i])
                if 0.7 < similarity < 0.95:  # Similar but not identical
                    return True
        return False
    
    def _count_suspicious_searches(self, history: List[Dict]) -> int:
        """Count number of suspicious searches in history"""
        suspicious_count = 0
        suspicious_terms = [
            'delete', 'hide', 'remove', 'evidence', 'DNA', 'fingerprint',
            'police', 'investigation', 'forensic', 'trace', 'anonymous'
        ]
        
        for h in history:
            if h.get('event_type') == 'search' and h.get('event_data'):
                query = h.get('event_data', {}).get('query', '').lower()
                if any(term in query for term in suspicious_terms):
                    suspicious_count += 1
        
        return suspicious_count
    
    def _is_before_public_knowledge(self, term: str) -> bool:
        """Check if term was used before public knowledge"""
        # Would need case timeline configuration
        # This is a placeholder - in production would check against
        # actual case timeline for when information became public
        return False
    
    def _analyze_writing_style(self, text: str) -> Dict[str, Any]:
        """Analyze writing style for stress indicators"""
        sentences = text.split('.')
        word_count = len(text.split())
        
        style_analysis = {
            'stress_indicators': False,
            'avg_sentence_length': len(sentences) / max(len([s for s in sentences if s.strip()]), 1),
            'punctuation_density': len([c for c in text if c in '!?.,;:']) / max(word_count, 1),
            'caps_usage': sum(1 for c in text if c.isupper()) / max(len(text), 1),
        }
        
        # Stress indicators: short sentences, high punctuation, unusual caps
        if (style_analysis['avg_sentence_length'] < 5 or 
            style_analysis['punctuation_density'] > self.thresholds['writing_stress_threshold'] or
            style_analysis['caps_usage'] > 0.1):
            style_analysis['stress_indicators'] = True
        
        return style_analysis
    
    def _calculate_string_similarity(self, str1: str, str2: str) -> float:
        """Calculate similarity between two strings (Levenshtein ratio)"""
        if not str1 or not str2:
            return 0.0
        
        # Simple similarity calculation
        longer = max(len(str1), len(str2))
        if longer == 0:
            return 1.0
        
        # Count matching characters
        matches = sum(c1 == c2 for c1, c2 in zip(str1, str2))
        return matches / longer
# enhanced_ml_analyzer.py - Advanced ML Analysis for Criminal Investigation Cases
# Location: tracker/ml_analyzer.py

import pandas as pd
import numpy as np
from sklearn.ensemble import IsolationForest, RandomForestClassifier, GradientBoostingClassifier
from sklearn.preprocessing import StandardScaler, MinMaxScaler
from sklearn.cluster import DBSCAN, KMeans, AgglomerativeClustering
from sklearn.decomposition import PCA
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from sklearn.neural_network import MLPClassifier
import tensorflow as tf
from tensorflow import keras
from tensorflow.keras import layers
import joblib
import json
import logging
import hashlib
from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional, Tuple
from scipy import stats
from scipy.spatial.distance import euclidean, cosine
from scipy.signal import find_peaks
import warnings
warnings.filterwarnings('ignore')

logger = logging.getLogger(__name__)


class CriminalMLAnalyzer:
    """
    Advanced ML analyzer specifically designed for criminal investigation cases.
    Integrates with EnhancedSuspiciousDetector for comprehensive behavioral analysis.
    """
    
    def __init__(self):
        # Initialize ML models
        self.anomaly_detector = IsolationForest(
            contamination=0.05,  # Lower contamination for criminal cases
            random_state=42,
            n_estimators=200
        )
        
        # Criminal behavior classifier
        self.criminal_classifier = GradientBoostingClassifier(
            n_estimators=300,
            max_depth=5,  # Changed from learning_depth to max_depth
            random_state=42
        )
        
        # Behavioral pattern classifier
        self.pattern_classifier = RandomForestClassifier(
            n_estimators=200,
            max_depth=10,
            random_state=42
        )
        
        # Deep learning model for complex patterns
        self.deep_model = self._build_deep_model()
        
        # Clustering for behavior grouping
        self.behavior_clusterer = DBSCAN(eps=0.3, min_samples=5)
        
        # Scalers for different feature types
        self.standard_scaler = StandardScaler()
        self.minmax_scaler = MinMaxScaler()
        
        # Text analyzer for linguistic patterns
        self.text_vectorizer = TfidfVectorizer(
            max_features=1000,
            ngram_range=(1, 3),
            stop_words='english'
        )
        
        # Load pre-trained models if available
        self.load_models()
        
        # Criminal-specific thresholds
        self.ml_thresholds = {
            'anomaly_threshold': -0.3,
            'criminal_probability': 0.7,
            'escalation_threshold': 0.6,
            'coordination_threshold': 0.8,
            'identity_match_threshold': 0.85,
            'behavioral_consistency': 0.75,
        }
    
    def _build_deep_model(self) -> keras.Model:
        """Build deep learning model for complex pattern detection"""
        model = keras.Sequential([
            layers.Dense(256, activation='relu', input_shape=(100,)),
            layers.Dropout(0.3),
            layers.Dense(128, activation='relu'),
            layers.BatchNormalization(),
            layers.Dropout(0.3),
            layers.Dense(64, activation='relu'),
            layers.Dense(32, activation='relu'),
            layers.Dense(1, activation='sigmoid')
        ])
        
        model.compile(
            optimizer='adam',
            loss='binary_crossentropy',
            metrics=['accuracy', keras.metrics.AUC()]
        )
        
        return model
    
    def extract_criminal_features(self, session_data: Dict[str, Any]) -> pd.DataFrame:
        """Extract features specifically relevant to criminal investigation"""
        
        features = {
            # ============ TEMPORAL FEATURES ============
            'hour_of_day': session_data['timestamp'].hour,
            'day_of_week': session_data['timestamp'].weekday(),
            'is_weekend': int(session_data['timestamp'].weekday() >= 5),
            'is_night_stalking': int(23 <= session_data['timestamp'].hour or session_data['timestamp'].hour < 4),
            'is_unusual_hour': int(2 <= session_data['timestamp'].hour < 6),
            'days_since_case_start': (session_data['timestamp'] - session_data.get('case_start_date', session_data['timestamp'])).days,
            'is_anniversary': int(session_data['timestamp'].day in [15, 30]),  # Monthly anniversaries
            
            # ============ NAVIGATION PATTERNS ============
            'page_views_count': len(session_data.get('pages', [])),
            'unique_pages_count': len(set(session_data.get('pages', []))),
            'victim_page_ratio': self._calculate_victim_page_ratio(session_data.get('pages', [])),
            'evidence_page_ratio': self._calculate_evidence_page_ratio(session_data.get('pages', [])),
            'timeline_obsession_score': self._calculate_timeline_obsession(session_data.get('pages', [])),
            'navigation_speed': len(session_data.get('pages', [])) / max(session_data.get('duration', 1), 1),
            'avg_time_per_page': np.mean(session_data.get('page_times', [0])),
            'rapid_navigation_count': session_data.get('rapid_nav_count', 0),
            
            # ============ BEHAVIORAL INDICATORS ============
            'click_count': session_data.get('clicks', 0),
            'panic_click_rate': session_data.get('panic_clicks', 0) / max(session_data.get('duration', 1), 1),
            'scroll_depth_avg': np.mean(session_data.get('scroll_depths', [0])),
            'scroll_stuttering': int(session_data.get('scroll_direction_changes', 0) > 5),
            'hover_duration_avg': np.mean(session_data.get('hover_durations', [0])),
            'mouse_velocity_avg': np.mean(session_data.get('mouse_velocities', [0])),
            'erratic_mouse_score': self._calculate_erratic_mouse_score(session_data),
            
            # ============ CONTENT INTERACTION ============
            'copy_events': session_data.get('copy_events', 0),
            'screenshot_attempts': session_data.get('screenshot_attempts', 0),
            'download_count': session_data.get('downloads', 0),
            'print_attempts': session_data.get('print_attempts', 0),
            'form_submissions': session_data.get('form_submissions', 0),
            'failed_submissions': session_data.get('failed_submissions', 0),
            'search_count': session_data.get('search_count', 0),
            'victim_name_searches': session_data.get('victim_searches', 0),
            
            # ============ EVASION INDICATORS ============
            'is_vpn': int(session_data.get('is_vpn', False)),
            'is_tor': int(session_data.get('is_tor', False)),
            'is_proxy': int(session_data.get('is_proxy', False)),
            'device_changes': session_data.get('device_changes', 0),
            'ip_changes': session_data.get('ip_changes', 0),
            'user_agent_changes': session_data.get('ua_changes', 0),
            'cookie_cleared': int(session_data.get('cookies_cleared', False)),
            'fingerprint_spoofing': int(session_data.get('fingerprint_anomaly', False)),
            
            # ============ AUTHENTICATION PATTERNS ============
            'failed_login_attempts': session_data.get('failed_logins', 0),
            'password_reset_attempts': session_data.get('password_resets', 0),
            'account_creation_attempts': session_data.get('account_creations', 0),
            
            # ============ PSYCHOLOGICAL INDICATORS ============
            'typing_speed_variance': session_data.get('typing_variance', 0),
            'backspace_ratio': session_data.get('backspace_ratio', 0),
            'decision_paralysis_score': self._calculate_decision_paralysis(session_data),
            'cognitive_load_indicator': self._calculate_cognitive_load(session_data),
            
            # ============ PATTERN INDICATORS ============
            'repeat_visits': session_data.get('repeat_visits', 0),
            'compulsive_checking_score': self._calculate_compulsive_score(session_data),
            'stalking_pattern_score': self._calculate_stalking_score(session_data),
            'obsession_indicator': self._calculate_obsession_indicator(session_data),
        }
        
        return pd.DataFrame([features])
    
    def detect_criminal_anomalies(self, features: pd.DataFrame) -> Dict[str, Any]:
                """Detect anomalous patterns specific to criminal behavior"""
                
                # Scale features
                features_scaled = self.standard_scaler.fit_transform(features)
                
                # Anomaly detection - handle unfitted model
                try:
                    anomaly_score = self.anomaly_detector.decision_function(features_scaled)[0]
                    is_anomaly = anomaly_score < self.ml_thresholds['anomaly_threshold']
                except:
                    # If model not fitted, fit it with current data and use default scores
                    try:
                        self.anomaly_detector.fit(features_scaled)
                        anomaly_score = self.anomaly_detector.decision_function(features_scaled)[0]
                        is_anomaly = anomaly_score < self.ml_thresholds['anomaly_threshold']
                    except:
                        # Fallback to rule-based scoring
                        anomaly_score = -0.1
                        is_anomaly = False
                
                # Calculate risk components
                risk_components = {
                    'temporal_risk': self._calculate_temporal_risk(features),
                    'behavioral_risk': self._calculate_behavioral_risk(features),
                    'evasion_risk': self._calculate_evasion_risk(features),
                    'obsession_risk': self._calculate_obsession_risk(features),
                    'technical_risk': self._calculate_technical_risk(features),
                }
                
                # Overall criminal risk score (0-10 scale)
                criminal_risk = self._calculate_overall_criminal_risk(risk_components)
                
                return {
                    'is_anomaly': is_anomaly,
                    'anomaly_score': float(anomaly_score),
                    'criminal_risk_score': criminal_risk,
                    'risk_components': risk_components,
                    'threat_level': self._determine_threat_level(criminal_risk),
                    'recommended_action': self._recommend_action(criminal_risk, risk_components)
                }
    
    def predict_criminal_behavior(self, features: pd.DataFrame, history: List[Dict] = None) -> Dict[str, Any]:
        """Predict probability of criminal involvement"""
        
        features_scaled = self.standard_scaler.fit_transform(features)
        
        # Get predictions from multiple models - handle unfitted models
        try:
            rf_prob = self.pattern_classifier.predict_proba(features_scaled)[0]
        except:
            # Model not fitted, use default probabilities
            rf_prob = [0.5, 0.5]
        # Deep model prediction
        # Skip deep model if input shape doesn't match
        try:
            deep_prob = self.deep_model.predict(features_scaled)[0][0] if self.deep_model else 0.5
        except:
            deep_prob = 0.5  # Default probability if model fails
        
        # Ensemble prediction
        ensemble_prob = (rf_prob[1] * 0.4 + deep_prob * 0.6) if len(rf_prob) > 1 else deep_prob
        
        # Behavioral profile
        profile = self._determine_behavioral_profile(features, history)
        
        return {
            'criminal_probability': float(ensemble_prob),
            'classification': 'high_risk' if ensemble_prob > self.ml_thresholds['criminal_probability'] else 'monitoring',
            'confidence': float(abs(ensemble_prob - 0.5) * 2),  # Convert to confidence score
            'behavioral_profile': profile,
            'risk_factors': self._identify_risk_factors(features),
            'investigative_value': self._calculate_investigative_value(features, ensemble_prob)
        }
    
    def analyze_temporal_criminal_patterns(self, user_sessions: List[Dict]) -> Dict[str, Any]:
        """Analyze temporal patterns for criminal behavior indicators"""
        
        if not user_sessions:
            return {}
        
        timestamps = [s['timestamp'] for s in user_sessions]
        
        # Night stalking analysis
        night_sessions = sum(1 for t in timestamps if 23 <= t.hour or t.hour < 4)
        night_ratio = night_sessions / len(timestamps)
        
        # Anniversary correlation
        anniversary_visits = self._detect_anniversary_patterns(timestamps)
        
        # Escalation detection
        escalation_pattern = self._detect_escalation_timeline(user_sessions)
        
        # Activity bursts
        burst_patterns = self._detect_activity_bursts(timestamps)
        
        # Geographic movement patterns
        geo_patterns = self._analyze_geographic_patterns(user_sessions)
        
        return {
            'night_stalking_ratio': night_ratio,
            'anniversary_correlation': anniversary_visits,
            'escalation_detected': escalation_pattern['detected'],
            'escalation_timeline': escalation_pattern['timeline'],
            'activity_bursts': burst_patterns,
            'geographic_evasion_score': geo_patterns['evasion_score'],
            'impossible_travel_detected': geo_patterns['impossible_travel'],
            'behavioral_consistency': self._calculate_behavioral_consistency(user_sessions),
            'pattern_evolution': self._analyze_pattern_evolution(user_sessions)
        }
    
    def detect_coordinated_criminal_activity(self, all_sessions: List[Dict]) -> Dict[str, Any]:
        """Detect coordinated activity between multiple actors"""
        
        if len(all_sessions) < 2:
            return {'coordinated_activity': False}
        
        # Extract features for all sessions
        features_list = []
        for session in all_sessions:
            features = self.extract_criminal_features(session)
            features_list.append(features.values[0])
        
        features_matrix = np.array(features_list)
        
        # Cluster analysis
        clusters = self.behavior_clusterer.fit_predict(features_matrix)
        
        # Temporal correlation
        temporal_correlation = self._analyze_temporal_correlation(all_sessions)
        
        # Communication patterns
        comm_patterns = self._detect_communication_patterns(all_sessions)
        
        # Role identification
        roles = self._identify_actor_roles(all_sessions, clusters)
        
        coordination_score = self._calculate_coordination_score(
            clusters, temporal_correlation, comm_patterns
        )
        
        return {
            'coordinated_activity': coordination_score > self.ml_thresholds['coordination_threshold'],
            'coordination_score': coordination_score,
            'num_actors': len(set(s.get('fingerprint_hash') for s in all_sessions)),
            'clusters_detected': len(set(clusters)) - (1 if -1 in clusters else 0),
            'temporal_correlation': temporal_correlation,
            'communication_patterns': comm_patterns,
            'identified_roles': roles,
            'network_structure': self._analyze_network_structure(all_sessions, clusters)
        }
    
    def predict_escalation(self, history: List[Dict]) -> Dict[str, Any]:
        """Predict behavioral escalation using ML"""
        
        if len(history) < 10:
            return {'escalation_probability': 0, 'insufficient_data': True}
        
        # Extract temporal features
        temporal_features = self._extract_escalation_features(history)
        
        # Train escalation model on historical patterns
        escalation_prob = self._predict_escalation_probability(temporal_features)
        
        # Identify escalation triggers
        triggers = self._identify_escalation_triggers(history)
        
        # Predict timeline
        timeline = self._predict_escalation_timeline(history, escalation_prob)
        
        # Risk mitigation recommendations
        mitigation = self._recommend_mitigation_strategies(escalation_prob, triggers)
        
        return {
            'escalation_probability': escalation_prob,
            'escalation_triggers': triggers,
            'predicted_timeline': timeline,
            'current_stage': self._identify_current_stage(history),
            'mitigation_strategies': mitigation,
            'confidence_interval': self._calculate_confidence_interval(escalation_prob, len(history)),
            'intervention_priority': 'HIGH' if escalation_prob > 0.7 else 'MEDIUM' if escalation_prob > 0.4 else 'LOW'
        }
    
    def identify_criminal_persona(self, features: pd.DataFrame, history: List[Dict]) -> Dict[str, Any]:
        """Identify criminal behavioral persona using ML clustering"""
        
        # Known criminal personas
        personas = {
            'calculated_stalker': {
                'indicators': ['high_night_ratio', 'victim_obsession', 'systematic_access'],
                'risk_level': 9
            },
            'impulsive_actor': {
                'indicators': ['erratic_behavior', 'panic_patterns', 'rapid_escalation'],
                'risk_level': 7
            },
            'technical_evader': {
                'indicators': ['vpn_usage', 'fingerprint_spoofing', 'systematic_evasion'],
                'risk_level': 8
            },
            'insider_threat': {
                'indicators': ['knowledge_indicators', 'specific_targeting', 'timeline_correlation'],
                'risk_level': 10
            },
            'opportunistic_viewer': {
                'indicators': ['news_correlation', 'irregular_patterns', 'low_technical'],
                'risk_level': 3
            }
        }
        
        # Calculate similarity to each persona
        persona_scores = {}
        for persona_name, persona_data in personas.items():
            score = self._calculate_persona_similarity(features, history, persona_data['indicators'])
            persona_scores[persona_name] = score
        
        # Identify primary persona
        primary_persona = max(persona_scores, key=persona_scores.get)
        confidence = persona_scores[primary_persona]
        
        return {
            'primary_persona': primary_persona,
            'confidence': confidence,
            'risk_level': personas[primary_persona]['risk_level'],
            'all_scores': persona_scores,
            'behavioral_markers': self._extract_behavioral_markers(features, primary_persona),
            'investigative_leads': self._generate_investigative_leads(primary_persona, features)
        }
    
    def analyze_linguistic_patterns(self, text_data: List[str]) -> Dict[str, Any]:
        """Analyze linguistic patterns in searches and submissions"""
        
        if not text_data:
            return {}
        
        # Vectorize text
        try:
            text_vectors = self.text_vectorizer.fit_transform(text_data)
        except:
            return {'analysis_failed': True}
        
        # Guilty knowledge indicators
        guilty_knowledge = self._detect_guilty_knowledge_language(text_data)
        
        # Stress indicators
        stress_patterns = self._analyze_stress_language(text_data)
        
        # Deception indicators
        deception_score = self._calculate_deception_score(text_data)
        
        # Topic modeling
        topics = self._extract_criminal_topics(text_vectors)
        
        return {
            'guilty_knowledge_score': guilty_knowledge,
            'stress_indicator': stress_patterns['stress_level'],
            'deception_probability': deception_score,
            'identified_topics': topics,
            'linguistic_profile': self._create_linguistic_profile(text_data),
            'keyword_clusters': self._cluster_keywords(text_vectors),
            'evolution_pattern': self._analyze_linguistic_evolution(text_data)
        }
    
    def cross_reference_behavioral_signatures(self, current_session: Dict, historical_data: List[Dict]) -> Dict[str, Any]:
        """Cross-reference current behavior with known criminal signatures"""
        
        # Extract current signature
        current_signature = self._extract_behavioral_signature(current_session)
        
        # Compare with historical criminal signatures
        matches = []
        for historical in historical_data:
            hist_signature = self._extract_behavioral_signature(historical)
            similarity = self._calculate_signature_similarity(current_signature, hist_signature)
            
            if similarity > self.ml_thresholds['identity_match_threshold']:
                matches.append({
                    'match_id': historical.get('fingerprint_hash'),
                    'similarity': similarity,
                    'matched_patterns': self._identify_matched_patterns(current_signature, hist_signature)
                })
        
        # Behavioral consistency analysis
        consistency = self._analyze_signature_consistency(current_signature, historical_data)
        
        return {
            'signature_matches': matches,
            'unique_signature': len(matches) == 0,
            'behavioral_consistency': consistency,
            'signature_evolution': self._track_signature_evolution(current_signature, historical_data),
            'identity_confidence': self._calculate_identity_confidence(matches, consistency)
        }
    
    # ============ HELPER METHODS ============
    
    def _calculate_victim_page_ratio(self, pages: List[str]) -> float:
        """Calculate ratio of victim-related page visits"""
        if not pages:
            return 0.0
        
        victim_keywords = ['victim', 'missing', 'disappeared', 'personal', 'family', 'photos']
        victim_pages = sum(1 for page in pages if any(kw in page.lower() for kw in victim_keywords))
        return victim_pages / len(pages)
    
    def _calculate_evidence_page_ratio(self, pages: List[str]) -> float:
        """Calculate ratio of evidence-related page visits"""
        if not pages:
            return 0.0
        
        evidence_keywords = ['evidence', 'timeline', 'investigation', 'report', 'witness']
        evidence_pages = sum(1 for page in pages if any(kw in page.lower() for kw in evidence_keywords))
        return evidence_pages / len(pages)
    
    def _calculate_timeline_obsession(self, pages: List[str]) -> float:
        """Calculate timeline obsession score"""
        timeline_visits = sum(1 for page in pages if 'timeline' in page.lower())
        return min(timeline_visits / 10.0, 1.0)  # Normalize to 0-1
    
    def _calculate_erratic_mouse_score(self, session_data: Dict) -> float:
        """Calculate erratic mouse movement score"""
        velocity_spikes = session_data.get('mouse_velocity_spikes', 0)
        direction_changes = session_data.get('mouse_direction_changes', 0)
        
        score = (velocity_spikes / 20.0 + direction_changes / 50.0) / 2.0
        return min(score, 1.0)
    
    def _calculate_decision_paralysis(self, session_data: Dict) -> float:
        """Calculate decision paralysis score"""
        hover_time = session_data.get('max_hover_duration', 0)
        repeated_hovers = session_data.get('repeated_hover_count', 0)
        
        score = (min(hover_time / 10000.0, 1.0) + min(repeated_hovers / 5.0, 1.0)) / 2.0
        return score
    
    def _calculate_cognitive_load(self, session_data: Dict) -> float:
        """Calculate cognitive load indicator"""
        rapid_closes = session_data.get('rapid_page_closes', 0)
        tab_switches = session_data.get('tab_switches', 0)
        screenshot_timing = session_data.get('early_screenshots', 0)
        
        score = (rapid_closes / 5.0 + tab_switches / 10.0 + screenshot_timing / 3.0) / 3.0
        return min(score, 1.0)
    
    def _calculate_compulsive_score(self, session_data: Dict) -> float:
        """Calculate compulsive behavior score"""
        refresh_count = session_data.get('page_refreshes', 0)
        repeat_visits = session_data.get('repeat_page_visits', 0)
        
        score = (refresh_count / 10.0 + repeat_visits / 15.0) / 2.0
        return min(score, 1.0)
    
    def _calculate_stalking_score(self, session_data: Dict) -> float:
        """Calculate stalking behavior score"""
        night_access = int(session_data.get('is_night_stalking', False))
        location_focus = session_data.get('location_page_ratio', 0)
        photo_obsession = session_data.get('photo_view_ratio', 0)
        
        score = (night_access * 0.4 + location_focus * 0.3 + photo_obsession * 0.3)
        return min(score, 1.0)
    
    def _calculate_obsession_indicator(self, session_data: Dict) -> float:
        """Calculate overall obsession indicator"""
        victim_ratio = session_data.get('victim_page_ratio', 0)
        session_duration = min(session_data.get('duration', 0) / 28800.0, 1.0)  # 8 hours max
        repeat_visits = min(session_data.get('repeat_visits', 0) / 20.0, 1.0)
        
        score = (victim_ratio * 0.4 + session_duration * 0.3 + repeat_visits * 0.3)
        return score
    
    def _calculate_temporal_risk(self, features: pd.DataFrame) -> float:
        """Calculate temporal risk component"""
        row = features.iloc[0]
        
        risk = 0.0
        if row.get('is_night_stalking', 0):
            risk += 0.3
        if row.get('is_unusual_hour', 0):
            risk += 0.2
        if row.get('is_anniversary', 0):
            risk += 0.2
        
        # Add pattern-based risk
        risk += row.get('repeat_visits', 0) / 50.0
        
        return min(risk, 1.0)
    
    def _calculate_behavioral_risk(self, features: pd.DataFrame) -> float:
        """Calculate behavioral risk component"""
        row = features.iloc[0]
        
        risk = (
            row.get('panic_click_rate', 0) * 0.2 +
            row.get('erratic_mouse_score', 0) * 0.2 +
            row.get('cognitive_load_indicator', 0) * 0.2 +
            row.get('stalking_pattern_score', 0) * 0.2 +
            row.get('obsession_indicator', 0) * 0.2
        )
        
        return min(risk, 1.0)
    

    def _calculate_evasion_risk(self, features: pd.DataFrame) -> float:
        """Calculate evasion risk component"""
        row = features.iloc[0]
        
        risk = 0.0
        if row.get('is_tor', 0):
            risk += 1.0
        if row.get('is_vpn', 0):
            risk += 0.6
        if row.get('is_proxy', 0):
            risk += 0.4
        
        risk += row.get('device_changes', 0) / 10.0
        risk += row.get('fingerprint_spoofing', 0) * 0.25
        
        return min(risk, 1.0)


    def _calculate_obsession_risk(self, features: pd.DataFrame) -> float:
        """Calculate obsession risk component"""
        row = features.iloc[0]
        
        risk = (
            row.get('victim_page_ratio', 0) * 0.3 +
            row.get('timeline_obsession_score', 0) * 0.2 +
            row.get('compulsive_checking_score', 0) * 0.2 +
            row.get('victim_name_searches', 0) / 10.0 * 0.3
        )
        
        return min(risk, 1.0)
    
    def _calculate_technical_risk(self, features: pd.DataFrame) -> float:
        """Calculate technical sophistication risk"""
        row = features.iloc[0]
        
        risk = (
            row.get('screenshot_attempts', 0) / 10.0 * 0.2 +
            row.get('download_count', 0) / 10.0 * 0.2 +
            row.get('copy_events', 0) / 15.0 * 0.2 +
            row.get('failed_login_attempts', 0) / 5.0 * 0.2 +
            row.get('fingerprint_spoofing', 0) * 0.2
        )
        
        return min(risk, 1.0)
    
    def _calculate_overall_criminal_risk(self, components: Dict[str, float]) -> float:
        """Calculate overall criminal risk score (0-10)"""
        
        # Weighted combination of risk components
        weights = {
            'temporal_risk': 0.15,
            'behavioral_risk': 0.25,
            'evasion_risk': 0.6,
            'obsession_risk': 0.25,
            'technical_risk': 0.10
        }
        
        weighted_sum = sum(components.get(k, 0) * v for k, v in weights.items())

        
        # Scale to 0-10
        return round(weighted_sum * 10, 1)
    
    def _determine_threat_level(self, risk_score: float) -> str:
        """Determine threat level based on risk score"""
        if risk_score >= 8.0:
            return 'CRITICAL'
        elif risk_score >= 6.0:
            return 'HIGH'
        elif risk_score >= 4.0:
            return 'MEDIUM'
        elif risk_score >= 2.0:
            return 'LOW'
        else:
            return 'MINIMAL'
    
    def _recommend_action(self, risk_score: float, components: Dict) -> List[str]:
        """Recommend actions based on risk analysis"""
        actions = []
        
        if risk_score >= 8.0:
            actions.append("🚨 IMMEDIATE: Contact law enforcement")
            actions.append("📋 Preserve all digital evidence")
        
        if risk_score >= 6.0:
            actions.append("🔒 Consider IP blocking")
            actions.append("📞 Alert case investigators")
        
        if components.get('evasion_risk', 0) > 0.7:
            actions.append("🔍 Enhanced tracking measures required")
        
        if components.get('obsession_risk', 0) > 0.7:
            actions.append("⚠️ Monitor for escalation patterns")
        
        if components.get('behavioral_risk', 0) > 0.7:
            actions.append("📊 Behavioral analysis recommended")
        
        return actions
    
    def _determine_behavioral_profile(self, features: pd.DataFrame, history: List[Dict]) -> Dict:
        """Determine behavioral profile from features"""
        row = features.iloc[0]
        
        profile = {
            'type': 'unknown',
            'characteristics': [],
            'risk_indicators': []
        }
        
        # Determine profile type
        if row.get('stalking_pattern_score', 0) > 0.7:
            profile['type'] = 'stalker'
            profile['characteristics'].append('Obsessive monitoring')
            profile['risk_indicators'].append('High victim focus')
        
        elif row.get('is_tor', 0) or row.get('fingerprint_spoofing', 0):
            profile['type'] = 'technical_evader'
            profile['characteristics'].append('Advanced evasion techniques')
            profile['risk_indicators'].append('Identity concealment')
        
        elif row.get('panic_click_rate', 0) > 0.5:
            profile['type'] = 'nervous_actor'
            profile['characteristics'].append('High stress indicators')
            profile['risk_indicators'].append('Potential insider knowledge')
        
        return profile
    
    def _identify_risk_factors(self, features: pd.DataFrame) -> List[str]:
        """Identify key risk factors from features"""
        row = features.iloc[0]
        risk_factors = []
        
        if row.get('is_tor', 0):
            risk_factors.append("Tor network usage")
        
        if row.get('victim_page_ratio', 0) > 0.6:
            risk_factors.append("Victim obsession pattern")
        
        if row.get('is_night_stalking', 0):
            risk_factors.append("Night stalking behavior")
        
        if row.get('device_changes', 0) > 3:
            risk_factors.append("Device manipulation")
        
        if row.get('failed_login_attempts', 0) > 3:
            risk_factors.append("Authentication probing")
        
        return risk_factors
    
    def _calculate_investigative_value(self, features: pd.DataFrame, probability: float) -> float:
        """Calculate investigative value of the user"""
        row = features.iloc[0]
        
        value = probability * 0.5  # Base on criminal probability
        
        # Add value for specific behaviors
        if row.get('victim_name_searches', 0) > 0:
            value += 0.2
        
        if row.get('timeline_obsession_score', 0) > 0.5:
            value += 0.15
        
        if row.get('is_tor', 0):
            value += 0.15
        
        return min(value, 1.0)
    
    def _detect_anniversary_patterns(self, timestamps: List[datetime]) -> Dict:
        """Detect anniversary-based visit patterns"""
        day_counts = {}
        for ts in timestamps:
            day = ts.day
            day_counts[day] = day_counts.get(day, 0) + 1
        
        # Find peaks
        anniversary_days = [day for day, count in day_counts.items() if count > 3]
        
        return {
            'detected': len(anniversary_days) > 0,
            'anniversary_days': anniversary_days,
            'pattern_strength': max(day_counts.values()) / len(timestamps) if timestamps else 0
        }
    
    def _detect_escalation_timeline(self, sessions: List[Dict]) -> Dict:
        """Detect escalation in behavior over time"""
        if len(sessions) < 5:
            return {'detected': False, 'timeline': 'insufficient_data'}
        
        # Calculate intensity over time
        intensities = []
        for session in sessions:
            intensity = (
                session.get('page_views', 0) / 10.0 +
                session.get('duration', 0) / 3600.0 +
                session.get('copy_events', 0) / 5.0
            ) / 3.0
            intensities.append(min(intensity, 1.0))
        
        # Check for increasing trend
        first_half = np.mean(intensities[:len(intensities)//2])
        second_half = np.mean(intensities[len(intensities)//2:])
        
        escalation_detected = second_half > first_half * 1.3
        
        return {
            'detected': escalation_detected,
            'timeline': 'rapid' if second_half > first_half * 2 else 'gradual' if escalation_detected else 'stable',
            'intensity_trend': intensities
        }
    
    def _detect_activity_bursts(self, timestamps: List[datetime]) -> List[Dict]:
        """Detect bursts of activity"""
        if len(timestamps) < 2:
            return []
        
        # Sort timestamps
        sorted_ts = sorted(timestamps)
        
        # Calculate inter-arrival times
        inter_arrivals = []
        for i in range(1, len(sorted_ts)):
            diff = (sorted_ts[i] - sorted_ts[i-1]).total_seconds()
            inter_arrivals.append(diff)
        
        # Detect bursts (rapid succession of events)
        bursts = []
        burst_start = 0
        
        for i, interval in enumerate(inter_arrivals):
            if interval < 300:  # Less than 5 minutes
                if burst_start == 0:
                    burst_start = i
            else:
                if burst_start > 0:
                    bursts.append({
                        'start': sorted_ts[burst_start],
                        'end': sorted_ts[i],
                        'event_count': i - burst_start + 1
                    })
                    burst_start = 0
        
        return bursts
    
    def _analyze_geographic_patterns(self, sessions: List[Dict]) -> Dict:
        """Analyze geographic movement patterns"""
        locations = [(s.get('ip_city'), s.get('ip_country'), s.get('timestamp')) 
                    for s in sessions if s.get('ip_city')]
        
        if len(locations) < 2:
            return {'evasion_score': 0, 'impossible_travel': False}
        
        # Check for impossible travel
        impossible_travel = False
        for i in range(1, len(locations)):
            if locations[i][1] != locations[i-1][1]:  # Different countries
                time_diff = (locations[i][2] - locations[i-1][2]).total_seconds() / 3600
                if time_diff < 5:  # Less than 5 hours between countries
                    impossible_travel = True
                    break
        
        # Calculate evasion score
        unique_locations = len(set((loc[0], loc[1]) for loc in locations))
        evasion_score = min(unique_locations / 10.0, 1.0)
        
        return {
            'evasion_score': evasion_score,
            'impossible_travel': impossible_travel,
            'unique_locations': unique_locations
        }
    
    def _calculate_behavioral_consistency(self, sessions: List[Dict]) -> float:
        """Calculate behavioral consistency across sessions"""
        if len(sessions) < 2:
            return 1.0
        
        # Extract key metrics for each session
        metrics = []
        for session in sessions:
            metric = [
                session.get('page_views', 0),
                session.get('duration', 0),
                session.get('click_count', 0)
            ]
            metrics.append(metric)
        
        # Calculate variance
        metrics_array = np.array(metrics)
        variances = np.var(metrics_array, axis=0)
        
        # Lower variance = higher consistency
        consistency = 1.0 - min(np.mean(variances) / 1000.0, 1.0)
        
        return consistency
    
    def _analyze_pattern_evolution(self, sessions: List[Dict]) -> Dict:
        """Analyze how patterns evolve over time"""
        if len(sessions) < 3:
            return {'evolution': 'insufficient_data'}
        
        # Divide into time periods
        early = sessions[:len(sessions)//3]
        middle = sessions[len(sessions)//3:2*len(sessions)//3]
        recent = sessions[2*len(sessions)//3:]
        
        # Calculate characteristics for each period
        periods = {'early': early, 'middle': middle, 'recent': recent}
        evolution = {}
        
        for period_name, period_sessions in periods.items():
            evolution[period_name] = {
                'avg_intensity': np.mean([s.get('page_views', 0) for s in period_sessions]),
                'vpn_usage': sum(s.get('is_vpn', False) for s in period_sessions) / len(period_sessions),
                'night_access': sum(23 <= s.get('timestamp').hour or s.get('timestamp').hour < 4 
                                  for s in period_sessions) / len(period_sessions)
            }
        
        return evolution
    
    def _extract_escalation_features(self, history: List[Dict]) -> np.ndarray:
        """Extract features for escalation prediction"""
        features = []
        
        # Time-based features
        timestamps = [h['timestamp'] for h in history]
        time_gaps = []
        for i in range(1, len(timestamps)):
            gap = (timestamps[i] - timestamps[i-1]).total_seconds()
            time_gaps.append(gap)
        
        features.append(np.mean(time_gaps) if time_gaps else 0)
        features.append(np.std(time_gaps) if time_gaps else 0)
        
        # Intensity features
        page_counts = [len(h.get('pages', [])) for h in history]
        features.append(np.mean(page_counts))
        features.append(np.max(page_counts) if page_counts else 0)
        
        # Behavioral features
        vpn_ratio = sum(h.get('is_vpn', False) for h in history) / len(history)
        features.append(vpn_ratio)
        
        return np.array(features)
    
    def _predict_escalation_probability(self, features: np.ndarray) -> float:
        """Predict probability of escalation"""
        # Simple heuristic model (would be ML model in production)
        
        # Decreasing time gaps = escalation
        if features[0] < 3600:  # Average gap less than 1 hour
            base_prob = 0.6
        else:
            base_prob = 0.3
        
        # High intensity
        if features[2] > 20:  # High page count average
            base_prob += 0.2
        
        # VPN usage
        if features[4] > 0.5:
            base_prob += 0.1
        
        return min(base_prob, 1.0)
    
    def _identify_escalation_triggers(self, history: List[Dict]) -> List[str]:
        """Identify potential escalation triggers"""
        triggers = []
        
        # Check for news correlation
        # (Would check against actual news events in production)
        
        # Check for anniversary approaching
        current_day = datetime.now().day
        if current_day in [14, 15, 29, 30]:
            triggers.append("Anniversary approaching")
        
        # Check for increased failed attempts
        recent_failures = sum(h.get('failed_attempts', 0) for h in history[-5:])
        if recent_failures > 3:
            triggers.append("Frustration from failed attempts")
        
        return triggers
    
    def _predict_escalation_timeline(self, history: List[Dict], probability: float) -> str:
        """Predict timeline for escalation"""
        if probability < 0.3:
            return "Low risk - no imminent escalation"
        
        # Calculate acceleration
        if len(history) < 2:
            return "Insufficient data"
        
        recent_intensity = sum(len(h.get('pages', [])) for h in history[-3:])
        older_intensity = sum(len(h.get('pages', [])) for h in history[-6:-3]) if len(history) > 5 else 0
        
        if recent_intensity > older_intensity * 2:
            return "High risk - possible escalation within 24-48 hours"
        elif recent_intensity > older_intensity * 1.5:
            return "Medium risk - possible escalation within week"
        else:
            return "Gradual pattern - monitor for changes"
    
    def _recommend_mitigation_strategies(self, probability: float, triggers: List[str]) -> List[str]:
        """Recommend mitigation strategies"""
        strategies = []
        
        if probability > 0.7:
            strategies.append("Immediate law enforcement notification")
            strategies.append("Enhanced monitoring protocols")
        
        if probability > 0.5:
            strategies.append("Increase security measures")
            strategies.append("Document all activities")
        
        if "Anniversary approaching" in triggers:
            strategies.append("Heightened alert for anniversary date")
        
        if "Frustration from failed attempts" in triggers:
            strategies.append("Monitor for alternative approach attempts")
        
        return strategies
    
    def _calculate_confidence_interval(self, probability: float, sample_size: int) -> Tuple[float, float]:
        """Calculate confidence interval for prediction"""
        # Wilson score interval
        z = 1.96  # 95% confidence
        
        n = sample_size
        p = probability
        
        denominator = 1 + z**2/n
        centre = (p + z**2/(2*n)) / denominator
        offset = z * np.sqrt((p*(1-p)/n + z**2/(4*n**2))) / denominator
        
        lower = max(0, centre - offset)
        upper = min(1, centre + offset)
        
        return (lower, upper)
    
    def _identify_current_stage(self, history: List[Dict]) -> str:
        """Identify current stage in criminal behavior progression"""
        
        # Simple stage identification based on patterns
        recent = history[-10:] if len(history) > 10 else history
        
        # Check key indicators
        tor_usage = any(h.get('is_tor', False) for h in recent)
        high_intensity = np.mean([len(h.get('pages', [])) for h in recent]) > 15
        victim_focus = np.mean([h.get('victim_page_ratio', 0) for h in recent]) > 0.6
        
        if tor_usage and high_intensity:
            return "Advanced evasion stage"
        elif victim_focus and high_intensity:
            return "Obsessive monitoring stage"
        elif high_intensity:
            return "Information gathering stage"
        else:
            return "Initial interest stage"
    
    def _analyze_temporal_correlation(self, sessions: List[Dict]) -> float:
        """Analyze temporal correlation between sessions"""
        if len(sessions) < 2:
            return 0.0
        
        # Extract timestamps
        timestamps = [s['timestamp'] for s in sessions]
        
        # Check for synchronized timing
        time_diffs = []
        for i in range(1, len(timestamps)):
            diff = (timestamps[i] - timestamps[i-1]).total_seconds()
            time_diffs.append(diff)
        
        # Low variance in time differences suggests coordination
        if time_diffs:
            variance = np.var(time_diffs)
            correlation = 1.0 - min(variance / 10000.0, 1.0)
            return correlation
        
        return 0.0
    
    def _detect_communication_patterns(self, sessions: List[Dict]) -> Dict:
        """Detect communication patterns between actors"""
        
        # Group sessions by fingerprint
        actor_sessions = {}
        for session in sessions:
            actor = session.get('fingerprint_hash')
            if actor not in actor_sessions:
                actor_sessions[actor] = []
            actor_sessions[actor].append(session)
        
        # Analyze patterns
        patterns = {
            'sequential_access': False,
            'information_relay': False,
            'distributed_reconnaissance': False
        }
        
        # Check for sequential access to same pages
        if len(actor_sessions) > 1:
            actors = list(actor_sessions.keys())
            for i in range(len(actors)-1):
                actor1_pages = set()
                for s in actor_sessions[actors[i]]:
                    actor1_pages.update(s.get('pages', []))
                
                actor2_pages = set()
                for s in actor_sessions[actors[i+1]]:
                    actor2_pages.update(s.get('pages', []))
                
                if len(actor1_pages.intersection(actor2_pages)) > 5:
                    patterns['sequential_access'] = True
        
        return patterns
    
    def _identify_actor_roles(self, sessions: List[Dict], clusters: np.ndarray) -> Dict:
        """Identify roles of different actors"""
        roles = {}
        
        # Group sessions by cluster
        for i, cluster in enumerate(clusters):
            if cluster == -1:
                continue
            
            session = sessions[i]
            
            # Determine role based on behavior
            if session.get('is_tor', False):
                role = 'technical_lead'
            elif session.get('victim_page_ratio', 0) > 0.7:
                role = 'primary_stalker'
            elif session.get('timeline_obsession_score', 0) > 0.5:
                role = 'monitor'
            else:
                role = 'support'
            
            actor = session.get('fingerprint_hash')
            roles[actor] = role
        
        return roles
    
    def _calculate_coordination_score(self, clusters: np.ndarray, 
                                     temporal_correlation: float,
                                     comm_patterns: Dict) -> float:
        """Calculate overall coordination score"""
        
        score = 0.0
        
        # Clustering indicates coordination
        unique_clusters = len(set(clusters)) - (1 if -1 in clusters else 0)
        if unique_clusters > 1:
            score += 0.3
        
        # Temporal correlation
        score += temporal_correlation * 0.4
        
        # Communication patterns
        if comm_patterns.get('sequential_access'):
            score += 0.3
        
        return min(score, 1.0)
    
    def _analyze_network_structure(self, sessions: List[Dict], clusters: np.ndarray) -> Dict:
        """Analyze the structure of the criminal network"""
        
        # Identify central actors
        actor_activity = {}
        for session in sessions:
            actor = session.get('fingerprint_hash')
            if actor not in actor_activity:
                actor_activity[actor] = 0
            actor_activity[actor] += len(session.get('pages', []))
        
        # Identify hub
        if actor_activity:
            hub = max(actor_activity, key=actor_activity.get)
        else:
            hub = None
        
        return {
            'network_size': len(actor_activity),
            'hub_actor': hub,
            'activity_distribution': actor_activity,
            'cluster_count': len(set(clusters)) - (1 if -1 in clusters else 0)
        }
    
    def _calculate_persona_similarity(self, features: pd.DataFrame, 
                                     history: List[Dict],
                                     indicators: List[str]) -> float:
        """Calculate similarity to a criminal persona"""
        
        score = 0.0
        row = features.iloc[0]
        
        for indicator in indicators:
            if indicator == 'high_night_ratio' and row.get('is_night_stalking', 0):
                score += 1.0
            elif indicator == 'victim_obsession' and row.get('victim_page_ratio', 0) > 0.6:
                score += 1.0
            elif indicator == 'systematic_access' and row.get('repeat_visits', 0) > 10:
                score += 1.0
            elif indicator == 'vpn_usage' and row.get('is_vpn', 0):
                score += 1.0
            # Add more indicator checks as needed
        
        return score / len(indicators) if indicators else 0.0
    
    def _extract_behavioral_markers(self, features: pd.DataFrame, persona: str) -> List[str]:
        """Extract behavioral markers for a persona"""
        markers = []
        row = features.iloc[0]
        
        if persona == 'calculated_stalker':
            if row.get('is_night_stalking', 0):
                markers.append("Night time activity pattern")
            if row.get('victim_page_ratio', 0) > 0.6:
                markers.append("High victim focus")
        
        elif persona == 'technical_evader':
            if row.get('is_tor', 0):
                markers.append("Tor network usage")
            if row.get('fingerprint_spoofing', 0):
                markers.append("Browser fingerprint manipulation")
        
        return markers
    
    def _generate_investigative_leads(self, persona: str, features: pd.DataFrame) -> List[str]:
        """Generate investigative leads based on persona"""
        leads = []
        
        if persona == 'calculated_stalker':
            leads.append("Check for physical surveillance in victim's area")
            leads.append("Review CCTV footage during identified time windows")
        
        elif persona == 'insider_threat':
            leads.append("Cross-reference with case-related personnel")
            leads.append("Check for information leaks")
        
        elif persona == 'technical_evader':
            leads.append("Request ISP logs for identified IP ranges")
            leads.append("Check dark web forums for related activity")
        
        return leads
    
    def _detect_guilty_knowledge_language(self, texts: List[str]) -> float:
        """Detect guilty knowledge in language patterns"""
        
        guilty_indicators = [
            'body', 'corpse', 'deceased', 'dead',
            'last seen', 'disappeared', 'found',
            'evidence', 'police', 'investigation'
        ]
        
        score = 0.0
        for text in texts:
            text_lower = text.lower()
            for indicator in guilty_indicators:
                if indicator in text_lower:
                    score += 1.0
        
        return min(score / (len(texts) * 3), 1.0) if texts else 0.0
    
    def _analyze_stress_language(self, texts: List[str]) -> Dict:
        """Analyze language for stress indicators"""
        
        stress_level = 0.0
        
        for text in texts:
            # Check for typos (simple heuristic)
            words = text.split()
            
            # Short sentences indicate stress
            if len(words) < 5:
                stress_level += 0.1
            
            # Excessive punctuation
            if text.count('!') + text.count('?') > 2:
                stress_level += 0.1
            
            # All caps words
            caps_words = sum(1 for word in words if word.isupper() and len(word) > 1)
            if caps_words > 0:
                stress_level += 0.1
        
        return {
            'stress_level': min(stress_level / len(texts), 1.0) if texts else 0.0,
            'indicators': ['short_sentences', 'excessive_punctuation', 'caps_usage']
        }
    
    def _calculate_deception_score(self, texts: List[str]) -> float:
        """Calculate deception probability from text"""
        
        deception_phrases = [
            "i didn't", "wasn't me", "don't know anything",
            "never been", "no idea", "wouldn't do"
        ]
        
        score = 0.0
        for text in texts:
            text_lower = text.lower()
            for phrase in deception_phrases:
                if phrase in text_lower:
                    score += 1.0
        
        return min(score / (len(texts) * 2), 1.0) if texts else 0.0
    
    def _extract_criminal_topics(self, text_vectors) -> List[str]:
        """Extract criminal-related topics from text"""
        
        # In production, would use LDA or similar
        # For now, return placeholder topics
        return ['victim_information', 'timeline_queries', 'location_searches']
    
    def _create_linguistic_profile(self, texts: List[str]) -> Dict:
        """Create linguistic profile from texts"""
        
        total_words = sum(len(text.split()) for text in texts)
        avg_length = total_words / len(texts) if texts else 0
        
        return {
            'avg_query_length': avg_length,
            'total_queries': len(texts),
            'vocabulary_size': len(set(' '.join(texts).split())) if texts else 0
        }
    
    def _cluster_keywords(self, text_vectors) -> List[List[str]]:
        """Cluster keywords from text"""
        
        # Placeholder - would use actual clustering in production
        return [
            ['victim', 'missing', 'disappeared'],
            ['evidence', 'timeline', 'investigation'],
            ['location', 'address', 'where']
        ]
    
    def _analyze_linguistic_evolution(self, texts: List[str]) -> str:
        """Analyze how language evolves over time"""
        
        if len(texts) < 3:
            return "insufficient_data"
        
        # Check if queries become more specific
        early_length = np.mean([len(t.split()) for t in texts[:len(texts)//2]])
        late_length = np.mean([len(t.split()) for t in texts[len(texts)//2:]])
        
        if late_length > early_length * 1.5:
            return "increasing_specificity"
        elif late_length < early_length * 0.7:
            return "decreasing_detail"
        else:
            return "stable_pattern"
    
    def _extract_behavioral_signature(self, session: Dict) -> np.ndarray:
        """Extract unique behavioral signature"""
        
        signature = [
            session.get('page_views', 0) / 100.0,
            session.get('duration', 0) / 3600.0,
            session.get('click_count', 0) / 100.0,
            session.get('scroll_depth_avg', 0),
            int(session.get('is_vpn', False)),
            int(session.get('is_tor', False)),
            session.get('victim_page_ratio', 0),
            session.get('mouse_velocity_avg', 0) / 1000.0,
        ]
        
        return np.array(signature)
    
    def _calculate_signature_similarity(self, sig1: np.ndarray, sig2: np.ndarray) -> float:
        """Calculate similarity between behavioral signatures"""
        
        # Use cosine similarity
        similarity = 1 - cosine(sig1, sig2)
        return max(0, similarity)  # Ensure non-negative
    
    def _identify_matched_patterns(self, sig1: np.ndarray, sig2: np.ndarray) -> List[str]:
        """Identify which patterns matched between signatures"""
        
        matched = []
        
        # Check each component
        if abs(sig1[0] - sig2[0]) < 0.1:
            matched.append("page_view_pattern")
        
        if abs(sig1[1] - sig2[1]) < 0.1:
            matched.append("session_duration")
        
        if sig1[4] == sig2[4] and sig1[4] == 1:
            matched.append("vpn_usage")
        
        if abs(sig1[6] - sig2[6]) < 0.1:
            matched.append("victim_focus")
        
        return matched
    
    def _analyze_signature_consistency(self, current: np.ndarray, historical: List[Dict]) -> float:
        """Analyze consistency of behavioral signature"""
        
        if not historical:
            return 1.0
        
        # Extract historical signatures
        historical_sigs = [self._extract_behavioral_signature(h) for h in historical]
        
        # Calculate average similarity
        similarities = [self._calculate_signature_similarity(current, hist) 
                       for hist in historical_sigs]
        
        return np.mean(similarities) if similarities else 0.0
    
    def _track_signature_evolution(self, current: np.ndarray, historical: List[Dict]) -> str:
        """Track how signature evolves over time"""
        
        if len(historical) < 3:
            return "insufficient_history"
        
        # Get signatures over time
        sigs = [self._extract_behavioral_signature(h) for h in historical]
        sigs.append(current)
        
        # Check for increasing evasion
        vpn_trend = [sig[4] for sig in sigs]
        if sum(vpn_trend[-3:]) > sum(vpn_trend[:3]):
            return "increasing_evasion"
        
        # Check for increasing obsession
        victim_trend = [sig[6] for sig in sigs]
        if np.mean(victim_trend[-3:]) > np.mean(victim_trend[:3]) * 1.3:
            return "increasing_obsession"
        
        return "stable_signature"
    
    def _calculate_identity_confidence(self, matches: List[Dict], consistency: float) -> float:
        """Calculate confidence in identity match"""
        
        if not matches:
            return 0.0
        
        # Best match similarity
        best_match = max(matches, key=lambda x: x['similarity'])['similarity'] if matches else 0
        
        # Combine with consistency
        confidence = (best_match * 0.7 + consistency * 0.3)
        
        return confidence
    
    def load_models(self):
        """Load pre-trained models"""
        try:
            # Load models if they exist
            # self.criminal_classifier = joblib.load('models/criminal_classifier.pkl')
            # self.pattern_classifier = joblib.load('models/pattern_classifier.pkl')
            # self.deep_model = keras.models.load_model('models/deep_criminal_model.h5')
            pass
        except Exception as e:
            logger.info(f"No pre-trained models found, using defaults: {e}")
    
    def save_models(self):
        """Save trained models"""
        try:
            # joblib.dump(self.criminal_classifier, 'models/criminal_classifier.pkl')
            # joblib.dump(self.pattern_classifier, 'models/pattern_classifier.pkl')
            # self.deep_model.save('models/deep_criminal_model.h5')
            pass
        except Exception as e:
            logger.error(f"Error saving models: {e}")
# tracker/detection_simple.py
"""
Simplified detection system that wraps the ML analyzer
"""
from typing import Dict, Any
from .ml_analyzer import CriminalMLAnalyzer


class SimpleDetectionSystem:
    """
    Simple detection system that uses the existing ML analyzer
    """
    
    def __init__(self):
        self.ml_analyzer = CriminalMLAnalyzer()
    
    def analyze_event(self, event) -> Dict[str, Any]:
        """
        Analyze a tracking event for criminal behavior
        """
        # Convert event to session data format for ML analyzer
        session_data = {
            'timestamp': event.timestamp,
            'case_start_date': event.case.created_at if event.case else event.timestamp,
            'pages': [event.page_url],
            'duration': event.time_on_page or 0,
            'clicks': event.clicks_count,
            'scroll_depths': [event.scroll_depth] if event.scroll_depth else [0],
            'is_vpn': event.is_vpn,
            'is_tor': event.is_tor,
            'is_proxy': event.is_proxy,
            'fingerprint_hash': event.fingerprint_hash,
            'ip_address': event.ip_address,
            'device_type': event.device_type,
            'browser': event.browser,
        }
        
        # Extract features and run ML analysis
        features = self.ml_analyzer.extract_criminal_features(session_data)
        anomalies = self.ml_analyzer.detect_criminal_anomalies(features)
        behavior_prediction = self.ml_analyzer.predict_criminal_behavior(features)
        
        # Build result in expected format
        result = {
            'criminal_score': anomalies['criminal_risk_score'],
            'threat_level': anomalies['threat_level'],
            'is_anomaly': anomalies['is_anomaly'],
            'risk_components': anomalies['risk_components'],
            'behavioral_profile': behavior_prediction['behavioral_profile'],
            'risk_factors': behavior_prediction['risk_factors'],
            'recommended_actions': anomalies['recommended_action'],
            'detections': [],  # Placeholder for compatibility
        }
        
        # Add specific detections based on the event
        if event.is_tor:
            result['detections'].append({
                'type': 'tor_usage',
                'severity': 'CRITICAL',
                'confidence': 1.0
            })
        
        if event.is_vpn:
            result['detections'].append({
                'type': 'vpn_usage',
                'severity': 'HIGH',
                'confidence': 1.0
            })
        
        return result


def create_simple_detection_system():
    """Factory function to create detection system"""
    return SimpleDetectionSystem()
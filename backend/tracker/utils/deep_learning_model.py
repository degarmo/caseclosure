# deep_learning_model.py
import tensorflow as tf
from tensorflow.keras import layers, models
import numpy as np

class DeepBehaviorAnalyzer:
    def __init__(self):
        self.model = self.build_model()
        self.sequence_length = 50  # Analyze last 50 actions
        
    def build_model(self):
        """Build LSTM model for sequence analysis"""
        model = models.Sequential([
            layers.LSTM(128, return_sequences=True, 
                       input_shape=(self.sequence_length, 15)),
            layers.Dropout(0.2),
            layers.LSTM(64, return_sequences=True),
            layers.Dropout(0.2),
            layers.LSTM(32),
            layers.Dense(16, activation='relu'),
            layers.Dense(1, activation='sigmoid')
        ])
        
        model.compile(
            optimizer='adam',
            loss='binary_crossentropy',
            metrics=['accuracy', tf.keras.metrics.AUC()]
        )
        
        return model
    
    def prepare_sequence_data(self, user_actions):
        """Convert user actions to sequence format"""
        sequences = []
        
        for i in range(len(user_actions) - self.sequence_length):
            sequence = user_actions[i:i + self.sequence_length]
            features = self.extract_sequence_features(sequence)
            sequences.append(features)
        
        return np.array(sequences)
    
    def extract_sequence_features(self, sequence):
        """Extract features from action sequence"""
        features = []
        
        for action in sequence:
            action_features = [
                self.encode_action_type(action['type']),
                action['timestamp'].hour / 24,
                action['time_since_last'] / 3600,  # Convert to hours
                action['page_depth'],
                action['is_form_interaction'],
                action['is_rapid'],
                action['scroll_speed'],
                action['click_rate'],
                action['is_vpn'],
                action['device_fingerprint_match'],
                action['geographic_consistency'],
                action['referrer_suspicious'],
                action['copy_paste_activity'],
                action['failed_attempts'],
                action['unusual_hour']
            ]
            features.append(action_features)
        
        return features
    
    def predict_suspicious_sequence(self, user_actions):
        """Predict if sequence of actions is suspicious"""
        if len(user_actions) < self.sequence_length:
            return {'suspicious': False, 'confidence': 0.0}
        
        sequence_data = self.prepare_sequence_data(user_actions)
        predictions = self.model.predict(sequence_data)
        
        # Aggregate predictions
        avg_prediction = np.mean(predictions)
        max_prediction = np.max(predictions)
        
        return {
            'suspicious': avg_prediction > 0.7,
            'average_score': float(avg_prediction),
            'max_score': float(max_prediction),
            'risk_timeline': predictions.tolist()
        }
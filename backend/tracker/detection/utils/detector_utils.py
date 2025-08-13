"""
Detector Utilities Module
Common helper functions and utilities used across all detection modules
"""

from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional, Tuple
import hashlib
import re
import math
from collections import defaultdict
import ipaddress
import logging

logger = logging.getLogger(__name__)


class DetectorUtils:
    """Common utilities for detection modules"""
    
    @staticmethod
    def calculate_string_similarity(str1: str, str2: str) -> float:
        """Calculate similarity between two strings (Levenshtein ratio)"""
        if not str1 or not str2:
            return 0.0
        
        # Handle identical strings
        if str1 == str2:
            return 1.0
        
        # Simple similarity calculation
        longer = max(len(str1), len(str2))
        shorter = min(len(str1), len(str2))
        
        if longer == 0:
            return 1.0
        
        # Calculate Levenshtein distance
        distance = DetectorUtils._levenshtein_distance(str1, str2)
        
        # Convert to similarity ratio
        return 1.0 - (distance / longer)
    
    @staticmethod
    def _levenshtein_distance(s1: str, s2: str) -> int:
        """Calculate Levenshtein distance between two strings"""
        if len(s1) < len(s2):
            return DetectorUtils._levenshtein_distance(s2, s1)
        
        if len(s2) == 0:
            return len(s1)
        
        previous_row = range(len(s2) + 1)
        
        for i, c1 in enumerate(s1):
            current_row = [i + 1]
            for j, c2 in enumerate(s2):
                # j+1 instead of j since previous_row and current_row are one character longer
                insertions = previous_row[j + 1] + 1
                deletions = current_row[j] + 1
                substitutions = previous_row[j] + (c1 != c2)
                current_row.append(min(insertions, deletions, substitutions))
            previous_row = current_row
        
        return previous_row[-1]
    
    @staticmethod
    def is_tor_exit_node(ip_address: str) -> bool:
        """Check if IP is a known Tor exit node"""
        if not ip_address:
            return False
        
        # In production, would check against Tor exit node list
        # This is a simplified check
        tor_indicators = [
            '198.96.',  # Known Tor hosting ranges
            '199.87.',
            '23.129.',
        ]
        
        return any(ip_address.startswith(prefix) for prefix in tor_indicators)
    
    @staticmethod
    def detect_vpn_provider(ip_address: str) -> Optional[str]:
        """Detect VPN provider from IP address"""
        if not ip_address:
            return None
        
        # Simplified VPN detection - in production would use IP intelligence API
        vpn_ranges = {
            'NordVPN': ['185.', '194.', '195.'],
            'ExpressVPN': ['174.', '198.'],
            'CyberGhost': ['89.', '91.'],
            'ProtonVPN': ['185.159.', '185.242.'],
        }
        
        for provider, ranges in vpn_ranges.items():
            if any(ip_address.startswith(prefix) for prefix in ranges):
                return provider
        
        return None
    
    @staticmethod
    def calculate_geographic_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
        """Calculate distance between two geographic coordinates in miles"""
        # Haversine formula
        R = 3959  # Earth's radius in miles
        
        lat1_rad = math.radians(lat1)
        lat2_rad = math.radians(lat2)
        delta_lat = math.radians(lat2 - lat1)
        delta_lon = math.radians(lon2 - lon1)
        
        a = (math.sin(delta_lat / 2) ** 2 + 
             math.cos(lat1_rad) * math.cos(lat2_rad) * 
             math.sin(delta_lon / 2) ** 2)
        c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
        
        return R * c
    
    @staticmethod
    def parse_user_agent(user_agent: str) -> Dict[str, str]:
        """Parse user agent string into components"""
        if not user_agent:
            return {'browser': 'unknown', 'os': 'unknown', 'device': 'unknown'}
        
        result = {
            'browser': 'unknown',
            'os': 'unknown',
            'device': 'desktop',
            'bot': False
        }
        
        ua_lower = user_agent.lower()
        
        # Detect browser
        if 'chrome' in ua_lower and 'edg' not in ua_lower:
            result['browser'] = 'Chrome'
        elif 'firefox' in ua_lower:
            result['browser'] = 'Firefox'
        elif 'safari' in ua_lower and 'chrome' not in ua_lower:
            result['browser'] = 'Safari'
        elif 'edg' in ua_lower:
            result['browser'] = 'Edge'
        elif 'opera' in ua_lower or 'opr' in ua_lower:
            result['browser'] = 'Opera'
        
        # Detect OS
        if 'windows' in ua_lower:
            result['os'] = 'Windows'
        elif 'mac' in ua_lower:
            result['os'] = 'macOS'
        elif 'linux' in ua_lower:
            result['os'] = 'Linux'
        elif 'android' in ua_lower:
            result['os'] = 'Android'
            result['device'] = 'mobile'
        elif 'iphone' in ua_lower or 'ipad' in ua_lower:
            result['os'] = 'iOS'
            result['device'] = 'mobile' if 'iphone' in ua_lower else 'tablet'
        
        # Detect bots
        bot_indicators = ['bot', 'crawler', 'spider', 'scraper', 'headless']
        if any(indicator in ua_lower for indicator in bot_indicators):
            result['bot'] = True
        
        return result
    
    @staticmethod
    def is_private_ip(ip_address: str) -> bool:
        """Check if IP address is private/internal"""
        try:
            ip = ipaddress.ip_address(ip_address)
            return ip.is_private
        except:
            return False
    
    @staticmethod
    def extract_domain(url: str) -> str:
        """Extract domain from URL"""
        if not url:
            return ''
        
        # Remove protocol
        domain = re.sub(r'^https?://', '', url)
        
        # Remove path
        domain = domain.split('/')[0]
        
        # Remove port
        domain = domain.split(':')[0]
        
        return domain
    
    @staticmethod
    def normalize_timestamp(timestamp: Any) -> datetime:
        """Normalize various timestamp formats to datetime"""
        if isinstance(timestamp, datetime):
            return timestamp
        elif isinstance(timestamp, str):
            try:
                return datetime.fromisoformat(timestamp.replace('Z', '+00:00'))
            except:
                try:
                    return datetime.strptime(timestamp, '%Y-%m-%d %H:%M:%S')
                except:
                    return datetime.now()
        else:
            return datetime.now()
    
    @staticmethod
    def calculate_time_difference(time1: Any, time2: Any, unit: str = 'seconds') -> float:
        """Calculate time difference between two timestamps"""
        dt1 = DetectorUtils.normalize_timestamp(time1)
        dt2 = DetectorUtils.normalize_timestamp(time2)
        
        diff = abs((dt2 - dt1).total_seconds())
        
        if unit == 'minutes':
            return diff / 60
        elif unit == 'hours':
            return diff / 3600
        elif unit == 'days':
            return diff / 86400
        else:
            return diff
    
    @staticmethod
    def detect_pattern_in_sequence(sequence: List[Any], pattern_length: int = 2) -> List[Tuple[int, List]]:
        """Detect repeating patterns in a sequence"""
        patterns = []
        
        if len(sequence) < pattern_length * 2:
            return patterns
        
        for i in range(len(sequence) - pattern_length):
            pattern = sequence[i:i + pattern_length]
            
            # Look for this pattern in the rest of the sequence
            for j in range(i + pattern_length, len(sequence) - pattern_length + 1):
                if sequence[j:j + pattern_length] == pattern:
                    patterns.append((i, pattern))
                    break
        
        return patterns
    
    @staticmethod
    def categorize_page_type(url: str) -> str:
        """Categorize page type from URL"""
        if not url:
            return 'unknown'
        
        url_lower = url.lower()
        
        # Evidence pages
        if any(term in url_lower for term in ['evidence', 'proof', 'document']):
            return 'evidence'
        
        # Timeline pages
        elif 'timeline' in url_lower:
            return 'timeline'
        
        # Victim-related pages
        elif any(term in url_lower for term in ['victim', 'missing', 'person']):
            return 'victim'
        
        # Witness pages
        elif any(term in url_lower for term in ['witness', 'testimony']):
            return 'witness'
        
        # News/updates
        elif any(term in url_lower for term in ['news', 'update', 'press']):
            return 'news'
        
        # Photos/media
        elif any(term in url_lower for term in ['photo', 'image', 'video', 'media']):
            return 'media'
        
        # Contact pages
        elif any(term in url_lower for term in ['contact', 'tip', 'report']):
            return 'contact'
        
        # Admin pages
        elif any(term in url_lower for term in ['admin', 'login', 'dashboard']):
            return 'admin'
        
        # Home page
        elif url_lower.endswith('/') or 'home' in url_lower or 'index' in url_lower:
            return 'home'
        
        else:
            return 'other'
    
    @staticmethod
    def generate_fingerprint(data: Dict[str, Any]) -> str:
        """Generate a fingerprint hash from data dictionary"""
        # Sort keys for consistent hashing
        sorted_data = sorted(data.items())
        
        # Create string representation
        fingerprint_str = '|'.join([f"{k}:{v}" for k, v in sorted_data if v is not None])
        
        # Generate hash
        return hashlib.sha256(fingerprint_str.encode()).hexdigest()
    
    @staticmethod
    def detect_automated_behavior(events: List[Dict], threshold: float = 0.8) -> bool:
        """Detect if behavior appears automated based on timing patterns"""
        if len(events) < 5:
            return False
        
        # Calculate time intervals
        intervals = []
        for i in range(1, len(events)):
            if 'timestamp' in events[i] and 'timestamp' in events[i-1]:
                interval = DetectorUtils.calculate_time_difference(
                    events[i]['timestamp'],
                    events[i-1]['timestamp']
                )
                intervals.append(interval)
        
        if not intervals:
            return False
        
        # Check for regular intervals (low variance)
        avg_interval = sum(intervals) / len(intervals)
        
        if avg_interval == 0:
            return True  # Instant actions = automated
        
        variance = sum((i - avg_interval) ** 2 for i in intervals) / len(intervals)
        coefficient_of_variation = math.sqrt(variance) / avg_interval
        
        # Low coefficient of variation suggests automation
        return coefficient_of_variation < (1 - threshold)
    
    @staticmethod
    def extract_ip_location(ip_address: str) -> Dict[str, Any]:
        """Extract location information from IP address"""
        # In production, would use IP geolocation API
        # This is a placeholder implementation
        
        location = {
            'country': 'Unknown',
            'city': 'Unknown',
            'region': 'Unknown',
            'latitude': None,
            'longitude': None,
            'timezone': None
        }
        
        # Simple checks for demonstration
        if ip_address.startswith('8.8.'):
            location['country'] = 'US'
            location['city'] = 'Mountain View'
        elif ip_address.startswith('1.1.'):
            location['country'] = 'AU'
            location['city'] = 'Sydney'
        
        return location
    
    @staticmethod
    def validate_email(email: str) -> bool:
        """Validate email address format"""
        pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
        return bool(re.match(pattern, email))
    
    @staticmethod
    def validate_phone(phone: str) -> bool:
        """Validate phone number format"""
        # Remove common separators
        cleaned = re.sub(r'[\s\-\(\)\.]', '', phone)
        
        # Check for valid phone number (10-15 digits)
        pattern = r'^\+?\d{10,15}$'
        return bool(re.match(pattern, cleaned))
    
    @staticmethod
    def calculate_entropy(data: str) -> float:
        """Calculate Shannon entropy of a string"""
        if not data:
            return 0.0
        
        # Calculate frequency of each character
        freq = defaultdict(int)
        for char in data:
            freq[char] += 1
        
        # Calculate entropy
        entropy = 0.0
        data_len = len(data)
        
        for count in freq.values():
            probability = count / data_len
            if probability > 0:
                entropy -= probability * math.log2(probability)
        
        return entropy
    
    @staticmethod
    def is_suspicious_filename(filename: str) -> bool:
        """Check if filename appears suspicious"""
        if not filename:
            return False
        
        suspicious_patterns = [
            r'\.exe$', r'\.dll$', r'\.bat$', r'\.cmd$',  # Executables
            r'\.zip$', r'\.rar$', r'\.7z$',  # Archives
            r'\.php$', r'\.jsp$', r'\.asp$',  # Server scripts
            r'hack', r'crack', r'exploit', r'payload',  # Suspicious terms
            r'\.\.', r'%00', r'%20',  # Path traversal attempts
        ]
        
        filename_lower = filename.lower()
        
        return any(re.search(pattern, filename_lower) for pattern in suspicious_patterns)
    
    @staticmethod
    def detect_sql_injection(input_str: str) -> bool:
        """Detect potential SQL injection attempts"""
        if not input_str:
            return False
        
        sql_patterns = [
            r"(\b(SELECT|INSERT|UPDATE|DELETE|DROP|UNION|CREATE|ALTER)\b)",
            r"(--|\#|\/\*|\*\/)",  # SQL comments
            r"(\bOR\b.*=.*)",  # OR conditions
            r"('|\"|;|\\x00|\\n|\\r|\\x1a)",  # Special characters
            r"(\bEXEC(UTE)?\b)",  # Execute commands
        ]
        
        input_upper = input_str.upper()
        
        return any(re.search(pattern, input_upper) for pattern in sql_patterns)
    
    @staticmethod
    def detect_xss_attempt(input_str: str) -> bool:
        """Detect potential XSS attempts"""
        if not input_str:
            return False
        
        xss_patterns = [
            r"<script[^>]*>.*?</script>",
            r"javascript:",
            r"on\w+\s*=",  # Event handlers
            r"<iframe[^>]*>",
            r"<embed[^>]*>",
            r"<object[^>]*>",
            r"alert\s*\(",
            r"eval\s*\(",
        ]
        
        input_lower = input_str.lower()
        
        return any(re.search(pattern, input_lower) for pattern in xss_patterns)
    
    @staticmethod
    def calculate_risk_score(indicators: Dict[str, float], weights: Dict[str, float] = None) -> float:
        """Calculate weighted risk score from multiple indicators"""
        if not indicators:
            return 0.0
        
        if weights is None:
            # Use equal weights if not provided
            weights = {k: 1.0 for k in indicators.keys()}
        
        total_score = 0.0
        total_weight = 0.0
        
        for indicator, value in indicators.items():
            weight = weights.get(indicator, 1.0)
            total_score += value * weight
            total_weight += weight
        
        if total_weight == 0:
            return 0.0
        
        # Normalize to 0-10 scale
        normalized_score = (total_score / total_weight) * 10
        
        return min(normalized_score, 10.0)
    
    @staticmethod
    def format_evidence_data(data: Any) -> str:
        """Format data for evidence preservation"""
        import json
        
        if isinstance(data, (dict, list)):
            return json.dumps(data, indent=2, default=str)
        elif isinstance(data, datetime):
            return data.isoformat()
        else:
            return str(data)
    
    @staticmethod
    def anonymize_ip(ip_address: str) -> str:
        """Anonymize IP address for privacy"""
        if not ip_address:
            return 'xxx.xxx.xxx.xxx'
        
        parts = ip_address.split('.')
        if len(parts) == 4:
            # Keep first two octets, anonymize last two
            return f"{parts[0]}.{parts[1]}.xxx.xxx"
        
        return 'xxx.xxx.xxx.xxx'
    
    @staticmethod
    def detect_base64_encoding(data: str) -> bool:
        """Detect if string appears to be base64 encoded"""
        if not data or len(data) < 4:
            return False
        
        # Base64 pattern
        base64_pattern = r'^[A-Za-z0-9+/]+={0,2}$'
        
        # Check pattern and length (base64 is always multiple of 4)
        return bool(re.match(base64_pattern, data)) and len(data) % 4 == 0
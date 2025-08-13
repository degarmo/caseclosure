"""
Environmental Analysis Module
Analyzes access environment, device patterns, and contextual factors
"""

from datetime import datetime, timedelta
from typing import Dict, List, Any
import logging

logger = logging.getLogger(__name__)


class EnvironmentalAnalyzer:
    """Analyzes environmental and contextual factors of user access"""
    
    def __init__(self, parent_detector):
        self.parent = parent_detector
        self.thresholds = parent_detector.thresholds
    
    def analyze_access_environment(self, event, history: List[Dict]) -> Dict[str, Any]:
        """Detect suspicious access environments"""
        result = {'triggered': False, 'score': 0.0, 'severity': 0, 'details': {}}
        
        environment_score = 0.0
        environment_details = {}
        
        # PUBLIC WIFI OBSESSION
        public_wifi_indicators = self._detect_public_wifi(event.ip_address)
        if public_wifi_indicators:
            # Check if NEVER from home IP
            home_access = any(self._is_residential_ip(h.get('ip_address', '')) for h in history)
            if not home_access:
                environment_score += 5.0
                environment_details['never_home_access'] = True
            else:
                environment_score += 2.0
                environment_details['public_wifi_usage'] = True
        
        # BURNER DEVICE INDICATORS
        if event.event_data:
            browser_data = event.event_data.get('browser_profile', {})
            if self._is_fresh_browser_install(browser_data):
                environment_score += 4.0
                environment_details['fresh_browser'] = True
            
            if not browser_data.get('extensions', []):
                environment_score += 2.0
                environment_details['no_extensions'] = True
            
            if browser_data.get('default_settings', True):
                environment_score += 2.0
                environment_details['default_settings'] = True
        
        # ISOLATED ACCESS
        if self._is_isolated_location(event.ip_address):
            environment_score += 3.0
            environment_details['isolated_access'] = True
        
        # BUSINESS HOURS ANOMALY
        if self._is_business_ip(event.ip_address) and self._is_after_hours(event.timestamp):
            environment_score += 4.0
            environment_details['after_hours_business'] = True
        
        # INSTITUTIONAL ACCESS
        if self._detect_institutional_access(event, history):
            environment_score += 3.0
            environment_details['institutional_access'] = True
        
        # ANONYMOUS ENVIRONMENT
        if self._detect_anonymous_environment(event):
            environment_score += 4.0
            environment_details['anonymous_environment'] = True
        
        if environment_score > 0:
            result['triggered'] = True
            result['score'] = min(environment_score, 10.0)
            result['severity'] = min(int(environment_score / 2), 5)
            result['details'] = environment_details
        
        return result
    
    def analyze_device_patterns(self, event, history: List[Dict]) -> Dict[str, Any]:
        """Analyze device usage patterns"""
        result = {'triggered': False, 'score': 0.0, 'severity': 0, 'details': {}}
        
        device_score = 0.0
        device_details = {}
        
        # DEVICE FINGERPRINT ANALYSIS
        device_fingerprint = self._create_device_fingerprint(event)
        
        # Check for spoofed device characteristics
        if self._detect_spoofed_device(device_fingerprint):
            device_score += 5.0
            device_details['spoofed_device'] = True
        
        # Check for virtual machine indicators
        if self._detect_virtual_machine(event):
            device_score += 4.0
            device_details['virtual_machine'] = True
        
        # Check for emulator usage
        if self._detect_emulator(event):
            device_score += 4.0
            device_details['emulator_detected'] = True
        
        # DEVICE CONSISTENCY ANALYSIS
        if history:
            # Check for impossible device switches
            if self._detect_impossible_device_switch(event, history):
                device_score += 6.0
                device_details['impossible_device_switch'] = True
            
            # Check for device spoofing patterns
            if self._detect_device_spoofing_pattern(history):
                device_score += 3.0
                device_details['device_spoofing_pattern'] = True
        
        # MOBILE VS DESKTOP ANOMALIES
        if self._detect_mobile_desktop_mismatch(event):
            device_score += 3.0
            device_details['device_type_mismatch'] = True
        
        if device_score > 0:
            result['triggered'] = True
            result['score'] = min(device_score, 10.0)
            result['severity'] = min(int(device_score / 2), 5)
            result['details'] = device_details
        
        return result
    
    def analyze_browser_environment(self, event, history: List[Dict]) -> Dict[str, Any]:
        """Analyze browser environment for suspicious configurations"""
        result = {'triggered': False, 'score': 0.0, 'severity': 0, 'details': {}}
        
        browser_score = 0.0
        browser_details = {}
        
        if not event.event_data:
            return result
        
        browser_data = event.event_data.get('browser_profile', {})
        
        # PRIVACY MODE INDICATORS
        if browser_data.get('incognito_mode'):
            browser_score += 2.0
            browser_details['incognito_mode'] = True
        
        # JAVASCRIPT DISABLED
        if not browser_data.get('javascript_enabled', True):
            browser_score += 3.0
            browser_details['javascript_disabled'] = True
        
        # COOKIES DISABLED
        if not browser_data.get('cookies_enabled', True):
            browser_score += 2.0
            browser_details['cookies_disabled'] = True
        
        # WEBRTC DISABLED
        if not browser_data.get('webrtc_enabled', True):
            browser_score += 2.0
            browser_details['webrtc_disabled'] = True
        
        # DNT HEADER
        if browser_data.get('do_not_track'):
            browser_score += 1.0
            browser_details['do_not_track'] = True
        
        # BROWSER LANGUAGE ANOMALIES
        if self._detect_language_anomaly(event, browser_data):
            browser_score += 3.0
            browser_details['language_anomaly'] = True
        
        # PLUGIN/EXTENSION ANALYSIS
        plugin_analysis = self._analyze_plugins(browser_data)
        if plugin_analysis['suspicious']:
            browser_score += plugin_analysis['score']
            browser_details['suspicious_plugins'] = plugin_analysis['details']
        
        if browser_score > 0:
            result['triggered'] = True
            result['score'] = min(browser_score, 10.0)
            result['severity'] = min(int(browser_score / 2), 5)
            result['details'] = browser_details
        
        return result
    
    def analyze_network_environment(self, event, history: List[Dict]) -> Dict[str, Any]:
        """Analyze network environment characteristics"""
        result = {'triggered': False, 'score': 0.0, 'severity': 0, 'details': {}}
        
        network_score = 0.0
        network_details = {}
        
        # ISP ANALYSIS
        isp_info = self._get_isp_info(event.ip_address)
        if isp_info:
            # Check for hosting provider IPs
            if isp_info.get('is_hosting'):
                network_score += 4.0
                network_details['hosting_provider'] = True
            
            # Check for mobile carrier
            if isp_info.get('is_mobile'):
                network_score += 1.0
                network_details['mobile_network'] = True
            
            # Check for education/government
            if isp_info.get('is_institutional'):
                network_score += 2.0
                network_details['institutional_network'] = True
        
        # CONNECTION QUALITY ANALYSIS
        if event.event_data:
            connection_data = event.event_data.get('connection', {})
            
            # Check for high latency (possible proxy/VPN)
            if connection_data.get('latency', 0) > 500:
                network_score += 2.0
                network_details['high_latency'] = True
            
            # Check for packet loss (unstable connection)
            if connection_data.get('packet_loss', 0) > 5:
                network_score += 1.0
                network_details['packet_loss'] = True
        
        # IP REPUTATION
        if self._check_ip_reputation(event.ip_address):
            network_score += 5.0
            network_details['bad_ip_reputation'] = True
        
        if network_score > 0:
            result['triggered'] = True
            result['score'] = min(network_score, 10.0)
            result['severity'] = min(int(network_score / 2), 5)
            result['details'] = network_details
        
        return result
    
    # Helper methods
    
    def _detect_public_wifi(self, ip_address: str) -> bool:
        """Detect if IP is from public WiFi"""
        # In production, would check against database of public WiFi IPs
        # Check for known coffee shop, library, restaurant chains
        
        # Placeholder - would do reverse DNS lookup and check for:
        # - starbucks, mcdonalds, library, airport, hotel patterns
        
        return False
    
    def _is_residential_ip(self, ip_address: str) -> bool:
        """Check if IP appears to be residential"""
        # Would use IP intelligence database
        # Check for residential ISP patterns
        
        return False
    
    def _is_fresh_browser_install(self, browser_data: Dict) -> bool:
        """Check if browser appears freshly installed"""
        if not browser_data:
            return False
        
        indicators = [
            browser_data.get('history_length', 0) < 10,
            browser_data.get('cookie_count', 0) < 5,
            not browser_data.get('saved_passwords', False),
            not browser_data.get('bookmarks', False),
            browser_data.get('install_age_days', 365) < 7,
        ]
        
        return sum(indicators) >= self.thresholds['fresh_browser_indicators']
    
    def _is_isolated_location(self, ip_address: str) -> bool:
        """Check if IP is from isolated/rural location"""
        # Would use geolocation database
        # Check for rural/remote location indicators
        
        return False
    
    def _is_business_ip(self, ip_address: str) -> bool:
        """Check if IP belongs to a business"""
        # Would use IP intelligence database
        # Check for business/corporate IP ranges
        
        return False
    
    def _is_after_hours(self, timestamp: datetime) -> bool:
        """Check if access is after business hours"""
        hour = timestamp.hour
        is_weekend = timestamp.weekday() >= 5
        
        # After hours: before 7am, after 7pm, or weekends
        return hour < 7 or hour > 19 or is_weekend
    
    def _detect_institutional_access(self, event, history: List[Dict]) -> bool:
        """Detect access from institutional networks"""
        # Check for library, school, government IPs
        # Placeholder implementation
        
        return False
    
    def _detect_anonymous_environment(self, event) -> bool:
        """Detect anonymous browsing environment"""
        if not event.event_data:
            return False
        
        anonymous_indicators = 0
        
        browser_data = event.event_data.get('browser_profile', {})
        
        # Check multiple privacy indicators
        if browser_data.get('incognito_mode'):
            anonymous_indicators += 1
        if not browser_data.get('cookies_enabled', True):
            anonymous_indicators += 1
        if not browser_data.get('javascript_enabled', True):
            anonymous_indicators += 1
        if browser_data.get('privacy_extensions'):
            anonymous_indicators += 1
        
        return anonymous_indicators >= 3
    
    def _create_device_fingerprint(self, event) -> Dict[str, Any]:
        """Create comprehensive device fingerprint"""
        fingerprint = {
            'user_agent': event.user_agent,
            'platform': event.os,
            'device_type': event.device_type,
            'browser': event.browser,
        }
        
        if event.event_data:
            fingerprint.update({
                'screen_resolution': event.event_data.get('screen_resolution'),
                'color_depth': event.event_data.get('color_depth'),
                'hardware_concurrency': event.event_data.get('hardware_concurrency'),
                'device_memory': event.event_data.get('device_memory'),
                'gpu_vendor': event.event_data.get('gpu_vendor'),
            })
        
        return fingerprint
    
    def _detect_spoofed_device(self, fingerprint: Dict) -> bool:
        """Detect spoofed device characteristics"""
        # Check for impossible combinations
        
        # Example: Mobile user agent but desktop screen resolution
        if fingerprint.get('device_type') == 'mobile':
            resolution = fingerprint.get('screen_resolution', '')
            if resolution and any(int(x) > 2000 for x in resolution.split('x') if x.isdigit()):
                return True
        
        # Check for mismatched platform indicators
        if 'Windows' in str(fingerprint.get('platform', '')):
            if 'Safari' in str(fingerprint.get('browser', '')) and 'Chrome' not in str(fingerprint.get('browser', '')):
                return True
        
        return False
    
    def _detect_virtual_machine(self, event) -> bool:
        """Detect virtual machine usage"""
        if not event.event_data:
            return False
        
        vm_indicators = 0
        
        # Check for VM-specific hardware
        gpu_vendor = event.event_data.get('gpu_vendor', '').lower()
        if any(vm in gpu_vendor for vm in ['vmware', 'virtualbox', 'qemu', 'virtual']):
            vm_indicators += 1
        
        # Check for VM-specific screen resolutions
        resolution = event.event_data.get('screen_resolution', '')
        vm_resolutions = ['1024x768', '800x600', '1280x800']
        if resolution in vm_resolutions:
            vm_indicators += 1
        
        # Check for VM-specific hardware concurrency
        if event.event_data.get('hardware_concurrency') == 1:
            vm_indicators += 1
        
        return vm_indicators >= 2
    
    def _detect_emulator(self, event) -> bool:
        """Detect emulator usage"""
        if not event.user_agent:
            return False
        
        emulator_indicators = [
            'Android SDK',
            'iPhone Simulator',
            'iPad Simulator',
            'Genymotion',
            'BlueStacks'
        ]
        
        ua_lower = event.user_agent.lower()
        return any(indicator.lower() in ua_lower for indicator in emulator_indicators)
    
    def _detect_impossible_device_switch(self, event, history: List[Dict]) -> bool:
        """Detect impossible device switches"""
        if not history:
            return False
        
        last_event = history[0]
        
        # Check for OS switch that's unlikely
        if last_event.get('os') == 'iOS' and event.os == 'Android':
            time_diff = (event.timestamp - datetime.fromisoformat(last_event['timestamp'])).total_seconds() / 60
            if time_diff < 5:  # Less than 5 minutes
                return True
        
        return False
    
    def _detect_device_spoofing_pattern(self, history: List[Dict]) -> bool:
        """Detect patterns indicating device spoofing"""
        if len(history) < 5:
            return False
        
        # Look for rapid device characteristic changes
        devices = []
        for h in history[:10]:
            device_sig = f"{h.get('browser')}_{h.get('os')}_{h.get('device_type')}"
            devices.append(device_sig)
        
        # Too many unique devices in short time
        unique_devices = set(devices)
        return len(unique_devices) > 5
    
    def _detect_mobile_desktop_mismatch(self, event) -> bool:
        """Detect mismatches between mobile and desktop indicators"""
        if not event.event_data:
            return False
        
        # Mobile device but desktop behavior
        if event.device_type == 'mobile':
            # Check for desktop-like mouse movements
            if event.event_data.get('mouse_metrics'):
                return True
        
        # Desktop device but mobile behavior
        if event.device_type == 'desktop':
            # Check for touch events
            if event.event_data.get('touch_events'):
                return True
        
        return False
    
    def _detect_language_anomaly(self, event, browser_data: Dict) -> bool:
        """Detect language setting anomalies"""
        if not browser_data:
            return False
        
        browser_lang = browser_data.get('language', '')
        accept_langs = browser_data.get('accept_languages', [])
        
        # Check for mismatch with IP country
        if event.ip_country:
            expected_langs = self._get_expected_languages(event.ip_country)
            if browser_lang and not any(lang in browser_lang for lang in expected_langs):
                return True
        
        return False
    
    def _analyze_plugins(self, browser_data: Dict) -> Dict[str, Any]:
        """Analyze browser plugins for suspicious ones"""
        result = {'suspicious': False, 'score': 0, 'details': []}
        
        if not browser_data:
            return result
        
        plugins = browser_data.get('plugins', [])
        extensions = browser_data.get('extensions', [])
        
        suspicious_keywords = ['vpn', 'proxy', 'privacy', 'anonymous', 'stealth', 'hide']
        
        for item in plugins + extensions:
            item_lower = str(item).lower()
            if any(keyword in item_lower for keyword in suspicious_keywords):
                result['suspicious'] = True
                result['score'] += 1.0
                result['details'].append(item)
        
        result['score'] = min(result['score'], 3.0)
        return result
    
    def _get_isp_info(self, ip_address: str) -> Dict[str, Any]:
        """Get ISP information for IP address"""
        # Would use IP intelligence API
        # Placeholder implementation
        
        return {
            'is_hosting': False,
            'is_mobile': False,
            'is_institutional': False,
            'isp_name': 'Unknown'
        }
    
    def _check_ip_reputation(self, ip_address: str) -> bool:
        """Check IP reputation against threat databases"""
        # Would check against threat intelligence databases
        # Placeholder implementation
        
        return False
    
    def _get_expected_languages(self, country: str) -> List[str]:
        """Get expected languages for a country"""
        language_map = {
            'US': ['en'],
            'UK': ['en'],
            'FR': ['fr'],
            'DE': ['de'],
            'ES': ['es'],
            'MX': ['es'],
            'BR': ['pt'],
            'CN': ['zh'],
            'JP': ['ja'],
            'RU': ['ru'],
        }
        
        return language_map.get(country, ['en'])
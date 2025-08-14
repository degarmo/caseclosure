from django.core.mail import send_mail
from django.conf import settings
from .models import TrackingEvent, Alert
import json

def check_for_criminal_behavior(event):
    """
    Check if this event indicates criminal behavior
    and send immediate alerts if needed
    """
    
    # High risk indicators
    alerts_needed = []
    
    # Tor user = VERY suspicious
    if event.is_tor and event.suspicious_score > 0.5:
        alerts_needed.append({
            'level': 'CRITICAL',
            'reason': 'Tor Browser detected viewing case',
            'action': 'email'
        })
    
    # VPN + suspicious behavior
    if event.is_vpn and event.suspicious_score > 0.3:
        alerts_needed.append({
            'level': 'HIGH',
            'reason': 'VPN user showing suspicious behavior',
            'action': 'log'
        })
    
    # Send alerts
    for alert in alerts_needed:
        send_criminal_alert(event, alert)
    
    return alerts_needed

def send_criminal_alert(event, alert_info):
    """
    Send immediate notification about potential criminal
    """
    
    # Log to database
    alert = Alert.objects.create(
        case=event.case,
        alert_type='suspicious_user',
        priority=alert_info['level'].lower(),
        title=f"⚠️ {alert_info['level']}: Potential Criminal Detected",
        message=alert_info['reason'],
        fingerprint_hash=event.fingerprint_hash,
        data={
            'ip': event.ip_address,
            'is_tor': event.is_tor,
            'is_vpn': event.is_vpn,
            'score': event.suspicious_score,
            'url': event.page_url
        }
    )
    
    # Send email for CRITICAL alerts
    if alert_info['level'] == 'CRITICAL' and event.case:
        send_email_alert(event, alert)
    
    return alert

def send_email_alert(event, alert):
    """
    Send email to case owner/detective
    """
    try:
        # Email content
        subject = f"🚨 URGENT: Suspicious Person Viewing {event.case.victim_name}'s Page"
        
        message = f"""
CRIMINAL DETECTION ALERT

A highly suspicious individual is currently viewing the memorial page.

THREAT DETAILS:
- Risk Score: {event.suspicious_score * 10:.1f}/10
- Using Tor: {'YES' if event.is_tor else 'NO'}
- Using VPN: {'YES' if event.is_vpn else 'NO'}
- Time: {event.timestamp}
- Location: {event.ip_address}
- Page: {event.page_url}

FINGERPRINT: {event.fingerprint_hash[:16]}

ACTION REQUIRED:
1. Document this activity
2. Check for pattern matches with other cases
3. Consider law enforcement notification if behavior escalates

View Full Details: http://localhost:8000/api/dashboard/alert/{alert.id}/

---
CaseClosure Criminal Detection System
        """
        
        # Send to case detective if available
        recipient = event.case.detective_email if event.case else settings.ADMIN_EMAIL
        
        if recipient:
            send_mail(
                subject,
                message,
                'alerts@caseclosure.com',
                [recipient],
                fail_silently=False,
            )
            print(f"🚨 CRITICAL ALERT SENT to {recipient}")
            
    except Exception as e:
        print(f"Failed to send email alert: {e}")
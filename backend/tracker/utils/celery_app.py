# tracker/tasks.py - Celery tasks for async ML processing

from celery import shared_task, chain, group, chord
from celery.result import AsyncResult
from celery.exceptions import SoftTimeLimitExceeded
from django.core.mail import send_mail
from django.template.loader import render_to_string
from django.utils import timezone
from django.db import transaction
from django.core.cache import cache
import logging
import json
from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional
import traceback

from .models import (
    TrackingEvent, UserSession, SuspiciousActivity,
    Alert, Case, DeviceFingerprint
)
from ..ml_analyzer import CriminalMLAnalyzer
from ..suspicious_detector import EnhancedSuspiciousDetector

logger = logging.getLogger(__name__)


# ============================================================================
# MAIN ML ANALYSIS TASKS
# ============================================================================

@shared_task(
    bind=True,
    max_retries=3,
    soft_time_limit=30,
    time_limit=60,
    queue='ml_analysis'
)
def analyze_tracking_event(self, event_id: str) -> Dict[str, Any]:
    """
    Main task to analyze a single tracking event using ML
    """
    try:
        event = TrackingEvent.objects.get(id=event_id)
        
        # Initialize analyzers
        ml_analyzer = CriminalMLAnalyzer()
        suspicious_detector = EnhancedSuspiciousDetector()
        
        # Extract features
        session_data = {
            'timestamp': event.timestamp,
            'case_start_date': event.case.created_at if event.case else event.timestamp,
            'pages': [event.page_url],
            'duration': event.time_on_page or 0,
            'clicks': event.event_data.get('click_count', 0) if event.event_data else 0,
            'scroll_depths': [event.scroll_depth] if event.scroll_depth else [0],
            'is_vpn': event.is_vpn,
            'is_tor': event.is_tor,
            'is_proxy': event.is_proxy,
            'fingerprint_hash': event.fingerprint_hash,
        }
        
        # Run ML analysis
        features = ml_analyzer.extract_criminal_features(session_data)
        anomalies = ml_analyzer.detect_criminal_anomalies(features)
        behavior_prediction = ml_analyzer.predict_criminal_behavior(features)
        
        # Run suspicious behavior detection
        suspicion_score = suspicious_detector.analyze_criminal_behavior(event)
        
        # Combined risk assessment
        combined_risk = (anomalies['criminal_risk_score'] + suspicion_score) / 2
        
        result = {
            'event_id': str(event_id),
            'ml_risk_score': anomalies['criminal_risk_score'],
            'suspicion_score': suspicion_score,
            'combined_risk': combined_risk,
            'is_anomaly': anomalies['is_anomaly'],
            'threat_level': anomalies['threat_level'],
            'behavioral_profile': behavior_prediction['behavioral_profile'],
            'risk_factors': behavior_prediction['risk_factors'],
            'timestamp': timezone.now().isoformat()
        }
        
        # Store result in cache for quick access
        cache_key = f'ml_analysis:{event_id}'
        cache.set(cache_key, result, 3600)  # Cache for 1 hour
        
        # Chain to alert generation if high risk
        if combined_risk >= 6.0:
            generate_alert.delay(event_id, result)
        
        # Log for monitoring
        logger.info(f"ML Analysis complete for event {event_id}: Risk={combined_risk}")
        
        return result
        
    except TrackingEvent.DoesNotExist:
        logger.error(f"Event {event_id} not found")
        raise
    except SoftTimeLimitExceeded:
        logger.warning(f"ML analysis timed out for event {event_id}")
        self.retry(countdown=60)
    except Exception as e:
        logger.error(f"Error analyzing event {event_id}: {str(e)}")
        self.retry(countdown=30)


@shared_task(
    bind=True,
    max_retries=3,
    soft_time_limit=60,
    time_limit=120,
    queue='ml_analysis'
)
def analyze_user_session(self, session_id: str) -> Dict[str, Any]:
    """
    Analyze entire user session for criminal patterns
    """
    try:
        session = UserSession.objects.get(id=session_id)
        events = TrackingEvent.objects.filter(
            session=session
        ).order_by('timestamp')
        
        if not events.exists():
            return {'error': 'No events in session'}
        
        ml_analyzer = CriminalMLAnalyzer()
        
        # Prepare session data
        history = []
        for event in events:
            history.append({
                'timestamp': event.timestamp.isoformat(),
                'event_type': event.event_type,
                'page_url': event.page_url,
                'ip_address': event.ip_address,
                'is_vpn': event.is_vpn,
                'is_tor': event.is_tor,
                'city': event.ip_city,
                'country': event.ip_country,
            })
        
        # Run temporal analysis
        temporal_patterns = ml_analyzer.analyze_temporal_criminal_patterns(history)
        
        # Predict escalation
        escalation = ml_analyzer.predict_escalation(history)
        
        # Check for coordinated activity
        all_sessions = list(events.values(
            'fingerprint_hash', 'timestamp', 'page_url', 'ip_address'
        ))
        coordination = ml_analyzer.detect_coordinated_criminal_activity(all_sessions)
        
        result = {
            'session_id': str(session_id),
            'temporal_patterns': temporal_patterns,
            'escalation_risk': escalation,
            'coordination_detected': coordination.get('coordinated_activity', False),
            'behavioral_consistency': temporal_patterns.get('behavioral_consistency', 0),
            'analysis_timestamp': timezone.now().isoformat()
        }
        
        # Update session with ML results
        session.ml_analysis_results = result
        session.risk_score = escalation.get('escalation_probability', 0)
        session.save()
        
        return result
        
    except UserSession.DoesNotExist:
        logger.error(f"Session {session_id} not found")
        raise
    except Exception as e:
        logger.error(f"Error analyzing session {session_id}: {str(e)}")
        self.retry(countdown=60)


@shared_task(
    bind=True,
    max_retries=2,
    soft_time_limit=120,
    time_limit=180,
    queue='ml_heavy'
)
def analyze_case_patterns(self, case_id: str) -> Dict[str, Any]:
    """
    Comprehensive ML analysis of all activity for a case
    """
    try:
        case = Case.objects.get(id=case_id)
        
        # Get all events for the case
        events = TrackingEvent.objects.filter(
            case=case,
            timestamp__gte=timezone.now() - timedelta(days=7)
        ).order_by('-timestamp')[:1000]
        
        ml_analyzer = CriminalMLAnalyzer()
        suspicious_detector = EnhancedSuspiciousDetector()
        
        # Group events by fingerprint
        user_groups = {}
        for event in events:
            if event.fingerprint_hash not in user_groups:
                user_groups[event.fingerprint_hash] = []
            user_groups[event.fingerprint_hash].append(event)
        
        # Analyze each user
        user_analyses = []
        high_risk_users = []
        
        for fingerprint, user_events in user_groups.items():
            # Create user history
            history = [{
                'timestamp': e.timestamp.isoformat(),
                'page_url': e.page_url,
                'event_type': e.event_type,
                'ip_address': e.ip_address,
                'is_vpn': e.is_vpn,
                'is_tor': e.is_tor,
            } for e in user_events]
            
            # Run analysis
            if len(history) >= 5:  # Need minimum data
                temporal = ml_analyzer.analyze_temporal_criminal_patterns(history)
                escalation = ml_analyzer.predict_escalation(history)
                
                user_analysis = {
                    'fingerprint': fingerprint[:16] + '...',
                    'event_count': len(user_events),
                    'escalation_probability': escalation.get('escalation_probability', 0),
                    'night_stalking_ratio': temporal.get('night_stalking_ratio', 0),
                    'behavioral_consistency': temporal.get('behavioral_consistency', 0),
                }
                
                user_analyses.append(user_analysis)
                
                # Flag high-risk users
                if escalation.get('escalation_probability', 0) > 0.7:
                    high_risk_users.append(fingerprint)
        
        # Check for coordination between users
        all_events_data = [{
            'fingerprint_hash': e.fingerprint_hash,
            'timestamp': e.timestamp,
            'page_url': e.page_url,
        } for e in events[:100]]
        
        coordination = ml_analyzer.detect_coordinated_criminal_activity(all_events_data)
        
        result = {
            'case_id': str(case_id),
            'total_users_analyzed': len(user_groups),
            'high_risk_users': high_risk_users,
            'coordination_detected': coordination.get('coordinated_activity', False),
            'coordination_score': coordination.get('coordination_score', 0),
            'user_analyses': user_analyses[:20],  # Top 20 users
            'analysis_timestamp': timezone.now().isoformat()
        }
        
        # Store comprehensive results
        cache_key = f'case_analysis:{case_id}'
        cache.set(cache_key, result, 7200)  # Cache for 2 hours
        
        # Generate case report if significant findings
        if high_risk_users or coordination.get('coordinated_activity'):
            generate_case_report.delay(case_id, result)
        
        return result
        
    except Case.DoesNotExist:
        logger.error(f"Case {case_id} not found")
        raise
    except Exception as e:
        logger.error(f"Error analyzing case {case_id}: {str(e)}")
        self.retry(countdown=120)


# ============================================================================
# ALERT GENERATION TASKS
# ============================================================================

@shared_task(
    bind=True,
    max_retries=3,
    queue='alerts'
)
def generate_alert(self, event_id: str, analysis_result: Dict) -> str:
    """
    Generate alert based on ML analysis results
    """
    try:
        event = TrackingEvent.objects.get(id=event_id)
        
        # Determine alert priority
        risk_score = analysis_result.get('combined_risk', 0)
        if risk_score >= 8.0:
            priority = 'critical'
            title = f"🚨 CRITICAL: Potential Suspect Activity Detected"
        elif risk_score >= 6.0:
            priority = 'high'
            title = f"⚠️ HIGH RISK: Suspicious Behavior Detected"
        else:
            priority = 'medium'
            title = f"📊 MEDIUM RISK: Anomalous Activity Detected"
        
        # Create alert
        alert = Alert.objects.create(
            case=event.case,
            alert_type='ml_detection',
            priority=priority,
            title=title,
            message=f"ML Analysis detected high-risk behavior from user {event.fingerprint_hash[:16]}",
            fingerprint_hash=event.fingerprint_hash,
            data={
                'event_id': str(event_id),
                'analysis_result': analysis_result,
                'ip_address': event.ip_address,
                'location': f"{event.ip_city}, {event.ip_country}",
                'page_accessed': event.page_url,
                'timestamp': event.timestamp.isoformat(),
            },
            recommended_actions=_get_recommended_actions(risk_score, analysis_result)
        )
        
        # Send notifications for critical alerts
        if priority == 'critical':
            send_alert_notifications.delay(str(alert.id))
        
        logger.info(f"Alert {alert.id} created for event {event_id}")
        return str(alert.id)
        
    except TrackingEvent.DoesNotExist:
        logger.error(f"Event {event_id} not found for alert generation")
        raise
    except Exception as e:
        logger.error(f"Error generating alert for event {event_id}: {str(e)}")
        self.retry(countdown=30)


@shared_task(
    bind=True,
    max_retries=3,
    queue='notifications'
)
def send_alert_notifications(self, alert_id: str):
    """
    Send email/SMS notifications for critical alerts
    """
    try:
        alert = Alert.objects.get(id=alert_id)
        
        # Get case investigators
        investigators = alert.case.investigators.all() if hasattr(alert.case, 'investigators') else []
        
        if not investigators:
            logger.warning(f"No investigators assigned to case {alert.case.id}")
            return
        
        # Prepare email content
        context = {
            'alert': alert,
            'case': alert.case,
            'dashboard_url': f"https://yourdomain.com/cases/{alert.case.id}/alerts/{alert.id}",
        }
        
        html_content = render_to_string('tracker/email/critical_alert.html', context)
        text_content = render_to_string('tracker/email/critical_alert.txt', context)
        
        # Send emails
        for investigator in investigators:
            if investigator.email:
                send_mail(
                    subject=f"[CRITICAL] {alert.title}",
                    message=text_content,
                    from_email='alerts@yoursystem.com',
                    recipient_list=[investigator.email],
                    html_message=html_content,
                    fail_silently=False,
                )
                logger.info(f"Alert notification sent to {investigator.email}")
        
        # Update alert
        alert.notification_sent = True
        alert.notification_sent_at = timezone.now()
        alert.save()
        
    except Alert.DoesNotExist:
        logger.error(f"Alert {alert_id} not found")
        raise
    except Exception as e:
        logger.error(f"Error sending notifications for alert {alert_id}: {str(e)}")
        self.retry(countdown=60)


# ============================================================================
# BATCH PROCESSING TASKS
# ============================================================================

@shared_task(
    bind=True,
    soft_time_limit=300,
    time_limit=360,
    queue='batch'
)
def batch_analyze_recent_events(self):
    """
    Batch process recent events that haven't been analyzed
    """
    try:
        # Get unanalyzed events from last hour
        one_hour_ago = timezone.now() - timedelta(hours=1)
        
        unanalyzed_events = TrackingEvent.objects.filter(
            timestamp__gte=one_hour_ago,
            ml_analyzed=False
        ).values_list('id', flat=True)[:100]  # Process 100 at a time
        
        if not unanalyzed_events:
            logger.info("No unanalyzed events found")
            return {'processed': 0}
        
        # Create group of analysis tasks
        job = group(
            analyze_tracking_event.s(str(event_id)) 
            for event_id in unanalyzed_events
        )
        
        # Execute group
        result = job.apply_async()
        
        # Mark events as queued for analysis
        TrackingEvent.objects.filter(
            id__in=unanalyzed_events
        ).update(ml_analyzed=True)
        
        logger.info(f"Queued {len(unanalyzed_events)} events for ML analysis")
        
        return {
            'processed': len(unanalyzed_events),
            'job_id': result.id
        }
        
    except Exception as e:
        logger.error(f"Error in batch analysis: {str(e)}")
        raise


@shared_task(
    bind=True,
    soft_time_limit=600,
    time_limit=720,
    queue='batch'
)
def daily_case_analysis(self):
    """
    Daily comprehensive analysis of all active cases
    """
    try:
        # Get active cases
        active_cases = Case.objects.filter(
            status__in=['active', 'investigating'],
            updated_at__gte=timezone.now() - timedelta(days=7)
        )
        
        results = []
        
        for case in active_cases:
            # Analyze case patterns
            case_result = analyze_case_patterns(str(case.id))
            results.append(case_result)
            
            # Check for users requiring immediate attention
            high_risk_count = len(case_result.get('high_risk_users', []))
            
            if high_risk_count > 0:
                # Create daily summary alert
                Alert.objects.create(
                    case=case,
                    alert_type='daily_summary',
                    priority='high' if high_risk_count > 3 else 'medium',
                    title=f"Daily Analysis: {high_risk_count} High-Risk Users Identified",
                    message=f"Daily ML analysis identified {high_risk_count} users with high escalation probability",
                    data=case_result
                )
        
        logger.info(f"Daily analysis completed for {len(active_cases)} cases")
        
        return {
            'cases_analyzed': len(active_cases),
            'timestamp': timezone.now().isoformat(),
            'results': results
        }
        
    except Exception as e:
        logger.error(f"Error in daily case analysis: {str(e)}")
        raise


@shared_task(
    bind=True,
    queue='batch'
)
def cleanup_old_analyses(self):
    """
    Clean up old ML analysis results and cache
    """
    try:
        # Delete old suspicious activities
        cutoff_date = timezone.now() - timedelta(days=30)
        deleted_count = SuspiciousActivity.objects.filter(
            created_at__lt=cutoff_date,
            severity_level__lt=3  # Keep high severity
        ).delete()[0]
        
        logger.info(f"Cleaned up {deleted_count} old suspicious activities")
        
        # Clear old cache entries
        cache_pattern = 'ml_analysis:*'
        # Note: This depends on your cache backend supporting pattern deletion
        
        return {
            'deleted_activities': deleted_count,
            'timestamp': timezone.now().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Error in cleanup: {str(e)}")
        raise


# ============================================================================
# REPORT GENERATION TASKS
# ============================================================================

@shared_task(
    bind=True,
    soft_time_limit=120,
    time_limit=180,
    queue='reports'
)
def generate_case_report(self, case_id: str, analysis_data: Dict):
    """
    Generate comprehensive PDF report for case
    """
    try:
        from reportlab.lib import colors
        from reportlab.lib.pagesizes import letter, A4
        from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph
        from reportlab.lib.styles import getSampleStyleSheet
        from io import BytesIO
        
        case = Case.objects.get(id=case_id)
        
        # Create PDF buffer
        buffer = BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=letter)
        elements = []
        styles = getSampleStyleSheet()
        
        # Title
        title = Paragraph(f"ML Analysis Report - Case #{case.case_number}", styles['Title'])
        elements.append(title)
        
        # Summary section
        summary = Paragraph(f"""
        <b>Analysis Date:</b> {timezone.now().strftime('%Y-%m-%d %H:%M')}<br/>
        <b>Total Users Analyzed:</b> {analysis_data.get('total_users_analyzed', 0)}<br/>
        <b>High Risk Users:</b> {len(analysis_data.get('high_risk_users', []))}<br/>
        <b>Coordination Detected:</b> {'Yes' if analysis_data.get('coordination_detected') else 'No'}<br/>
        """, styles['Normal'])
        elements.append(summary)
        
        # High risk users table
        if analysis_data.get('user_analyses'):
            data = [['User ID', 'Events', 'Escalation Risk', 'Night Activity']]
            for user in analysis_data['user_analyses'][:10]:
                data.append([
                    user.get('fingerprint', 'Unknown'),
                    str(user.get('event_count', 0)),
                    f"{user.get('escalation_probability', 0):.2%}",
                    f"{user.get('night_stalking_ratio', 0):.2%}"
                ])
            
            table = Table(data)
            table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
                ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
                ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                ('FONTSIZE', (0, 0), (-1, 0), 14),
                ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
                ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
                ('GRID', (0, 0), (-1, -1), 1, colors.black)
            ]))
            elements.append(table)
        
        # Build PDF
        doc.build(elements)
        pdf_data = buffer.getvalue()
        buffer.close()
        
        # Save report (you'd typically save to S3 or similar)
        # For now, we'll just log success
        logger.info(f"Generated PDF report for case {case_id}, size: {len(pdf_data)} bytes")
        
        # You could save to a model or send via email here
        
        return {
            'case_id': str(case_id),
            'report_size': len(pdf_data),
            'generated_at': timezone.now().isoformat()
        }
        
    except Case.DoesNotExist:
        logger.error(f"Case {case_id} not found")
        raise
    except Exception as e:
        logger.error(f"Error generating report for case {case_id}: {str(e)}")
        self.retry(countdown=60)


# ============================================================================
# REAL-TIME PROCESSING TASKS
# ============================================================================

@shared_task(
    bind=True,
    max_retries=1,
    soft_time_limit=5,
    time_limit=10,
    queue='realtime'
)
def quick_risk_assessment(self, event_id: str) -> float:
    """
    Quick risk assessment for real-time feedback
    """
    try:
        event = TrackingEvent.objects.get(id=event_id)
        
        # Quick checks only
        risk_score = 0.0
        
        # Tor usage - immediate flag
        if event.is_tor:
            risk_score = 10.0
        # VPN usage
        elif event.is_vpn:
            risk_score += 3.0
        
        # Night access
        if 23 <= event.timestamp.hour or event.timestamp.hour < 4:
            risk_score += 2.0
        
        # Victim page access
        if 'victim' in event.page_url.lower():
            risk_score += 3.0
        
        # Evidence page access
        if 'evidence' in event.page_url.lower():
            risk_score += 2.0
        
        # Cache for immediate retrieval
        cache_key = f'quick_risk:{event_id}'
        cache.set(cache_key, risk_score, 300)  # 5 minutes
        
        # Queue full analysis if risk is significant
        if risk_score >= 5.0:
            analyze_tracking_event.delay(str(event_id))
        
        return min(risk_score, 10.0)
        
    except TrackingEvent.DoesNotExist:
        logger.error(f"Event {event_id} not found")
        return 0.0
    except Exception as e:
        logger.error(f"Error in quick assessment: {str(e)}")
        return 0.0


# ============================================================================
# COORDINATED TASK WORKFLOWS
# ============================================================================

@shared_task
def process_new_event_workflow(event_id: str):
    """
    Complete workflow for processing a new tracking event
    """
    workflow = chain(
        quick_risk_assessment.s(event_id),
        analyze_tracking_event.s(event_id)
    )
    
    return workflow.apply_async()


@shared_task
def hourly_analysis_workflow():
    """
    Hourly workflow for comprehensive analysis
    """
    workflow = chain(
        batch_analyze_recent_events.s(),
        cleanup_old_analyses.s()
    )
    
    return workflow.apply_async()


# ============================================================================
# HELPER FUNCTIONS
# ============================================================================

def _get_recommended_actions(risk_score: float, analysis_result: Dict) -> List[str]:
    """
    Get recommended actions based on risk score and analysis
    """
    actions = []
    
    if risk_score >= 8.0:
        actions.extend([
            "🚨 IMMEDIATE: Contact law enforcement",
            "📋 Preserve all digital evidence",
            "🔒 Consider IP blocking",
            "📞 Alert case investigators"
        ])
    elif risk_score >= 6.0:
        actions.extend([
            "⚠️ Increase monitoring frequency",
            "📊 Review user's complete history",
            "🔍 Cross-reference with other cases",
            "📧 Notify case supervisor"
        ])
    else:
        actions.extend([
            "👁️ Continue monitoring",
            "📝 Document patterns",
            "🔄 Review in 24 hours"
        ])
    
    # Add specific actions based on risk factors
    if analysis_result.get('is_anomaly'):
        actions.append("🎯 Flag for anomaly investigation")
    
    if 'tor_usage' in analysis_result.get('risk_factors', []):
        actions.append("🌐 Investigate Tor usage patterns")
    
    if 'victim_obsession' in analysis_result.get('risk_factors', []):
        actions.append("👤 Monitor victim-related page access")
    
    return actions


# ============================================================================
# MONITORING AND HEALTH CHECK TASKS
# ============================================================================

@shared_task
def health_check():
    """
    Health check task for monitoring
    """
    return {
        'status': 'healthy',
        'timestamp': timezone.now().isoformat(),
        'queues': ['ml_analysis', 'alerts', 'notifications', 'batch', 'realtime']
    }
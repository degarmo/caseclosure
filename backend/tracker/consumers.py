# tracker/consumers.py
import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.core.cache import cache
import asyncio
from datetime import datetime, timedelta

class TrackingConsumer(AsyncWebsocketConsumer):
    """WebSocket consumer for real-time tracking updates"""
    
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.case_id = None
        self.user_fingerprint = None
        self.is_admin = False
        self.subscriptions = set()
        
    async def connect(self):
        """Handle WebSocket connection"""
        # Get case ID from URL route
        self.case_id = self.scope['url_route']['kwargs'].get('case_id')
        self.user = self.scope.get('user')
        
        # Check if user is authenticated
        if not self.user or not self.user.is_authenticated:
            await self.close()
            return
            
        # Check admin status
        self.is_admin = await self.get_user_admin_status()
        
        # Join case-specific group
        if self.case_id:
            await self.channel_layer.group_add(
                f'case_{self.case_id}',
                self.channel_name
            )
            self.subscriptions.add(f'case_{self.case_id}')
        
        # Admins join the admin monitoring group
        if self.is_admin:
            await self.channel_layer.group_add(
                'admin_monitoring',
                self.channel_name
            )
            self.subscriptions.add('admin_monitoring')
        
        await self.accept()
        
        # Send initial connection confirmation
        await self.send(text_data=json.dumps({
            'type': 'connection_established',
            'case_id': self.case_id,
            'is_admin': self.is_admin,
            'timestamp': datetime.now().isoformat()
        }))
        
        # Start sending periodic heartbeat
        asyncio.create_task(self.send_heartbeat())
    
    async def disconnect(self, close_code):
        """Handle WebSocket disconnection"""
        # Leave all groups
        for group in self.subscriptions:
            await self.channel_layer.group_discard(
                group,
                self.channel_name
            )
    
    async def receive(self, text_data):
        """Handle incoming WebSocket messages"""
        try:
            data = json.loads(text_data)
            message_type = data.get('type')
            
            if message_type == 'subscribe':
                await self.handle_subscription(data)
            elif message_type == 'unsubscribe':
                await self.handle_unsubscription(data)
            elif message_type == 'ping':
                await self.send_pong()
            elif message_type == 'request_stats':
                await self.send_current_stats()
                
        except json.JSONDecodeError:
            await self.send_error('Invalid JSON')
        except Exception as e:
            await self.send_error(str(e))
    
    async def handle_subscription(self, data):
        """Handle subscription requests"""
        subscription_type = data.get('subscription_type')
        target_id = data.get('target_id')
        
        if subscription_type == 'user' and self.is_admin:
            # Admin subscribing to specific user activity
            group_name = f'user_{target_id}'
            await self.channel_layer.group_add(group_name, self.channel_name)
            self.subscriptions.add(group_name)
            
            await self.send(text_data=json.dumps({
                'type': 'subscription_confirmed',
                'subscription_type': subscription_type,
                'target_id': target_id
            }))
    
    async def handle_unsubscription(self, data):
        """Handle unsubscription requests"""
        group_name = data.get('group_name')
        if group_name in self.subscriptions:
            await self.channel_layer.group_discard(group_name, self.channel_name)
            self.subscriptions.remove(group_name)
    
    # Event handlers for different types of real-time updates
    
    async def tracking_event(self, event):
        """Send tracking event to WebSocket"""
        await self.send(text_data=json.dumps({
            'type': 'tracking_event',
            'data': event['data'],
            'timestamp': event.get('timestamp', datetime.now().isoformat())
        }))
    
    async def suspicious_alert(self, event):
        """Send suspicious activity alert"""
        await self.send(text_data=json.dumps({
            'type': 'suspicious_alert',
            'severity': event['severity'],
            'data': event['data'],
            'timestamp': event.get('timestamp', datetime.now().isoformat())
        }))
    
    async def critical_alert(self, event):
        """Send critical alert requiring immediate attention"""
        await self.send(text_data=json.dumps({
            'type': 'critical_alert',
            'priority': event['priority'],
            'data': event['data'],
            'requires_action': event.get('requires_action', True),
            'timestamp': event.get('timestamp', datetime.now().isoformat())
        }))
    
    async def visitor_update(self, event):
        """Send visitor statistics update"""
        await self.send(text_data=json.dumps({
            'type': 'visitor_update',
            'active_users': event['active_users'],
            'total_today': event['total_today'],
            'new_visitors': event.get('new_visitors', 0),
            'timestamp': event.get('timestamp', datetime.now().isoformat())
        }))
    
    async def ml_prediction(self, event):
        """Send ML prediction results"""
        await self.send(text_data=json.dumps({
            'type': 'ml_prediction',
            'prediction': event['prediction'],
            'confidence': event['confidence'],
            'risk_score': event['risk_score'],
            'user_fingerprint': event.get('user_fingerprint'),
            'timestamp': event.get('timestamp', datetime.now().isoformat())
        }))
    
    # Helper methods
    
    async def send_heartbeat(self):
        """Send periodic heartbeat to keep connection alive"""
        while self.channel_name:
            await asyncio.sleep(30)  # Every 30 seconds
            try:
                await self.send(text_data=json.dumps({
                    'type': 'heartbeat',
                    'timestamp': datetime.now().isoformat()
                }))
            except:
                break
    
    async def send_pong(self):
        """Respond to ping with pong"""
        await self.send(text_data=json.dumps({
            'type': 'pong',
            'timestamp': datetime.now().isoformat()
        }))
    
    async def send_current_stats(self):
        """Send current statistics snapshot"""
        stats = await self.get_current_stats()
        await self.send(text_data=json.dumps({
            'type': 'stats_update',
            'stats': stats,
            'timestamp': datetime.now().isoformat()
        }))
    
    async def send_error(self, message):
        """Send error message"""
        await self.send(text_data=json.dumps({
            'type': 'error',
            'message': message,
            'timestamp': datetime.now().isoformat()
        }))
    
    @database_sync_to_async
    def get_user_admin_status(self):
        """Check if user is admin"""
        return self.user.is_staff or self.user.is_superuser
    
    @database_sync_to_async
    def get_current_stats(self):
        """Get current statistics from database"""
        from .models import TrackingEvent, UserSession
        from django.utils import timezone
        
        now = timezone.now()
        last_5_min = now - timedelta(minutes=5)
        
        return {
            'active_users': UserSession.objects.filter(
                last_activity__gte=last_5_min
            ).count(),
            'events_last_5min': TrackingEvent.objects.filter(
                timestamp__gte=last_5_min
            ).count(),
            'suspicious_count': TrackingEvent.objects.filter(
                timestamp__gte=last_5_min,
                is_suspicious=True
            ).count()
        }


class AdminMonitoringConsumer(AsyncWebsocketConsumer):
    """Dedicated WebSocket consumer for admin monitoring dashboard"""
    
    async def connect(self):
        self.user = self.scope.get('user')
        
        # Only allow admin users
        if not self.user or not self.user.is_authenticated:
            await self.close()
            return
            
        is_admin = await self.is_user_admin()
        if not is_admin:
            await self.close()
            return
        
        # Join admin monitoring group
        await self.channel_layer.group_add(
            'admin_monitoring',
            self.channel_name
        )
        
        await self.accept()
        
        # Send initial data
        await self.send_initial_data()
        
        # Start monitoring loop
        asyncio.create_task(self.monitoring_loop())
    
    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(
            'admin_monitoring',
            self.channel_name
        )
    
    async def monitoring_loop(self):
        """Send periodic monitoring updates"""
        while self.channel_name:
            await asyncio.sleep(5)  # Update every 5 seconds
            try:
                stats = await self.get_monitoring_stats()
                await self.send(text_data=json.dumps({
                    'type': 'monitoring_update',
                    'data': stats,
                    'timestamp': datetime.now().isoformat()
                }))
            except:
                break
    
    @database_sync_to_async
    def is_user_admin(self):
        return self.user.is_staff or self.user.is_superuser
    
    @database_sync_to_async
    def get_monitoring_stats(self):
        """Get comprehensive monitoring statistics"""
        from .models import TrackingEvent, UserSession, SuspiciousActivity, Alert
        from django.utils import timezone
        from django.db.models import Count, Q
        
        now = timezone.now()
        last_5_min = now - timedelta(minutes=5)
        last_hour = now - timedelta(hours=1)
        
        return {
            'active_users': UserSession.objects.filter(
                last_activity__gte=last_5_min
            ).count(),
            'total_events_hour': TrackingEvent.objects.filter(
                timestamp__gte=last_hour
            ).count(),
            'suspicious_users': SuspiciousActivity.objects.filter(
                created_at__gte=last_hour
            ).values('fingerprint_hash').distinct().count(),
            'critical_alerts': Alert.objects.filter(
                created_at__gte=last_hour,
                priority='critical',
                resolved=False
            ).count(),
            'top_pages': list(TrackingEvent.objects.filter(
                timestamp__gte=last_hour
            ).values('page_url').annotate(
                count=Count('id')
            ).order_by('-count')[:5]),
            'vpn_users': UserSession.objects.filter(
                last_activity__gte=last_5_min,
                is_vpn=True
            ).count(),
            'tor_users': UserSession.objects.filter(
                last_activity__gte=last_5_min,
                is_tor=True
            ).count()
        }
    
    async def send_initial_data(self):
        """Send initial dashboard data"""
        stats = await self.get_monitoring_stats()
        await self.send(text_data=json.dumps({
            'type': 'initial_data',
            'data': stats,
            'timestamp': datetime.now().isoformat()
        }))
# utils/email.py - Complete version with all required functions

from django.core.mail import send_mail
from django.template.loader import render_to_string
from django.utils.html import strip_tags
from django.conf import settings
import logging

logger = logging.getLogger(__name__)


def send_invite_email(email, invite_code, first_name):
    """Send invite code email to approved user"""
    subject = 'Your CaseClosure Invite Code'
    
    context = {
        'first_name': first_name,
        'invite_code': invite_code,
        'email': email,
        'site_url': settings.SITE_URL,
    }
    
    html_message = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <style>
            body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
            .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
            .header {{ background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }}
            .content {{ background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }}
            .code-box {{ background: white; border: 2px solid #667eea; border-radius: 8px; padding: 20px; margin: 20px 0; text-align: center; }}
            .code {{ font-size: 32px; font-weight: bold; letter-spacing: 4px; color: #667eea; font-family: 'Courier New', monospace; }}
            .button {{ display: inline-block; padding: 12px 30px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; text-decoration: none; border-radius: 25px; margin-top: 20px; }}
            .steps {{ background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }}
            .steps ol {{ margin: 10px 0; padding-left: 20px; }}
            .steps li {{ margin: 10px 0; }}
            .footer {{ text-align: center; margin-top: 30px; color: #666; font-size: 14px; }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>Welcome to CaseClosure</h1>
                <p>Your safe space to honor and remember</p>
            </div>
            
            <div class="content">
                <h2>Hello {first_name},</h2>
                
                <p>Your account request has been approved. We understand this is a difficult time, and we're here to help you create a meaningful memorial space for your loved one.</p>
                
                <div class="code-box">
                    <p style="margin-bottom: 10px; color: #666;">Your personal invite code:</p>
                    <div class="code">{invite_code}</div>
                </div>
                
                <div class="steps">
                    <h3>Complete Your Registration:</h3>
                    <ol>
                        <li>Visit <a href="{settings.SITE_URL}/signup">{settings.SITE_URL}/signup</a></li>
                        <li>Enter your invite code: <strong>{invite_code}</strong></li>
                        <li>Use this email address: <strong>{email}</strong></li>
                        <li>Create a secure password</li>
                        <li>Start creating your memorial page</li>
                    </ol>
                </div>
                
                <center>
                    <a href="{settings.SITE_URL}/signup" class="button">Complete Registration</a>
                </center>
                
                <p style="margin-top: 30px;"><strong>Important:</strong> This invite code is valid for one use only and is tied to your email address for security.</p>
                
                <p>If you have any questions or need assistance, please don't hesitate to reach out to our support team.</p>
                
                <div class="footer">
                    <p>With sympathy and support,<br>
                    The CaseClosure Team</p>
                    <p style="margin-top: 20px; font-size: 12px;">
                        This email was sent to {email} because an account was requested on CaseClosure.
                    </p>
                </div>
            </div>
        </div>
    </body>
    </html>
    """
    
    plain_message = strip_tags(html_message)
    
    try:
        send_mail(
            subject,
            plain_message,
            settings.DEFAULT_FROM_EMAIL,
            [email],
            html_message=html_message,
            fail_silently=False,
        )
        logger.info(f"Invite email sent successfully to {email}")
        return True
    except Exception as e:
        logger.error(f"Failed to send invite email to {email}: {str(e)}")
        # Print to console in debug mode
        if settings.DEBUG:
            print(f"""
            ===== EMAIL WOULD BE SENT =====
            To: {email}
            Subject: {subject}
            
            Hi {first_name},
            Your invite code is: {invite_code}
            ================================
            """)
        return False


def send_rejection_email(email, first_name, reason=""):
    """Send rejection email to user"""
    subject = 'Your CaseClosure Account Request'
    
    html_message = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <style>
            body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
            .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
            .header {{ background: #f0f0f0; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }}
            .content {{ background: white; padding: 30px; border: 1px solid #ddd; border-radius: 0 0 10px 10px; }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>CaseClosure Account Request Update</h1>
            </div>
            
            <div class="content">
                <h2>Hello {first_name},</h2>
                
                <p>Thank you for your interest in CaseClosure. After careful review, we're unable to approve your account request at this time.</p>
                
                {f'<p><strong>Reason:</strong> {reason}</p>' if reason else ''}
                
                <p>If you believe this decision was made in error or if you have additional information to provide, please feel free to submit a new request with more details about your connection to the case.</p>
                
                <p>We understand this may be disappointing, and we appreciate your understanding as we work to maintain a safe and supportive environment for all families.</p>
                
                <p>Best regards,<br>
                The CaseClosure Team</p>
            </div>
        </div>
    </body>
    </html>
    """
    
    plain_message = strip_tags(html_message)
    
    try:
        send_mail(
            subject,
            plain_message,
            settings.DEFAULT_FROM_EMAIL,
            [email],
            html_message=html_message,
            fail_silently=False,
        )
        logger.info(f"Rejection email sent to {email}")
        return True
    except Exception as e:
        logger.error(f"Failed to send rejection email to {email}: {str(e)}")
        return False


def send_request_confirmation_email(email, first_name):
    """Send confirmation email when someone submits an account request"""
    subject = 'We Received Your CaseClosure Request'
    
    html_message = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <style>
            body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
            .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
            .header {{ background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }}
            .content {{ background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }}
            .info-box {{ background: white; border-left: 4px solid #667eea; padding: 15px; margin: 20px 0; }}
            .footer {{ text-align: center; margin-top: 30px; color: #666; font-size: 14px; }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>Request Received</h1>
                <p>Thank you for reaching out</p>
            </div>
            
            <div class="content">
                <h2>Hello {first_name},</h2>
                
                <p>We've received your account request for CaseClosure. We understand this is a difficult time, and we appreciate you trusting us to help honor your loved one's memory.</p>
                
                <div class="info-box">
                    <h3 style="margin-top: 0;">What happens next?</h3>
                    <ul>
                        <li>Our team will carefully review your request</li>
                        <li>We typically respond within 24-48 hours</li>
                        <li>You'll receive an email with your decision</li>
                        <li>If approved, you'll get an invite code to complete registration</li>
                    </ul>
                </div>
                
                <p>We review each request individually to ensure CaseClosure remains a safe and supportive space for all families. This helps us maintain the integrity and purpose of our platform.</p>
                
                <p>If you have any urgent questions or need to provide additional information, please don't hesitate to reach out to our support team.</p>
                
                <div class="footer">
                    <p>With sympathy and support,<br>
                    The CaseClosure Team</p>
                    <p style="margin-top: 20px; font-size: 12px;">
                        This email was sent to {email} because an account request was submitted on CaseClosure.
                    </p>
                </div>
            </div>
        </div>
    </body>
    </html>
    """
    
    plain_message = strip_tags(html_message)
    
    try:
        send_mail(
            subject,
            plain_message,
            settings.DEFAULT_FROM_EMAIL,
            [email],
            html_message=html_message,
            fail_silently=False,
        )
        logger.info(f"Request confirmation email sent to {email}")
        return True
    except Exception as e:
        logger.error(f"Failed to send confirmation email to {email}: {str(e)}")
        # Print to console in debug mode
        if settings.DEBUG:
            print(f"""
            ===== CONFIRMATION EMAIL =====
            To: {email}
            Subject: {subject}
            
            Hi {first_name},
            We received your CaseClosure account request.
            We'll review it and get back to you within 48 hours.
            ==============================
            """)
        return False
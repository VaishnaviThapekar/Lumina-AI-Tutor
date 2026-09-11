import smtplib
import ssl
import logging
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import Optional
import httpx

from app.config import settings

logger = logging.getLogger(__name__)


def generate_password_reset_html(reset_link: str) -> str:
    """Generate a clean, responsive HTML email template for password reset."""
    return f"""
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reset Your Lumina Password</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f4f4f7; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #333333;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f4f4f7; padding: 40px 0;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width: 580px; background-color: #ffffff; border-radius: 16px; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05); overflow: hidden; padding: 36px 32px;" cellspacing="0" cellpadding="0">
          <tr>
            <td align="center" style="padding-bottom: 24px;">
              <div style="display: inline-block; background: linear-gradient(135deg, #6366f1, #a855f7); padding: 14px 20px; border-radius: 12px; color: #ffffff; font-weight: bold; font-size: 20px; letter-spacing: -0.5px;">
                ✨ Lumina AI Tutor
              </div>
            </td>
          </tr>
          <tr>
            <td>
              <h1 style="font-size: 22px; font-weight: 700; color: #111827; margin: 0 0 16px 0; text-align: center;">Reset Your Password</h1>
              <p style="font-size: 15px; line-height: 24px; color: #4b5563; margin: 0 0 24px 0;">
                We received a request to reset the password for your Lumina AI Tutor account. Click the button below to choose a new password:
              </p>
            </td>
          </tr>
          <tr>
            <td align="center" style="padding: 12px 0 28px 0;">
              <a href="{reset_link}" target="_blank" style="display: inline-block; background: linear-gradient(135deg, #6366f1, #9333ea); color: #ffffff; text-decoration: none; font-size: 15px; font-weight: 600; padding: 14px 32px; border-radius: 10px; box-shadow: 0 4px 14px rgba(99, 102, 241, 0.4);">
                Reset Password
              </a>
            </td>
          </tr>
          <tr>
            <td>
              <p style="font-size: 13px; line-height: 20px; color: #6b7280; margin: 0 0 16px 0;">
                If the button above does not work, copy and paste this link into your browser:
              </p>
              <p style="font-size: 12px; line-height: 18px; color: #6366f1; word-break: break-all; margin: 0 0 24px 0;">
                <a href="{reset_link}" style="color: #6366f1;">{reset_link}</a>
              </p>
              <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;" />
              <p style="font-size: 12px; line-height: 18px; color: #9ca3af; margin: 0; text-align: center;">
                This link will expire in <strong>1 hour</strong>. If you did not request a password reset, you can safely ignore this email.
              </p>
            </td>
          </tr>
        </table>
        <table role="presentation" width="100%" style="max-width: 580px; margin-top: 16px;" cellspacing="0" cellpadding="0">
          <tr>
            <td align="center" style="font-size: 12px; color: #9ca3af;">
              &copy; Lumina AI Tutor. All rights reserved.
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
"""


def send_smtp_email(to_email: str, subject: str, html_content: str, text_content: str) -> bool:
    """Send an email using configured SMTP settings."""
    if not settings.SMTP_HOST or not settings.SMTP_USER or not settings.SMTP_PASSWORD:
        return False

    sender_email = settings.SMTP_FROM_EMAIL or settings.SMTP_USER
    sender_name = settings.SMTP_FROM_NAME or "Lumina AI Tutor"

    message = MIMEMultipart("alternative")
    message["Subject"] = subject
    message["From"] = f"{sender_name} <{sender_email}>"
    message["To"] = to_email

    part1 = MIMEText(text_content, "plain")
    part2 = MIMEText(html_content, "html")
    message.attach(part1)
    message.attach(part2)

    try:
        if settings.SMTP_PORT == 465:
            context = ssl.create_default_context()
            with smtplib.SMTP_SSL(settings.SMTP_HOST, settings.SMTP_PORT, context=context) as server:
                server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
                server.sendmail(sender_email, to_email, message.as_string())
        else:
            with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT, timeout=15) as server:
                if settings.SMTP_TLS:
                    server.starttls(context=ssl.create_default_context())
                server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
                server.sendmail(sender_email, to_email, message.as_string())

        logger.info(f"✅ Password reset email successfully sent via SMTP to {to_email}")
        return True
    except Exception as e:
        logger.error(f"❌ Failed to send SMTP email to {to_email}: {str(e)}")
        return False


def send_resend_email(to_email: str, subject: str, html_content: str) -> bool:
    """Send an email using Resend API if API key is present."""
    if not settings.RESEND_API_KEY:
        return False

    sender_email = settings.SMTP_FROM_EMAIL or "onboarding@resend.dev"
    sender_name = settings.SMTP_FROM_NAME or "Lumina AI Tutor"

    try:
        with httpx.Client(timeout=10) as client:
            response = client.post(
                "https://api.resend.com/emails",
                headers={
                    "Authorization": f"Bearer {settings.RESEND_API_KEY}",
                    "Content-Type": "application/json",
                },
                json={
                    "from": f"{sender_name} <{sender_email}>",
                    "to": [to_email],
                    "subject": subject,
                    "html": html_content,
                },
            )
            if response.status_code in (200, 201):
                logger.info(f"✅ Password reset email successfully sent via Resend API to {to_email}")
                return True
            else:
                logger.error(f"❌ Resend API error ({response.status_code}): {response.text}")
                return False
    except Exception as e:
        logger.error(f"❌ Failed to send email via Resend API: {str(e)}")
        return False


def send_password_reset_email(to_email: str, reset_link: str) -> bool:
    """
    Main entry point for sending password reset emails.
    Tries Resend API first, then SMTP, then falls back to logging the link.
    """
    subject = "Reset Your Lumina AI Tutor Password"
    text_content = f"""Reset Your Lumina Password

We received a request to reset your password. Use the link below to choose a new password:
{reset_link}

This link will expire in 1 hour. If you did not request this, you can safely ignore this email."""

    html_content = generate_password_reset_html(reset_link)

    # 1. Try Resend if configured
    if settings.RESEND_API_KEY:
        if send_resend_email(to_email, subject, html_content):
            return True

    # 2. Try SMTP if configured
    if settings.SMTP_HOST and settings.SMTP_USER and settings.SMTP_PASSWORD:
        if send_smtp_email(to_email, subject, html_content, text_content):
            return True

    # 3. Fallback: Log reset link clearly to console/server logs
    logger.warning(
        f"""
================================================================================
📧 PASSWORD RESET EMAIL (SMTP Not Configured)
To: {to_email}
Reset Link: {reset_link}
Valid For: 1 hour

To send actual emails to users' inboxes:
Set SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD (or RESEND_API_KEY) in your environment.
================================================================================
"""
    )
    return False

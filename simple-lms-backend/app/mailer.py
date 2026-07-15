import smtplib
import ssl
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from email.utils import formatdate, make_msgid

from flask import current_app


def _build_verification_email_text(first_name, code):
    return (
        f"{first_name} عزیز،\n\n"
        f"کد تایید بازیابی رمز عبور شما: {code}\n\n"
        "این کد تا ۱۰ دقیقه دیگر معتبر است.\n"
        "اگر این درخواست را شما ثبت نکرده‌اید، این ایمیل را نادیده بگیرید.\n"
    )


def _build_verification_email_html(first_name, code):
    return f"""
    <div style="font-family: Tahoma, Arial, sans-serif; background:#f7f5f0; padding:32px 16px;">
      <div style="max-width:420px; margin:0 auto; background:#ffffff; border-radius:16px;
                  overflow:hidden; border:1px solid #e6e1d6;">
        <div style="background:#aa3bff; padding:24px; text-align:center;">
          <span style="color:#ffffff; font-size:20px; font-weight:700;">MedStat</span>
        </div>
        <div style="padding:28px 24px; text-align:center;">
          <p style="color:#211e1a; font-size:15px; margin:0 0 20px;">
            {first_name} عزیز،<br>
            کد تایید بازیابی رمز عبور شما:
          </p>
          <div style="font-size:32px; font-weight:700; letter-spacing:6px; color:#aa3bff;
                      background:#f7f5f0; border-radius:10px; padding:14px 0; margin:0 0 20px;">
            {code}
          </div>
          <p style="color:#8a8478; font-size:13px; margin:0;">
            این کد تا ۱۰ دقیقه دیگر معتبر است.<br>
            اگر این درخواست را شما ثبت نکرده‌اید، این ایمیل را نادیده بگیرید.
          </p>
        </div>
      </div>
    </div>
    """


def send_verification_code_email(to_email, first_name, code):
    """
    Sends the password-reset verification code by email via Gmail SMTP.
    Raises on failure so callers can decide how to surface the error —
    it's intentionally not swallowed here, since a silent failure would
    leave a user waiting forever for a code that never arrives.
    """
    username = current_app.config['MAIL_USERNAME']
    app_password = current_app.config['MAIL_APP_PASSWORD']

    if not username or not app_password:
        raise RuntimeError(
            'MAIL_USERNAME / MAIL_APP_PASSWORD are not configured on the server'
        )

    message = MIMEMultipart('alternative')
    message['Subject'] = 'کد بازیابی رمز عبور MedStat'
    message['From'] = f"{current_app.config['MAIL_SENDER_NAME']} <{username}>"
    message['To'] = to_email
    message['Reply-To'] = username
    message['Date'] = formatdate(localtime=True)
    message['Message-ID'] = make_msgid(domain=username.split('@')[-1])

    # A missing plain-text alternative and missing Date/Message-ID headers
    # are both common spam-score signals for a freshly-created sending
    # account; attach the plain-text part first (least-preferred first is
    # the "alternative" convention) then the HTML version.
    message.attach(MIMEText(_build_verification_email_text(first_name, code), 'plain', 'utf-8'))
    message.attach(MIMEText(_build_verification_email_html(first_name, code), 'html', 'utf-8'))

    context = ssl.create_default_context()
    with smtplib.SMTP(current_app.config['MAIL_SERVER'], current_app.config['MAIL_PORT']) as server:
        server.starttls(context=context)
        server.login(username, app_password)
        server.sendmail(username, to_email, message.as_string())

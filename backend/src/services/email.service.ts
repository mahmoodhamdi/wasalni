import { Resend } from 'resend';
import { config } from '../config';
import { logger } from '../utils/logger';

// Initialize Resend client
const resend = config.email.resendApiKey
  ? new Resend(config.email.resendApiKey)
  : null;

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

/**
 * Send an email using Resend
 */
export const sendEmail = async (options: EmailOptions): Promise<boolean> => {
  if (!resend) {
    logger.warn('Resend API key not configured, email not sent');
    // In development, log the email content
    if (config.nodeEnv === 'development') {
      logger.info(`[DEV EMAIL] To: ${options.to}`);
      logger.info(`[DEV EMAIL] Subject: ${options.subject}`);
      logger.info(`[DEV EMAIL] HTML: ${options.html}`);
    }
    return false;
  }

  try {
    const { data, error } = await resend.emails.send({
      from: config.email.fromEmail,
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text,
    });

    if (error) {
      logger.error(`Failed to send email: ${error.message}`);
      return false;
    }

    logger.info(`Email sent successfully: ${data?.id}`);
    return true;
  } catch (error) {
    logger.error(`Email sending error: ${error}`);
    return false;
  }
};

/**
 * Send OTP verification email
 */
export const sendOTPEmail = async (
  email: string,
  otp: string,
  purpose: 'registration' | 'login' | 'password_reset' = 'login'
): Promise<boolean> => {
  const purposeText = {
    registration: {
      ar: 'التسجيل في تطبيق وصّلني',
      en: 'registration with Wasalni',
    },
    login: {
      ar: 'تسجيل الدخول إلى تطبيق وصّلني',
      en: 'logging into Wasalni',
    },
    password_reset: {
      ar: 'إعادة تعيين كلمة المرور',
      en: 'password reset',
    },
  };

  const html = `
    <!DOCTYPE html>
    <html dir="rtl" lang="ar">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>رمز التحقق - وصّلني</title>
    </head>
    <body style="font-family: 'Cairo', 'Segoe UI', Arial, sans-serif; background-color: #f5f5f5; margin: 0; padding: 20px;">
      <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #1a73e8 0%, #0d47a1 100%); padding: 30px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 28px;">وصّلني</h1>
          <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0; font-size: 16px;">توصيلتك علينا</p>
        </div>

        <!-- Content -->
        <div style="padding: 40px 30px;">
          <h2 style="color: #333; margin: 0 0 20px; font-size: 22px; text-align: center;">
            رمز التحقق الخاص بك
          </h2>

          <p style="color: #666; font-size: 16px; line-height: 1.8; text-align: center; margin-bottom: 30px;">
            استخدم الرمز التالي لإتمام عملية ${purposeText[purpose].ar}
          </p>

          <!-- OTP Code -->
          <div style="background: #f8f9fa; border: 2px dashed #1a73e8; border-radius: 12px; padding: 25px; text-align: center; margin: 0 auto; max-width: 250px;">
            <span style="font-size: 36px; font-weight: bold; letter-spacing: 8px; color: #1a73e8; font-family: monospace;">
              ${otp}
            </span>
          </div>

          <p style="color: #999; font-size: 14px; text-align: center; margin-top: 30px;">
            ⏱️ هذا الرمز صالح لمدة ${config.otp.expiresIn} دقائق فقط
          </p>

          <div style="background: #fff3cd; border-radius: 8px; padding: 15px; margin-top: 20px;">
            <p style="color: #856404; font-size: 14px; margin: 0; text-align: center;">
              ⚠️ إذا لم تطلب هذا الرمز، يرجى تجاهل هذا البريد الإلكتروني
            </p>
          </div>
        </div>

        <!-- Footer -->
        <div style="background: #f8f9fa; padding: 20px; text-align: center; border-top: 1px solid #eee;">
          <p style="color: #999; font-size: 12px; margin: 0;">
            © 2024 وصّلني - Wasalni. جميع الحقوق محفوظة.
          </p>
          <p style="color: #999; font-size: 12px; margin: 10px 0 0;">
            الباجور، المنوفية، مصر
          </p>
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `
    وصّلني - رمز التحقق

    رمز التحقق الخاص بك هو: ${otp}

    استخدم هذا الرمز لإتمام عملية ${purposeText[purpose].ar}

    هذا الرمز صالح لمدة ${config.otp.expiresIn} دقائق فقط.

    إذا لم تطلب هذا الرمز، يرجى تجاهل هذا البريد الإلكتروني.

    ---
    Wasalni - Verification Code

    Your verification code is: ${otp}

    Use this code to complete your ${purposeText[purpose].en}.

    This code is valid for ${config.otp.expiresIn} minutes only.

    If you didn't request this code, please ignore this email.
  `;

  return sendEmail({
    to: email,
    subject: `${otp} - رمز التحقق من وصّلني | Wasalni Verification Code`,
    html,
    text,
  });
};

/**
 * Send welcome email after registration
 */
export const sendWelcomeEmail = async (
  email: string,
  name: string,
  userType: 'passenger' | 'driver'
): Promise<boolean> => {
  const typeText = {
    passenger: {
      ar: 'راكب',
      en: 'passenger',
      message: 'يمكنك الآن طلب رحلات بسهولة وأمان',
    },
    driver: {
      ar: 'سائق',
      en: 'driver',
      message: 'يمكنك الآن البدء في تلقي طلبات الرحلات وكسب المال',
    },
  };

  const html = `
    <!DOCTYPE html>
    <html dir="rtl" lang="ar">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>مرحباً بك في وصّلني</title>
    </head>
    <body style="font-family: 'Cairo', 'Segoe UI', Arial, sans-serif; background-color: #f5f5f5; margin: 0; padding: 20px;">
      <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #1a73e8 0%, #0d47a1 100%); padding: 30px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 28px;">وصّلني</h1>
          <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0; font-size: 16px;">توصيلتك علينا</p>
        </div>

        <!-- Content -->
        <div style="padding: 40px 30px; text-align: center;">
          <div style="font-size: 60px; margin-bottom: 20px;">🎉</div>

          <h2 style="color: #333; margin: 0 0 20px; font-size: 24px;">
            أهلاً وسهلاً ${name}!
          </h2>

          <p style="color: #666; font-size: 16px; line-height: 1.8; margin-bottom: 30px;">
            تم تسجيلك بنجاح كـ${typeText[userType].ar} في تطبيق وصّلني.
            <br>
            ${typeText[userType].message}
          </p>

          <div style="background: #e8f5e9; border-radius: 12px; padding: 20px; margin: 20px 0;">
            <h3 style="color: #2e7d32; margin: 0 0 10px;">✅ حسابك جاهز</h3>
            <p style="color: #4caf50; margin: 0;">
              يمكنك الآن استخدام التطبيق والاستمتاع بخدماتنا
            </p>
          </div>

          <p style="color: #999; font-size: 14px; margin-top: 30px;">
            إذا كان لديك أي استفسار، تواصل معنا على ${config.app.supportPhone}
          </p>
        </div>

        <!-- Footer -->
        <div style="background: #f8f9fa; padding: 20px; text-align: center; border-top: 1px solid #eee;">
          <p style="color: #999; font-size: 12px; margin: 0;">
            © 2024 وصّلني - Wasalni. جميع الحقوق محفوظة.
          </p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail({
    to: email,
    subject: `مرحباً بك في وصّلني! | Welcome to Wasalni!`,
    html,
  });
};

/**
 * Send password reset email
 */
export const sendPasswordResetEmail = async (
  email: string,
  resetToken: string
): Promise<boolean> => {
  const resetLink = `${config.app.frontendUrl}/reset-password?token=${resetToken}`;

  const html = `
    <!DOCTYPE html>
    <html dir="rtl" lang="ar">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>إعادة تعيين كلمة المرور - وصّلني</title>
    </head>
    <body style="font-family: 'Cairo', 'Segoe UI', Arial, sans-serif; background-color: #f5f5f5; margin: 0; padding: 20px;">
      <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #1a73e8 0%, #0d47a1 100%); padding: 30px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 28px;">وصّلني</h1>
        </div>

        <!-- Content -->
        <div style="padding: 40px 30px; text-align: center;">
          <div style="font-size: 60px; margin-bottom: 20px;">🔐</div>

          <h2 style="color: #333; margin: 0 0 20px; font-size: 22px;">
            إعادة تعيين كلمة المرور
          </h2>

          <p style="color: #666; font-size: 16px; line-height: 1.8; margin-bottom: 30px;">
            طلبت إعادة تعيين كلمة المرور الخاصة بحسابك.
            <br>
            اضغط على الزر أدناه لإنشاء كلمة مرور جديدة.
          </p>

          <a href="${resetLink}" style="display: inline-block; background: #1a73e8; color: white; padding: 15px 40px; border-radius: 8px; text-decoration: none; font-size: 16px; font-weight: bold;">
            إعادة تعيين كلمة المرور
          </a>

          <p style="color: #999; font-size: 14px; margin-top: 30px;">
            ⏱️ هذا الرابط صالح لمدة ساعة واحدة فقط
          </p>

          <div style="background: #fff3cd; border-radius: 8px; padding: 15px; margin-top: 20px;">
            <p style="color: #856404; font-size: 14px; margin: 0;">
              ⚠️ إذا لم تطلب إعادة تعيين كلمة المرور، يرجى تجاهل هذا البريد الإلكتروني
            </p>
          </div>
        </div>

        <!-- Footer -->
        <div style="background: #f8f9fa; padding: 20px; text-align: center; border-top: 1px solid #eee;">
          <p style="color: #999; font-size: 12px; margin: 0;">
            © 2024 وصّلني - Wasalni. جميع الحقوق محفوظة.
          </p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail({
    to: email,
    subject: `إعادة تعيين كلمة المرور - وصّلني | Password Reset - Wasalni`,
    html,
  });
};

export default {
  sendEmail,
  sendOTPEmail,
  sendWelcomeEmail,
  sendPasswordResetEmail,
};

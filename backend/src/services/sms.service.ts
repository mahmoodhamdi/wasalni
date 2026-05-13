import axios from 'axios';
import { logger } from '../utils/logger';

// SMS Provider Types — Egyptian + international support
type SMSProvider = 'twilio' | 'unifonic' | 'victorylink' | 'mock';

interface SMSConfig {
  provider: SMSProvider;
  // Twilio (international)
  twilioAccountSid?: string;
  twilioAuthToken?: string;
  twilioPhoneNumber?: string;
  // Unifonic (Egyptian / MENA)
  unifonicAppSid?: string;
  unifonicSenderId?: string;
  // VictoryLink (Egyptian local; widely used in MENA secondary cities)
  victorylinkUserName?: string;
  victorylinkPassword?: string;
  victorylinkSender?: string;
}

interface SOSAlertParams {
  riderName: string;
  riderPhone: string;
  driverName: string;
  driverPhone: string;
  vehiclePlate: string;
  vehicleColor?: string;
  vehicleModel?: string;
  location: { lat: number; lng: number };
  emergencyContacts: Array<{ name: string; phone: string }>;
  tripId?: string;
}

interface RideShareParams {
  riderName: string;
  driverName: string;
  driverPhone: string;
  vehiclePlate: string;
  vehicleColor?: string;
  vehicleModel?: string;
  pickup: string;
  dropoff: string;
  trackingUrl?: string;
  emergencyContact: { name: string; phone: string };
}

class SMSService {
  private config: SMSConfig;
  private twilioClient: any = null;

  constructor() {
    this.config = {
      provider: (process.env.SMS_PROVIDER as SMSProvider) || 'mock',
      twilioAccountSid: process.env.TWILIO_ACCOUNT_SID,
      twilioAuthToken: process.env.TWILIO_AUTH_TOKEN,
      twilioPhoneNumber: process.env.TWILIO_PHONE_NUMBER,
      unifonicAppSid: process.env.UNIFONIC_APP_SID,
      unifonicSenderId: process.env.UNIFONIC_SENDER_ID || 'WASALNI',
      victorylinkUserName: process.env.VICTORYLINK_USERNAME,
      victorylinkPassword: process.env.VICTORYLINK_PASSWORD,
      victorylinkSender: process.env.VICTORYLINK_SENDER || 'WASALNI',
    };

    // Initialize Twilio client if configured
    if (this.config.provider === 'twilio' && this.config.twilioAccountSid) {
      this.initTwilioClient();
    }
  }

  private initTwilioClient(): void {
    try {
      // Dynamic import for optional dependency
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const twilio = require('twilio');
      this.twilioClient = twilio(
        this.config.twilioAccountSid,
        this.config.twilioAuthToken
      );
    } catch {
      logger.warn('Twilio package not installed, SMS will use mock provider');
      this.config.provider = 'mock';
    }
  }

  /**
   * Send SMS message
   */
  async sendSMS(to: string, message: string): Promise<boolean> {
    // Normalize phone number
    const normalizedPhone = this.normalizePhoneNumber(to);

    try {
      switch (this.config.provider) {
        case 'twilio':
          return await this.sendViaTwilio(normalizedPhone, message);

        case 'unifonic':
          return await this.sendViaUnifonic(normalizedPhone, message);

        case 'victorylink':
          return await this.sendViaVictoryLink(normalizedPhone, message);

        case 'mock':
        default:
          return this.sendMock(normalizedPhone, message);
      }
    } catch (error: any) {
      logger.error(`SMS send failed to ${to}: ${error.message}`);
      return false;
    }
  }

  /**
   * Send via Twilio
   */
  private async sendViaTwilio(to: string, message: string): Promise<boolean> {
    if (!this.twilioClient) {
      logger.error('Twilio client not initialized');
      return false;
    }

    try {
      await this.twilioClient.messages.create({
        body: message,
        from: this.config.twilioPhoneNumber,
        to,
      });

      logger.info(`SMS sent via Twilio to ${to}`);
      return true;
    } catch (error: any) {
      logger.error(`Twilio SMS error: ${error.message}`);
      return false;
    }
  }

  /**
   * Send via Unifonic (Egyptian provider)
   */
  private async sendViaUnifonic(to: string, message: string): Promise<boolean> {
    try {
      const response = await axios.post(
        'https://el.cloud.unifonic.com/rest/SMS/messages',
        {
          AppSid: this.config.unifonicAppSid,
          SenderID: this.config.unifonicSenderId,
          Body: message,
          Recipient: to,
        },
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.data.success) {
        logger.info(`SMS sent via Unifonic to ${to}`);
        return true;
      }

      logger.error(`Unifonic SMS error: ${response.data.message}`);
      return false;
    } catch (error: any) {
      logger.error(`Unifonic SMS error: ${error.message}`);
      return false;
    }
  }

  /**
   * Send via VictoryLink (Egyptian SMS gateway, popular for SMBs)
   */
  private async sendViaVictoryLink(to: string, message: string): Promise<boolean> {
    try {
      const response = await axios.post(
        'https://smsmisr.com/api/SMS/',
        null,
        {
          params: {
            username: this.config.victorylinkUserName,
            password: this.config.victorylinkPassword,
            sender: this.config.victorylinkSender,
            mobile: to.replace(/^\+/, ''),
            language: '2',
            message,
          },
          timeout: 10000,
        }
      );

      const code = (response.data?.code || response.data?.Code || '').toString();
      if (code === '1901' || code === '4901') {
        logger.info(`SMS sent via VictoryLink to ${to}`);
        return true;
      }
      logger.error(`VictoryLink SMS error code: ${code}`);
      return false;
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      logger.error(`VictoryLink SMS error: ${msg}`);
      return false;
    }
  }

  /**
   * Mock SMS (for development)
   */
  private sendMock(to: string, message: string): boolean {
    logger.info(`[MOCK SMS] To: ${to}`);
    logger.info(`[MOCK SMS] Message: ${message}`);
    console.log('\n📱 ====== MOCK SMS ======');
    console.log(`📞 To: ${to}`);
    console.log(`📝 Message:\n${message}`);
    console.log('========================\n');
    return true;
  }

  /**
   * Normalize Egyptian phone number
   */
  private normalizePhoneNumber(phone: string): string {
    // Remove spaces and dashes
    let normalized = phone.replace(/[\s-]/g, '');

    // Handle Egyptian numbers
    if (normalized.startsWith('0')) {
      normalized = '+2' + normalized;
    } else if (normalized.startsWith('2') && !normalized.startsWith('+')) {
      normalized = '+' + normalized;
    } else if (!normalized.startsWith('+')) {
      normalized = '+20' + normalized;
    }

    return normalized;
  }

  /**
   * Send SOS alert to emergency contacts
   */
  async sendSOSAlert(params: SOSAlertParams): Promise<{ sent: number; failed: number }> {
    const googleMapsUrl = `https://maps.google.com/?q=${params.location.lat},${params.location.lng}`;

    let sent = 0;
    let failed = 0;

    for (const contact of params.emergencyContacts) {
      const message = `🆘 تنبيه طوارئ من وصّلني!

${params.riderName} يحتاج مساعدتك الآن!

معلومات السائق:
👤 الاسم: ${params.driverName}
📞 الهاتف: ${params.driverPhone}
🚗 السيارة: ${params.vehicleModel || 'غير محدد'} - ${params.vehicleColor || ''}
🔢 اللوحة: ${params.vehiclePlate}

📍 الموقع الحالي:
${googleMapsUrl}

اتصل بـ ${params.riderName} فوراً أو توجه للموقع!

للطوارئ اتصل بـ 122`;

      const success = await this.sendSMS(contact.phone, message);
      if (success) {
        sent++;
        logger.info(`SOS alert sent to ${contact.name} (${contact.phone})`);
      } else {
        failed++;
        logger.error(`Failed to send SOS alert to ${contact.name} (${contact.phone})`);
      }
    }

    return { sent, failed };
  }

  /**
   * Send ride details to emergency contact (ride sharing)
   */
  async sendRideShare(params: RideShareParams): Promise<boolean> {
    const message = `👋 مرحباً ${params.emergencyContact.name}

${params.riderName} شارك معك تفاصيل رحلته:

🚗 معلومات السائق:
• الاسم: ${params.driverName}
• الهاتف: ${params.driverPhone}
• السيارة: ${params.vehicleModel || ''} ${params.vehicleColor || ''}
• اللوحة: ${params.vehiclePlate}

📍 تفاصيل الرحلة:
• من: ${params.pickup}
• إلى: ${params.dropoff}
${params.trackingUrl ? `\n🔗 تتبع الرحلة:\n${params.trackingUrl}` : ''}

هذه الرسالة من تطبيق وصّلني للتوصيل`;

    const success = await this.sendSMS(params.emergencyContact.phone, message);

    if (success) {
      logger.info(`Ride share sent to ${params.emergencyContact.name}`);
    }

    return success;
  }

  /**
   * Send trip started notification
   */
  async sendTripStartedNotification(params: {
    riderName: string;
    driverName: string;
    driverPhone: string;
    vehiclePlate: string;
    pickup: string;
    dropoff: string;
    estimatedArrival?: string;
    contacts: Array<{ name: string; phone: string }>;
  }): Promise<void> {
    const message = `${params.riderName} بدأ رحلة مع وصّلني

من: ${params.pickup}
إلى: ${params.dropoff}
${params.estimatedArrival ? `الوصول المتوقع: ${params.estimatedArrival}` : ''}

السائق: ${params.driverName}
الهاتف: ${params.driverPhone}
اللوحة: ${params.vehiclePlate}`;

    for (const contact of params.contacts) {
      await this.sendSMS(contact.phone, message);
    }
  }

  /**
   * Send trip completed notification
   */
  async sendTripCompletedNotification(params: {
    riderName: string;
    contacts: Array<{ name: string; phone: string }>;
  }): Promise<void> {
    const message = `✅ ${params.riderName} وصل بسلامة

هذه الرسالة من تطبيق وصّلني`;

    for (const contact of params.contacts) {
      await this.sendSMS(contact.phone, message);
    }
  }

  /**
   * Send driver verification code
   */
  async sendDriverVerificationCode(phone: string, code: string): Promise<boolean> {
    const message = `رمز التحقق الخاص بك في وصّلني: ${code}

لا تشارك هذا الرمز مع أي شخص.`;

    return this.sendSMS(phone, message);
  }

  /**
   * Send promo notification
   */
  async sendPromoNotification(
    phones: string[],
    promoCode: string,
    discount: string,
    description: string
  ): Promise<{ sent: number; failed: number }> {
    const message = `🎁 عرض خاص من وصّلني!

${description}

استخدم الكود: ${promoCode}
للحصول على خصم ${discount}

حمّل التطبيق الآن!`;

    let sent = 0;
    let failed = 0;

    for (const phone of phones) {
      const success = await this.sendSMS(phone, message);
      if (success) sent++;
      else failed++;
    }

    return { sent, failed };
  }

  /**
   * Check if SMS is configured
   */
  isConfigured(): boolean {
    if (this.config.provider === 'mock') return true;
    if (this.config.provider === 'twilio') return !!this.twilioClient;
    if (this.config.provider === 'unifonic') return !!this.config.unifonicAppSid;
    if (this.config.provider === 'victorylink')
      return !!(this.config.victorylinkUserName && this.config.victorylinkPassword);
    return false;
  }

  /**
   * Get current provider
   */
  getProvider(): SMSProvider {
    return this.config.provider;
  }
}

export const smsService = new SMSService();
export default smsService;

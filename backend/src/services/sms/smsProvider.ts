/**
 * HELYRA Emergency SMS Provider Engine
 * 
 * Implements a provider-agnostic interface with support for:
 * - Twilio
 * - MSG91
 * - Mock/Console provider for test & offline development
 * 
 * Strict Privacy & Security:
 * - Phone numbers and GPS coordinates are NEVER logged in plain text (PII scrubbing).
 * - Automatic retry with exponential backoff on transient network/provider failures.
 */

export interface SmsSendResult {
  success: boolean;
  messageId?: string;
  error?: string;
  provider: string;
}

export interface SmsProvider {
  readonly name: string;
  sendSms(to: string, message: string): Promise<SmsSendResult>;
}

/**
 * Redacts phone numbers for safe logging (e.g. "+919876543210" -> "+91*****3210")
 */
export function maskPhoneNumber(phone: string): string {
  if (!phone || typeof phone !== 'string') return '[NO_PHONE]';
  const clean = phone.replace(/[\s-]/g, '');
  if (clean.length <= 4) return '****';
  const prefix = clean.slice(0, 3);
  const suffix = clean.slice(-4);
  return `${prefix}*****${suffix}`;
}

/**
 * Redacts GPS coordinates for privacy (e.g. 13.0827, 80.2707 -> "13.08**, 80.27**")
 */
export function maskCoordinates(lat?: number | null, lng?: number | null): string {
  if (lat == null || lng == null) return '[NO_GPS]';
  return `lat:${lat.toFixed(2)}**,lng:${lng.toFixed(2)}**`;
}

/**
 * Retry helper with exponential backoff
 */
async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  retries: number = 2,
  initialDelayMs: number = 300
): Promise<T> {
  let attempt = 0;
  while (attempt <= retries) {
    try {
      return await fn();
    } catch (err: any) {
      if (attempt === retries) throw err;
      const delay = initialDelayMs * Math.pow(2, attempt);
      await new Promise(resolve => setTimeout(resolve, delay));
      attempt++;
    }
  }
  throw new Error('Retry exhausted');
}

/**
 * Twilio SMS Provider Implementation
 */
export class TwilioSmsProvider implements SmsProvider {
  readonly name = 'twilio';
  private accountSid: string;
  private authToken: string;
  private fromNumber: string;

  constructor(options?: { accountSid?: string; authToken?: string; fromNumber?: string }) {
    this.accountSid = options?.accountSid || process.env.TWILIO_ACCOUNT_SID || '';
    this.authToken = options?.authToken || process.env.TWILIO_AUTH_TOKEN || '';
    this.fromNumber = options?.fromNumber || process.env.TWILIO_FROM_NUMBER || '';
  }

  async sendSms(to: string, message: string): Promise<SmsSendResult> {
    if (!this.accountSid || !this.authToken || !this.fromNumber) {
      return {
        success: false,
        provider: this.name,
        error: 'Twilio credentials not configured'
      };
    }

    const maskedTo = maskPhoneNumber(to);
    console.log(`[SMS-DISPATCH] Twilio sending SMS to ${maskedTo}`);

    try {
      return await retryWithBackoff(async () => {
        const url = `https://api.twilio.com/2010-04-01/Accounts/${this.accountSid}/Messages.json`;
        const body = new URLSearchParams({
          To: to,
          From: this.fromNumber,
          Body: message
        });

        const auth = Buffer.from(`${this.accountSid}:${this.authToken}`).toString('base64');
        const res = await fetch(url, {
          method: 'POST',
          headers: {
            'Authorization': `Basic ${auth}`,
            'Content-Type': 'application/x-www-form-urlencoded'
          },
          body: body.toString()
        });

        const data: any = await res.json();
        if (!res.ok) {
          throw new Error(data.message || `Twilio HTTP error ${res.status}`);
        }

        return {
          success: true,
          messageId: data.sid,
          provider: this.name
        };
      }, 2, 400);
    } catch (err: any) {
      console.warn(`[SMS-ERROR] Twilio send failed to ${maskedTo}:`, err.message);
      return {
        success: false,
        provider: this.name,
        error: err.message
      };
    }
  }
}

/**
 * MSG91 SMS Provider Implementation
 */
export class Msg91SmsProvider implements SmsProvider {
  readonly name = 'msg91';
  private authKey: string;
  private templateId: string;
  private senderId: string;

  constructor(options?: { authKey?: string; templateId?: string; senderId?: string }) {
    this.authKey = options?.authKey || process.env.MSG91_AUTH_KEY || '';
    this.templateId = options?.templateId || process.env.MSG91_TEMPLATE_ID || '';
    this.senderId = options?.senderId || process.env.MSG91_SENDER_ID || 'HELYRA';
  }

  async sendSms(to: string, message: string): Promise<SmsSendResult> {
    if (!this.authKey) {
      return {
        success: false,
        provider: this.name,
        error: 'MSG91 authKey not configured'
      };
    }

    const cleanTo = to.replace(/[\s+-]/g, '');
    const maskedTo = maskPhoneNumber(to);
    console.log(`[SMS-DISPATCH] MSG91 sending SMS to ${maskedTo}`);

    try {
      return await retryWithBackoff(async () => {
        const url = 'https://control.msg91.com/api/v5/flow/';
        const payload = {
          template_id: this.templateId,
          short_url: '0',
          recipients: [
            {
              mobiles: cleanTo,
              message,
              sender: this.senderId
            }
          ]
        };

        const res = await fetch(url, {
          method: 'POST',
          headers: {
            'authkey': this.authKey,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(payload)
        });

        const data: any = await res.json();
        if (!res.ok || data.type === 'error') {
          throw new Error(data.message || `MSG91 HTTP error ${res.status}`);
        }

        return {
          success: true,
          messageId: data.message_id || `msg91_${Date.now()}`,
          provider: this.name
        };
      }, 2, 400);
    } catch (err: any) {
      console.warn(`[SMS-ERROR] MSG91 send failed to ${maskedTo}:`, err.message);
      return {
        success: false,
        provider: this.name,
        error: err.message
      };
    }
  }
}

/**
 * Mock SMS Provider for local development & testing
 */
export interface DispatchedMockMessage {
  to: string;
  maskedTo: string;
  message: string;
  timestamp: string;
  id: string;
}

export class MockSmsProvider implements SmsProvider {
  readonly name = 'mock';
  private dispatched: DispatchedMockMessage[] = [];

  async sendSms(to: string, message: string): Promise<SmsSendResult> {
    const maskedTo = maskPhoneNumber(to);
    const msgId = `mock_sms_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    
    console.log(`[MOCK-SMS] Dispatched to ${maskedTo}: "${message.slice(0, 100)}..."`);
    
    this.dispatched.push({
      to,
      maskedTo,
      message,
      timestamp: new Date().toISOString(),
      id: msgId
    });

    return {
      success: true,
      messageId: msgId,
      provider: this.name
    };
  }

  getDispatchedMessages(): DispatchedMockMessage[] {
    return [...this.dispatched];
  }

  clearDispatchedMessages(): void {
    this.dispatched = [];
  }
}

// Global Singleton Provider Instance
let globalProvider: SmsProvider | null = null;
let mockInstance: MockSmsProvider | null = null;

export function getMockSmsProvider(): MockSmsProvider {
  if (!mockInstance) {
    mockInstance = new MockSmsProvider();
  }
  return mockInstance;
}

export function getSmsProvider(): SmsProvider {
  if (globalProvider) return globalProvider;

  const forced = process.env.SMS_PROVIDER?.toLowerCase();
  if (forced === 'twilio' || (process.env.TWILIO_ACCOUNT_SID && !forced)) {
    globalProvider = new TwilioSmsProvider();
  } else if (forced === 'msg91' || (process.env.MSG91_AUTH_KEY && !forced)) {
    globalProvider = new Msg91SmsProvider();
  } else {
    globalProvider = getMockSmsProvider();
  }

  return globalProvider;
}

export function setSmsProviderForTesting(provider: SmsProvider | null): void {
  globalProvider = provider;
}

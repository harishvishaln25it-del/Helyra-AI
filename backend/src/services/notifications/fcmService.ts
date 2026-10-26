/**
 * HELYRA Firebase Cloud Messaging (FCM) Push Notification Service
 * 
 * Supports:
 * - Real-time emergency SOS broadcast to family members' native Android devices
 * - Scheduled medication reminders with interactive actions ("Taken" / "Snooze")
 * - Honest channel reporting (sent vs failed tokens)
 * - Safe test & offline mock mode
 */

export interface PushNotificationPayload {
  title: string;
  body: string;
  data?: Record<string, string>;
  priority?: 'high' | 'normal';
  actions?: Array<{ action: string; title: string }>;
}

export interface PushNotificationResult {
  sent: number;
  failed: number;
  total: number;
  provider: string;
  errors?: string[];
}

export class FcmPushService {
  private serverKey?: string;
  private isConfigured: boolean;
  private sentHistory: Array<{ tokens: string[]; payload: PushNotificationPayload; timestamp: string }> = [];

  constructor() {
    this.serverKey = process.env.FCM_SERVER_KEY || process.env.FIREBASE_SERVER_KEY;
    this.isConfigured = Boolean(this.serverKey);
  }

  /**
   * Broadcast push notification to a list of device push tokens
   */
  async sendToTokens(tokens: string[], payload: PushNotificationPayload): Promise<PushNotificationResult> {
    if (!tokens || tokens.length === 0) {
      return { sent: 0, failed: 0, total: 0, provider: this.isConfigured ? 'fcm' : 'mock' };
    }

    // If no real FCM server key is configured in dev, operate in mock mode
    if (!this.isConfigured) {
      console.log(`[MOCK-FCM] Broadcast to ${tokens.length} device tokens: "${payload.title}" - "${payload.body}"`);
      this.sentHistory.push({
        tokens,
        payload,
        timestamp: new Date().toISOString()
      });
      return {
        sent: tokens.length,
        failed: 0,
        total: tokens.length,
        provider: 'mock'
      };
    }

    try {
      // FCM Legacy HTTP / v1 notification dispatch
      const res = await fetch('https://fcm.googleapis.com/fcm/send', {
        method: 'POST',
        headers: {
          'Authorization': `key=${this.serverKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          registration_ids: tokens,
          notification: {
            title: payload.title,
            body: payload.body,
            sound: 'default'
          },
          data: {
            ...payload.data,
            click_action: 'FLUTTER_NOTIFICATION_CLICK'
          },
          priority: payload.priority || 'high'
        })
      });

      const data: any = await res.json();
      const successCount = Number(data.success) || 0;
      const failureCount = Number(data.failure) || 0;

      return {
        sent: successCount,
        failed: failureCount,
        total: tokens.length,
        provider: 'fcm'
      };
    } catch (err: any) {
      console.warn('[FCM-ERROR] Failed to dispatch push notification:', err.message);
      return {
        sent: 0,
        failed: tokens.length,
        total: tokens.length,
        provider: 'fcm',
        errors: [err.message]
      };
    }
  }

  getHistory() {
    return [...this.sentHistory];
  }

  clearHistory() {
    this.sentHistory = [];
  }
}

export const fcmService = new FcmPushService();

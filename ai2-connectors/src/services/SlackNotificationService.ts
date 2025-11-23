// --- 📦 SLACK NOTIFICATION SERVICE ---
// embracingearth.space - Slack notifications for critical events
// Integrates with core app notification service or sends directly to Slack

/**
 * Slack Notification Service
 * Architecture: Sends critical alerts to Slack for monitoring
 * Uses same pattern as core app notification service
 */
export class SlackNotificationService {
  private readonly slackWebhook: string | null;
  private readonly environment: string;
  private readonly throttle: Map<string, number> = new Map();
  private readonly throttleWindow = 5 * 60 * 1000; // 5 minutes

  constructor() {
    this.slackWebhook = process.env.SLACK_WEBHOOK_URL || null;
    this.environment = process.env.NODE_ENV || 'development';
  }

  /**
   * Send alert to Slack
   */
  async sendAlert(
    message: string,
    severity: 'error' | 'warning' | 'info' = 'info',
    context?: {
      service?: string;
      userId?: string;
      connectorId?: string;
      transactionId?: string;
      error?: string;
      metadata?: any;
    }
  ): Promise<void> {
    // Throttle duplicate messages
    if (!this.shouldSend(message)) {
      return;
    }

    if (!this.slackWebhook) {
      // Silently fail if Slack not configured (non-breaking)
      return;
    }

    try {
      const emoji = severity === 'error' ? '🚨' : severity === 'warning' ? '⚠️' : 'ℹ️';
      const color = severity === 'error' ? '#ff0000' : severity === 'warning' ? '#ffa500' : '#0000ff';

      const fields: any[] = [
        { title: 'Service', value: context?.service || 'connectors-service', short: true },
        { title: 'Environment', value: this.environment, short: true }
      ];

      if (context?.connectorId) {
        fields.push({ title: 'Connector', value: context.connectorId, short: true });
      }

      if (context?.userId) {
        fields.push({ title: 'User ID', value: context.userId.substring(0, 20) + '...', short: true });
      }

      if (context?.transactionId) {
        fields.push({ title: 'Transaction ID', value: context.transactionId.substring(0, 20) + '...', short: true });
      }

      await fetch(this.slackWebhook, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: 'AI2 Connectors Monitor',
          icon_emoji: ':robot_face:',
          attachments: [{
            color,
            title: `${emoji} ${severity.toUpperCase()} Alert`,
            text: message,
            fields,
            footer: 'embracingearth.space',
            ts: Math.floor(Date.now() / 1000)
          }]
        })
      });
    } catch (error: any) {
      // Don't throw - Slack failures shouldn't break the service
      console.error('Failed to send Slack notification:', error.message);
    }
  }

  /**
   * Check if message should be sent (throttle duplicates)
   */
  private shouldSend(message: string): boolean {
    const key = message.slice(0, 100);
    const now = Date.now();
    const last = this.throttle.get(key);

    if (last && now - last < this.throttleWindow) {
      return false; // Throttled
    }

    this.throttle.set(key, now);
    
    // Cleanup old entries
    if (this.throttle.size > 1000) {
      for (const [k, t] of this.throttle.entries()) {
        if (now - t > this.throttleWindow * 2) {
          this.throttle.delete(k);
        }
      }
    }

    return true;
  }

  /**
   * Notify critical error
   */
  async notifyError(error: Error | string, context?: {
    service?: string;
    userId?: string;
    connectorId?: string;
    transactionId?: string;
    metadata?: any;
  }): Promise<void> {
    const message = typeof error === 'string' ? error : `Error: ${error.message}`;
    await this.sendAlert(message, 'error', {
      ...context,
      error: typeof error === 'string' ? error : error.stack
    });
  }

  /**
   * Notify warning
   */
  async notifyWarning(message: string, context?: {
    service?: string;
    userId?: string;
    connectorId?: string;
    metadata?: any;
  }): Promise<void> {
    await this.sendAlert(message, 'warning', context);
  }

  /**
   * Notify info
   */
  async notifyInfo(message: string, context?: {
    service?: string;
    metadata?: any;
  }): Promise<void> {
    await this.sendAlert(message, 'info', context);
  }
}

// Singleton instance
export const slackNotificationService = new SlackNotificationService();


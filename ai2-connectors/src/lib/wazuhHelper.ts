// --- 📦 WAZUH HELPER (Connectors Service) ---
// embracingearth.space - Non-blocking Wazuh event tracking for connectors service
// Works independently of core app - sends events directly to Wazuh Manager

/**
 * Send security event to Wazuh (non-blocking, fire-and-forget)
 * Safe to use in connectors service - won't impact UX or performance
 */
export async function sendWazuhEvent(event: {
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  ip?: string;
  userAgent?: string;
  userId?: string;
  path?: string;
  method?: string;
  metadata?: Record<string, any>;
}): Promise<void> {
  // Non-blocking - fire and forget
  setImmediate(async () => {
    try {
      const wazuhManagerUrl = process.env.WAZUH_MANAGER_URL;
      const wazuhApiUser = process.env.WAZUH_API_USER || 'wazuh';
      const wazuhApiPassword = process.env.WAZUH_API_PASSWORD;

      if (!wazuhManagerUrl || !wazuhApiPassword) {
        return; // Silently skip if not configured
      }

      const axios = require('axios');
      const auth = Buffer.from(`${wazuhApiUser}:${wazuhApiPassword}`).toString('base64');

      // Map event type to Wazuh rule ID
      const ruleMap: Record<string, number> = {
        'connector_connect': 100003,
        'connector_disconnect': 100003,
        'connector_sync': 100003,
        'connector_error': 100003,
        'credential_access': 100002,
        'transaction_create': 100001,
        'transaction_update': 100001,
        'high_value_transaction': 100001,
      };

      const ruleId = ruleMap[event.type] || 1002;

      // Map severity to Wazuh level
      const levelMap: Record<string, number> = {
        'low': 2,
        'medium': 5,
        'high': 10,
        'critical': 15
      };

      await axios.post(
        `${wazuhManagerUrl}:55000/events`,
        {
          timestamp: new Date().toISOString(),
          agent: {
            id: '000',
            name: 'ai2-connectors'
          },
          manager: {
            name: 'wazuh-manager'
          },
          rule: {
            id: ruleId,
            level: levelMap[event.severity] || 5,
            description: event.message,
            groups: ['financial_app', 'connector', event.type]
          },
          data: {
            srcip: event.ip,
            user: event.userId,
            path: event.path,
            method: event.method,
            ...event.metadata
          },
          full_log: JSON.stringify(event)
        },
        {
          headers: {
            'Authorization': `Basic ${auth}`,
            'Content-Type': 'application/json'
          },
          timeout: 2000 // Fast timeout - don't block
        }
      );
    } catch (error) {
      // Silently fail - don't impact user experience
      // Wazuh tracking is best-effort
    }
  });
}


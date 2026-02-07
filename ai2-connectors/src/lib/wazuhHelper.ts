/**
 * Security Event Helper — ai2-connectors service
 * embracingearth.space
 *
 * MIGRATION: Previously sent events to Wazuh Manager REST API.
 * Now outputs structured JSON to stdout → Fly.io → Grafana Cloud Loki.
 *
 * Same interface — callers (SecureCredentialManager, connectors.ts, etc.)
 * don't need updating.
 */

import { logSecurityEvent } from '../utils/wazuh-logger';

/**
 * Send security event (non-blocking, fire-and-forget).
 * Previously: HTTP POST to Wazuh API (2s timeout, axios dependency).
 * Now: synchronous structured JSON to stdout (~0ms).
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
  try {
    logSecurityEvent({
      type: event.type as any,
      action: event.type,
      userId: event.userId,
      ip: event.ip,
      userAgent: event.userAgent,
      details: {
        message: event.message,
        path: event.path,
        method: event.method,
        ...(event.metadata || {}),
      },
      severity: event.severity,
    });
  } catch {
    // Silently fail — security logging is best-effort
    // embracingearth.space
  }
}

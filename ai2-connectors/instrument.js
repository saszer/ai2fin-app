/**
 * Sentry SDK Initialization for Connectors Service
 * CRITICAL: This file must be imported FIRST, before any other imports
 * embracingearth.space - Enterprise error tracking and monitoring
 */

const Sentry = require('@sentry/node');

// Only initialize if not already initialized (avoid double init)
// Only initialize if not already initialized (avoid double init)
// V8+ compatibility: getClient() is the correct way to check initialization
if (!Sentry.getClient()) {
  // Initialize Sentry as early as possible in application lifecycle
  Sentry.init({
    dsn: process.env.SENTRY_DSN || 'https://b09f3ace235939102c2f2eaf4fa58327@o4510689032208384.ingest.us.sentry.io/4510689032536064',

    // Environment configuration
    environment: process.env.NODE_ENV || 'development',

    // Performance monitoring
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0, // 10% in prod, 100% in dev

    // Setting this option to true will send default PII data to Sentry
    // For example, automatic IP address collection on events
    sendDefaultPii: true,

    // Release tracking (for deployment tracking)
    release: process.env.APP_VERSION || process.env.npm_package_version || 'unknown',

    // Server name for identifying which instance
    serverName: process.env.FLY_APP_NAME || process.env.APP_NAME || 'ai2-connectors',

    // Additional context
    initialScope: {
      tags: {
        service: 'ai2-connectors',
        region: process.env.FLY_REGION || 'local',
        machine: process.env.FLY_MACHINE_ID || 'unknown',
      },
    },

    // Filter out health check noise
    beforeSend(event, hint) {
      // Don't send events for health check endpoints
      if (event.request?.url?.includes('/health')) {
        return null;
      }

      // Don't send Wazuh connection errors (handled gracefully)
      if (event.exception?.values?.[0]?.message?.includes('ENOTFOUND ai2-wazuh')) {
        return null;
      }

      return event;
    },

    // Ignore specific errors (if needed)
    ignoreErrors: [
      // Wazuh connection errors (handled gracefully)
      'ENOTFOUND',
      // Rate limiting (expected behavior)
      'TooManyRequests',
    ],
  });

  console.log('✅ Sentry initialized for connectors service');
} else {
  console.log('✅ Sentry already initialized');
}

module.exports = Sentry;

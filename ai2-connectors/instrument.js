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

    // Integrations
    integrations: (() => {
      const integrationsList = [];

      // OpenAI Integration - AI/MCP Monitoring
      try {
        if (Sentry.openAIIntegration) {
          integrationsList.push(Sentry.openAIIntegration({
            recordInputs: true,
            recordOutputs: true,
          }));
        }
      } catch (e) {
        // Optional integration
      }

      return integrationsList;
    })(),

    // Console logging
    enableLogs: true,
  });

  console.log('✅ Sentry initialized for connectors service');
} else {
  console.log('✅ Sentry already initialized');
}

module.exports = Sentry;

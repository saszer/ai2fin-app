/**
 * Sentry SDK Initialization for Analytics Service
 * CRITICAL: This file must be imported FIRST, before any other imports
 * embracingearth.space - Data & Analytics Monitoring
 */

const Sentry = require('@sentry/node');

// Only initialize if not already initialized
if (Sentry && !Sentry.getClient()) {
    Sentry.init({
        dsn: process.env.SENTRY_DSN || 'https://b09f3ace235939102c2f2eaf4fa58327@o4510689032208384.ingest.us.sentry.io/4510689032536064',
        environment: process.env.NODE_ENV || 'development',
        release: process.env.APP_VERSION || process.env.npm_package_version || 'unknown',
        serverName: process.env.FLY_APP_NAME || process.env.APP_NAME || 'ai2-analytics',

        // Lower sampling for high-volume analytics
        tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.05 : 1.0,

        // Console logging
        enableLogs: true,

        // Tags for analytics context
        initialScope: {
            tags: {
                service: 'ai2-analytics',
                region: process.env.FLY_REGION || 'local',
                type: 'data-processing'
            },
        },
    });

    console.log('✅ Sentry initialized for Analytics Service');
}

module.exports = Sentry;

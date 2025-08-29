/**
 * Production Issues Debug Script
 * Diagnoses subscription lookup failures and CSRF token issues
 * embracingearth.space - Production Troubleshooting
 */

const TEST_CONFIG = {
  SUBSCRIPTION_API: process.env.SUBSCRIPTION_API || 'https://ai2-subs.fly.dev',
  CORE_API: process.env.CORE_API || 'https://ai2-core-api.fly.dev',
  PROD_USER_ID: 'cme7xcwmh0000rajix47iwxh2', // From the logs
};

console.log('🚨 Production Issues Debug Script');
console.log('==================================');

async function debugSubscriptionIssues() {
  console.log('\n🔍 DEBUGGING SUBSCRIPTION LOOKUP FAILURES...');
  
  try {
    // Issue 1: Check if user has email in JWT token
    console.log('\n📋 Issue Analysis:');
    console.log('1. User ID from logs:', TEST_CONFIG.PROD_USER_ID);
    console.log('2. Error: "No subscription found for user" - not proceeding to Stripe checks');
    console.log('3. This suggests the orphan recovery logic is not being triggered');
    
    // Root cause analysis
    console.log('\n🔍 Root Cause Analysis:');
    
    const possibleCauses = {
      'Missing Email in JWT': {
        description: 'JWT token may not contain email field',
        impact: 'Orphan recovery requires userEmail to search Stripe',
        check: 'Verify JWT payload contains email field',
        location: 'ai2-subscription-service/src/routes/subscription.ts:496'
      },
      'User Not Authenticated': {
        description: 'User may not be properly authenticated',
        impact: 'req.user.email would be undefined',
        check: 'Verify authentication middleware is working',
        location: 'ai2-subscription-service/src/middleware/auth.ts'
      },
      'Database Connection Issues': {
        description: 'Database queries may be failing silently',
        impact: 'syncUserWithStripe returns early without proper error logging',
        check: 'Add more detailed error logging',
        location: 'ai2-subscription-service/src/services/subscription.ts:927-946'
      },
      'Environment Variables Missing': {
        description: 'STRIPE_SECRET_KEY or other env vars missing in production',
        impact: 'Stripe API calls would fail',
        check: 'Verify all required env vars are set in production',
        location: 'Production environment configuration'
      }
    };
    
    console.log('\n🚨 Possible Root Causes:');
    Object.entries(possibleCauses).forEach(([cause, details]) => {
      console.log(`\n  ${cause}:`);
      console.log(`    Description: ${details.description}`);
      console.log(`    Impact: ${details.impact}`);
      console.log(`    Check: ${details.check}`);
      console.log(`    Location: ${details.location}`);
    });
    
    // Recommended fixes
    console.log('\n🔧 RECOMMENDED FIXES:');
    
    const fixes = [
      {
        priority: 'HIGH',
        title: 'Add Enhanced Logging to Subscription Service',
        description: 'Add detailed logging to identify where the flow is breaking',
        implementation: [
          'Log JWT token payload (sanitized) in /sync-user endpoint',
          'Log userEmail value before orphan recovery check',
          'Add error logging in syncUserWithStripe method',
          'Log database query results'
        ]
      },
      {
        priority: 'HIGH', 
        title: 'Verify Production Environment Variables',
        description: 'Ensure all required environment variables are set',
        implementation: [
          'Check STRIPE_SECRET_KEY is set and valid',
          'Verify JWT_SECRET is consistent between services',
          'Check database connection strings',
          'Verify CORS and cookie settings for production domain'
        ]
      },
      {
        priority: 'MEDIUM',
        title: 'Improve Error Handling in Subscription Sync',
        description: 'Make the sync process more robust with better error reporting',
        implementation: [
          'Catch and log specific database errors',
          'Add retry logic for transient failures',
          'Return more detailed error messages',
          'Add health check endpoint for subscription service'
        ]
      }
    ];
    
    fixes.forEach((fix, index) => {
      console.log(`\n  ${index + 1}. [${fix.priority}] ${fix.title}`);
      console.log(`     ${fix.description}`);
      fix.implementation.forEach(step => {
        console.log(`     • ${step}`);
      });
    });
    
  } catch (error) {
    console.error('❌ Error in subscription debug:', error.message);
  }
}

async function debugCSRFIssues() {
  console.log('\n🔍 DEBUGGING CSRF TOKEN ISSUES...');
  
  try {
    console.log('\n📋 CSRF Issue Analysis:');
    console.log('Error: "CSRF token missing" in production');
    console.log('This affects state-changing requests (POST, PUT, DELETE)');
    
    const csrfCauses = {
      'Cookie SameSite Settings': {
        description: 'Production may require different SameSite cookie settings',
        impact: 'Cookies not sent with cross-origin requests',
        check: 'Verify COOKIE_SAMESITE and COOKIE_SECURE env vars',
        fix: 'Set COOKIE_SAMESITE=none and COOKIE_SECURE=true for production'
      },
      'Missing CSRF Cookie': {
        description: 'ai2_csrf cookie not being set or sent',
        impact: 'Frontend cannot read CSRF token to include in headers',
        check: 'Inspect browser cookies and network requests',
        fix: 'Ensure cookie is httpOnly=false and accessible to JS'
      },
      'Frontend Not Sending CSRF Header': {
        description: 'Frontend not including X-CSRF-Token header',
        impact: 'Server rejects requests due to missing CSRF token',
        check: 'Verify frontend API service includes CSRF header',
        fix: 'Update frontend to read ai2_csrf cookie and send as header'
      },
      'Domain Mismatch': {
        description: 'Cookie domain not matching request domain',
        impact: 'Browser blocks cookie due to domain restrictions',
        check: 'Verify cookie domain settings in production',
        fix: 'Set correct cookie domain for production environment'
      }
    };
    
    console.log('\n🚨 Possible CSRF Root Causes:');
    Object.entries(csrfCauses).forEach(([cause, details]) => {
      console.log(`\n  ${cause}:`);
      console.log(`    Description: ${details.description}`);
      console.log(`    Impact: ${details.impact}`);
      console.log(`    Check: ${details.check}`);
      console.log(`    Fix: ${details.fix}`);
    });
    
    // CSRF fixes
    console.log('\n🔧 CSRF FIXES:');
    
    const csrfFixes = [
      {
        priority: 'HIGH',
        title: 'Update Production Cookie Settings',
        description: 'Configure cookies for cross-origin production environment',
        envVars: {
          'COOKIE_SAMESITE': 'none',
          'COOKIE_SECURE': 'true',
          'CSRF_ENABLED': 'true'
        }
      },
      {
        priority: 'HIGH',
        title: 'Verify Frontend CSRF Implementation',
        description: 'Ensure frontend correctly handles CSRF tokens',
        checks: [
          'ai2_csrf cookie is readable by JavaScript',
          'X-CSRF-Token header is included in API requests',
          'Cookie is sent with credentials: "include"',
          'CORS allows credentials for production domain'
        ]
      },
      {
        priority: 'MEDIUM',
        title: 'Add CSRF Debug Logging',
        description: 'Add detailed logging to identify CSRF failures',
        implementation: [
          'Log cookie presence and values (sanitized)',
          'Log CSRF header presence',
          'Log request origin and referrer',
          'Add CSRF bypass for debugging (temporary)'
        ]
      }
    ];
    
    csrfFixes.forEach((fix, index) => {
      console.log(`\n  ${index + 1}. [${fix.priority}] ${fix.title}`);
      console.log(`     ${fix.description}`);
      if (fix.envVars) {
        console.log('     Environment Variables:');
        Object.entries(fix.envVars).forEach(([key, value]) => {
          console.log(`       ${key}=${value}`);
        });
      }
      if (fix.checks) {
        console.log('     Checks:');
        fix.checks.forEach(check => {
          console.log(`       • ${check}`);
        });
      }
      if (fix.implementation) {
        console.log('     Implementation:');
        fix.implementation.forEach(step => {
          console.log(`       • ${step}`);
        });
      }
    });
    
  } catch (error) {
    console.error('❌ Error in CSRF debug:', error.message);
  }
}

async function generateQuickFixes() {
  console.log('\n🚀 QUICK FIXES FOR IMMEDIATE DEPLOYMENT');
  console.log('=====================================');
  
  const quickFixes = [
    {
      title: 'Enhanced Subscription Logging',
      description: 'Add detailed logging to identify subscription lookup failures',
      files: ['ai2-subscription-service/src/routes/subscription.ts'],
      changes: [
        'Add logging for JWT payload (sanitized)',
        'Log userEmail value before orphan recovery',
        'Add database query error logging',
        'Log Stripe API call results'
      ]
    },
    {
      title: 'Production Environment Variables',
      description: 'Set required environment variables for production',
      files: ['Production environment configuration'],
      changes: [
        'COOKIE_SAMESITE=none',
        'COOKIE_SECURE=true', 
        'CSRF_ENABLED=true',
        'Verify STRIPE_SECRET_KEY is set',
        'Verify JWT_SECRET consistency'
      ]
    },
    {
      title: 'CSRF Debug Mode',
      description: 'Temporarily disable CSRF for debugging',
      files: ['ai2-core-app/src/middleware/cookieAuth.ts'],
      changes: [
        'Add detailed CSRF logging',
        'Temporarily set CSRF_ENABLED=false for debugging',
        'Log cookie and header values'
      ]
    }
  ];
  
  quickFixes.forEach((fix, index) => {
    console.log(`\n${index + 1}. ${fix.title}`);
    console.log(`   ${fix.description}`);
    console.log(`   Files: ${fix.files.join(', ')}`);
    console.log('   Changes:');
    fix.changes.forEach(change => {
      console.log(`     • ${change}`);
    });
  });
  
  console.log('\n🎯 IMMEDIATE ACTION PLAN:');
  console.log('1. Deploy enhanced logging to identify root cause');
  console.log('2. Set production environment variables');
  console.log('3. Monitor logs for specific error details');
  console.log('4. Apply targeted fixes based on log analysis');
  console.log('5. Re-enable CSRF after issues are resolved');
}

// Run all debug functions
async function runDebug() {
  await debugSubscriptionIssues();
  await debugCSRFIssues();
  await generateQuickFixes();
  
  console.log('\n✅ Debug analysis complete!');
  console.log('📋 Next steps: Apply quick fixes and monitor production logs');
}

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    debugSubscriptionIssues,
    debugCSRFIssues,
    generateQuickFixes,
    runDebug,
    TEST_CONFIG
  };
}

// Run if called directly
if (require.main === module) {
  runDebug().catch(console.error);
}

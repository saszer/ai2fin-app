// --- 📦 CONNECTOR REGISTRATION ---
// embracingearth.space - Register all available connectors
// Add your custom connectors here to make them available

import { connectorRegistry } from '../core/ConnectorRegistry';
import { BankAPIConnector } from './examples/BankAPIConnector';
import { XeroConnector } from './examples/XeroConnector';
import { SMSUPIConnector } from './examples/SMSUPIConnector';
import { BasiqConnector } from './BasiqConnector';
import { ApideckConnector } from './ApideckConnector';
import { WiseConnector } from './WiseConnector';
import { PlaidConnector } from './PlaidConnector';

/**
 * Register all connectors
 * 
 * Architecture Notes:
 * - All connectors must be registered before use
 * - Connectors are only available if their env vars are configured
 * - embracingearth.space - Production connector registry
 */
export function registerAllConnectors(): void {
  // Register production connectors (conditionally based on env vars)
  
  // Basiq - Australian bank aggregation
  if (process.env.BASIQ_API_KEY) {
    connectorRegistry.register(BasiqConnector);
    console.log('  ✓ Basiq connector registered');
  }
  
  // Wise - Multi-currency payments
  if (process.env.WISE_CLIENT_ID && process.env.WISE_CLIENT_SECRET) {
    connectorRegistry.register(WiseConnector);
    console.log('  ✓ Wise connector registered');
  }
  
  // Apideck - Unified accounting API (QuickBooks, Xero, etc.)
  if (process.env.APIDECK_API_KEY && process.env.APIDECK_APP_ID) {
    connectorRegistry.register(ApideckConnector);
    console.log('  ✓ Apideck connector registered');
  }
  
  // Plaid - US/UK/Canada/EU bank aggregation
  // embracingearth.space - 12,000+ banks worldwide
  if (process.env.PLAID_CLIENT_ID && process.env.PLAID_SECRET) {
    connectorRegistry.register(PlaidConnector);
    console.log('  ✓ Plaid connector registered');
  }
  
  // Register example connectors for development/demo
  if (process.env.NODE_ENV !== 'production') {
    connectorRegistry.register(BankAPIConnector);
    connectorRegistry.register(XeroConnector);
    connectorRegistry.register(SMSUPIConnector);
    console.log('  ✓ Example connectors registered (dev mode)');
  }
  
  console.log(`✅ Registered ${connectorRegistry.listConnectorIds().length} connector(s)`);
}

/**
 * Auto-register connectors on module load
 */
registerAllConnectors();



// --- 📦 CONNECTOR REGISTRATION ---
// embracingearth.space - Register all available connectors
// Add your custom connectors here to make them available

import { connectorRegistry } from '../core/ConnectorRegistry';
import { BankAPIConnector } from './examples/BankAPIConnector';
import { XeroConnector } from './examples/XeroConnector';
import { SMSUPIConnector } from './examples/SMSUPIConnector';
import { BasiqConnector } from './BasiqConnector';

/**
 * Register all connectors
 * 
 * Architecture Notes:
 * - All connectors must be registered before use
 * - Add your custom connectors here
 * - Connectors can be loaded dynamically in future (plugin system)
 */
export function registerAllConnectors(): void {
  // Register example connectors
  connectorRegistry.register(BankAPIConnector);
  connectorRegistry.register(XeroConnector);
  connectorRegistry.register(SMSUPIConnector);
  
  // Register production connectors
  connectorRegistry.register(BasiqConnector);
  
  // Add your custom connectors here:
  // connectorRegistry.register(MyCustomConnector);
  // connectorRegistry.register(AnotherConnector);
  
  console.log(`✅ Registered ${connectorRegistry.listConnectorIds().length} connector(s)`);
}

/**
 * Auto-register connectors on module load
 */
registerAllConnectors();



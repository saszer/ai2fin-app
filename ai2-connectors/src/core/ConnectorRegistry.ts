// --- 📦 CONNECTOR REGISTRY ---
// embracingearth.space - Central registry for all connectors
// Manages connector discovery, registration, and instantiation

import { BaseConnector } from './BaseConnector';
import { ConnectorMetadata, ConnectorType, ConnectorError, ConnectorErrorCode } from '../types/connector';

/**
 * Connector registry - manages all available connectors
 * Architecture: Singleton pattern for centralized connector management
 * Supports both static registration (built-in connectors) and dynamic registration (user connectors)
 * 
 * Note: In future iterations, this could support plugin loading from separate modules
 */
export class ConnectorRegistry {
  private static instance: ConnectorRegistry;
  private connectors: Map<string, typeof BaseConnector> = new Map();
  private metadata: Map<string, ConnectorMetadata> = new Map();

  private constructor() {
    // Private constructor for singleton pattern
  }

  /**
   * Get singleton instance
   */
  static getInstance(): ConnectorRegistry {
    if (!ConnectorRegistry.instance) {
      ConnectorRegistry.instance = new ConnectorRegistry();
    }
    return ConnectorRegistry.instance;
  }

  /**
   * Register a connector class
   * Connectors must be registered before use
   * 
   * @param connectorClass - Connector class (must extend BaseConnector)
   */
  register(connectorClass: typeof BaseConnector): void {
    // Create temporary instance to get metadata
    const tempInstance = new (connectorClass as any)() as BaseConnector;
    const metadata = tempInstance.getMetadata();
    
    // Validate connector ID
    if (this.connectors.has(metadata.id)) {
      console.warn(`Connector ${metadata.id} is already registered. Overwriting...`);
    }
    
    // Register connector
    this.connectors.set(metadata.id, connectorClass);
    this.metadata.set(metadata.id, metadata);
    
    console.log(`✅ Registered connector: ${metadata.name} (${metadata.id})`);
  }

  /**
   * Register multiple connectors at once
   */
  registerAll(connectorClasses: (typeof BaseConnector)[]): void {
    connectorClasses.forEach(connectorClass => {
      this.register(connectorClass);
    });
  }

  /**
   * Get connector instance by ID
   * 
   * @param connectorId - Connector identifier
   * @returns Connector instance
   * @throws ConnectorError if connector not found
   */
  getConnector(connectorId: string): BaseConnector {
    const ConnectorClass = this.connectors.get(connectorId);
    
    if (!ConnectorClass) {
      throw new ConnectorError(
        `Connector not found: ${connectorId}`,
        ConnectorErrorCode.CONNECTION_FAILED,
        404,
        { connectorId, availableConnectors: Array.from(this.connectors.keys()) }
      );
    }
    
    // Type assertion: ConnectorClass is a concrete class extending BaseConnector
    return new (ConnectorClass as any)() as BaseConnector;
  }

  /**
   * Get connector metadata by ID
   */
  getMetadata(connectorId: string): ConnectorMetadata | null {
    return this.metadata.get(connectorId) || null;
  }

  /**
   * Get all registered connector metadata
   */
  getAllMetadata(): ConnectorMetadata[] {
    return Array.from(this.metadata.values());
  }

  /**
   * Get connectors by type
   */
  getConnectorsByType(type: ConnectorType): ConnectorMetadata[] {
    return Array.from(this.metadata.values()).filter(meta => meta.type === type);
  }

  /**
   * Check if connector is registered
   */
  hasConnector(connectorId: string): boolean {
    return this.connectors.has(connectorId);
  }

  /**
   * List all registered connector IDs
   */
  listConnectorIds(): string[] {
    return Array.from(this.connectors.keys());
  }
}

/**
 * Global registry instance (singleton)
 */
export const connectorRegistry = ConnectorRegistry.getInstance();



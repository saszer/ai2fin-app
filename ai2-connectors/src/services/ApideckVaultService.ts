// --- 📦 APIDECK VAULT SERVICE ---
// embracingearth.space - Apideck Vault OAuth management service
// Handles OAuth flow, session creation, and connection management via Apideck Vault
// Architecture: Centralized service for managing Apideck Vault OAuth flows

import crypto from 'crypto';

/**
 * Apideck Vault Service
 * 
 * Architecture Notes:
 * - Manages OAuth flows via Apideck Vault (no manual OAuth implementation needed)
 * - Creates Vault sessions for users to connect integrations
 * - Handles OAuth callbacks and connection status updates
 * - Integrates with webhook system for real-time connection updates
 * 
 * Flow:
 * 1. User requests to connect accounting platform
 * 2. Service creates Vault session and returns Vault URL
 * 3. User redirected to Apideck Vault to authorize
 * 4. Apideck redirects back with connection established
 * 5. Webhook notifies us of connection status
 */

export interface VaultSessionRequest {
  consumerId: string;
  redirectUri: string;
  consumerMetadata?: {
    account_name?: string;
    user_name?: string;
    image?: string;
  };
  theme?: {
    vault_name?: string;
    primary_color?: string;
    sidepanel_text_color?: string;
  };
}

export interface VaultSessionResponse {
  session_id: string;
  session_token: string;
  consumer: {
    id: string;
    metadata?: Record<string, any>;
  };
  redirect_uri: string;
}

export interface VaultConnection {
  id: string;
  service_id: string;
  consumer_id: string;
  state: 'available' | 'callable' | 'added' | 'authorized' | 'invalid_credentials';
  settings?: Record<string, any>;
  metadata?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export class ApideckVaultService {
  private readonly apideckBaseUrl = 'https://unify.apideck.com';
  private readonly apiKey: string;
  private readonly appId: string;

  constructor() {
    this.apiKey = process.env.APIDECK_API_KEY || '';
    this.appId = process.env.APIDECK_APP_ID || '';

    if (!this.apiKey || !this.appId) {
      console.warn('⚠️ Apideck Vault Service: APIDECK_API_KEY and APIDECK_APP_ID must be set');
    }
  }

  /**
   * Create a Vault session for OAuth flow
   * Architecture: Returns Vault URL that user redirects to for OAuth authorization
   */
  async createSession(request: VaultSessionRequest): Promise<VaultSessionResponse> {
    if (!this.apiKey || !this.appId) {
      throw new Error('Apideck API key and App ID must be configured');
    }

    const url = `${this.apideckBaseUrl}/vault/sessions`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'x-apideck-app-id': this.appId,
        'x-apideck-consumer-id': request.consumerId,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        redirect_uri: request.redirectUri,
        consumer_metadata: request.consumerMetadata || {},
        theme: request.theme || {
          vault_name: 'AI2 Financial',
          primary_color: '#286efa',
          sidepanel_text_color: '#FFFFFF'
        }
      })
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Failed to create Vault session' })) as { message?: string };
      throw new Error(error.message || `Failed to create Vault session: ${response.statusText}`);
    }

    return await response.json() as VaultSessionResponse;
  }

  /**
   * Get Vault URL for a session
   * Architecture: Returns the URL user should be redirected to for OAuth
   */
  getVaultUrl(sessionToken: string): string {
    return `https://vault.apideck.com/session/${sessionToken}`;
  }

  /**
   * Get connection details from Vault
   * Architecture: Fetches connection information after OAuth completion
   */
  async getConnection(
    consumerId: string,
    serviceId: string
  ): Promise<VaultConnection | null> {
    if (!this.apiKey || !this.appId) {
      throw new Error('Apideck API key and App ID must be configured');
    }

    const url = `${this.apideckBaseUrl}/vault/connections`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'x-apideck-app-id': this.appId,
        'x-apideck-consumer-id': consumerId
      }
    });

    if (!response.ok) {
      if (response.status === 404) {
        return null;
      }
      const error = await response.json().catch(() => ({ message: 'Failed to get connections' })) as { message?: string };
      throw new Error(error.message || `Failed to get connections: ${response.statusText}`);
    }

    const data = await response.json() as { data?: VaultConnection[] };
    const connections = data.data || [];
    
    // Find connection for the specific service
    const connection = connections.find((conn: VaultConnection) => conn.service_id === serviceId);
    
    return connection || null;
  }

  /**
   * Get all connections for a consumer
   * Architecture: Lists all connected integrations for a user
   */
  async getConnections(consumerId: string): Promise<VaultConnection[]> {
    if (!this.apiKey || !this.appId) {
      throw new Error('Apideck API key and App ID must be configured');
    }

    const url = `${this.apideckBaseUrl}/vault/connections`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'x-apideck-app-id': this.appId,
        'x-apideck-consumer-id': consumerId
      }
    });

    if (!response.ok) {
      if (response.status === 404) {
        return [];
      }
      const error = await response.json().catch(() => ({ message: 'Failed to get connections' })) as { message?: string };
      throw new Error(error.message || `Failed to get connections: ${response.statusText}`);
    }

    const data = await response.json() as { data?: VaultConnection[] };
    return data.data || [];
  }

  /**
   * Delete a connection
   * Architecture: Revokes OAuth connection and removes from Vault
   */
  async deleteConnection(
    consumerId: string,
    connectionId: string
  ): Promise<boolean> {
    if (!this.apiKey || !this.appId) {
      throw new Error('Apideck API key and App ID must be configured');
    }

    const url = `${this.apideckBaseUrl}/vault/connections/${connectionId}`;
    
    const response = await fetch(url, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'x-apideck-app-id': this.appId,
        'x-apideck-consumer-id': consumerId
      }
    });

    if (!response.ok && response.status !== 404) {
      const error = await response.json().catch(() => ({ message: 'Failed to delete connection' })) as { message?: string };
      throw new Error(error.message || `Failed to delete connection: ${response.statusText}`);
    }

    return true;
  }

  /**
   * Verify webhook signature
   * Architecture: Apideck webhook verification (HMAC-SHA256 if configured)
   * Reference: Check Apideck dashboard for webhook signing configuration
   */
  verifyWebhookSignature(
    payload: string,
    signature: string,
    secret: string
  ): boolean {
    // If no secret configured, skip verification (not recommended for production)
    if (!secret || secret === 'your_webhook_secret') {
      if (process.env.NODE_ENV === 'production') {
        console.warn('⚠️ APIDECK_WEBHOOK_SECRET not configured - webhook verification disabled');
        return false; // Block in production if not configured
      }
      return true; // Allow in dev
    }

    try {
      // Apideck typically uses HMAC-SHA256 for webhook signatures
      // Format: signature header contains HMAC-SHA256 hash
      const expectedSignature = crypto
        .createHmac('sha256', secret)
        .update(payload)
        .digest('hex');

      // Timing-safe comparison to prevent timing attacks
      return crypto.timingSafeEqual(
        Buffer.from(signature),
        Buffer.from(expectedSignature)
      );
    } catch (error) {
      console.error('Apideck webhook signature verification error:', error);
      return false;
    }
  }
}

// Singleton instance
export const apideckVaultService = new ApideckVaultService();


// --- 📦 CREDENTIAL MANAGER ---
// embracingearth.space - Secure credential storage and retrieval
// NEVER stores credentials in plain text or commits secrets to repository

import * as crypto from 'crypto';
import { ConnectorCredentials } from '../types/connector';

/**
 * Secure credential encryption key (must be set via environment variable)
 * CRITICAL: Never hardcode this value or commit it to repository
 */
const ENCRYPTION_KEY = process.env.CREDENTIAL_ENCRYPTION_KEY;
const ENCRYPTION_ALGORITHM = 'aes-256-gcm';

/**
 * Credential Manager - handles secure storage and retrieval of connector credentials
 * 
 * Architecture Notes:
 * - Credentials are encrypted before storage
 * - Encryption key must be provided via environment variable
 * - In production, credentials should be stored in secure vault (e.g., AWS Secrets Manager, HashiCorp Vault)
 * - For now, uses file-based storage with encryption (can be extended to use database)
 * 
 * Security Considerations:
 * - All credentials are encrypted at rest
 * - Encryption key is never stored in code
 * - Credentials are never logged (masked in logs)
 * - Supports per-user credential isolation
 */
export class CredentialManager {
  private static instance: CredentialManager;
  private storage: Map<string, string> = new Map(); // In-memory storage (encrypted values)
  // TODO: In production, replace with secure vault (AWS Secrets Manager, HashiCorp Vault, etc.)

  private constructor() {
    // Validate encryption key on initialization
    if (!ENCRYPTION_KEY) {
      console.warn('⚠️  CREDENTIAL_ENCRYPTION_KEY not set. Credentials will not be encrypted.');
      console.warn('⚠️  Set CREDENTIAL_ENCRYPTION_KEY environment variable for production use.');
    } else if (ENCRYPTION_KEY.length < 32) {
      throw new Error('CREDENTIAL_ENCRYPTION_KEY must be at least 32 characters long');
    }
  }

  static getInstance(): CredentialManager {
    if (!CredentialManager.instance) {
      CredentialManager.instance = new CredentialManager();
    }
    return CredentialManager.instance;
  }

  /**
   * Generate encryption key from password (for testing only)
   * In production, use a secure key management system
   */
  private getEncryptionKey(): Buffer {
    if (!ENCRYPTION_KEY) {
      // Fallback for development (NOT SECURE - only for local dev)
      if (process.env.NODE_ENV === 'production') {
        throw new Error('CREDENTIAL_ENCRYPTION_KEY must be set in production');
      }
      console.warn('⚠️  Using insecure default encryption key (development only)');
      return crypto.scryptSync('default-dev-key-not-secure', 'salt', 32);
    }
    return crypto.scryptSync(ENCRYPTION_KEY, 'salt', 32);
  }

  /**
   * Encrypt credentials
   */
  private encrypt(plaintext: string): string {
    if (!ENCRYPTION_KEY && process.env.NODE_ENV === 'production') {
      throw new Error('Encryption key required for credential encryption');
    }

    const key = this.getEncryptionKey();
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(ENCRYPTION_ALGORITHM, key, iv);
    
    let encrypted = cipher.update(plaintext, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const authTag = cipher.getAuthTag();
    
    // Return IV + AuthTag + Encrypted data (all hex encoded)
    return iv.toString('hex') + ':' + authTag.toString('hex') + ':' + encrypted;
  }

  /**
   * Decrypt credentials
   */
  private decrypt(encryptedData: string): string {
    if (!ENCRYPTION_KEY && process.env.NODE_ENV === 'production') {
      throw new Error('Encryption key required for credential decryption');
    }

    const key = this.getEncryptionKey();
    const parts = encryptedData.split(':');
    
    if (parts.length !== 3) {
      throw new Error('Invalid encrypted data format');
    }
    
    const iv = Buffer.from(parts[0], 'hex');
    const authTag = Buffer.from(parts[1], 'hex');
    const encrypted = parts[2];
    
    const decipher = crypto.createDecipheriv(ENCRYPTION_ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);
    
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  }

  /**
   * Store credentials for a connection
   * 
   * @param connectionId - Unique connection ID
   * @param userId - User ID (for isolation)
   * @param credentials - Credentials to store (will be encrypted)
   * 
   * PRODUCTION NOTE: This implementation uses in-memory storage (encrypted).
   * For production, replace with enterprise vault:
   * - Cloudflare Workers: Use Cloudflare Secrets Store (KV namespace)
   * - Fly.io: Use Fly.io secrets or AWS Secrets Manager
   * - AWS: Use AWS Secrets Manager
   * - Multi-cloud: Use HashiCorp Vault
   * 
   * See docs/SECRET_VAULT_INTEGRATION.md for implementation examples
   */
  async storeCredentials(
    connectionId: string,
    userId: string,
    credentials: ConnectorCredentials
  ): Promise<void> {
    const storageKey = `${userId}:${connectionId}`;
    const plaintext = JSON.stringify(credentials);
    
    // Encrypt credentials
    const encrypted = this.encrypt(plaintext);
    
    // Store encrypted value (in-memory - replace with vault in production)
    this.storage.set(storageKey, encrypted);
    
    // PRODUCTION: Replace with vault integration
    // Cloudflare: await secretsStore.put(storageKey, encrypted);
    // AWS: await secretsManager.putSecretValue({ SecretId: storageKey, SecretString: encrypted });
    // Vault: await vault.write(`secret/data/${storageKey}`, { data: credentials });
  }

  /**
   * Retrieve credentials for a connection
   * 
   * @param connectionId - Connection ID
   * @param userId - User ID (for isolation)
   * @returns Decrypted credentials
   */
  async getCredentials(
    connectionId: string,
    userId: string
  ): Promise<ConnectorCredentials> {
    const storageKey = `${userId}:${connectionId}`;
    const encrypted = this.storage.get(storageKey);
    
    if (!encrypted) {
      throw new Error(`Credentials not found for connection: ${connectionId}`);
    }
    
    // Decrypt credentials
    const plaintext = this.decrypt(encrypted);
    return JSON.parse(plaintext) as ConnectorCredentials;
  }

  /**
   * Delete credentials for a connection
   * 
   * PRODUCTION: Replace with vault deletion:
   * - Cloudflare: await secretsStore.delete(storageKey);
   * - AWS: await secretsManager.deleteSecret({ SecretId: storageKey });
   * - Vault: await vault.delete(`secret/data/${storageKey}`);
   */
  async deleteCredentials(connectionId: string, userId: string): Promise<void> {
    const storageKey = `${userId}:${connectionId}`;
    this.storage.delete(storageKey);
    
    // PRODUCTION: Delete from vault instead
  }

  /**
   * Mask sensitive credential fields for logging
   */
  maskCredentials(credentials: ConnectorCredentials): Record<string, any> {
    const masked: Record<string, any> = {};
    const sensitiveFields = ['password', 'secret', 'token', 'key', 'apiKey', 'accessToken', 'refreshToken'];
    
    for (const [key, value] of Object.entries(credentials)) {
      if (sensitiveFields.some(field => key.toLowerCase().includes(field.toLowerCase()))) {
        masked[key] = '***MASKED***';
      } else {
        masked[key] = value;
      }
    }
    
    return masked;
  }

  /**
   * Validate credential structure (basic validation)
   */
  validateCredentials(credentials: ConnectorCredentials, requiredFields: string[]): void {
    const missingFields: string[] = [];
    
    for (const field of requiredFields) {
      if (!(field in credentials) || !credentials[field]) {
        missingFields.push(field);
      }
    }
    
    if (missingFields.length > 0) {
      throw new Error(`Missing required credential fields: ${missingFields.join(', ')}`);
    }
  }
}

/**
 * Global credential manager instance
 */
export const credentialManager = CredentialManager.getInstance();


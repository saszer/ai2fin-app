# 🔐 Enterprise Secret Vault Integration Guide

## Overview

This guide explains how to integrate enterprise secret vault solutions with the AI2 Connectors CredentialManager. The framework currently uses in-memory encrypted storage, but should be upgraded to use a proper secret vault for production.

## Recommended Solutions

### 🌐 Cloudflare Secrets Store (Recommended for Cloudflare Workers)

**Best for:** Applications deployed on Cloudflare Workers

**Features:**
- ✅ Account-level secrets management
- ✅ Encrypted storage across all Cloudflare data centers
- ✅ Integrated with Cloudflare Workers
- ✅ Role-based access control (RBAC)
- ✅ Audit logs
- ✅ No infrastructure management

**Implementation:**

```typescript
// src/core/CredentialManager.cloudflare.ts
import { ConnectorCredentials } from '../types/connector';

export class CloudflareCredentialManager {
  private secretsStore: KVNamespace; // Bind to Cloudflare Secrets Store KV namespace
  
  constructor(secretsStore: KVNamespace) {
    this.secretsStore = secretsStore;
  }

  async storeCredentials(
    connectionId: string,
    userId: string,
    credentials: ConnectorCredentials
  ): Promise<void> {
    const storageKey = `connectors:${userId}:${connectionId}`;
    
    // Cloudflare KV stores strings, so we JSON stringify
    // Cloudflare KV automatically encrypts at rest
    await this.secretsStore.put(storageKey, JSON.stringify(credentials), {
      expirationTtl: 31536000, // 1 year TTL (optional)
      metadata: {
        userId,
        connectionId,
        createdAt: new Date().toISOString()
      }
    });
  }

  async getCredentials(
    connectionId: string,
    userId: string
  ): Promise<ConnectorCredentials> {
    const storageKey = `connectors:${userId}:${connectionId}`;
    const encrypted = await this.secretsStore.get(storageKey);
    
    if (!encrypted) {
      throw new Error(`Credentials not found for connection: ${connectionId}`);
    }
    
    return JSON.parse(encrypted) as ConnectorCredentials;
  }

  async deleteCredentials(connectionId: string, userId: string): Promise<void> {
    const storageKey = `connectors:${userId}:${connectionId}`;
    await this.secretsStore.delete(storageKey);
  }
}
```

**Setup in `wrangler.toml`:**
```toml
name = "ai2-connectors"
compatibility_date = "2024-01-01"

[[kv_namespaces]]
binding = "SECRETS_STORE"
id = "your-kv-namespace-id"
preview_id = "your-preview-kv-namespace-id"

# Or use Cloudflare Secrets Store (newer)
# Bind to Secrets Store via Workers dashboard or API
```

**Using Cloudflare Secrets Store (Recommended):**
```bash
# Create secret via Wrangler CLI
npx wrangler secrets-store secret create <STORE_ID> \
  --name "connectors:user123:conn456" \
  --value '{"apiKey":"...","secret":"..."}' \
  --scopes workers

# Or via Cloudflare Dashboard:
# 1. Go to Workers & Pages → Secrets Store
# 2. Create new secret
# 3. Bind to your Worker
```

### ✈️ Fly.io Secrets (Recommended for Fly.io)

**Best for:** Applications deployed on Fly.io

**Features:**
- ✅ Built-in secret management via `fly secrets`
- ✅ Environment variables encrypted at rest
- ✅ Automatic secret rotation
- ✅ Per-app secret isolation
- ✅ No additional cost

**Implementation:**

```typescript
// For Fly.io, credentials are stored as encrypted environment variables
// Fly.io automatically injects secrets as env vars at runtime

export class FlyIOCredentialManager {
  // Fly.io doesn't have a dedicated secrets API
  // Instead, use environment variables per connection
  // Or integrate with external vault (see below)

  async storeCredentials(
    connectionId: string,
    userId: string,
    credentials: ConnectorCredentials
  ): Promise<void> {
    // Option 1: Use Fly.io secrets via fly secrets command
    // fly secrets set CONNECTOR_USER123_CONN456='{"apiKey":"...","secret":"..."}'
    
    // Option 2: Integrate with external vault (AWS, HashiCorp, etc.)
    // See AWS Secrets Manager integration below
    
    // Option 3: Use Fly.io Postgres + encryption
    // Store encrypted credentials in database
    throw new Error('Use external vault or Fly.io secrets command');
  }

  async getCredentials(
    connectionId: string,
    userId: string
  ): Promise<ConnectorCredentials> {
    // Fly.io secrets are available as environment variables
    const secretKey = `CONNECTOR_${userId}_${connectionId}`;
    const encrypted = process.env[secretKey];
    
    if (!encrypted) {
      throw new Error(`Credentials not found for connection: ${connectionId}`);
    }
    
    // Decrypt if needed (Fly.io stores as plain env vars)
    // In production, always encrypt before storing
    return JSON.parse(encrypted) as ConnectorCredentials;
  }
}
```

**Fly.io Setup:**
```bash
# Set secrets via CLI
fly secrets set CONNECTOR_USER123_CONN456='{"apiKey":"sk_123","secret":"sec_456"}'

# Or use Fly.io Postgres + application-level encryption
# Store encrypted credentials in database table
```

### ☁️ AWS Secrets Manager (Recommended for AWS/Production)

**Best for:** Production deployments on AWS or hybrid cloud

**Features:**
- ✅ Automatic secret rotation
- ✅ Fine-grained access control (IAM)
- ✅ Audit logging (CloudTrail)
- ✅ Cross-region replication
- ✅ Integration with Lambda, ECS, etc.

**Implementation:**

```typescript
// src/core/CredentialManager.aws.ts
import { SecretsManagerClient, PutSecretValueCommand, GetSecretValueCommand, DeleteSecretCommand } from '@aws-sdk/client-secrets-manager';
import { ConnectorCredentials } from '../types/connector';
import * as crypto from 'crypto';

export class AWSCredentialManager {
  private client: SecretsManagerClient;
  private encryptionKey: Buffer;

  constructor(region: string = 'us-east-1') {
    this.client = new SecretsManagerClient({ region });
    
    // Use encryption key for additional layer of security
    const keyEnv = process.env.CREDENTIAL_ENCRYPTION_KEY;
    if (!keyEnv) {
      throw new Error('CREDENTIAL_ENCRYPTION_KEY must be set');
    }
    this.encryptionKey = crypto.scryptSync(keyEnv, 'salt', 32);
  }

  private encrypt(plaintext: string): string {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv('aes-256-gcm', this.encryptionKey, iv);
    
    let encrypted = cipher.update(plaintext, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    const authTag = cipher.getAuthTag();
    
    return iv.toString('hex') + ':' + authTag.toString('hex') + ':' + encrypted;
  }

  private decrypt(encryptedData: string): string {
    const parts = encryptedData.split(':');
    const iv = Buffer.from(parts[0], 'hex');
    const authTag = Buffer.from(parts[1], 'hex');
    const encrypted = parts[2];
    
    const decipher = crypto.createDecipheriv('aes-256-gcm', this.encryptionKey, iv);
    decipher.setAuthTag(authTag);
    
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  }

  private getSecretName(userId: string, connectionId: string): string {
    return `ai2-connectors/${userId}/${connectionId}`;
  }

  async storeCredentials(
    connectionId: string,
    userId: string,
    credentials: ConnectorCredentials
  ): Promise<void> {
    const secretName = this.getSecretName(userId, connectionId);
    const plaintext = JSON.stringify(credentials);
    
    // Double encryption: AWS encrypts at rest + our encryption
    const encrypted = this.encrypt(plaintext);
    
    try {
      // Try to update existing secret
      await this.client.send(new PutSecretValueCommand({
        SecretId: secretName,
        SecretString: encrypted
      }));
    } catch (error: any) {
      if (error.name === 'ResourceNotFoundException') {
        // Create new secret
        await this.client.send(new PutSecretValueCommand({
          Name: secretName,
          SecretString: encrypted,
          Description: `AI2 Connector credentials for user ${userId}, connection ${connectionId}`,
          Tags: [
            { Key: 'Service', Value: 'ai2-connectors' },
            { Key: 'UserId', Value: userId },
            { Key: 'ConnectionId', Value: connectionId }
          ]
        }));
      } else {
        throw error;
      }
    }
  }

  async getCredentials(
    connectionId: string,
    userId: string
  ): Promise<ConnectorCredentials> {
    const secretName = this.getSecretName(userId, connectionId);
    
    try {
      const response = await this.client.send(new GetSecretValueCommand({
        SecretId: secretName
      }));
      
      if (!response.SecretString) {
        throw new Error(`Credentials not found for connection: ${connectionId}`);
      }
      
      // Decrypt our encryption layer
      const decrypted = this.decrypt(response.SecretString);
      return JSON.parse(decrypted) as ConnectorCredentials;
    } catch (error: any) {
      if (error.name === 'ResourceNotFoundException') {
        throw new Error(`Credentials not found for connection: ${connectionId}`);
      }
      throw error;
    }
  }

  async deleteCredentials(connectionId: string, userId: string): Promise<void> {
    const secretName = this.getSecretName(userId, connectionId);
    
    await this.client.send(new DeleteSecretCommand({
      SecretId: secretName,
      ForceDeleteWithoutRecovery: true // Optional: immediate deletion
    }));
  }
}
```

**AWS Setup:**
```bash
# Install AWS SDK
npm install @aws-sdk/client-secrets-manager

# Set AWS credentials (IAM user with Secrets Manager permissions)
export AWS_ACCESS_KEY_ID=your_access_key
export AWS_SECRET_ACCESS_KEY=your_secret_key
export AWS_REGION=us-east-1

# IAM Policy required:
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "secretsmanager:GetSecretValue",
        "secretsmanager:PutSecretValue",
        "secretsmanager:CreateSecret",
        "secretsmanager:DeleteSecret"
      ],
      "Resource": "arn:aws:secretsmanager:*:*:secret:ai2-connectors/*"
    }
  ]
}
```

### 🏗️ HashiCorp Vault (Recommended for On-Prem/Multi-Cloud)

**Best for:** On-premise deployments, multi-cloud, enterprise organizations

**Features:**
- ✅ Open-source
- ✅ Self-hosted or cloud (HCP Vault)
- ✅ Dynamic secrets
- ✅ Fine-grained policies
- ✅ Detailed audit logs
- ✅ Secret rotation engines

**Implementation:**

```typescript
// src/core/CredentialManager.vault.ts
import { Vault } from 'node-vault';
import { ConnectorCredentials } from '../types/connector';

export class VaultCredentialManager {
  private vault: Vault;

  constructor(vaultAddress: string, vaultToken: string) {
    this.vault = Vault({
      endpoint: vaultAddress,
      token: vaultToken
    });
  }

  private getSecretPath(userId: string, connectionId: string): string {
    return `secret/data/ai2-connectors/${userId}/${connectionId}`;
  }

  async storeCredentials(
    connectionId: string,
    userId: string,
    credentials: ConnectorCredentials
  ): Promise<void> {
    const path = this.getSecretPath(userId, connectionId);
    
    await this.vault.write(path, {
      data: credentials,
      metadata: {
        userId,
        connectionId,
        createdAt: new Date().toISOString()
      }
    });
  }

  async getCredentials(
    connectionId: string,
    userId: string
  ): Promise<ConnectorCredentials> {
    const path = this.getSecretPath(userId, connectionId);
    
    try {
      const response = await this.vault.read(path);
      return response.data.data as ConnectorCredentials;
    } catch (error: any) {
      if (error.response?.statusCode === 404) {
        throw new Error(`Credentials not found for connection: ${connectionId}`);
      }
      throw error;
    }
  }

  async deleteCredentials(connectionId: string, userId: string): Promise<void> {
    const path = this.getSecretPath(userId, connectionId);
    await this.vault.delete(path);
  }
}
```

**Vault Setup:**
```bash
# Install node-vault
npm install node-vault

# Start Vault (dev mode)
vault server -dev

# Set Vault address and token
export VAULT_ADDR='http://127.0.0.1:8200'
export VAULT_TOKEN='your-vault-token'

# Enable KV secrets engine
vault secrets enable -path=secret kv-v2
```

## Comparison Table

| Solution | Best For | Cost | Features | Ease of Use |
|----------|----------|------|----------|-------------|
| **Cloudflare Secrets Store** | Cloudflare Workers | Free (paid plans) | ✅ Account-level, RBAC, Audit | ⭐⭐⭐⭐⭐ |
| **Fly.io Secrets** | Fly.io apps | Free | ✅ Built-in, Simple | ⭐⭐⭐⭐ |
| **AWS Secrets Manager** | AWS deployments | ~$0.40/secret/month | ✅ Rotation, IAM, Audit | ⭐⭐⭐⭐ |
| **HashiCorp Vault** | Multi-cloud/On-prem | Open-source | ✅ Dynamic secrets, Policies | ⭐⭐⭐ |
| **Azure Key Vault** | Azure deployments | ~$0.03/10k ops | ✅ RBAC, Audit | ⭐⭐⭐⭐ |
| **Google Secret Manager** | GCP deployments | $0.06/secret/month | ✅ IAM, Audit | ⭐⭐⭐⭐ |

## Implementation Strategy

### Option 1: Update CredentialManager to Support Multiple Vaults

```typescript
// src/core/CredentialManager.factory.ts
import { CredentialManager } from './CredentialManager';
import { CloudflareCredentialManager } from './CredentialManager.cloudflare';
import { AWSCredentialManager } from './CredentialManager.aws';
import { VaultCredentialManager } from './CredentialManager.vault';

export function createCredentialManager(): CredentialManager {
  const vaultType = process.env.VAULT_TYPE || 'memory';
  
  switch (vaultType) {
    case 'cloudflare':
      if (!process.env.CLOUDFLARE_SECRETS_STORE) {
        throw new Error('CLOUDFLARE_SECRETS_STORE not configured');
      }
      return new CloudflareCredentialManager(process.env.CLOUDFLARE_SECRETS_STORE);
    
    case 'aws':
      return new AWSCredentialManager(process.env.AWS_REGION || 'us-east-1');
    
    case 'vault':
      if (!process.env.VAULT_ADDR || !process.env.VAULT_TOKEN) {
        throw new Error('VAULT_ADDR and VAULT_TOKEN must be set');
      }
      return new VaultCredentialManager(process.env.VAULT_ADDR, process.env.VAULT_TOKEN);
    
    case 'memory':
    default:
      // Fallback to in-memory (development only)
      if (process.env.NODE_ENV === 'production') {
        throw new Error('Memory vault not allowed in production. Set VAULT_TYPE.');
      }
      return new CredentialManager();
  }
}
```

### Option 2: Environment-Based Configuration

```bash
# .env.production
VAULT_TYPE=aws
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_key
AWS_SECRET_ACCESS_KEY=your_secret
CREDENTIAL_ENCRYPTION_KEY=your_encryption_key

# .env.cloudflare
VAULT_TYPE=cloudflare
CLOUDFLARE_SECRETS_STORE=your_kv_namespace

# .env.fly
VAULT_TYPE=fly
# Use fly secrets command to set secrets
```

## Migration Guide

### Step 1: Choose Your Vault

Based on your deployment platform:
- **Cloudflare Workers** → Cloudflare Secrets Store
- **Fly.io** → Fly.io Secrets or AWS Secrets Manager
- **AWS** → AWS Secrets Manager
- **Multi-cloud/Enterprise** → HashiCorp Vault

### Step 2: Update CredentialManager

Replace the in-memory storage with your chosen vault implementation.

### Step 3: Update Environment Variables

Set the appropriate environment variables for your vault.

### Step 4: Test Migration

```typescript
// Test script
const manager = createCredentialManager();
await manager.storeCredentials('test-conn', 'test-user', { apiKey: 'test' });
const creds = await manager.getCredentials('test-conn', 'test-user');
console.log('Migration test:', creds);
```

## Security Best Practices

1. **Always encrypt at application level** - Even if vault encrypts at rest
2. **Use IAM/RBAC** - Restrict access to secrets
3. **Rotate secrets regularly** - Use vault's rotation features
4. **Audit logs** - Monitor all secret access
5. **Least privilege** - Only grant necessary permissions
6. **Separate encryption keys** - Use different keys per environment

## Recommendations

### For Cloudflare Workers:
✅ **Use Cloudflare Secrets Store** - Native integration, zero config

### For Fly.io:
✅ **Use Fly.io Secrets + Database** - Simple, built-in
OR
✅ **Use AWS Secrets Manager** - More features, automatic rotation

### For Production (General):
✅ **AWS Secrets Manager** - Best balance of features and cost
✅ **HashiCorp Vault** - Maximum flexibility and control

---

*For more information, see the main [SECURITY.md](../SECURITY.md) guide.*




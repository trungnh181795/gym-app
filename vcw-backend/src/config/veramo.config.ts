import { createAgent, IResolver, IKeyManager, IDIDManager, ICredentialPlugin } from '@veramo/core';
import { CredentialPlugin } from '@veramo/credential-w3c';
import { DIDManager } from '@veramo/did-manager';
import { KeyManager } from '@veramo/key-manager';
import { DIDResolverPlugin } from '@veramo/did-resolver';
import { Resolver } from 'did-resolver';
import { getDidKeyResolver } from '@veramo/did-provider-key';
import { KeyManagementSystem, SecretBox } from '@veramo/kms-local';
import { KeyDIDProvider } from '@veramo/did-provider-key';
import { DataSource } from 'typeorm';
import { Entities, KeyStore, DIDStore, PrivateKeyStore, migrations } from '@veramo/data-store';
import path from 'path';
import fs from 'fs';

// Database configuration
// Generate a 32-byte hex key for encryption (64 hex characters)
const DB_ENCRYPTION_KEY = process.env.VERAMO_DB_ENCRYPTION_KEY || 
  '29739248cad1bd1a0fc4d9b75cd4d2990de535baf5caadfdf8d8f86664aa830c';

// Ensure storage directory exists
const STORAGE_DIR = path.join(__dirname, '../../storage');
if (!fs.existsSync(STORAGE_DIR)) {
  fs.mkdirSync(STORAGE_DIR, { recursive: true });
}

const DB_PATH = path.join(STORAGE_DIR, 'veramo.sqlite');

// Initialize database
export const dbConnection = new DataSource({
  type: 'sqlite',
  database: DB_PATH,
  synchronize: false,
  migrations,
  migrationsRun: true,
  logging: ['error', 'info', 'warn'],
  entities: Entities,
}).initialize();

// Create Veramo agent
export const agent = createAgent<
  IDIDManager & IKeyManager & IResolver & ICredentialPlugin
>({
  plugins: [
    // Key Management
    new KeyManager({
      store: new KeyStore(dbConnection),
      kms: {
        local: new KeyManagementSystem(new PrivateKeyStore(dbConnection, new SecretBox(DB_ENCRYPTION_KEY))),
      },
    }),

    // DID Management
    new DIDManager({
      store: new DIDStore(dbConnection),
      defaultProvider: 'did:key',
      providers: {
        'did:key': new KeyDIDProvider({
          defaultKms: 'local',
        }),
      },
    }),

    // DID Resolver
    new DIDResolverPlugin({
      resolver: new Resolver({
        ...getDidKeyResolver(),
      }),
    }),

    // Credential Plugin for W3C Verifiable Credentials
    new CredentialPlugin(),
  ],
});

/**
 * Initialize or get the issuer DID
 * This will create a new DID if one doesn't exist with the alias 'gym-issuer'
 */
export async function getOrCreateIssuerDID() {
  try {
    // Try to get existing issuer
    const identifiers = await agent.didManagerFind({
      alias: 'gym-issuer',
    });

    if (identifiers && identifiers.length > 0) {
      console.log('Using existing issuer DID:', identifiers[0].did);
      return identifiers[0];
    }

    // Create new issuer DID
    console.log('Creating new issuer DID...');
    const identifier = await agent.didManagerCreate({
      alias: 'gym-issuer',
      provider: 'did:key',
      kms: 'local',
    });

    console.log('Created new issuer DID:', identifier.did);
    return identifier;
  } catch (error) {
    console.error('Error getting/creating issuer DID:', error);
    throw error;
  }
}

/**
 * Get or create a DID for a user
 */
export async function getOrCreateUserDID(userId: string) {
  try {
    const alias = `user-${userId}`;
    
    // Try to get existing user DID
    const identifiers = await agent.didManagerFind({
      alias,
    });

    if (identifiers && identifiers.length > 0) {
      return identifiers[0];
    }

    // Create new user DID
    const identifier = await agent.didManagerCreate({
      alias,
      provider: 'did:key',
      kms: 'local',
    });

    console.log(`Created new user DID for ${userId}:`, identifier.did);
    return identifier;
  } catch (error) {
    console.error('Error getting/creating user DID:', error);
    throw error;
  }
}

export default agent;

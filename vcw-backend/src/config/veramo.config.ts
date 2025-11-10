import { createAgent, IResolver, IKeyManager, IDIDManager, ICredentialPlugin, TAgent } from '@veramo/core';
import { CredentialPlugin } from '@veramo/credential-w3c';
import { DIDManager } from '@veramo/did-manager';
import { KeyManager } from '@veramo/key-manager';
import { DIDResolverPlugin } from '@veramo/did-resolver';
import { Resolver } from 'did-resolver';
import { getDidKeyResolver } from '@veramo/did-provider-key';
import { KeyManagementSystem, SecretBox } from '@veramo/kms-local';
import { KeyDIDProvider } from '@veramo/did-provider-key';
import { KeyStore, DIDStore, PrivateKeyStore } from '@veramo/data-store';
import { getDataSource, DB_ENCRYPTION_KEY } from './database.config';

// Export database connection for other modules
export { getDataSource } from './database.config';

// Singleton agent instance
let agentInstance: TAgent<IDIDManager & IKeyManager & IResolver & ICredentialPlugin> | null = null;
let agentInitPromise: Promise<TAgent<IDIDManager & IKeyManager & IResolver & ICredentialPlugin>> | null = null;

/**
 * Get or create the Veramo agent
 * This ensures the database is initialized before creating the agent
 */
export async function getAgent(): Promise<TAgent<IDIDManager & IKeyManager & IResolver & ICredentialPlugin>> {
  if (agentInstance) {
    return agentInstance;
  }

  if (agentInitPromise) {
    console.log('⏳ Veramo agent initialization already in progress, waiting...');
    return agentInitPromise;
  }

  console.log('🔄 Starting Veramo agent initialization...');
  agentInitPromise = (async () => {
    // Ensure database is initialized first
    const dataSource = await getDataSource();

    // Create Veramo agent with the initialized DataSource
    agentInstance = createAgent<IDIDManager & IKeyManager & IResolver & ICredentialPlugin>({
      plugins: [
        // Key Management
        new KeyManager({
          store: new KeyStore(dataSource),
          kms: {
            local: new KeyManagementSystem(new PrivateKeyStore(dataSource, new SecretBox(DB_ENCRYPTION_KEY))),
          },
        }),

        // DID Management
        new DIDManager({
          store: new DIDStore(dataSource),
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

    console.log('✅ Veramo agent initialized successfully');
    return agentInstance;
  })();

  try {
    const result = await agentInitPromise;
    agentInitPromise = null;
    return result;
  } catch (error) {
    agentInitPromise = null;
    throw error;
  }
}

/**
 * Initialize or get the issuer DID
 * This will create a new DID if one doesn't exist with the alias 'gym-issuer'
 */
export async function getOrCreateIssuerDID() {
  try {
    const agent = await getAgent();
    
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
    const agent = await getAgent();
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

export default getAgent;

import { DataSource } from 'typeorm';
import { Entities } from '@veramo/data-store';
import path from 'path';
import fs from 'fs';
import { 
  User, 
  Service, 
  Benefit, 
  Membership, 
  StoredCredential, 
  CredentialToken 
} from '../entities';

// Database configuration
// Generate a 32-byte hex key for encryption (64 hex characters)
export const DB_ENCRYPTION_KEY = process.env.VERAMO_DB_ENCRYPTION_KEY || 
  '29739248cad1bd1a0fc4d9b75cd4d2990de535baf5caadfdf8d8f86664aa830c';

// Ensure storage directory exists
const STORAGE_DIR = path.join(__dirname, '../../storage');
if (!fs.existsSync(STORAGE_DIR)) {
  fs.mkdirSync(STORAGE_DIR, { recursive: true });
}

const DB_PATH = path.join(STORAGE_DIR, 'veramo.sqlite');

// Singleton DataSource - combines Veramo entities with application entities
let dataSourceInstance: DataSource | null = null;
let initPromise: Promise<DataSource> | null = null;

/**
 * Get or initialize the singleton DataSource
 * This combines Veramo entities (for DIDs, keys) with application entities
 */
export async function getDataSource(): Promise<DataSource> {
  // If already initialized, return immediately
  if (dataSourceInstance && dataSourceInstance.isInitialized) {
    return dataSourceInstance;
  }

  // If initialization is in progress, wait for it
  if (initPromise) {
    console.log('⏳ Database initialization already in progress, waiting...');
    return initPromise;
  }

  // Start new initialization
  console.log('🔄 Starting database initialization...');
  initPromise = (async () => {
    if (!dataSourceInstance) {
      dataSourceInstance = new DataSource({
        type: 'sqlite',
        database: DB_PATH,
        synchronize: true, // Auto-create tables in development
        logging: ['error', 'warn'],
        entities: [
          ...Entities, // Veramo entities (identifier, key, private-key, etc.)
          User,
          Service,
          Benefit,
          Membership,
          StoredCredential,
          CredentialToken,
        ],
      });
    }

    if (!dataSourceInstance.isInitialized) {
      await dataSourceInstance.initialize();
      console.log('✅ Database initialized successfully');
    }

    return dataSourceInstance;
  })();

  try {
    const result = await initPromise;
    initPromise = null; // Clear promise after successful initialization
    return result;
  } catch (error) {
    initPromise = null; // Clear promise on error so it can be retried
    throw error;
  }
}

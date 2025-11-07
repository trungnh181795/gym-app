import fs from 'fs';
import path from 'path';
import { StoredCredential, PaginationInfo } from '../types';

interface StorageStats {
  totalCredentials: number;
  storageLocation: string;
  lastModified: string | null;
  fileSizeBytes?: number;
}

interface PaginatedResult {
  credentials: StoredCredential[];
  pagination: PaginationInfo;
}

export class StorageService {
  private storageDir: string;
  private credentialsFile: string;
  private credentials: Map<string, StoredCredential>;

  constructor() {
    this.storageDir = './storage';
    this.credentialsFile = path.join(this.storageDir, 'credentials.json');
    this.credentials = new Map<string, StoredCredential>();
    this.init();
  }

  private init(): void {
    try {
      if (!fs.existsSync(this.storageDir)) {
        fs.mkdirSync(this.storageDir, { recursive: true });
        console.log('Storage directory created');
      }

      this.loadCredentials();
      console.log(`Storage service initialized with ${this.credentials.size} credentials`);
    } catch (error) {
      console.error('Error initializing storage service:', error);
      throw error;
    }
  }

  private loadCredentials(): void {
    try {
      if (fs.existsSync(this.credentialsFile)) {
        const data = fs.readFileSync(this.credentialsFile, 'utf8');
        const credentialsArray: [string, StoredCredential][] = JSON.parse(data);
        
        this.credentials = new Map(credentialsArray);
        console.log(`Loaded ${this.credentials.size} credentials from file`);
      } else {
        this.saveCredentials();
        console.log('Created new credentials file');
      }
    } catch (error) {
      console.error('Error loading credentials:', error);
      this.credentials = new Map();
      this.saveCredentials();
    }
  }

  private saveCredentials(): void {
    try {
      const credentialsArray = Array.from(this.credentials.entries());
      fs.writeFileSync(this.credentialsFile, JSON.stringify(credentialsArray, null, 2));
    } catch (error) {
      console.error('Error saving credentials:', error);
      throw error;
    }
  }

  public createCredential(id: string, credential: Omit<StoredCredential, 'createdAt' | 'updatedAt'>): StoredCredential {
    try {
      if (this.credentials.has(id)) {
        throw new Error(`Credential with ID ${id} already exists`);
      }

      // Add timestamp
      const credentialWithMetadata: StoredCredential = {
        ...credential,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      this.credentials.set(id, credentialWithMetadata);
      this.saveCredentials();
      
      console.log(`Credential ${id} created successfully`);
      return credentialWithMetadata;
    } catch (error) {
      console.error('Error creating credential:', error);
      throw error;
    }
  }

  public readCredential(id: string): StoredCredential | null {
    try {
      return this.credentials.get(id) || null;
    } catch (error) {
      console.error('Error reading credential:', error);
      throw error;
    }
  }

  public readAllCredentials(): StoredCredential[] {
    try {
      return Array.from(this.credentials.values());
    } catch (error) {
      console.error('Error reading all credentials:', error);
      throw error;
    }
  }

  public readCredentialsPaginated(page: number = 1, limit: number = 10): PaginatedResult {
    try {
      const allCredentials = this.readAllCredentials();
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      
      return {
        credentials: allCredentials.slice(startIndex, endIndex),
        pagination: {
          page,
          limit,
          total: allCredentials.length,
          totalPages: Math.ceil(allCredentials.length / limit)
        }
      };
    } catch (error) {
      console.error('Error reading paginated credentials:', error);
      throw error;
    }
  }

  public updateCredential(id: string, updatedCredential: Partial<StoredCredential>): boolean {
    try {
      if (!this.credentials.has(id)) {
        return false; // Credential doesn't exist
      }

      const existingCredential = this.credentials.get(id)!;
      const mergedCredential: StoredCredential = {
        ...existingCredential,
        ...updatedCredential,
        updatedAt: new Date().toISOString()
      };

      this.credentials.set(id, mergedCredential);
      this.saveCredentials();
      
      console.log(`Credential ${id} updated successfully`);
      return true;
    } catch (error) {
      console.error('Error updating credential:', error);
      throw error;
    }
  }

  public deleteCredential(id: string): boolean {
    try {
      if (!this.credentials.has(id)) {
        return false; // Credential doesn't exist
      }

      this.credentials.delete(id);
      this.saveCredentials();
      
      console.log(`Credential ${id} deleted successfully`);
      return true;
    } catch (error) {
      console.error('Error deleting credential:', error);
      throw error;
    }
  }

  public credentialExists(id: string): boolean {
    return this.credentials.has(id);
  }

  public getCredentialCount(): number {
    return this.credentials.size;
  }

  public searchCredentials(searchTerm: string): StoredCredential[] {
    try {
      const allCredentials = this.readAllCredentials();
      const searchLower = searchTerm.toLowerCase();
      
      return allCredentials.filter(credential => {
        // Search in credential subject properties
        const subjectStr = JSON.stringify(credential.credential?.credentialSubject || {}).toLowerCase();
        const typeStr = JSON.stringify(credential.credential?.type || []).toLowerCase();
        const issuerStr = (credential.credential?.issuer || '').toLowerCase();
        const metadataStr = JSON.stringify(credential.metadata || {}).toLowerCase();
        
        return subjectStr.includes(searchLower) || 
               typeStr.includes(searchLower) || 
               issuerStr.includes(searchLower) ||
               metadataStr.includes(searchLower);
      });
    } catch (error) {
      console.error('Error searching credentials:', error);
      throw error;
    }
  }

  public getStorageStats(): StorageStats {
    try {
      const stats: StorageStats = {
        totalCredentials: this.getCredentialCount(),
        storageLocation: this.credentialsFile,
        lastModified: null
      };

      if (fs.existsSync(this.credentialsFile)) {
        const fileStats = fs.statSync(this.credentialsFile);
        stats.lastModified = fileStats.mtime.toISOString();
        stats.fileSizeBytes = fileStats.size;
      }

      return stats;
    } catch (error) {
      console.error('Error getting storage stats:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const storageService = new StorageService();
export default storageService;
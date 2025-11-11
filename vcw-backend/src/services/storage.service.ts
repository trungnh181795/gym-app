import { Repository, Like } from 'typeorm';
import { getDataSource } from '../config/database.config';
import { StoredCredential as StoredCredentialEntity } from '../entities';
import { StoredCredential, PaginationInfo } from '../types';

interface StorageStats {
  totalCredentials: number;
  storageLocation: string;
  lastModified: string | null;
}

interface PaginatedResult {
  credentials: StoredCredential[];
  pagination: PaginationInfo;
}

export class StorageService {
  private credentialRepository: Repository<StoredCredentialEntity> | null = null;
  private initPromise: Promise<void> | null = null;

  private async ensureInitialized(): Promise<void> {
    if (this.credentialRepository) {
      return;
    }

    if (this.initPromise) {
      return this.initPromise;
    }

    this.initPromise = (async () => {
      try {
        const dataSource = await getDataSource();
        this.credentialRepository = dataSource.getRepository(StoredCredentialEntity);
        const count = await this.credentialRepository!.count();
        this.initPromise = null;
      } catch (error) {
        this.initPromise = null;
        throw error;
      }
    })();

    return this.initPromise;
  }

  private entityToType(entity: StoredCredentialEntity): StoredCredential {
    return {
      id: entity.id,
      credential: JSON.parse(entity.credential),
      jwt: entity.jwt,
      holderDid: entity.holderDid,
      benefitId: entity.benefitId || '',
      membershipId: entity.membershipId || '',
      status: entity.status,
      expireDate: entity.expireDate?.toISOString() || '',
      metadata: entity.metadata ? JSON.parse(entity.metadata) : undefined,
      createdAt: entity.createdAt.toISOString(),
      updatedAt: entity.updatedAt.toISOString()
    };
  }

  public async createCredential(id: string, credential: Omit<StoredCredential, 'createdAt' | 'updatedAt'>): Promise<StoredCredential> {
    try {
      await this.ensureInitialized();
      
      const existing = await this.credentialRepository!.findOne({ where: { id } });
      if (existing) {
        throw new Error(`Credential with ID ${id} already exists`);
      }

      const newCredential = this.credentialRepository!.create({
        id,
        credential: JSON.stringify(credential.credential),
        jwt: credential.jwt,
        holderDid: credential.holderDid,
        benefitId: credential.benefitId || undefined,
        membershipId: credential.membershipId || undefined,
        status: credential.status,
        expireDate: credential.expireDate ? new Date(credential.expireDate) : undefined,
        metadata: credential.metadata ? JSON.stringify(credential.metadata) : undefined,
      });

      await this.credentialRepository!.save(newCredential);
      
      return this.entityToType(newCredential);
    } catch (error) {
      console.error('Error creating credential:', error);
      throw error;
    }
  }

  public async readCredential(id: string): Promise<StoredCredential | null> {
    try {
      await this.ensureInitialized();
      
      const credential = await this.credentialRepository!.findOne({ where: { id } });
      return credential ? this.entityToType(credential) : null;
    } catch (error) {
      console.error('Error reading credential:', error);
      throw error;
    }
  }

  public async readAllCredentials(): Promise<StoredCredential[]> {
    try {
      await this.ensureInitialized();
      
      const credentials = await this.credentialRepository!.find();
      return credentials.map(c => this.entityToType(c));
    } catch (error) {
      console.error('Error reading all credentials:', error);
      throw error;
    }
  }

  public async readCredentialsPaginated(page: number = 1, limit: number = 10): Promise<PaginatedResult> {
    try {
      await this.ensureInitialized();
      
      const skip = (page - 1) * limit;
      const [credentials, total] = await this.credentialRepository!.findAndCount({
        skip,
        take: limit,
        order: { createdAt: 'DESC' }
      });
      
      return {
        credentials: credentials.map(c => this.entityToType(c)),
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      console.error('Error reading paginated credentials:', error);
      throw error;
    }
  }

  public async updateCredential(id: string, updatedCredential: Partial<StoredCredential>): Promise<boolean> {
    try {
      await this.ensureInitialized();
      
      const credential = await this.credentialRepository!.findOne({ where: { id } });
      if (!credential) {
        return false;
      }

      if (updatedCredential.credential !== undefined) {
        credential.credential = JSON.stringify(updatedCredential.credential);
      }
      if (updatedCredential.jwt !== undefined) credential.jwt = updatedCredential.jwt;
      if (updatedCredential.holderDid !== undefined) credential.holderDid = updatedCredential.holderDid;
      if (updatedCredential.benefitId !== undefined) credential.benefitId = updatedCredential.benefitId || undefined;
      if (updatedCredential.membershipId !== undefined) credential.membershipId = updatedCredential.membershipId || undefined;
      if (updatedCredential.status !== undefined) credential.status = updatedCredential.status;
      if (updatedCredential.expireDate !== undefined) {
        credential.expireDate = updatedCredential.expireDate ? new Date(updatedCredential.expireDate) : undefined;
      }
      if (updatedCredential.metadata !== undefined) {
        credential.metadata = updatedCredential.metadata ? JSON.stringify(updatedCredential.metadata) : undefined;
      }

      await this.credentialRepository!.save(credential);
      return true;
    } catch (error) {
      console.error('Error updating credential:', error);
      throw error;
    }
  }

  public async deleteCredential(id: string): Promise<boolean> {
    try {
      await this.ensureInitialized();
      
      const result = await this.credentialRepository!.delete(id);
      const deleted = (result.affected ?? 0) > 0;
      
      return deleted;
    } catch (error) {
      console.error('Error deleting credential:', error);
      throw error;
    }
  }

  public async credentialExists(id: string): Promise<boolean> {
    try {
      await this.ensureInitialized();
      
      const count = await this.credentialRepository!.count({ where: { id } });
      return count > 0;
    } catch (error) {
      console.error('Error checking credential existence:', error);
      throw error;
    }
  }

  public async getCredentialCount(): Promise<number> {
    try {
      await this.ensureInitialized();
      
      return await this.credentialRepository!.count();
    } catch (error) {
      console.error('Error getting credential count:', error);
      throw error;
    }
  }

  public async searchCredentials(searchTerm: string): Promise<StoredCredential[]> {
    try {
      await this.ensureInitialized();
      
      const credentials = await this.credentialRepository!.find();
      const searchLower = searchTerm.toLowerCase();
      
      return credentials
        .filter(credential => {
          const credentialStr = credential.credential.toLowerCase();
          const holderDidStr = credential.holderDid.toLowerCase();
          const metadataStr = (credential.metadata || '').toLowerCase();
          
          return credentialStr.includes(searchLower) || 
                 holderDidStr.includes(searchLower) ||
                 metadataStr.includes(searchLower);
        })
        .map(c => this.entityToType(c));
    } catch (error) {
      console.error('Error searching credentials:', error);
      throw error;
    }
  }

  public async getStorageStats(): Promise<StorageStats> {
    try {
      await this.ensureInitialized();
      
      const count = await this.credentialRepository!.count();
      const latest = await this.credentialRepository!.findOne({
        order: { updatedAt: 'DESC' }
      });

      return {
        totalCredentials: count,
        storageLocation: 'SQLite Database',
        lastModified: latest?.updatedAt.toISOString() || null
      };
    } catch (error) {
      console.error('Error getting storage stats:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const storageService = new StorageService();
export default storageService;
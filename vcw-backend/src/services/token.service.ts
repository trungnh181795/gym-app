import { v4 as uuidv4 } from 'uuid';
import { Repository, LessThan } from 'typeorm';
import crypto from 'crypto';
import { CredentialToken } from '../entities/CredentialToken.entity';
import { getDataSource } from '../config/database.config';
import { veramoCredentialsService } from './veramo-credentials.service';

interface CredentialTokenData {
  token: string;
  credentials: any[];
  createdAt: string;
  expiresAt: string;
}

export class TokenService {
  private tokenRepository: Repository<CredentialToken> | null = null;
  private initPromise: Promise<void> | null = null;
  private readonly TOKEN_VALIDITY_MINUTES = 60; // Tokens valid for 60 minutes

  private async ensureInitialized(): Promise<void> {
    if (this.tokenRepository) {
      return;
    }

    if (this.initPromise) {
      return this.initPromise;
    }

    this.initPromise = (async () => {
      try {
        const dataSource = await getDataSource();
        this.tokenRepository = dataSource.getRepository(CredentialToken);
      } catch (error) {
        console.error('Error initializing token service:', error);
        throw error;
      }
    })();

    return this.initPromise;
  }

  // Generate a short, secure token
  private generateToken(): string {
    // Generate a shorter token (16 characters) instead of full UUID
    return crypto.randomBytes(8).toString('hex');
  }

  // Create a token for credentials
  public async createCredentialToken(credentials: any[], permanent: boolean = false): Promise<string> {
    try {
      await this.ensureInitialized();

      const token = this.generateToken();
      const now = new Date();
      // For permanent tokens, set expiration to 100 years in the future
      const expiresAt = permanent 
        ? new Date(now.getTime() + 100 * 365 * 24 * 60 * 60 * 1000) 
        : new Date(now.getTime() + this.TOKEN_VALIDITY_MINUTES * 60 * 1000);

      // Store credentials as JSON string in a single credential reference
      // For now, we'll store the first credential ID or a combined reference
      const credentialId = Array.isArray(credentials) && credentials.length > 0
        ? credentials[0].id || uuidv4()
        : uuidv4();

      const credentialToken = this.tokenRepository!.create({
        id: uuidv4(),
        token,
        credentialId,
        expiresAt,
        used: false
      });

      await this.tokenRepository!.save(credentialToken);
      return token;
    } catch (error) {
      console.error('Error creating credential token:', error);
      throw new Error(`Failed to create credential token: ${(error as Error).message}`);
    }
  }

  // Get credentials by token
  public async getCredentialsByToken(token: string): Promise<any[] | null> {
    try {
      await this.ensureInitialized();

      const credentialToken = await this.tokenRepository!.findOne({ 
        where: { token } 
      });

      if (!credentialToken) {
        return null;
      }

      // Check if token has expired
      const now = new Date();
      if (now > credentialToken.expiresAt) {
        return null;
      }

      // Check if token was already used
      if (credentialToken.used) {
        return null;
      }

      // Fetch the full credential from SQLite database
      const credential = await veramoCredentialsService.getCredential(credentialToken.credentialId);
      
      if (!credential) {
        console.error('Credential not found for ID:', credentialToken.credentialId);
        return null;
      }

      // Return the full credential wrapped in an array
      return [credential];
    } catch (error) {
      console.error('Error getting credentials by token:', error);
      throw new Error(`Failed to get credentials by token: ${(error as Error).message}`);
    }
  }

  // Mark token as used
  public async markTokenAsUsed(token: string): Promise<boolean> {
    try {
      await this.ensureInitialized();

      const credentialToken = await this.tokenRepository!.findOne({ 
        where: { token } 
      });

      if (!credentialToken) {
        return false;
      }

      credentialToken.used = true;
      await this.tokenRepository!.save(credentialToken);
      return true;
    } catch (error) {
      console.error('Error marking token as used:', error);
      throw new Error(`Failed to mark token as used: ${(error as Error).message}`);
    }
  }

  // Clean up expired tokens (can be called periodically)
  public async cleanupExpiredTokens(): Promise<number> {
    try {
      await this.ensureInitialized();

      const now = new Date();
      const result = await this.tokenRepository!.delete({
        expiresAt: LessThan(now)
      });

      return result.affected || 0;
    } catch (error) {
      console.error('Error cleaning up expired tokens:', error);
      throw new Error(`Failed to cleanup expired tokens: ${(error as Error).message}`);
    }
  }

  // Revoke a specific token
  public async revokeToken(token: string): Promise<boolean> {
    try {
      await this.ensureInitialized();

      const result = await this.tokenRepository!.delete({ token });
      return (result.affected || 0) > 0;
    } catch (error) {
      console.error('Error revoking token:', error);
      throw new Error(`Failed to revoke token: ${(error as Error).message}`);
    }
  }
}

export const tokenService = new TokenService();

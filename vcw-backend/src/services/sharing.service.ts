import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import path from 'path';
import { ShareableCredential, CreateShareRequest, ShareResponse } from '../types';
import { credentialsService } from './credentials.service';

export class SharingService {
  private sharesFilePath: string;
  private baseUrl: string;

  constructor() {
    this.sharesFilePath = path.join(process.cwd(), 'storage', 'shares.json');
    this.baseUrl = process.env.BASE_URL || 'http://localhost:3000';
    this.ensureStorageExists();
  }

  private ensureStorageExists(): void {
    const storageDir = path.dirname(this.sharesFilePath);
    if (!fs.existsSync(storageDir)) {
      fs.mkdirSync(storageDir, { recursive: true });
    }
    
    if (!fs.existsSync(this.sharesFilePath)) {
      fs.writeFileSync(this.sharesFilePath, JSON.stringify([], null, 2));
    }
  }

  private readShares(): ShareableCredential[] {
    try {
      const data = fs.readFileSync(this.sharesFilePath, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      console.error('Error reading shares:', error);
      return [];
    }
  }

  private writeShares(shares: ShareableCredential[]): void {
    try {
      fs.writeFileSync(this.sharesFilePath, JSON.stringify(shares, null, 2));
    } catch (error) {
      console.error('Error writing shares:', error);
      throw new Error('Failed to save shares');
    }
  }

  public async createShare(request: CreateShareRequest): Promise<ShareResponse> {
    try {
      // Verify credential exists
      const credential = await credentialsService.getCredential(request.credentialId);
      if (!credential) {
        throw new Error('Credential not found');
      }

      const shares = this.readShares();
      const shareId = uuidv4();
      const expiresInHours = request.expiresInHours || 24; // Default 24 hours
      const expiresAt = new Date(Date.now() + (expiresInHours * 60 * 60 * 1000)).toISOString();
      
      const shareableCredential: ShareableCredential = {
        id: request.credentialId,
        jwt: credential.jwt,
        shareId: shareId,
        expiresAt: expiresAt,
        createdAt: new Date().toISOString()
      };

      // Remove expired shares before adding new one
      const activeShares = shares.filter(share => new Date(share.expiresAt) > new Date());
      activeShares.push(shareableCredential);
      
      this.writeShares(activeShares);

      const shareUrl = `${this.baseUrl}/api/shares/${shareId}`;

      return {
        shareId: shareId,
        shareUrl: shareUrl,
        expiresAt: expiresAt
      };
    } catch (error) {
      console.error('Error creating share:', error);
      throw new Error(`Failed to create share: ${(error as Error).message}`);
    }
  }

  public async getSharedCredential(shareId: string): Promise<{
    jwt: string;
    credential: any;
    valid: boolean;
    message: string;
  }> {
    try {
      const shares = this.readShares();
      const share = shares.find(s => s.shareId === shareId);

      if (!share) {
        return {
          jwt: '',
          credential: null,
          valid: false,
          message: 'Share not found'
        };
      }

      // Check if share has expired
      if (new Date(share.expiresAt) <= new Date()) {
        return {
          jwt: '',
          credential: null,
          valid: false,
          message: 'Share has expired'
        };
      }

      // Verify the credential is still valid
      const verificationResult = await credentialsService.verifyCredential(share.jwt);
      
      return {
        jwt: share.jwt,
        credential: verificationResult.credential,
        valid: verificationResult.valid,
        message: verificationResult.valid ? 'Credential is valid' : verificationResult.message
      };
    } catch (error) {
      console.error('Error getting shared credential:', error);
      return {
        jwt: '',
        credential: null,
        valid: false,
        message: `Failed to get shared credential: ${(error as Error).message}`
      };
    }
  }

  public async revokeShare(shareId: string): Promise<boolean> {
    try {
      const shares = this.readShares();
      const shareIndex = shares.findIndex(s => s.shareId === shareId);
      
      if (shareIndex === -1) {
        return false;
      }

      shares.splice(shareIndex, 1);
      this.writeShares(shares);

      return true;
    } catch (error) {
      console.error('Error revoking share:', error);
      throw new Error(`Failed to revoke share: ${(error as Error).message}`);
    }
  }

  public async getSharesByCredentialId(credentialId: string): Promise<ShareableCredential[]> {
    try {
      const shares = this.readShares();
      const now = new Date();
      
      // Return only active shares for this credential
      return shares.filter(share => 
        share.id === credentialId && 
        new Date(share.expiresAt) > now
      );
    } catch (error) {
      console.error('Error getting shares by credential ID:', error);
      throw new Error(`Failed to get shares: ${(error as Error).message}`);
    }
  }

  public async cleanupExpiredShares(): Promise<number> {
    try {
      const shares = this.readShares();
      const now = new Date();
      const activeShares = shares.filter(share => new Date(share.expiresAt) > now);
      const expiredCount = shares.length - activeShares.length;
      
      if (expiredCount > 0) {
        this.writeShares(activeShares);
      }

      return expiredCount;
    } catch (error) {
      console.error('Error cleaning up expired shares:', error);
      throw new Error(`Failed to cleanup expired shares: ${(error as Error).message}`);
    }
  }

  public async getShareStats(): Promise<{
    totalActive: number;
    totalExpired: number;
    expiringIn24Hours: number;
  }> {
    try {
      const shares = this.readShares();
      const now = new Date();
      const in24Hours = new Date(Date.now() + (24 * 60 * 60 * 1000));

      const active = shares.filter(share => new Date(share.expiresAt) > now);
      const expired = shares.filter(share => new Date(share.expiresAt) <= now);
      const expiringIn24Hours = active.filter(share => new Date(share.expiresAt) <= in24Hours);

      return {
        totalActive: active.length,
        totalExpired: expired.length,
        expiringIn24Hours: expiringIn24Hours.length
      };
    } catch (error) {
      console.error('Error getting share stats:', error);
      throw new Error(`Failed to get share stats: ${(error as Error).message}`);
    }
  }
}

export const sharingService = new SharingService();
export default sharingService;
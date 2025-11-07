import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

interface CredentialToken {
  token: string;
  credentials: any[];
  createdAt: string;
  expiresAt: string;
}

export class TokenService {
  private tokensFilePath: string;
  private readonly TOKEN_VALIDITY_MINUTES = 60; // Tokens valid for 60 minutes

  constructor() {
    this.tokensFilePath = path.join(process.cwd(), 'storage', 'credential-tokens.json');
    this.ensureStorageExists();
  }

  private ensureStorageExists(): void {
    const storageDir = path.dirname(this.tokensFilePath);
    if (!fs.existsSync(storageDir)) {
      fs.mkdirSync(storageDir, { recursive: true });
    }
    
    if (!fs.existsSync(this.tokensFilePath)) {
      fs.writeFileSync(this.tokensFilePath, JSON.stringify([], null, 2));
    }
  }

  private readTokens(): CredentialToken[] {
    try {
      const data = fs.readFileSync(this.tokensFilePath, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      console.error('Error reading tokens:', error);
      return [];
    }
  }

  private writeTokens(tokens: CredentialToken[]): void {
    try {
      fs.writeFileSync(this.tokensFilePath, JSON.stringify(tokens, null, 2));
    } catch (error) {
      console.error('Error writing tokens:', error);
      throw new Error('Failed to save tokens');
    }
  }

  // Generate a short, secure token
  private generateToken(): string {
    // Generate a shorter token (16 characters) instead of full UUID
    return crypto.randomBytes(8).toString('hex');
  }

  // Create a token for credentials
  public createCredentialToken(credentials: any[]): string {
    const tokens = this.readTokens();
    const token = this.generateToken();
    const now = new Date();
    const expiresAt = new Date(now.getTime() + this.TOKEN_VALIDITY_MINUTES * 60 * 1000);

    const credentialToken: CredentialToken = {
      token,
      credentials,
      createdAt: now.toISOString(),
      expiresAt: expiresAt.toISOString()
    };

    tokens.push(credentialToken);
    this.writeTokens(tokens);

    return token;
  }

  // Get credentials by token
  public getCredentialsByToken(token: string): any[] | null {
    const tokens = this.readTokens();
    const credentialToken = tokens.find(t => t.token === token);

    if (!credentialToken) {
      return null;
    }

    // Check if token has expired
    const now = new Date();
    const expiresAt = new Date(credentialToken.expiresAt);

    if (now > expiresAt) {
      // Token has expired
      return null;
    }

    return credentialToken.credentials;
  }

  // Clean up expired tokens (can be called periodically)
  public cleanupExpiredTokens(): number {
    const tokens = this.readTokens();
    const now = new Date();
    
    const validTokens = tokens.filter(t => new Date(t.expiresAt) > now);
    const removedCount = tokens.length - validTokens.length;

    if (removedCount > 0) {
      this.writeTokens(validTokens);
    }

    return removedCount;
  }

  // Revoke a specific token
  public revokeToken(token: string): boolean {
    const tokens = this.readTokens();
    const filteredTokens = tokens.filter(t => t.token !== token);
    
    if (filteredTokens.length < tokens.length) {
      this.writeTokens(filteredTokens);
      return true;
    }

    return false;
  }
}

export const tokenService = new TokenService();

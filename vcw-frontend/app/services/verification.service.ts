import { jwtVerify, importSPKI } from 'jose';
import { apiClient } from '../api';
import type { JWTPayload, VerifiableCredential } from '../types';

export interface VerificationResult {
  valid: boolean;
  payload: JWTPayload | null;
  credential: VerifiableCredential | null;
  message: string;
}

export interface DIDDocument {
  id: string;
  verificationMethod: Array<{
    id: string;
    type: string;
    controller: string;
    publicKeyMultibase?: string;
    publicKeyJwk?: Record<string, unknown>;
    publicKeyPem?: string;
  }>;
  authentication?: string[];
  assertionMethod?: string[];
}

class VerificationService {
  private didDocument: DIDDocument | null = null;
  private publicKey: CryptoKey | null = null;
  private issuerDid: string | null = null;

  /**
   * Initialize the verification service by fetching the DID document from the issuer
   */
  async initialize(): Promise<void> {
    try {
      console.log('Initializing verification service...');
      
      // Fetch the DID document from the issuer
      const didDocumentResponse = await apiClient.getDIDDocument();
      this.didDocument = didDocumentResponse;
      this.issuerDid = didDocumentResponse.id;
      
      console.log('DID Document fetched:', this.didDocument);

      // Extract the public key from the first verification method
      const verificationMethod = didDocumentResponse.verificationMethod[0];
      if (!verificationMethod) {
        throw new Error('No verification method found in DID document');
      }

      // Import the public key based on the format
      if (verificationMethod.publicKeyPem) {
        this.publicKey = await importSPKI(verificationMethod.publicKeyPem, 'EdDSA');
        console.log('Public key imported from PEM format');
      } else if (verificationMethod.publicKeyJwk) {
        // Handle JWK format if needed
        throw new Error('JWK format not yet supported');
      } else if (verificationMethod.publicKeyMultibase) {
        // Handle multibase format if needed
        throw new Error('Multibase format not yet supported');
      } else {
        throw new Error('No supported public key format found in verification method');
      }

      console.log('Verification service initialized successfully');
    } catch (error) {
      console.error('Failed to initialize verification service:', error);
      throw error;
    }
  }

  /**
   * Verify a JWT credential locally
   */
  async verifyCredential(jwt: string): Promise<VerificationResult> {
    try {
      if (!jwt) {
        return {
          valid: false,
          payload: null,
          credential: null,
          message: 'JWT is required for verification'
        };
      }

      // Ensure the service is initialized
      if (!this.publicKey || !this.issuerDid) {
        console.log('Verification service not initialized, initializing...');
        await this.initialize();
      }

      if (!this.publicKey || !this.issuerDid) {
        throw new Error('Verification service initialization failed');
      }

      console.log('Verifying JWT locally...');

      // Verify the JWT using the cached public key
      const { payload } = await jwtVerify(jwt, this.publicKey, {
        issuer: this.issuerDid,
      });

      console.log('JWT verified successfully');

      // Cast the payload to our expected format
      const verifiedPayload = payload as any;

      return {
        valid: true,
        payload: verifiedPayload,
        credential: verifiedPayload.vc,
        message: 'Credential is valid'
      };

    } catch (error) {
      console.error('Credential verification failed:', error);
      return {
        valid: false,
        payload: null,
        credential: null,
        message: `Credential verification failed: ${(error as Error).message}`
      };
    }
  }

  /**
   * Get the cached DID document
   */
  getDIDDocument(): DIDDocument | null {
    return this.didDocument;
  }

  /**
   * Get the cached issuer DID
   */
  getIssuerDid(): string | null {
    return this.issuerDid;
  }

  /**
   * Check if the service is initialized
   */
  isInitialized(): boolean {
    return this.publicKey !== null && this.issuerDid !== null;
  }

  /**
   * Force refresh the DID document and public key
   */
  async refresh(): Promise<void> {
    this.didDocument = null;
    this.publicKey = null;
    this.issuerDid = null;
    await this.initialize();
  }
}

export const verificationService = new VerificationService();
export default verificationService;
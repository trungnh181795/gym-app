import { SignJWT, jwtVerify, importPKCS8, importSPKI } from 'jose';
import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';
import { issuerService } from './issuer.service';
import { storageService } from './storage.service';
import {
  CreateCredentialRequest,
  CreateCredentialResponse,
  VerifiableCredential,
  StoredCredential,
  JWTPayload,
  CredentialListItem,
  ListCredentialsOptions,
  ListCredentialsResponse,
  VerificationResult,
  StorageStats,
  Membership,
  Benefit,
  CreateBenefitCredentialRequest,
  Service
} from '../types';
import { userService } from './user.service';
import { benefitManager } from './benefit.service';
import { serviceManager } from './service.service';

export class CredentialsService {
  public async createCredential({
    holderDid,
    userId,
    name,
    plan,
    benefitId,
    membershipId
  }: CreateCredentialRequest): Promise<CreateCredentialResponse> {
    try {
      // Get user information if not provided
      let finalHolderDid = holderDid;
      let finalName = name;
      
      if (userId && !finalHolderDid) {
        const user = await userService.getUserById(userId);
        if (!user) {
          throw new Error('User not found');
        }
        finalHolderDid = user.walletDid;
        finalName = finalName || user.name;
      }

      if (!finalHolderDid) {
        throw new Error('Either holderDid or userId must be provided');
      }

      // Get benefit information
      const benefit = await benefitManager.getBenefitById(benefitId);
      if (!benefit) {
        throw new Error('Benefit not found');
      }

      // Get services for this benefit
      const services = await serviceManager.getServicesByIds(benefit.serviceIds);
      
      // Generate unique credential ID
      const credentialId = uuidv4();
      
      // Load private key for signing
      const privateKeyPem = issuerService.getPrivateKey();
      const privateKey = await importPKCS8(privateKeyPem, 'EdDSA');
      
      // Determine credential type based on services
      const credentialTypes = ['VerifiableCredential', 'CMCGlobalMembershipCredential'];
      
      // Add specific credential types based on services
      services.forEach(service => {
        switch (service.name.toLowerCase()) {
          case 'gym floor':
            credentialTypes.push('GymFloorAccessCredential');
            break;
          case 'swimming pool':
            credentialTypes.push('AquaticFacilitiesCredential');
            break;
          case 'sauna':
          case 'steam room':
            credentialTypes.push('WellnessCredential');
            break;
          case 'personal training':
            credentialTypes.push('PersonalTrainingCredential');
            break;
          case 'group fitness classes':
            credentialTypes.push('GroupFitnessCredential');
            break;
          case 'nutrition consultation':
            credentialTypes.push('NutritionCredential');
            break;
          default:
            credentialTypes.push('GeneralAccessCredential');
        }
      });
      
      // Create the verifiable credential
      const now = new Date();
      const validUntil = new Date(benefit.endDate); // Use benefit's end date
      
      // Create proof object
      const proof = {
        type: 'Ed25519Signature2020',
        created: now.toISOString(),
        verificationMethod: `${issuerService.getIssuerDid()}#key-1`,
        proofPurpose: 'assertionMethod'
      };
      
      const credential: VerifiableCredential = {
        '@context': [
          'https://www.w3.org/ns/credentials/v2',
          'https://www.w3.org/ns/credentials/examples/v2',
          'https://cmcglobal.fitness/credentials/v1'
        ],
        id: `urn:uuid:${credentialId}`,
        type: credentialTypes,
        issuer: issuerService.getIssuerDid(),
        validFrom: now.toISOString(),
        validUntil: validUntil.toISOString(),
        credentialSubject: {
          id: finalHolderDid,
          name: finalName || 'Unknown',
          membershipPlan: plan || 'Unknown',
          membershipId: membershipId,
          benefitId: benefitId,
          benefitName: benefit.name,
          services: services.map(s => s.name),
          maxUsesPerMonth: benefit.maxUsesPerMonth,
          requiresBooking: benefit.requiresBooking,
          gymLocation: 'CMC Global Network',
          issuingFacility: 'CMC Global Fitness Center'
        },
        proof: proof
      };
      
      // Create JWT payload (this JWT represents the proof)
      const payload: JWTPayload = {
        vc: credential,
        sub: finalHolderDid,
        iss: issuerService.getIssuerDid(),
        iat: Math.floor(now.getTime() / 1000),
        exp: Math.floor(validUntil.getTime() / 1000),
        jti: credentialId
      };
      
      // Sign the JWT (this becomes the proof)
      const jwt = await new SignJWT(payload)
        .setProtectedHeader({ alg: 'EdDSA', typ: 'JWT' })
        .setIssuedAt()
        .setIssuer(issuerService.getIssuerDid())
        .setSubject(finalHolderDid)
        .setJti(credentialId)
        .setExpirationTime(validUntil)
        .sign(privateKey);
      
      // Add JWT signature to proof
      credential.proof.jws = jwt;
      
      // Store the credential
      const storedCredential: StoredCredential = {
        id: credentialId,
        credential: credential,
        jwt: jwt,
        holderDid: finalHolderDid,
        benefitId: benefitId,
        membershipId: membershipId,
        status: 'active',
        expireDate: validUntil.toISOString(),
        metadata: {
          name: finalName || 'Unknown',
          plan: plan || 'Unknown',
          membershipId: membershipId,
          benefitId: benefitId,
          benefitName: benefit.name,
          userId: userId
        },
        createdAt: now.toISOString(),
        updatedAt: now.toISOString()
      };
      
      const finalStoredCredential = storageService.createCredential(credentialId, {
        id: credentialId,
        credential: credential,
        jwt: jwt,
        holderDid: finalHolderDid,
        benefitId: benefitId,
        membershipId: membershipId,
        status: 'active',
        expireDate: validUntil.toISOString(),
        metadata: {
          name: finalName || 'Unknown',
          plan: plan || 'Unknown',
          membershipId: membershipId,
          benefitId: benefitId,
          benefitName: benefit.name,
          userId: userId
        }
      });
      
      return {
        id: credentialId,
        credential: credential,
        jwt: jwt,
        status: 'active',
        issuedAt: now.toISOString(),
        metadata: {
          name: finalName || 'Unknown',
          plan: plan || 'Unknown',
          membershipId: membershipId
        }
      };
    } catch (error) {
      console.error('Error creating credential:', error);
      throw new Error(`Failed to create credential: ${(error as Error).message}`);
    }
  }

  public async getCredential(credentialId: string): Promise<StoredCredential | null> {
    try {
      if (!credentialId) {
        throw new Error('Credential ID is required');
      }

      return storageService.readCredential(credentialId);
    } catch (error) {
      console.error('Error retrieving credential:', error);
      return null;
    }
  }

  public async listCredentials(options: ListCredentialsOptions = {}): Promise<ListCredentialsResponse> {
    try {
      const {
        page = 1,
        limit = 20,
        search = '',
        holderDid,
        status
      } = options;

      const allCredentials = storageService.readAllCredentials();
      
      // Filter credentials
      let filteredCredentials = allCredentials.filter((cred: StoredCredential) => {
        const matchesSearch = !search || 
          cred.metadata.name.toLowerCase().includes(search.toLowerCase()) ||
          cred.metadata.plan.toLowerCase().includes(search.toLowerCase()) ||
          cred.metadata.benefitName?.toLowerCase().includes(search.toLowerCase());
        
        const matchesHolder = !holderDid || cred.holderDid === holderDid;
        const matchesStatus = !status || cred.status === status;
        
        return matchesSearch && matchesHolder && matchesStatus;
      });

      // Sort by creation date (newest first)
      filteredCredentials.sort((a: StoredCredential, b: StoredCredential) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      // Pagination
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      const paginatedCredentials = filteredCredentials.slice(startIndex, endIndex);

      // Convert to list items
      const credentialItems: CredentialListItem[] = paginatedCredentials.map((cred: StoredCredential) => ({
        id: cred.id,
        type: cred.credential.type,
        subject: {
          id: cred.credential.credentialSubject.id,
          name: cred.metadata.name,
          plan: cred.metadata.plan
        },
        issuer: cred.credential.issuer,
        issuedAt: cred.credential.validFrom,
        status: cred.status,
        membershipId: cred.membershipId,
        createdAt: cred.createdAt,
        updatedAt: cred.updatedAt
      }));

      return {
        credentials: credentialItems,
        count: credentialItems.length,
        pagination: {
          page,
          limit,
          total: filteredCredentials.length,
          totalPages: Math.ceil(filteredCredentials.length / limit)
        }
      };
    } catch (error) {
      console.error('Error listing credentials:', error);
      throw new Error(`Failed to list credentials: ${(error as Error).message}`);
    }
  }

  public async verifyCredential(jwt: string): Promise<VerificationResult> {
    try {
      if (!jwt) {
        return {
          valid: false,
          payload: null,
          credential: null,
          message: 'No JWT provided'
        };
      }

      // Load public key for verification
      const publicKeyPem = issuerService.getPublicKey();
      const publicKey = await importSPKI(publicKeyPem, 'EdDSA');

      // Step 1: Verify the JWT signature
      const { payload } = await jwtVerify(jwt, publicKey);
      const jwtPayload = payload as JWTPayload;

      // Step 2: Verify the issuer DID
      const expectedIssuer = issuerService.getIssuerDid();
      if (jwtPayload.iss !== expectedIssuer) {
        return {
          valid: false,
          payload: jwtPayload,
          credential: jwtPayload.vc,
          message: `Invalid issuer. Expected: ${expectedIssuer}, Got: ${jwtPayload.iss}`
        };
      }

      // Step 3: Check expiration
      const now = Math.floor(Date.now() / 1000);
      if (jwtPayload.exp && jwtPayload.exp < now) {
        return {
          valid: false,
          payload: jwtPayload,
          credential: jwtPayload.vc,
          message: 'Credential has expired'
        };
      }

      // Step 4: Check if credential is revoked
      const storedCredential = await this.getCredential(jwtPayload.jti);
      if (storedCredential && storedCredential.status === 'revoked') {
        return {
          valid: false,
          payload: jwtPayload,
          credential: jwtPayload.vc,
          message: 'Credential has been revoked'
        };
      }

      return {
        valid: true,
        payload: jwtPayload,
        credential: jwtPayload.vc,
        message: 'Credential is valid'
      };
    } catch (error) {
      console.error('Error verifying credential:', error);
      return {
        valid: false,
        payload: null,
        credential: null,
        message: `Verification failed: ${(error as Error).message}`
      };
    }
  }

  public async revokeCredential(credentialId: string, reason?: string): Promise<boolean> {
    try {
      const credential = await this.getCredential(credentialId);
      if (!credential) {
        return false;
      }

      const updatedCredential: StoredCredential = {
        ...credential,
        status: 'revoked',
        metadata: {
          ...credential.metadata,
          revocationReason: reason || 'No reason provided'
        },
        updatedAt: new Date().toISOString()
      };

      storageService.updateCredential(credentialId, {
        status: 'revoked',
        metadata: {
          ...credential.metadata,
          revocationReason: reason || 'No reason provided'
        },
        updatedAt: new Date().toISOString()
      });
      return true;
    } catch (error) {
      console.error('Error revoking credential:', error);
      return false;
    }
  }

  public async deleteCredential(credentialId: string): Promise<boolean> {
    try {
      return await storageService.deleteCredential(credentialId);
    } catch (error) {
      console.error('Error deleting credential:', error);
      return false;
    }
  }

  public async getStorageStats(): Promise<StorageStats> {
    try {
      const allCredentials = storageService.readAllCredentials();
      
      const active = allCredentials.filter((c: StoredCredential) => c.status === 'active').length;
      const revoked = allCredentials.filter((c: StoredCredential) => c.status === 'revoked').length;
      const expired = allCredentials.filter((c: StoredCredential) => {
        const expDate = new Date(c.expireDate);
        return expDate < new Date();
      }).length;

      return {
        total: allCredentials.length,
        active,
        revoked,
        expired,
        storageInfo: {
          totalCredentials: allCredentials.length,
          storageLocation: 'File system',
          lastModified: allCredentials.length > 0 ? 
            allCredentials.reduce((latest: string, cred: StoredCredential) => 
              new Date(cred.updatedAt) > new Date(latest) ? cred.updatedAt : latest, 
              allCredentials[0].updatedAt
            ) : null
        }
      };
    } catch (error) {
      console.error('Error getting storage stats:', error);
      throw new Error(`Failed to get storage stats: ${(error as Error).message}`);
    }
  }

  // Generate QR code data for a credential
  public async generateQRCodeData(credentialId: string): Promise<string> {
    try {
      const credential = await this.getCredential(credentialId);
      if (!credential) {
        throw new Error('Credential not found');
      }

      // Return the credential JSON as QR code data
      return JSON.stringify(credential.credential);
    } catch (error) {
      console.error('Error generating QR code data:', error);
      throw new Error(`Failed to generate QR code data: ${(error as Error).message}`);
    }
  }

  // Verify credential from QR code JSON
  public async verifyCredentialFromQR(credentialJson: string): Promise<VerificationResult> {
    try {
      const credential = JSON.parse(credentialJson) as VerifiableCredential;
      
      if (!credential.proof || !credential.proof.jws) {
        return {
          valid: false,
          payload: null,
          credential: credential,
          message: 'No JWT proof found in credential'
        };
      }

      return await this.verifyCredential(credential.proof.jws);
    } catch (error) {
      console.error('Error verifying credential from QR:', error);
      return {
        valid: false,
        payload: null,
        credential: null,
        message: `Failed to verify credential from QR: ${(error as Error).message}`
      };
    }
  }
}

export const credentialsService = new CredentialsService();
export default credentialsService;
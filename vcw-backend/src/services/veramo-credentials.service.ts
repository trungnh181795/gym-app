import { getAgent, getOrCreateUserDID } from '../config/veramo.config';
import { veramoIssuerService } from './veramo-issuer.service';
import { storageService } from './storage.service';
import {
  CreateCredentialRequest,
  CreateCredentialResponse,
  StoredCredential,
  VerificationResult,
  ListCredentialsOptions,
  ListCredentialsResponse,
} from '../types';
import { userService } from './user.service';
import { benefitManager } from './benefit.service';
import { serviceManager } from './service.service';
import { v4 as uuidv4 } from 'uuid';

/**
 * Veramo-based Credentials Service
 * Uses Veramo framework for W3C Verifiable Credentials issuance and verification
 */
export class VeramoCredentialsService {
  /**
   * Create a W3C Verifiable Credential using Veramo
   */
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
        
        // Get or create DID for user using Veramo
        const userIdentifier = await getOrCreateUserDID(userId);
        finalHolderDid = userIdentifier.did;
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

      // Get services for this benefit - ensure serviceIds is an array
      const serviceIds = benefit.serviceIds || [];
      const services = await serviceManager.getServicesByIds(serviceIds);
      
      // Generate unique credential ID
      const credentialId = uuidv4();
      
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
      
      // Create dates
      const now = new Date();
      const validUntil = new Date(benefit.endDate);
      
      // Get issuer DID
      const issuerDid = veramoIssuerService.getIssuerDid();
      
      // Get Veramo agent
      const agent = await getAgent();
      
      // Create the credential using Veramo
      const verifiableCredential = await agent.createVerifiableCredential({
        credential: {
          '@context': [
            'https://www.w3.org/2018/credentials/v1',
            'https://www.w3.org/2018/credentials/examples/v1',
            'https://cmcglobal.fitness/credentials/v1'
          ],
          id: `urn:uuid:${credentialId}`,
          type: credentialTypes,
          issuer: { id: issuerDid },
          issuanceDate: now.toISOString(),
          expirationDate: validUntil.toISOString(),
          credentialSubject: {
            id: finalHolderDid,
            name: finalName || 'Unknown',
            membershipPlan: plan || 'Unknown',
            membershipId: membershipId,
            benefitId: benefitId,
            benefitName: benefit.name,
            benefitDescription: benefit.description,
            services: services.map(service => ({
              id: service.id,
              name: service.name,
              description: service.description,
              category: service.category,
              metadata: service.metadata
            })),
            maxUsesPerMonth: benefit.maxUsesPerMonth,
            requiresBooking: benefit.requiresBooking,
            gymLocation: 'CMC Global Network',
            issuingFacility: 'CMC Global Fitness Center'
          }
        },
        proofFormat: 'jwt',
        save: false, // We'll handle storage ourselves
      });
      
      // Extract the actual credential and JWT from Veramo response
      // Veramo returns the VC in the verifiableCredential property and JWT in proof.jwt
      const vcObject = verifiableCredential.verifiableCredential || verifiableCredential;
      const jwtToken = verifiableCredential.proof?.jwt || '';
      
      if (!jwtToken) {
        console.error('Veramo response structure:', JSON.stringify(verifiableCredential, null, 2));
        throw new Error('Failed to get JWT from Veramo credential');
      }
      
      if (!vcObject) {
        console.error('Veramo response structure:', JSON.stringify(verifiableCredential, null, 2));
        throw new Error('Failed to get credential object from Veramo');
      }
      
      // Store the credential
      const storedCredential: StoredCredential = {
        id: credentialId,
        credential: vcObject,
        jwt: jwtToken,
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
      
      const finalStoredCredential = await storageService.createCredential(credentialId, storedCredential);
      
      return {
        id: credentialId,
        credential: finalStoredCredential.credential,
        jwt: finalStoredCredential.jwt,
        status: finalStoredCredential.status,
        issuedAt: finalStoredCredential.createdAt,
        metadata: {
          name: finalName || 'Unknown',
          plan: plan || 'Unknown',
          membershipId: membershipId
        }
      };
      
    } catch (error) {
      console.error('Error creating credential with Veramo:', error);
      throw error;
    }
  }

  /**
   * Verify a W3C Verifiable Credential using Veramo
   */
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

      // Get Veramo agent
      const agent = await getAgent();

      // Verify the credential using Veramo
      const verificationResult = await agent.verifyCredential({
        credential: jwt,
      });

      if (!verificationResult.verified) {
        return {
          valid: false,
          payload: null,
          credential: verificationResult.verifiableCredential,
          message: 'Credential verification failed'
        };
      }

      // Extract credential data
      const vc = verificationResult.verifiableCredential;
      const credentialSubject = vc.credentialSubject as any;

      // Check if credential is revoked in our storage
      const credentialId = vc.id?.replace('urn:uuid:', '') || '';
      const storedCredential = await this.getCredential(credentialId);
      
      if (storedCredential && storedCredential.status === 'revoked') {
        return {
          valid: false,
          payload: null,
          credential: vc,
          message: 'Credential has been revoked'
        };
      }

      // Check expiration
      const now = new Date();
      const expirationDate = vc.expirationDate ? new Date(vc.expirationDate) : null;
      
      if (expirationDate && expirationDate < now) {
        return {
          valid: false,
          payload: null,
          credential: vc,
          message: 'Credential has expired'
        };
      }

      // Get benefit details for monthly usage tracking
      const benefitId = credentialSubject.benefitId;
      const benefit = benefitId ? await benefitManager.getBenefitById(benefitId) : null;

      // Calculate usage if benefit exists
      let usesThisMonth = 0;
      let usesRemaining: number | undefined = undefined;

      if (benefit && benefit.maxUsesPerMonth) {
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();
        
        // TODO: Implement usage tracking
        // For now, return max uses
        usesRemaining = benefit.maxUsesPerMonth;
      }

      // Extract user name and benefit name from credential subject
      const userName = credentialSubject.name || credentialSubject.userName || 'Member';
      const benefitName = credentialSubject.benefitName || benefit?.name || 'Standard Plan';
      const expiryDate = vc.expirationDate;

      return {
        valid: true,
        payload: null,
        credential: vc,
        message: 'Credential is valid',
        userName,
        benefitName,
        expiryDate,
        usesRemaining
      };

    } catch (error) {
      console.error('Error verifying credential with Veramo:', error);
      return {
        valid: false,
        payload: null,
        credential: null,
        message: `Verification error: ${(error as Error).message}`
      };
    }
  }

  /**
   * Get a credential by ID
   */
  public async getCredential(credentialId: string): Promise<StoredCredential | null> {
    try {
      if (!credentialId) {
        throw new Error('Credential ID is required');
      }
      return await storageService.readCredential(credentialId);
    } catch (error) {
      console.error('Error retrieving credential:', error);
      return null;
    }
  }

  /**
   * List credentials with filtering and pagination
   */
  public async listCredentials(options: ListCredentialsOptions = {}): Promise<ListCredentialsResponse> {
    try {
      const {
        page = 1,
        limit = 20,
        search = '',
        holderDid,
        status
      } = options;

      const allCredentials = await storageService.readAllCredentials();
      
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
      filteredCredentials.sort((a: StoredCredential, b: StoredCredential) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );

      // Pagination
      const total = filteredCredentials.length;
      const totalPages = Math.ceil(total / limit);
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      const paginatedCredentials = filteredCredentials.slice(startIndex, endIndex);

      // Map to CredentialListItem format
      const credentialItems = paginatedCredentials.map(cred => {
        const issuerValue = typeof cred.credential.issuer === 'string' 
          ? cred.credential.issuer 
          : (cred.credential.issuer as any)?.id || 'unknown';
        
        const credentialSubject = cred.credential.credentialSubject as any;
        
        return {
          id: cred.id,
          type: Array.isArray(cred.credential.type) ? cred.credential.type : [cred.credential.type],
          subject: {
            id: cred.holderDid,
            name: credentialSubject.name || cred.metadata.name,
            plan: credentialSubject.membershipPlan || cred.metadata.plan
          },
          holder: cred.holderDid,
          holderName: credentialSubject.name || cred.metadata.name || 'Unknown',
          benefitId: cred.benefitId,
          benefitName: cred.metadata.benefitName || 'Unknown Benefit',
          membershipId: cred.membershipId,
          membershipName: cred.metadata.plan || 'Unknown Membership',
          issuer: issuerValue,
          issuedAt: cred.createdAt,
          expiresAt: cred.expireDate,
          status: cred.status,
          createdAt: cred.createdAt,
          updatedAt: cred.updatedAt
        };
      });

      return {
        credentials: credentialItems,
        pagination: {
          page,
          limit,
          total,
          totalPages
        }
      };
    } catch (error) {
      console.error('Error listing credentials:', error);
      throw error;
    }
  }

  /**
   * Revoke a credential
   */
  public async revokeCredential(credentialId: string, _reason?: string): Promise<boolean> {
    try {
      const credential = await this.getCredential(credentialId);
      
      if (!credential) {
        throw new Error('Credential not found');
      }

      if (credential.status === 'revoked') {
        throw new Error('Credential is already revoked');
      }

      // Update credential status
      const updatedCredential: StoredCredential = {
        ...credential,
        status: 'revoked',
        updatedAt: new Date().toISOString()
      };

      await storageService.updateCredential(credentialId, updatedCredential);
      
      return true;
    } catch (error) {
      console.error('Error revoking credential:', error);
      throw error;
    }
  }

  /**
   * Delete a credential
   */
  public async deleteCredential(credentialId: string): Promise<boolean> {
    try {
      const credential = await this.getCredential(credentialId);
      
      if (!credential) {
        throw new Error('Credential not found');
      }

      return await storageService.deleteCredential(credentialId);
    } catch (error) {
      console.error('Error deleting credential:', error);
      throw error;
    }
  }

  /**
   * Get storage statistics
   */
  public async getStorageStats(): Promise<any> {
    try {
      const allCredentials = await storageService.readAllCredentials();
      
      const stats = {
        total: allCredentials.length,
        active: allCredentials.filter((c: StoredCredential) => c.status === 'active').length,
        revoked: allCredentials.filter((c: StoredCredential) => c.status === 'revoked').length,
        expired: allCredentials.filter((c: StoredCredential) => {
          const expDate = new Date(c.expireDate);
          return expDate < new Date();
        }).length,
        storageInfo: {
          totalCredentials: allCredentials.length,
          storageLocation: 'SQLite Database',
          lastModified: new Date().toISOString()
        }
      };

      return stats;
    } catch (error) {
      console.error('Error getting storage stats:', error);
      throw error;
    }
  }

  /**
   * Generate QR code data for a credential
   */
  public async generateQRCodeData(credentialId: string): Promise<string> {
    try {
      const credential = await this.getCredential(credentialId);
      
      if (!credential) {
        throw new Error('Credential not found');
      }

      // Return the JWT for QR code
      return credential.jwt;
    } catch (error) {
      console.error('Error generating QR code data:', error);
      throw error;
    }
  }

  /**
   * Verify credential from QR code JSON
   */
  public async verifyCredentialFromQR(credentialJson: string): Promise<any> {
    try {
      // Parse the credential JSON
      const credential = JSON.parse(credentialJson);
      
      // If it's a JWT string, verify it
      if (typeof credential === 'string') {
        return await this.verifyCredential(credential);
      }

      // If it's a credential object with JWT
      if (credential.jwt) {
        return await this.verifyCredential(credential.jwt);
      }

      throw new Error('Invalid credential format');
    } catch (error) {
      console.error('Error verifying credential from QR:', error);
      throw error;
    }
  }
}

// Create and export singleton instance
export const veramoCredentialsService = new VeramoCredentialsService();
export default veramoCredentialsService;

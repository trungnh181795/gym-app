/**
 * LEGACY SERVICE - PARTIALLY USED FOR KEY MANAGEMENT
 * 
 * This service is maintained primarily for reading cryptographic keys from PEM files.
 * The application now uses veramo-issuer.service.ts for all DID and credential issuance operations.
 * 
 * Still used for:
 * - Reading issuer public/private keys from config/issuer-*.pem files
 * 
 * Not used for:
 * - DID Document creation (handled by Veramo)
 * - Credential signing (handled by Veramo)
 * 
 * @deprecated For credential operations, use veramo-issuer.service.ts instead
 */

import fs from 'fs';
import path from 'path';
import { ISSUER_DID, DID_CONFIG, GYM_CONFIG } from '../config';
import { createDIDDocument, validateDIDDocument, DIDDocument } from '../config/did-document';

export class IssuerService {
    public getIssuerDid(): string {
        return DID_CONFIG.issuerDid;
    }

    public getPublicKey(): string {
        if (!fs.existsSync(DID_CONFIG.publicKeyPath)) {
            throw new Error('Public key not found. Please run key generation first.');
        }
        return fs.readFileSync(DID_CONFIG.publicKeyPath, 'utf8');
    }

    public getPrivateKey(): string {
        if (!fs.existsSync(DID_CONFIG.privateKeyPath)) {
            throw new Error('Private key not found. Please run key generation first.');
        }
        return fs.readFileSync(DID_CONFIG.privateKeyPath, 'utf8');
    }

    /**
     * Get the complete W3C DID Document for this issuer
     * @returns DID Document with verification methods
     */
    public getDIDDocument(): DIDDocument {
        const issuerDid = this.getIssuerDid();
        const publicKeyPem = this.getPublicKey();
        
        const didDocument = createDIDDocument(issuerDid, publicKeyPem);
        
        // Validate the document before returning
        validateDIDDocument(didDocument);
        
        return didDocument;
    }

    /**
     * Get a specific verification method by key ID
     * @param keyId - The key ID to retrieve (defaults to #key-1)
     * @returns Verification method or null if not found
     */
    public getVerificationMethod(keyId: string = DID_CONFIG.keyId): any {
        const didDocument = this.getDIDDocument();
        const fullKeyId = keyId.startsWith('#') ? `${this.getIssuerDid()}${keyId}` : keyId;
        
        return didDocument.verificationMethod.find(method => method.id === fullKeyId) || null;
    }

    /**
     * Get the gym business information
     * @returns Gym configuration with business details
     */
    public getGymInfo() {
        return {
            name: GYM_CONFIG.name,
            fullName: GYM_CONFIG.fullName,
            businessType: GYM_CONFIG.businessType,
            location: GYM_CONFIG.location,
            services: GYM_CONFIG.services,
            website: GYM_CONFIG.website,
            did: this.getIssuerDid()
        };
    }

    /**
     * Get issuer information with both DID and display name
     * @returns Object with DID and business name
     */
    public getIssuerInfo() {
        return {
            did: this.getIssuerDid(),
            name: GYM_CONFIG.name,
            fullName: GYM_CONFIG.fullName,
            businessType: GYM_CONFIG.businessType
        };
    }
}

export const issuerService = new IssuerService();
export default issuerService;
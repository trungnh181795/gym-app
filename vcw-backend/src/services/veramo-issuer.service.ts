import { agent, getOrCreateIssuerDID } from '../config/veramo.config';
import { GYM_CONFIG } from '../config';

/**
 * Veramo-based Issuer Service
 * Manages DIDs and issuer identity using Veramo framework
 */
export class VeramoIssuerService {
    private issuerDID: string | null = null;
    private issuerIdentifier: any = null;

    /**
     * Initialize the issuer DID
     * Must be called before using other methods
     */
    public async initialize(): Promise<void> {
        try {
            const identifier = await getOrCreateIssuerDID();
            this.issuerDID = identifier.did;
            this.issuerIdentifier = identifier;
            console.log('Veramo Issuer Service initialized with DID:', this.issuerDID);
        } catch (error) {
            console.error('Failed to initialize Veramo Issuer Service:', error);
            throw error;
        }
    }

    /**
     * Get the issuer DID
     * @returns Issuer DID string
     */
    public getIssuerDid(): string {
        if (!this.issuerDID) {
            throw new Error('Issuer Service not initialized. Call initialize() first.');
        }
        return this.issuerDID;
    }

    /**
     * Get the full issuer identifier object from Veramo
     * @returns Veramo identifier object with keys
     */
    public getIssuerIdentifier(): any {
        if (!this.issuerIdentifier) {
            throw new Error('Issuer Service not initialized. Call initialize() first.');
        }
        return this.issuerIdentifier;
    }

    /**
     * Get the public key from the issuer's first key
     * @returns Public key in hex format
     */
    public getPublicKey(): string {
        if (!this.issuerIdentifier || !this.issuerIdentifier.keys || this.issuerIdentifier.keys.length === 0) {
            throw new Error('No keys found for issuer');
        }
        return this.issuerIdentifier.keys[0].publicKeyHex;
    }

    /**
     * Get the W3C DID Document for this issuer
     * @returns DID Document resolved by Veramo
     */
    public async getDIDDocument(): Promise<any> {
        const did = this.getIssuerDid();
        const didDocument = await agent.resolveDid({ didUrl: did });
        return didDocument.didDocument;
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

    /**
     * Get all managed DIDs
     * @returns Array of all DIDs managed by this agent
     */
    public async listDIDs(): Promise<any[]> {
        return await agent.didManagerFind();
    }

    /**
     * Create a new DID
     * @param alias - Optional alias for the DID
     * @returns New identifier
     */
    public async createDID(alias?: string): Promise<any> {
        return await agent.didManagerCreate({
            alias,
            provider: 'did:key',
            kms: 'local',
        });
    }
}

// Create and export singleton instance
export const veramoIssuerService = new VeramoIssuerService();
export default veramoIssuerService;

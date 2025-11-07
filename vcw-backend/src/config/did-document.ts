/**
 * DID Document Configuration
 * W3C Decentralized Identifier (DID) Document template
 * This defines the issuer's identity and verification methods
 */

import { DID_CONFIG } from './index';

export interface DIDDocument {
    "@context": string[];
    id: string;
    verificationMethod: VerificationMethod[];
    authentication: string[];
    assertionMethod: string[];
    keyAgreement: string[];
    capabilityInvocation: string[];
    capabilityDelegation: string[];
}

export interface VerificationMethod {
    id: string;
    type: string;
    controller: string;
    publicKeyPem: string;
}

/**
 * Creates a W3C compliant DID Document for the issuer
 * @param issuerDid - The issuer's DID
 * @param publicKeyPem - The issuer's public key in PEM format
 * @returns Complete DID Document
 */
export function createDIDDocument(issuerDid: string, publicKeyPem: string): DIDDocument {
    const keyId = `${issuerDid}${DID_CONFIG.keyId}`;
    
    return {
        "@context": DID_CONFIG.contexts,
        "id": issuerDid,
        "verificationMethod": [{
            "id": keyId,
            "type": DID_CONFIG.verificationMethodType,
            "controller": issuerDid,
            "publicKeyPem": publicKeyPem
        }],
        "authentication": [keyId],
        "assertionMethod": [keyId],
        "keyAgreement": [keyId],
        "capabilityInvocation": [keyId],
        "capabilityDelegation": [keyId]
    };
}

/**
 * Validates a DID Document structure
 * @param didDocument - The DID Document to validate
 * @returns True if valid, throws error if invalid
 */
export function validateDIDDocument(didDocument: any): boolean {
    if (!didDocument["@context"] || !Array.isArray(didDocument["@context"])) {
        throw new Error("DID Document must have @context array");
    }
    
    if (!didDocument["@context"].includes("https://www.w3.org/ns/did/v1")) {
        throw new Error("DID Document must include W3C DID v1 context");
    }
    
    if (!didDocument.id || typeof didDocument.id !== "string") {
        throw new Error("DID Document must have an id");
    }
    
    if (!didDocument.verificationMethod || !Array.isArray(didDocument.verificationMethod)) {
        throw new Error("DID Document must have verificationMethod array");
    }
    
    if (didDocument.verificationMethod.length === 0) {
        throw new Error("DID Document must have at least one verification method");
    }
    
    // Validate each verification method
    for (const method of didDocument.verificationMethod) {
        if (!method.id || !method.type || !method.controller || !method.publicKeyPem) {
            throw new Error("Verification method must have id, type, controller, and publicKeyPem");
        }
    }
    
    return true;
}

/**
 * Get DID Document configuration settings
 * @returns DID configuration object
 */
export function getDIDConfig() {
    return DID_CONFIG;
}
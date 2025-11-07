import path from 'path';
import { AppConfig } from '../types';

export const config: AppConfig = {
  ISSUER_DID: 'did:example:cmcglobal:gym:issuer',
  storagePath: path.join(__dirname, '../../storage/credentials.json')
};

// Gym Business Configuration
export const GYM_CONFIG = {
  name: 'CMC Global',
  fullName: 'CMC Global Fitness Center',
  businessType: 'Fitness & Wellness',
  location: 'Global Network',
  services: [
    'Gym & Fitness Equipment',
    'Swimming Pool',
    'Sauna & Steam Room',
    'Personal Training',
    'Group Fitness Classes',
    'Nutrition Consultation'
  ],
  website: 'https://cmcglobal.fitness'
};

// DID Document Configuration
export const DID_CONFIG = {
  // Default issuer DID (can be overridden via environment)
  issuerDid: process.env.ISSUER_DID || config.ISSUER_DID,
  
  // Key file paths
  publicKeyPath: path.join(__dirname, '../../config/issuer-public-key.pem'),
  privateKeyPath: path.join(__dirname, '../../config/issuer-private-key.pem'),
  
  // DID Document settings
  keyId: '#key-1',
  verificationMethodType: 'Ed25519VerificationKey2020',
  
  // Supported contexts
  contexts: [
    'https://www.w3.org/ns/did/v1',
    'https://w3id.org/security/suites/ed25519-2020/v1',
    'https://www.w3.org/ns/credentials/v2'
  ],
  
  // Key purposes
  keyPurposes: [
    'authentication',
    'assertionMethod', 
    'keyAgreement',
    'capabilityInvocation',
    'capabilityDelegation'
  ],
  
  // Business metadata for DID Document
  serviceEndpoints: [
    {
      id: '#gym-services',
      type: 'GymServices',
      serviceEndpoint: 'https://cmcglobal.fitness/api/gym'
    },
    {
      id: '#credential-issuer',  
      type: 'CredentialIssuerService',
      serviceEndpoint: 'https://cmcglobal.fitness/api/credentials'
    }
  ]
};

export const { ISSUER_DID, storagePath } = config;
export default config;
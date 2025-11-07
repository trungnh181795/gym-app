// User Types
export interface User {
  id: string;
  name: string;
  email: string;
  password?: string; // Optional for existing users
  phone?: string;
  status?: 'active' | 'inactive' | 'suspended';
  walletDid: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateUserRequest {
  name: string;
  email: string;
  password?: string;
  phone?: string;
  status?: 'active' | 'inactive' | 'suspended';
}

// Service Types
export interface Service {
  id: string;
  name: string;
  description: string;
  category: 'facility' | 'equipment' | 'program' | 'wellness';
  metadata?: {
    capacity?: number;
    location?: string;
    hours?: string;
    requirements?: string[];
    [key: string]: any;
  };
  createdAt: string;
  updatedAt: string;
}

export interface CreateServiceRequest {
  name: string;
  description: string;
  category: 'facility' | 'equipment' | 'program' | 'wellness';
  metadata?: {
    capacity?: number;
    location?: string;
    hours?: string;
    requirements?: string[];
    [key: string]: any;
  };
}

// Benefit Types
export type BenefitType = 'gym_access' | 'pool_access' | 'sauna_access' | 'personal_trainer' | 'group_classes' | 'nutrition_consultation';

export interface Benefit {
  id: string;
  name: string;
  description: string;
  price: number;
  serviceIds: string[]; // References to Service entities
  startDate: string;
  endDate: string;
  maxUsesPerMonth?: number;
  requiresBooking?: boolean;
  isShareable: boolean;
  sharedWithUserId?: string; // Only if isShareable is true and shared
  createdAt: string;
  updatedAt: string;
}

export interface CreateBenefitRequest {
  name: string;
  description: string;
  price: number;
  serviceIds: string[];
  startDate: string;
  endDate: string;
  maxUsesPerMonth?: number;
  requiresBooking?: boolean;
  isShareable: boolean;
  sharedWithUserId?: string;
}

// Membership Types
export interface Membership {
  id: string;
  userId: string;
  name: string;
  description: string;
  status: 'active' | 'suspended' | 'expired' | 'cancelled';
  validFrom: string;
  validUntil: string;
  price?: number;
  benefitIds: string[]; // References to Benefit entities
  createdAt: string;
  updatedAt: string;
}

export interface CreateMembershipRequest {
  userId: string;
  name: string;
  description: string;
  validFrom: string;
  validUntil: string;
  price: number;
  benefits: Array<{
    type: string;
    name: string;
    description?: string;
    maxUsesPerMonth?: number;
    requiresBooking: boolean;
    isShared?: boolean;
    sharedWithUserId?: string;
  }>;
}

// Enhanced Verifiable Credential Types
export interface CredentialSubject {
  id: string;
  name: string;
  membershipPlan?: string;
  membershipId?: string;
  benefitId?: string;
  benefitName?: string;
  services?: string[];
  maxUsesPerMonth?: number;
  requiresBooking?: boolean;
  [key: string]: any;
}

export interface CredentialProof {
  type: string;
  created: string;
  verificationMethod: string;
  proofPurpose: string;
  jws?: string;
}

export interface VerifiableCredential {
  '@context': string[];
  id: string;
  type: string[];
  issuer: string;
  validFrom: string;
  validUntil?: string;
  credentialSubject: CredentialSubject;
  proof: CredentialProof;
}

export interface JWTPayload {
  vc: VerifiableCredential;
  sub: string;
  iss: string;
  iat: number;
  exp: number;
  jti: string;
  [key: string]: any; // Allow additional properties for JOSE compatibility
}

// Storage Types
export interface StoredCredential {
  id: string;
  credential: VerifiableCredential;
  jwt: string;
  holderDid: string;
  benefitId: string; // 1-1 relationship with benefit
  membershipId: string;
  status: 'active' | 'revoked' | 'expired';
  expireDate: string; // Based on benefit end date
  metadata: {
    name: string;
    plan: string;
    membershipId: string;
    benefitId: string;
    benefitName?: string;
    userId?: string;
    [key: string]: any;
  };
  createdAt: string;
  updatedAt: string;
}

// API Request/Response Types
export interface CreateCredentialRequest {
  holderDid?: string; // Optional - will be derived from userId if not provided
  userId?: string; // User ID - will be used to get holderDid if holderDid not provided
  name?: string; // Optional - will be derived from user if not provided
  plan?: string; // Optional - will be derived from membership if not provided
  benefitId: string; // Required - references the specific benefit
  membershipId: string; // Required - references the membership
}

export interface CreateBenefitCredentialRequest {
  userId: string;
  membershipId: string;
  benefitId: string;
}

export interface CreateCredentialResponse {
  id: string;
  credential: VerifiableCredential;
  jwt: string;
  status: string;
  issuedAt: string;
  metadata: {
    name: string;
    plan: string;
    membershipId: string;
  };
}

export interface CredentialListItem {
  id: string;
  type: string[];
  subject: {
    id: string;
    name: string;
    plan: string;
  };
  issuer: string;
  issuedAt: string;
  status: string;
  membershipId: string;
  createdAt: string;
  updatedAt: string;
}

export interface ListCredentialsOptions {
  page?: number;
  limit?: number;
  search?: string;
  holderDid?: string;
  status?: 'active' | 'revoked' | 'expired';
}

export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ListCredentialsResponse {
  credentials: CredentialListItem[];
  count?: number;
  pagination?: PaginationInfo;
}

// Verification Types
export interface VerificationResult {
  valid: boolean;
  payload: JWTPayload | null;
  credential: VerifiableCredential | null;
  message: string;
}

// Storage Statistics
export interface StorageStats {
  total: number;
  active: number;
  revoked: number;
  expired: number;
  storageInfo: {
    totalCredentials: number;
    storageLocation: string;
    lastModified: string | null;
    fileSizeBytes?: number;
  };
}

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
}

export interface ApiErrorResponse {
  error: string;
  message: string;
  path?: string;
}

// Configuration Types
export interface AppConfig {
  ISSUER_DID: string;
  storagePath: string;
}

export interface GymBusinessInfo {
  name: string;
  fullName: string;
  businessType: string;
  location: string;
  services: string[];
  website: string;
  did: string;
}

export interface IssuerInfo {
  did: string;
  name: string;
  fullName: string;
  businessType: string;
}

// Sharing Types
export interface ShareableCredential {
  id: string;
  jwt: string;
  shareId: string;
  expiresAt: string;
  createdAt: string;
}

export interface CreateShareRequest {
  credentialId: string;
  expiresInHours?: number;
}

export interface ShareResponse {
  shareId: string;
  shareUrl: string;
  expiresAt: string;
}

// Express Request Extensions
export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    did: string;
  };
}
// API types and interfaces
export interface User {
  id: string;
  name: string;
  email: string;
  walletDid: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateUserRequest {
  name: string;
  email: string;
}

export type BenefitType = 'gym_access' | 'pool_access' | 'sauna_access' | 'personal_trainer' | 'group_classes' | 'nutrition_consultation';

export interface Benefit {
  type: BenefitType;
  name: string;
  description: string;
  maxUsesPerMonth?: number;
  requiresBooking?: boolean;
}

export interface Membership {
  id: string;
  userId: string;
  name: string;
  description: string;
  status: 'active' | 'suspended' | 'expired' | 'cancelled';
  validFrom: string;
  validUntil: string;
  benefits: Benefit[];
  price: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateMembershipRequest {
  userId: string;
  name: string;
  description: string;
  benefits: Benefit[];
  validFrom: string;
  validUntil: string;
  price: number;
}

export interface CredentialSubject {
  id: string;
  name: string;
  membershipPlan?: string;
  membershipId?: string;
  benefitType?: BenefitType;
  benefitName?: string;
  maxUsesPerMonth?: number;
  requiresBooking?: boolean;
  [key: string]: string | number | boolean | undefined;
}

export interface VerifiableCredential {
  '@context': string[];
  id: string;
  type: string[];
  issuer: string;
  validFrom: string;
  validUntil?: string;
  credentialSubject: CredentialSubject;
}

export interface StoredCredential {
  id: string;
  credential: VerifiableCredential;
  jwt: string;
  holderDid: string;
  status: 'active' | 'revoked' | 'expired';
  metadata: {
    name: string;
    plan: string;
    membershipId: string;
    benefitType?: BenefitType;
    benefitName?: string;
    userId?: string;
    [key: string]: string | number | boolean | undefined;
  };
  createdAt: string;
  updatedAt: string;
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

export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
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
    benefitType?: BenefitType;
    benefitName?: string;
  };
}

export interface VerificationResult {
  valid: boolean;
  payload: JWTPayload | null;
  credential: VerifiableCredential | null;
  message: string;
  error?: string;
  header?: Record<string, unknown>;
}

export interface JWTPayload {
  vc: VerifiableCredential;
  sub: string;
  iss: string;
  iat: number;
  exp: number;
  jti: string;
}

export interface PublicKeyInfo {
  publicKeyPem: string;
  algorithm: string;
  curve: string;
  format: string;
  usage: string[];
  note: string;
}

export interface ShareDetail {
  id: string;
  shareId: string;
  credentialId: string;
  createdAt: string;
  expiresAt: string;
  isExpired: boolean;
  credential: StoredCredential;
}

// Dashboard specific types
export interface DashboardStats {
  users: {
    total: number;
    createdToday: number;
    createdThisMonth: number;
  };
  memberships: {
    total: number;
    active: number;
    expired: number;
    suspended: number;
    totalRevenue: number;
    averagePrice: number;
  };
  credentials: {
    total: number;
    active: number;
    revoked: number;
    expired: number;
  };
  shares: {
    totalActive: number;
    totalExpired: number;
    expiringIn24Hours: number;
  };
}

export interface MembershipTemplate {
  name: string;
  description: string;
  benefits: Benefit[];
  price: number;
}
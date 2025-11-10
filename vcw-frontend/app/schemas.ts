import { z } from 'zod';
// User form schema
export const userSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100, 'Name too long'),
  email: z.string().email('Invalid email address'),
});

export type UserFormData = z.infer<typeof userSchema>;

// Benefit schema
export const benefitSchema = z.object({
  type: z.enum(['gym_access', 'pool_access', 'sauna_access', 'personal_trainer', 'group_classes', 'nutrition_consultation'] as const),
  name: z.string().min(2, 'Benefit name is required'),
  description: z.string().optional().default(''),
  maxUsesPerMonth: z.number().int().positive().optional(),
  requiresBooking: z.boolean(),
  isShared: z.boolean().optional().default(false),
  sharedWithUserId: z.string().optional(),
});

export type BenefitFormData = z.infer<typeof benefitSchema>;

// Membership form schema
export const membershipSchema = z.object({
  userId: z.string().min(1, 'User is required'),
  name: z.string().min(2, 'Membership name is required'),
  description: z.string().default(''),
  validFrom: z.string().min(1, 'Start date is required'),
  validUntil: z.string().min(1, 'End date is required'),
  price: z.number().positive('Price must be positive'),
  benefits: z.array(benefitSchema).min(1, 'At least one benefit is required'),
});

export type MembershipFormData = z.infer<typeof membershipSchema>;

// Credential creation schema
export const credentialSchema = z.object({
  holderDid: z.string().min(1, 'Holder DID is required'),
  name: z.string().min(2, 'Name is required'),
  plan: z.string().min(2, 'Plan is required'),
  benefitType: z.enum(['gym_access', 'pool_access', 'sauna_access', 'personal_trainer', 'group_classes', 'nutrition_consultation'] as const).optional(),
  membershipId: z.string().optional(),
});

export type CredentialFormData = z.infer<typeof credentialSchema>;

// Share creation schema
export const shareSchema = z.object({
  credentialId: z.string().min(1, 'Credential ID is required'),
  expiresInHours: z.number().int().positive().max(168, 'Cannot exceed 7 days').default(24),
});

export type ShareFormData = z.infer<typeof shareSchema>;

// JWT verification schema
export const verifySchema = z.object({
  jwt: z.string().min(10, 'JWT token is required'),
});

export type VerifyFormData = z.infer<typeof verifySchema>;
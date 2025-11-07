import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import path from 'path';
import { 
  Membership, 
  CreateMembershipRequest, 
  Benefit, 
  CreateBenefitCredentialRequest
} from '../types';
import { userService } from './user.service';
import { veramoCredentialsService } from './veramo-credentials.service';
import { benefitManager } from './benefit.service';

export class MembershipService {
  private membershipsFilePath: string;

  constructor() {
    this.membershipsFilePath = path.join(process.cwd(), 'storage', 'memberships.json');
    this.ensureStorageExists();
  }

  private ensureStorageExists(): void {
    const storageDir = path.dirname(this.membershipsFilePath);
    if (!fs.existsSync(storageDir)) {
      fs.mkdirSync(storageDir, { recursive: true });
    }
    
    if (!fs.existsSync(this.membershipsFilePath)) {
      fs.writeFileSync(this.membershipsFilePath, JSON.stringify([], null, 2));
    }
  }

  private readMemberships(): Membership[] {
    try {
      const data = fs.readFileSync(this.membershipsFilePath, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      console.error('Error reading memberships:', error);
      return [];
    }
  }

  private writeMemberships(memberships: Membership[]): void {
    try {
      fs.writeFileSync(this.membershipsFilePath, JSON.stringify(memberships, null, 2));
    } catch (error) {
      console.error('Error writing memberships:', error);
      throw new Error('Failed to save memberships');
    }
  }

  public async createMembership(request: CreateMembershipRequest): Promise<{ membership: Membership; credentials: any[] }> {
    try {
      // Verify user exists
      const user = await userService.getUserById(request.userId);
      if (!user) {
        throw new Error('User not found');
      }

      // Create benefits from the request
      const benefitIds: string[] = [];
      for (const benefitData of request.benefits) {
        const benefit = await benefitManager.createBenefit({
          name: benefitData.name,
          description: benefitData.description || '',
          price: 0, // Individual benefit price is 0, membership has the total price
          serviceIds: [], // No specific services assigned to individual benefits
          startDate: request.validFrom,
          endDate: request.validUntil,
          requiresBooking: benefitData.requiresBooking,
          maxUsesPerMonth: benefitData.maxUsesPerMonth,
          isShareable: benefitData.isShared || false,
          sharedWithUserId: benefitData.sharedWithUserId
        });
        benefitIds.push(benefit.id);
      }

      const memberships = this.readMemberships();
      const now = new Date().toISOString();
      const membershipId = uuidv4();
      
      const newMembership: Membership = {
        id: membershipId,
        userId: request.userId,
        name: request.name,
        description: request.description,
        status: 'active',
        validFrom: request.validFrom,
        validUntil: request.validUntil,
        benefitIds: benefitIds,
        price: request.price,
        createdAt: now,
        updatedAt: now
      };

      memberships.push(newMembership);
      this.writeMemberships(memberships);

      // Auto-issue benefit credentials for this membership
      const credentials = await this.issueBenefitCredentials(membershipId);

      return { membership: newMembership, credentials };
    } catch (error) {
      console.error('Error creating membership:', error);
      throw new Error(`Failed to create membership: ${(error as Error).message}`);
    }
  }

  public async getMembershipById(membershipId: string): Promise<Membership | null> {
    try {
      const memberships = this.readMemberships();
      return memberships.find(membership => membership.id === membershipId) || null;
    } catch (error) {
      console.error('Error getting membership:', error);
      throw new Error(`Failed to get membership: ${(error as Error).message}`);
    }
  }

  public async getMembershipsByUserId(userId: string): Promise<Membership[]> {
    try {
      const memberships = this.readMemberships();
      return memberships.filter(membership => membership.userId === userId);
    } catch (error) {
      console.error('Error getting user memberships:', error);
      throw new Error(`Failed to get user memberships: ${(error as Error).message}`);
    }
  }

  public async getAllMemberships(): Promise<Membership[]> {
    try {
      return this.readMemberships();
    } catch (error) {
      console.error('Error getting all memberships:', error);
      throw new Error(`Failed to get memberships: ${(error as Error).message}`);
    }
  }

  public async updateMembership(
    membershipId: string, 
    updates: Partial<Pick<Membership, 'name' | 'description' | 'status' | 'validUntil' | 'benefitIds'>>
  ): Promise<Membership | null> {
    try {
      const memberships = this.readMemberships();
      const membershipIndex = memberships.findIndex(membership => membership.id === membershipId);
      
      if (membershipIndex === -1) {
        return null;
      }

      // If benefitIds are being updated, validate them
      if (updates.benefitIds) {
        const benefits = await benefitManager.getBenefitsByIds(updates.benefitIds);
        if (benefits.length !== updates.benefitIds.length) {
          throw new Error('Some benefit IDs are invalid');
        }
      }

      const updatedMembership: Membership = {
        ...memberships[membershipIndex],
        ...updates,
        updatedAt: new Date().toISOString()
      };

      memberships[membershipIndex] = updatedMembership;
      this.writeMemberships(memberships);

      // If benefits were updated, re-issue credentials
      if (updates.benefitIds) {
        await this.revokeBenefitCredentials(membershipId);
        await this.issueBenefitCredentials(membershipId);
      }

      return updatedMembership;
    } catch (error) {
      console.error('Error updating membership:', error);
      throw new Error(`Failed to update membership: ${(error as Error).message}`);
    }
  }

  public async deleteMembership(membershipId: string): Promise<boolean> {
    try {
      const memberships = this.readMemberships();
      const membershipIndex = memberships.findIndex(membership => membership.id === membershipId);
      
      if (membershipIndex === -1) {
        return false;
      }

      // Revoke all benefit credentials for this membership
      await this.revokeBenefitCredentials(membershipId);

      memberships.splice(membershipIndex, 1);
      this.writeMemberships(memberships);

      return true;
    } catch (error) {
      console.error('Error deleting membership:', error);
      throw new Error(`Failed to delete membership: ${(error as Error).message}`);
    }
  }

  public async issueBenefitCredentials(membershipId: string): Promise<any[]> {
    try {
      const membership = await this.getMembershipById(membershipId);
      if (!membership) {
        throw new Error('Membership not found');
      }

      const user = await userService.getUserById(membership.userId);
      if (!user) {
        throw new Error('User not found');
      }

      const benefits = await benefitManager.getBenefitsByIds(membership.benefitIds);
      const issuedCredentials: any[] = [];

      // Issue a credential for each benefit
      for (const benefit of benefits) {
        // Create credential for the main holder
        const credential = await veramoCredentialsService.createCredential({
          userId: user.id,
          membershipId: membership.id,
          benefitId: benefit.id
        });
        issuedCredentials.push(credential);

        // If benefit is shared, create credential for the shared user as well
        if (benefit.isShareable && benefit.sharedWithUserId) {
          const sharedUser = await userService.getUserById(benefit.sharedWithUserId);
          if (sharedUser) {
            const sharedCredential = await veramoCredentialsService.createCredential({
              userId: benefit.sharedWithUserId,
              membershipId: membership.id,
              benefitId: benefit.id
            });
            issuedCredentials.push(sharedCredential);
          }
        }
      }

      return issuedCredentials;
    } catch (error) {
      console.error('Error issuing benefit credentials:', error);
      throw new Error(`Failed to issue benefit credentials: ${(error as Error).message}`);
    }
  }

  public async revokeBenefitCredentials(membershipId: string): Promise<void> {
    try {
      // Get all credentials for this membership and revoke them
      const allCredentials = await veramoCredentialsService.listCredentials();
      const membershipCredentials = allCredentials.credentials.filter(
        cred => cred.membershipId === membershipId
      );

      for (const credential of membershipCredentials) {
        // Use the new revoke functionality instead of deleting
        await veramoCredentialsService.revokeCredential(credential.id, 'Membership updated or cancelled');
      }
    } catch (error) {
      console.error('Error revoking benefit credentials:', error);
      throw new Error(`Failed to revoke benefit credentials: ${(error as Error).message}`);
    }
  }

  public async getMembershipStats(): Promise<{
    total: number;
    active: number;
    expired: number;
    suspended: number;
    totalBenefits: number;
    averageBenefitsPerMembership: number;
  }> {
    try {
      const memberships = this.readMemberships();
      const active = memberships.filter(m => m.status === 'active').length;
      const expired = memberships.filter(m => m.status === 'expired').length;
      const suspended = memberships.filter(m => m.status === 'suspended').length;
      const totalBenefits = memberships.reduce((sum, m) => sum + m.benefitIds.length, 0);
      const averageBenefitsPerMembership = memberships.length > 0 ? totalBenefits / memberships.length : 0;

      return {
        total: memberships.length,
        active,
        expired,
        suspended,
        totalBenefits,
        averageBenefitsPerMembership
      };
    } catch (error) {
      console.error('Error getting membership stats:', error);
      throw new Error(`Failed to get membership stats: ${(error as Error).message}`);
    }
  }

  public async getMembershipWithBenefits(membershipId: string): Promise<(Membership & { benefits: Benefit[] }) | null> {
    try {
      const membership = await this.getMembershipById(membershipId);
      if (!membership) {
        return null;
      }

      const benefits = await benefitManager.getBenefitsByIds(membership.benefitIds);
      
      return {
        ...membership,
        benefits
      };
    } catch (error) {
      console.error('Error getting membership with benefits:', error);
      throw new Error(`Failed to get membership with benefits: ${(error as Error).message}`);
    }
  }

  public async getAllMembershipsWithBenefits(): Promise<Array<Membership & { benefits: Benefit[] }>> {
    try {
      const memberships = this.readMemberships();
      const results: Array<Membership & { benefits: Benefit[] }> = [];

      for (const membership of memberships) {
        const benefits = await benefitManager.getBenefitsByIds(membership.benefitIds);
        results.push({
          ...membership,
          benefits
        });
      }

      return results;
    } catch (error) {
      console.error('Error getting all memberships with benefits:', error);
      throw new Error(`Failed to get memberships with benefits: ${(error as Error).message}`);
    }
  }
}

export const membershipService = new MembershipService();
export default membershipService;
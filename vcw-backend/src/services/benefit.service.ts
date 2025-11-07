import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import path from 'path';
import { Benefit, CreateBenefitRequest } from '../types';
import { serviceManager } from './service.service';

export class BenefitManager {
  private benefitsFilePath: string;

  constructor() {
    this.benefitsFilePath = path.join(process.cwd(), 'storage', 'benefits.json');
    this.ensureStorageExists();
  }

  private ensureStorageExists(): void {
    const storageDir = path.dirname(this.benefitsFilePath);
    if (!fs.existsSync(storageDir)) {
      fs.mkdirSync(storageDir, { recursive: true });
    }
    
    if (!fs.existsSync(this.benefitsFilePath)) {
      fs.writeFileSync(this.benefitsFilePath, JSON.stringify([], null, 2));
    }
  }

  private readBenefits(): Benefit[] {
    try {
      const data = fs.readFileSync(this.benefitsFilePath, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      console.error('Error reading benefits:', error);
      return [];
    }
  }

  private writeBenefits(benefits: Benefit[]): void {
    try {
      fs.writeFileSync(this.benefitsFilePath, JSON.stringify(benefits, null, 2));
    } catch (error) {
      console.error('Error writing benefits:', error);
      throw new Error('Failed to save benefits');
    }
  }

  public async createBenefit(request: CreateBenefitRequest): Promise<Benefit> {
    try {
      // Validate that all service IDs exist
      const services = await serviceManager.getServicesByIds(request.serviceIds);
      if (services.length !== request.serviceIds.length) {
        throw new Error('Some service IDs are invalid');
      }

      const benefits = this.readBenefits();
      const now = new Date().toISOString();
      
      const newBenefit: Benefit = {
        id: uuidv4(),
        name: request.name,
        description: request.description,
        price: request.price,
        serviceIds: request.serviceIds,
        startDate: request.startDate,
        endDate: request.endDate,
        maxUsesPerMonth: request.maxUsesPerMonth,
        requiresBooking: request.requiresBooking || false,
        isShareable: request.isShareable || false,
        sharedWithUserId: request.sharedWithUserId,
        createdAt: now,
        updatedAt: now
      };

      benefits.push(newBenefit);
      this.writeBenefits(benefits);

      return newBenefit;
    } catch (error) {
      console.error('Error creating benefit:', error);
      throw new Error(`Failed to create benefit: ${(error as Error).message}`);
    }
  }

  public async getBenefitById(benefitId: string): Promise<Benefit | null> {
    try {
      const benefits = this.readBenefits();
      return benefits.find(benefit => benefit.id === benefitId) || null;
    } catch (error) {
      console.error('Error getting benefit:', error);
      throw new Error(`Failed to get benefit: ${(error as Error).message}`);
    }
  }

  public async getAllBenefits(): Promise<Benefit[]> {
    try {
      return this.readBenefits();
    } catch (error) {
      console.error('Error getting all benefits:', error);
      throw new Error(`Failed to get benefits: ${(error as Error).message}`);
    }
  }

  public async getBenefitsByIds(benefitIds: string[]): Promise<Benefit[]> {
    try {
      const benefits = this.readBenefits();
      return benefits.filter(benefit => benefitIds.includes(benefit.id));
    } catch (error) {
      console.error('Error getting benefits by IDs:', error);
      throw new Error(`Failed to get benefits by IDs: ${(error as Error).message}`);
    }
  }

  public async updateBenefit(
    benefitId: string, 
    updates: Partial<Pick<Benefit, 'name' | 'description' | 'price' | 'serviceIds' | 'startDate' | 'endDate' | 'maxUsesPerMonth' | 'requiresBooking' | 'isShareable' | 'sharedWithUserId'>>
  ): Promise<Benefit | null> {
    try {
      const benefits = this.readBenefits();
      const benefitIndex = benefits.findIndex(benefit => benefit.id === benefitId);
      
      if (benefitIndex === -1) {
        return null;
      }

      // Validate service IDs if provided
      if (updates.serviceIds) {
        const services = await serviceManager.getServicesByIds(updates.serviceIds);
        if (services.length !== updates.serviceIds.length) {
          throw new Error('Some service IDs are invalid');
        }
      }

      const updatedBenefit: Benefit = {
        ...benefits[benefitIndex],
        ...updates,
        updatedAt: new Date().toISOString()
      };

      benefits[benefitIndex] = updatedBenefit;
      this.writeBenefits(benefits);

      return updatedBenefit;
    } catch (error) {
      console.error('Error updating benefit:', error);
      throw new Error(`Failed to update benefit: ${(error as Error).message}`);
    }
  }

  public async deleteBenefit(benefitId: string): Promise<boolean> {
    try {
      const benefits = this.readBenefits();
      const benefitIndex = benefits.findIndex(benefit => benefit.id === benefitId);
      
      if (benefitIndex === -1) {
        return false;
      }

      benefits.splice(benefitIndex, 1);
      this.writeBenefits(benefits);

      return true;
    } catch (error) {
      console.error('Error deleting benefit:', error);
      throw new Error(`Failed to delete benefit: ${(error as Error).message}`);
    }
  }

  public async getBenefitsWithServices(benefitIds: string[]): Promise<Array<Benefit & { services: any[] }>> {
    try {
      const benefits = await this.getBenefitsByIds(benefitIds);
      const resultsWithServices: Array<Benefit & { services: any[] }> = [];

      for (const benefit of benefits) {
        // Ensure serviceIds is an array, default to empty array if undefined
        const serviceIds = benefit.serviceIds || [];
        const services = await serviceManager.getServicesByIds(serviceIds);
        resultsWithServices.push({
          ...benefit,
          services
        });
      }

      return resultsWithServices;
    } catch (error) {
      console.error('Error getting benefits with services:', error);
      throw new Error(`Failed to get benefits with services: ${(error as Error).message}`);
    }
  }

  public async getActiveBenefits(): Promise<Benefit[]> {
    try {
      const benefits = this.readBenefits();
      const now = new Date();
      
      return benefits.filter(benefit => {
        const startDate = new Date(benefit.startDate);
        const endDate = new Date(benefit.endDate);
        return now >= startDate && now <= endDate;
      });
    } catch (error) {
      console.error('Error getting active benefits:', error);
      throw new Error(`Failed to get active benefits: ${(error as Error).message}`);
    }
  }

  public async shareBenefit(benefitId: string, targetUserId: string): Promise<Benefit | null> {
    try {
      const benefit = await this.getBenefitById(benefitId);
      if (!benefit) {
        throw new Error('Benefit not found');
      }

      if (!benefit.isShareable) {
        throw new Error('This benefit is not shareable');
      }

      // Create a copy of the benefit for the target user
      const sharedBenefit: Benefit = {
        ...benefit,
        id: uuidv4(),
        sharedWithUserId: targetUserId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      const benefits = this.readBenefits();
      benefits.push(sharedBenefit);
      this.writeBenefits(benefits);

      return sharedBenefit;
    } catch (error) {
      console.error('Error sharing benefit:', error);
      throw new Error(`Failed to share benefit: ${(error as Error).message}`);
    }
  }
}

export const benefitManager = new BenefitManager();
export default benefitManager;
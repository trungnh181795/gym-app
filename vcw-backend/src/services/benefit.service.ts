import { v4 as uuidv4 } from 'uuid';
import { Repository } from 'typeorm';
import { getDataSource } from '../config/database.config';
import { Benefit as BenefitEntity } from '../entities';
import { Benefit, CreateBenefitRequest } from '../types';
import { serviceManager } from './service.service';

export class BenefitManager {
  private benefitRepository: Repository<BenefitEntity> | null = null;
  private initPromise: Promise<void> | null = null;

  private async ensureInitialized(): Promise<void> {
    if (this.benefitRepository) {
      return;
    }

    if (this.initPromise) {
      return this.initPromise;
    }

    this.initPromise = (async () => {
      try {
        const dataSource = await getDataSource();
        this.benefitRepository = dataSource.getRepository(BenefitEntity);
      } catch (error) {
        this.initPromise = null;
        throw error;
      }
    })();

    return this.initPromise;
  }

  private entityToType(entity: BenefitEntity): Benefit {
    return {
      id: entity.id,
      name: entity.name,
      description: entity.description,
      price: entity.price,
      serviceIds: entity.serviceIds ? JSON.parse(entity.serviceIds) : [],
      startDate: entity.startDate.toISOString(),
      endDate: entity.endDate.toISOString(),
      maxUsesPerMonth: entity.maxUsesPerMonth,
      requiresBooking: entity.requiresBooking,
      isShareable: entity.isShareable,
      sharedWithUserId: entity.sharedWithUserId,
      createdAt: entity.createdAt.toISOString(),
      updatedAt: entity.updatedAt.toISOString()
    };
  }

  public async createBenefit(request: CreateBenefitRequest): Promise<Benefit> {
    try {
      const services = await serviceManager.getServicesByIds(request.serviceIds);
      if (services.length !== request.serviceIds.length) {
        throw new Error('Some service IDs are invalid');
      }

      await this.ensureInitialized();
      
      const newBenefit = this.benefitRepository!.create({
        id: uuidv4(),
        name: request.name,
        description: request.description,
        price: request.price,
        serviceIds: JSON.stringify(request.serviceIds),
        startDate: new Date(request.startDate),
        endDate: new Date(request.endDate),
        maxUsesPerMonth: request.maxUsesPerMonth,
        requiresBooking: request.requiresBooking || false,
        isShareable: request.isShareable || false,
        sharedWithUserId: request.sharedWithUserId,
      });

      const saved = await this.benefitRepository!.save(newBenefit);
      return this.entityToType(saved);
    } catch (error) {
      console.error('Error creating benefit:', error);
      throw new Error(`Failed to create benefit: ${(error as Error).message}`);
    }
  }

  public async getBenefitById(benefitId: string): Promise<Benefit | null> {
    try {
      await this.ensureInitialized();
      
      const benefit = await this.benefitRepository!.findOne({ where: { id: benefitId } });
      
      if (!benefit) {
        return null;
      }
      
      return this.entityToType(benefit);
    } catch (error) {
      console.error('Error getting benefit:', error);
      throw new Error(`Failed to get benefit: ${(error as Error).message}`);
    }
  }

  public async getAllBenefits(): Promise<Benefit[]> {
    try {
      await this.ensureInitialized();
      
      const benefits = await this.benefitRepository!.find();
      return benefits.map(b => this.entityToType(b));
    } catch (error) {
      console.error('Error getting all benefits:', error);
      throw new Error(`Failed to get benefits: ${(error as Error).message}`);
    }
  }

  public async getBenefitsByIds(benefitIds: string[]): Promise<Benefit[]> {
    try {
      await this.ensureInitialized();
      
      const benefits = await this.benefitRepository!.findByIds(benefitIds);
      return benefits.map(b => this.entityToType(b));
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
      if (updates.serviceIds) {
        const services = await serviceManager.getServicesByIds(updates.serviceIds);
        if (services.length !== updates.serviceIds.length) {
          throw new Error('Some service IDs are invalid');
        }
      }

      await this.ensureInitialized();
      
      const benefit = await this.benefitRepository!.findOne({ where: { id: benefitId } });
      
      if (!benefit) {
        return null;
      }

      if (updates.name !== undefined) benefit.name = updates.name;
      if (updates.description !== undefined) benefit.description = updates.description;
      if (updates.price !== undefined) benefit.price = updates.price;
      if (updates.serviceIds !== undefined) benefit.serviceIds = JSON.stringify(updates.serviceIds);
      if (updates.startDate !== undefined) benefit.startDate = new Date(updates.startDate);
      if (updates.endDate !== undefined) benefit.endDate = new Date(updates.endDate);
      if (updates.maxUsesPerMonth !== undefined) benefit.maxUsesPerMonth = updates.maxUsesPerMonth;
      if (updates.requiresBooking !== undefined) benefit.requiresBooking = updates.requiresBooking;
      if (updates.isShareable !== undefined) benefit.isShareable = updates.isShareable;
      if (updates.sharedWithUserId !== undefined) benefit.sharedWithUserId = updates.sharedWithUserId;

      const saved = await this.benefitRepository!.save(benefit);
      return this.entityToType(saved);
    } catch (error) {
      console.error('Error updating benefit:', error);
      throw new Error(`Failed to update benefit: ${(error as Error).message}`);
    }
  }

  public async deleteBenefit(benefitId: string): Promise<boolean> {
    try {
      await this.ensureInitialized();
      
      const result = await this.benefitRepository!.delete(benefitId);
      return (result.affected ?? 0) > 0;
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
      await this.ensureInitialized();
      
      const now = new Date();
      const benefits = await this.benefitRepository!.createQueryBuilder('benefit')
        .where('benefit.startDate <= :now', { now })
        .andWhere('benefit.endDate >= :now', { now })
        .getMany();
      
      return benefits.map(b => this.entityToType(b));
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

      await this.ensureInitialized();
      
      const sharedBenefit = this.benefitRepository!.create({
        id: uuidv4(),
        name: benefit.name,
        description: benefit.description,
        price: benefit.price,
        serviceIds: JSON.stringify(benefit.serviceIds),
        startDate: new Date(benefit.startDate),
        endDate: new Date(benefit.endDate),
        maxUsesPerMonth: benefit.maxUsesPerMonth,
        requiresBooking: benefit.requiresBooking,
        isShareable: benefit.isShareable,
        sharedWithUserId: targetUserId,
      });

      const saved = await this.benefitRepository!.save(sharedBenefit);
      return this.entityToType(saved);
    } catch (error) {
      console.error('Error sharing benefit:', error);
      throw new Error(`Failed to share benefit: ${(error as Error).message}`);
    }
  }
}

export const benefitManager = new BenefitManager();
export default benefitManager;
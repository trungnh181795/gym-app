import { v4 as uuidv4 } from 'uuid';
import { Repository } from 'typeorm';
import { getDataSource } from '../config/database.config';
import { Service as ServiceEntity } from '../entities';
import { Service, CreateServiceRequest } from '../types';

export class ServiceManager {
  private serviceRepository: Repository<ServiceEntity> | null = null;
  private initPromise: Promise<void> | null = null;

  private async ensureInitialized(): Promise<void> {
    if (this.serviceRepository) {
      return;
    }

    if (this.initPromise) {
      return this.initPromise;
    }

    this.initPromise = (async () => {
      try {
        const dataSource = await getDataSource();
        this.serviceRepository = dataSource.getRepository(ServiceEntity);
      } catch (error) {
        this.initPromise = null;
        throw error;
      }
    })();

    return this.initPromise;
  }

  public async createService(request: CreateServiceRequest): Promise<Service> {
    try {
      await this.ensureInitialized();
      
      const newService = this.serviceRepository!.create({
        id: uuidv4(),
        name: request.name,
        description: request.description,
        category: request.category,
        metadata: request.metadata ? JSON.stringify(request.metadata) : undefined,
      });

      const saved = await this.serviceRepository!.save(newService);
      
      return {
        id: saved.id,
        name: saved.name,
        description: saved.description,
        category: saved.category as Service['category'],
        metadata: saved.metadata ? JSON.parse(saved.metadata) : {},
        createdAt: saved.createdAt.toISOString(),
        updatedAt: saved.updatedAt.toISOString()
      };
    } catch (error) {
      console.error('Error creating service:', error);
      throw new Error(`Failed to create service: ${(error as Error).message}`);
    }
  }

  public async getServiceById(serviceId: string): Promise<Service | null> {
    try {
      await this.ensureInitialized();
      
      const service = await this.serviceRepository!.findOne({ where: { id: serviceId } });
      
      if (!service) {
        return null;
      }
      
      return {
        id: service.id,
        name: service.name,
        description: service.description,
        category: service.category as Service['category'],
        metadata: service.metadata ? JSON.parse(service.metadata) : {},
        createdAt: service.createdAt.toISOString(),
        updatedAt: service.updatedAt.toISOString()
      };
    } catch (error) {
      console.error('Error getting service:', error);
      throw new Error(`Failed to get service: ${(error as Error).message}`);
    }
  }

  public async getAllServices(): Promise<Service[]> {
    try {
      await this.ensureInitialized();
      
      const services = await this.serviceRepository!.find();
      
      return services.map(service => ({
        id: service.id,
        name: service.name,
        description: service.description,
        category: service.category as Service['category'],
        metadata: service.metadata ? JSON.parse(service.metadata) : {},
        createdAt: service.createdAt.toISOString(),
        updatedAt: service.updatedAt.toISOString()
      }));
    } catch (error) {
      console.error('Error getting all services:', error);
      throw new Error(`Failed to get services: ${(error as Error).message}`);
    }
  }

  public async getServicesByCategory(category: Service['category']): Promise<Service[]> {
    try {
      await this.ensureInitialized();
      
      const services = await this.serviceRepository!.find({ where: { category } });
      
      return services.map(service => ({
        id: service.id,
        name: service.name,
        description: service.description,
        category: service.category as Service['category'],
        metadata: service.metadata ? JSON.parse(service.metadata) : {},
        createdAt: service.createdAt.toISOString(),
        updatedAt: service.updatedAt.toISOString()
      }));
    } catch (error) {
      console.error('Error getting services by category:', error);
      throw new Error(`Failed to get services by category: ${(error as Error).message}`);
    }
  }

  public async updateService(
    serviceId: string, 
    updates: Partial<Pick<Service, 'name' | 'description' | 'category' | 'metadata'>>
  ): Promise<Service | null> {
    try {
      await this.ensureInitialized();
      
      const service = await this.serviceRepository!.findOne({ where: { id: serviceId } });
      
      if (!service) {
        return null;
      }

      if (updates.name !== undefined) service.name = updates.name;
      if (updates.description !== undefined) service.description = updates.description;
      if (updates.category !== undefined) service.category = updates.category;
      if (updates.metadata !== undefined) {
        service.metadata = JSON.stringify(updates.metadata);
      }

      const saved = await this.serviceRepository!.save(service);

      return {
        id: saved.id,
        name: saved.name,
        description: saved.description,
        category: saved.category as Service['category'],
        metadata: saved.metadata ? JSON.parse(saved.metadata) : {},
        createdAt: saved.createdAt.toISOString(),
        updatedAt: saved.updatedAt.toISOString()
      };
    } catch (error) {
      console.error('Error updating service:', error);
      throw new Error(`Failed to update service: ${(error as Error).message}`);
    }
  }

  public async deleteService(serviceId: string): Promise<boolean> {
    try {
      await this.ensureInitialized();
      
      const result = await this.serviceRepository!.delete(serviceId);
      
      return (result.affected ?? 0) > 0;
    } catch (error) {
      console.error('Error deleting service:', error);
      throw new Error(`Failed to delete service: ${(error as Error).message}`);
    }
  }

  public async getServicesByIds(serviceIds: string[]): Promise<Service[]> {
    try {
      await this.ensureInitialized();
      
      if (!serviceIds || !Array.isArray(serviceIds) || serviceIds.length === 0) {
        return [];
      }
      
      const services = await this.serviceRepository!.findByIds(serviceIds);
      
      return services.map(service => ({
        id: service.id,
        name: service.name,
        description: service.description,
        category: service.category as Service['category'],
        metadata: service.metadata ? JSON.parse(service.metadata) : {},
        createdAt: service.createdAt.toISOString(),
        updatedAt: service.updatedAt.toISOString()
      }));
    } catch (error) {
      console.error('Error getting services by IDs:', error);
      throw new Error(`Failed to get services by IDs: ${(error as Error).message}`);
    }
  }

  public static async initializeDefaultServices(): Promise<void> {
    const serviceManager = new ServiceManager();
    const existingServices = await serviceManager.getAllServices();
    
    if (existingServices.length === 0) {
      const defaultServices: CreateServiceRequest[] = [
        {
          name: 'Gym Floor',
          description: 'Full access to all gym equipment including weights, cardio machines, and functional training area',
          category: 'facility',
          metadata: {
            capacity: 100,
            location: 'Main Floor',
            hours: '5:00 AM - 11:00 PM',
            requirements: ['Valid membership', 'Proper workout attire']
          }
        },
        {
          name: 'Swimming Pool',
          description: 'Olympic-size swimming pool with lap lanes and leisure area',
          category: 'facility',
          metadata: {
            capacity: 50,
            location: 'Level 2',
            hours: '6:00 AM - 10:00 PM',
            requirements: ['Valid membership', 'Swimming attire', 'Shower before entry']
          }
        },
        {
          name: 'Sauna',
          description: 'Traditional Finnish sauna for relaxation and recovery',
          category: 'wellness',
          metadata: {
            capacity: 12,
            location: 'Wellness Area',
            hours: '7:00 AM - 9:00 PM',
            requirements: ['Valid membership', 'Towel required', 'Maximum 20 minutes per session']
          }
        },
        {
          name: 'Steam Room',
          description: 'Steam room for muscle relaxation and recovery',
          category: 'wellness',
          metadata: {
            capacity: 8,
            location: 'Wellness Area',
            hours: '7:00 AM - 9:00 PM',
            requirements: ['Valid membership', 'Towel required', 'Maximum 15 minutes per session']
          }
        },
        {
          name: 'Group Fitness Classes',
          description: 'Various group fitness classes including yoga, pilates, HIIT, and more',
          category: 'program',
          metadata: {
            capacity: 25,
            location: 'Group Fitness Studio',
            hours: 'Scheduled classes throughout the day',
            requirements: ['Valid membership', 'Advance booking required', 'Proper workout attire']
          }
        },
        {
          name: 'Personal Training',
          description: 'One-on-one personal training sessions with certified trainers',
          category: 'program',
          metadata: {
            capacity: 1,
            location: 'Personal Training Area',
            hours: 'By appointment',
            requirements: ['Valid membership', 'Advance booking required', 'Additional fee may apply']
          }
        },
        {
          name: 'Nutrition Consultation',
          description: 'Professional nutrition consultation and meal planning services',
          category: 'program',
          metadata: {
            capacity: 1,
            location: 'Consultation Room',
            hours: 'By appointment',
            requirements: ['Valid membership', 'Advance booking required']
          }
        },
        {
          name: 'Locker Rooms',
          description: 'Clean and secure locker facilities with showers',
          category: 'facility',
          metadata: {
            capacity: 200,
            location: 'Main Level',
            hours: '5:00 AM - 11:00 PM',
            requirements: ['Valid membership']
          }
        }
      ];

      for (const serviceData of defaultServices) {
        await serviceManager.createService(serviceData);
      }
    }
  }
}

export const serviceManager = new ServiceManager();
export default serviceManager;

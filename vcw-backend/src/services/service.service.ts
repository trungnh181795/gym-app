import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import path from 'path';
import { Service, CreateServiceRequest } from '../types';

export class ServiceManager {
  private servicesFilePath: string;

  constructor() {
    this.servicesFilePath = path.join(process.cwd(), 'storage', 'services.json');
    this.ensureStorageExists();
  }

  private ensureStorageExists(): void {
    const storageDir = path.dirname(this.servicesFilePath);
    if (!fs.existsSync(storageDir)) {
      fs.mkdirSync(storageDir, { recursive: true });
    }
    
    if (!fs.existsSync(this.servicesFilePath)) {
      fs.writeFileSync(this.servicesFilePath, JSON.stringify([], null, 2));
    }
  }

  private readServices(): Service[] {
    try {
      const data = fs.readFileSync(this.servicesFilePath, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      console.error('Error reading services:', error);
      return [];
    }
  }

  private writeServices(services: Service[]): void {
    try {
      fs.writeFileSync(this.servicesFilePath, JSON.stringify(services, null, 2));
    } catch (error) {
      console.error('Error writing services:', error);
      throw new Error('Failed to save services');
    }
  }

  public async createService(request: CreateServiceRequest): Promise<Service> {
    try {
      const services = this.readServices();
      const now = new Date().toISOString();
      
      const newService: Service = {
        id: uuidv4(),
        name: request.name,
        description: request.description,
        category: request.category,
        metadata: request.metadata || {},
        createdAt: now,
        updatedAt: now
      };

      services.push(newService);
      this.writeServices(services);

      return newService;
    } catch (error) {
      console.error('Error creating service:', error);
      throw new Error(`Failed to create service: ${(error as Error).message}`);
    }
  }

  public async getServiceById(serviceId: string): Promise<Service | null> {
    try {
      const services = this.readServices();
      return services.find(service => service.id === serviceId) || null;
    } catch (error) {
      console.error('Error getting service:', error);
      throw new Error(`Failed to get service: ${(error as Error).message}`);
    }
  }

  public async getAllServices(): Promise<Service[]> {
    try {
      return this.readServices();
    } catch (error) {
      console.error('Error getting all services:', error);
      throw new Error(`Failed to get services: ${(error as Error).message}`);
    }
  }

  public async getServicesByCategory(category: Service['category']): Promise<Service[]> {
    try {
      const services = this.readServices();
      return services.filter(service => service.category === category);
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
      const services = this.readServices();
      const serviceIndex = services.findIndex(service => service.id === serviceId);
      
      if (serviceIndex === -1) {
        return null;
      }

      const updatedService: Service = {
        ...services[serviceIndex],
        ...updates,
        updatedAt: new Date().toISOString()
      };

      services[serviceIndex] = updatedService;
      this.writeServices(services);

      return updatedService;
    } catch (error) {
      console.error('Error updating service:', error);
      throw new Error(`Failed to update service: ${(error as Error).message}`);
    }
  }

  public async deleteService(serviceId: string): Promise<boolean> {
    try {
      const services = this.readServices();
      const serviceIndex = services.findIndex(service => service.id === serviceId);
      
      if (serviceIndex === -1) {
        return false;
      }

      services.splice(serviceIndex, 1);
      this.writeServices(services);

      return true;
    } catch (error) {
      console.error('Error deleting service:', error);
      throw new Error(`Failed to delete service: ${(error as Error).message}`);
    }
  }

  public async getServicesByIds(serviceIds: string[]): Promise<Service[]> {
    try {
      // Handle undefined or empty serviceIds
      if (!serviceIds || !Array.isArray(serviceIds) || serviceIds.length === 0) {
        return [];
      }
      
      const services = this.readServices();
      return services.filter(service => serviceIds.includes(service.id));
    } catch (error) {
      console.error('Error getting services by IDs:', error);
      throw new Error(`Failed to get services by IDs: ${(error as Error).message}`);
    }
  }

  // Predefined gym services
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
import { v4 as uuidv4 } from 'uuid';
import { Repository } from 'typeorm';
import { User } from '../entities';
import { CreateUserRequest } from '../types';
import { getDataSource } from '../config/database.config';

export class UserService {
  private userRepo!: Repository<User>;
  private isInitialized = false;
  private initPromise: Promise<void> | null = null;

  private async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }
    
    if (this.initPromise) {
      return this.initPromise;
    }

    this.initPromise = (async () => {
      const dataSource = await getDataSource();
      this.userRepo = dataSource.getRepository(User);
      this.isInitialized = true;
    })();

    return this.initPromise;
  }

  private async ensureInitialized(): Promise<void> {
    if (!this.isInitialized) {
      await this.initialize();
    }
  }

  public async createUser(request: CreateUserRequest): Promise<User> {
    try {
      await this.ensureInitialized();
      
      // Check if email already exists
      const existingUser = await this.userRepo.findOne({
        where: { email: request.email.toLowerCase() }
      });
      
      if (existingUser) {
        throw new Error('User with this email already exists');
      }

      const userId = uuidv4();
      
      const newUser = this.userRepo.create({
        id: userId,
        name: request.name,
        email: request.email.toLowerCase(),
        password: request.password,
        phone: request.phone,
        status: request.status || 'active',
        walletDid: `did:gym:user:${userId}`,
      });

      return await this.userRepo.save(newUser);
    } catch (error) {
      console.error('Error creating user:', error);
      throw new Error(`Failed to create user: ${(error as Error).message}`);
    }
  }

  public async getUserById(userId: string): Promise<User | null> {
    try {
      await this.ensureInitialized();
      return await this.userRepo.findOne({ where: { id: userId } });
    } catch (error) {
      console.error('Error getting user:', error);
      throw new Error(`Failed to get user: ${(error as Error).message}`);
    }
  }

  public async getUserByEmail(email: string): Promise<User | null> {
    try {
      await this.ensureInitialized();
      return await this.userRepo.findOne({ 
        where: { email: email.toLowerCase() } 
      });
    } catch (error) {
      console.error('Error getting user by email:', error);
      throw new Error(`Failed to get user: ${(error as Error).message}`);
    }
  }

  public async getAllUsers(): Promise<User[]> {
    try {
      await this.ensureInitialized();
      return await this.userRepo.find({
        order: { createdAt: 'DESC' }
      });
    } catch (error) {
      console.error('Error getting all users:', error);
      throw new Error(`Failed to get users: ${(error as Error).message}`);
    }
  }

  public async updateUser(userId: string, updates: Partial<Pick<User, 'name' | 'email'>>): Promise<User | null> {
    try {
      await this.ensureInitialized();
      
      const user = await this.userRepo.findOne({ where: { id: userId } });
      if (!user) {
        return null;
      }

      // Check if email is being updated and if it already exists
      if (updates.email) {
        const existingUser = await this.userRepo.findOne({
          where: { email: updates.email.toLowerCase() }
        });
        if (existingUser && existingUser.id !== userId) {
          throw new Error('User with this email already exists');
        }
      }

      Object.assign(user, updates);
      if (updates.email) {
        user.email = updates.email.toLowerCase();
      }

      return await this.userRepo.save(user);
    } catch (error) {
      console.error('Error updating user:', error);
      throw new Error(`Failed to update user: ${(error as Error).message}`);
    }
  }

  public async deleteUser(userId: string): Promise<boolean> {
    try {
      await this.ensureInitialized();
      
      const result = await this.userRepo.delete(userId);
      return !!(result.affected && result.affected > 0);
    } catch (error) {
      console.error('Error deleting user:', error);
      throw new Error(`Failed to delete user: ${(error as Error).message}`);
    }
  }

  public async searchUsers(query: string): Promise<User[]> {
    try {
      await this.ensureInitialized();
      
      const lowercaseQuery = query.toLowerCase();
      
      return await this.userRepo
        .createQueryBuilder('user')
        .where('LOWER(user.name) LIKE :query OR LOWER(user.email) LIKE :query', {
          query: `%${lowercaseQuery}%`
        })
        .getMany();
    } catch (error) {
      console.error('Error searching users:', error);
      throw new Error(`Failed to search users: ${(error as Error).message}`);
    }
  }

  public async getUserStats(): Promise<{
    total: number;
    createdToday: number;
    createdThisMonth: number;
  }> {
    try {
      await this.ensureInitialized();
      
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);

      const total = await this.userRepo.count();
      
      const createdToday = await this.userRepo
        .createQueryBuilder('user')
        .where('user.createdAt >= :today', { today })
        .getCount();
        
      const createdThisMonth = await this.userRepo
        .createQueryBuilder('user')
        .where('user.createdAt >= :thisMonth', { thisMonth })
        .getCount();

      return { total, createdToday, createdThisMonth };
    } catch (error) {
      console.error('Error getting user stats:', error);
      throw new Error(`Failed to get user stats: ${(error as Error).message}`);
    }
  }
}

export const userService = new UserService();
export default userService;
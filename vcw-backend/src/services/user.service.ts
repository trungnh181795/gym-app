import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import path from 'path';
import { User, CreateUserRequest } from '../types';

export class UserService {
  private usersFilePath: string;

  constructor() {
    this.usersFilePath = path.join(process.cwd(), 'storage', 'users.json');
    this.ensureStorageExists();
  }

  private ensureStorageExists(): void {
    const storageDir = path.dirname(this.usersFilePath);
    if (!fs.existsSync(storageDir)) {
      fs.mkdirSync(storageDir, { recursive: true });
    }
    
    if (!fs.existsSync(this.usersFilePath)) {
      fs.writeFileSync(this.usersFilePath, JSON.stringify([], null, 2));
    }
  }

  private readUsers(): User[] {
    try {
      const data = fs.readFileSync(this.usersFilePath, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      console.error('Error reading users:', error);
      return [];
    }
  }

  private writeUsers(users: User[]): void {
    try {
      fs.writeFileSync(this.usersFilePath, JSON.stringify(users, null, 2));
    } catch (error) {
      console.error('Error writing users:', error);
      throw new Error('Failed to save users');
    }
  }

  public async createUser(request: CreateUserRequest): Promise<User> {
    try {
      const users = this.readUsers();
      
      // Check if email already exists
      const existingUser = users.find(user => user.email.toLowerCase() === request.email.toLowerCase());
      if (existingUser) {
        throw new Error('User with this email already exists');
      }

      const now = new Date().toISOString();
      const userId = uuidv4();
      
      const newUser: User = {
        id: userId,
        name: request.name,
        email: request.email.toLowerCase(),
        password: request.password,
        phone: request.phone,
        status: request.status || 'active',
        walletDid: `did:gym:user:${userId}`,
        createdAt: now,
        updatedAt: now
      };

      users.push(newUser);
      this.writeUsers(users);

      return newUser;
    } catch (error) {
      console.error('Error creating user:', error);
      throw new Error(`Failed to create user: ${(error as Error).message}`);
    }
  }

  public async getUserById(userId: string): Promise<User | null> {
    try {
      const users = this.readUsers();
      return users.find(user => user.id === userId) || null;
    } catch (error) {
      console.error('Error getting user:', error);
      throw new Error(`Failed to get user: ${(error as Error).message}`);
    }
  }

  public async getUserByEmail(email: string): Promise<User | null> {
    try {
      const users = this.readUsers();
      return users.find(user => user.email.toLowerCase() === email.toLowerCase()) || null;
    } catch (error) {
      console.error('Error getting user by email:', error);
      throw new Error(`Failed to get user: ${(error as Error).message}`);
    }
  }

  public async getAllUsers(): Promise<User[]> {
    try {
      return this.readUsers();
    } catch (error) {
      console.error('Error getting all users:', error);
      throw new Error(`Failed to get users: ${(error as Error).message}`);
    }
  }

  public async updateUser(userId: string, updates: Partial<Pick<User, 'name' | 'email'>>): Promise<User | null> {
    try {
      const users = this.readUsers();
      const userIndex = users.findIndex(user => user.id === userId);
      
      if (userIndex === -1) {
        return null;
      }

      // Check if email is being updated and if it already exists
      if (updates.email) {
        const existingUser = users.find(user => 
          user.email.toLowerCase() === updates.email!.toLowerCase() && user.id !== userId
        );
        if (existingUser) {
          throw new Error('User with this email already exists');
        }
      }

      const updatedUser: User = {
        ...users[userIndex],
        ...updates,
        email: updates.email ? updates.email.toLowerCase() : users[userIndex].email,
        updatedAt: new Date().toISOString()
      };

      users[userIndex] = updatedUser;
      this.writeUsers(users);

      return updatedUser;
    } catch (error) {
      console.error('Error updating user:', error);
      throw new Error(`Failed to update user: ${(error as Error).message}`);
    }
  }

  public async deleteUser(userId: string): Promise<boolean> {
    try {
      const users = this.readUsers();
      const userIndex = users.findIndex(user => user.id === userId);
      
      if (userIndex === -1) {
        return false;
      }

      users.splice(userIndex, 1);
      this.writeUsers(users);

      return true;
    } catch (error) {
      console.error('Error deleting user:', error);
      throw new Error(`Failed to delete user: ${(error as Error).message}`);
    }
  }

  public async searchUsers(query: string): Promise<User[]> {
    try {
      const users = this.readUsers();
      const lowercaseQuery = query.toLowerCase();
      
      return users.filter(user => 
        user.name.toLowerCase().includes(lowercaseQuery) ||
        user.email.toLowerCase().includes(lowercaseQuery)
      );
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
      const users = this.readUsers();
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);

      return {
        total: users.length,
        createdToday: users.filter(user => new Date(user.createdAt) >= today).length,
        createdThisMonth: users.filter(user => new Date(user.createdAt) >= thisMonth).length
      };
    } catch (error) {
      console.error('Error getting user stats:', error);
      throw new Error(`Failed to get user stats: ${(error as Error).message}`);
    }
  }
}

export const userService = new UserService();
export default userService;
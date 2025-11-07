import { Router, Request, Response } from 'express';
import { userService } from '../services/user.service';
import { ApiResponse, CreateUserRequest } from '../types';

const router = Router();

// Create a new user
router.post('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const createUserRequest: CreateUserRequest = req.body;
    
    if (!createUserRequest.name || !createUserRequest.email) {
      res.status(400).json({
        success: false,
        error: 'Name and email are required'
      } as ApiResponse);
      return;
    }

    const user = await userService.createUser(createUserRequest);
    
    res.status(201).json({
      success: true,
      message: 'User created successfully',
      data: user
    } as ApiResponse);
  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create user',
      message: (error as Error).message
    } as ApiResponse);
  }
});

// Get all users
router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const { search } = req.query;
    
    let users;
    if (search && typeof search === 'string') {
      users = await userService.searchUsers(search);
    } else {
      users = await userService.getAllUsers();
    }
    
    res.json({
      success: true,
      message: 'Users retrieved successfully',
      data: users
    } as ApiResponse);
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get users',
      message: (error as Error).message
    } as ApiResponse);
  }
});

// Get user by ID
router.get('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const user = await userService.getUserById(id);
    
    if (!user) {
      res.status(404).json({
        success: false,
        error: 'User not found'
      } as ApiResponse);
      return;
    }
    
    res.json({
      success: true,
      message: 'User retrieved successfully',
      data: user
    } as ApiResponse);
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get user',
      message: (error as Error).message
    } as ApiResponse);
  }
});

// Update user
router.put('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    const user = await userService.updateUser(id, updates);
    
    if (!user) {
      res.status(404).json({
        success: false,
        error: 'User not found'
      } as ApiResponse);
      return;
    }
    
    res.json({
      success: true,
      message: 'User updated successfully',
      data: user
    } as ApiResponse);
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update user',
      message: (error as Error).message
    } as ApiResponse);
  }
});

// Delete user
router.delete('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const deleted = await userService.deleteUser(id);
    
    if (!deleted) {
      res.status(404).json({
        success: false,
        error: 'User not found'
      } as ApiResponse);
      return;
    }
    
    res.json({
      success: true,
      message: 'User deleted successfully'
    } as ApiResponse);
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete user',
      message: (error as Error).message
    } as ApiResponse);
  }
});

export default router;
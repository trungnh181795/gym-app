import express from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { userService } from '../services/user.service';
import { ApiResponse, ApiErrorResponse } from '../types';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const SALT_ROUNDS = 10;

interface LoginRequest {
  email: string;
  password: string;
}

interface RegisterRequest {
  name: string;
  email: string;
  password: string;
  phone?: string;
}

interface AuthResponse {
  token: string;
  user: {
    id: string;
    name: string;
    email: string;
    phone?: string;
  };
}

// Login endpoint
router.post('/login', async (req, res) => {
  try {
    const { email, password }: LoginRequest = req.body;

    if (!email || !password) {
      const errorResponse: ApiErrorResponse = {
        error: 'Validation Error',
        message: 'Email and password are required'
      };
      return res.status(400).json(errorResponse);
    }

    // Get user by email
    const user = await userService.getUserByEmail(email);
    if (!user) {
      const errorResponse: ApiErrorResponse = {
        error: 'Authentication Error',
        message: 'Invalid email or password'
      };
      return res.status(401).json(errorResponse);
    }

    // For now, we'll do simple password comparison since users might not have hashed passwords
    // In a real app, you'd always hash passwords
    let isValidPassword = false;
    
    if (user.password) {
      // Check if password looks like a bcrypt hash (starts with $2b$, $2a$, or $2y$)
      const isBcryptHash = /^\$2[aby]\$/.test(user.password);
      
      if (isBcryptHash) {
        // It's a hashed password, use bcrypt
        try {
          isValidPassword = await bcrypt.compare(password, user.password);
        } catch (error) {
          console.error('Bcrypt comparison error:', error);
          isValidPassword = false;
        }
      } else {
        // It's a plain text password, do direct comparison
        isValidPassword = user.password === password;
      }
    }

    if (!isValidPassword) {
      const errorResponse: ApiErrorResponse = {
        error: 'Authentication Error',
        message: 'Invalid email or password'
      };
      return res.status(401).json(errorResponse);
    }

    // Generate JWT token
    const token = jwt.sign(
      { 
        userId: user.id, 
        email: user.email,
        name: user.name
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    const authResponse: AuthResponse = {
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone
      }
    };

    const response: ApiResponse<AuthResponse> = {
      success: true,
      message: 'Login successful',
      data: authResponse
    };

    res.json(response);
  } catch (error) {
    console.error('Login error:', error);
    const errorResponse: ApiErrorResponse = {
      error: 'Server Error',
      message: 'An error occurred during login'
    };
    res.status(500).json(errorResponse);
  }
});

// Register endpoint
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, phone }: RegisterRequest = req.body;

    if (!name || !email || !password) {
      const errorResponse: ApiErrorResponse = {
        error: 'Validation Error',
        message: 'Name, email, and password are required'
      };
      return res.status(400).json(errorResponse);
    }

    // Check if user already exists
    const existingUser = await userService.getUserByEmail(email);
    if (existingUser) {
      const errorResponse: ApiErrorResponse = {
        error: 'Validation Error',
        message: 'User with this email already exists'
      };
      return res.status(409).json(errorResponse);
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

    // Create new user
    const newUser = await userService.createUser({
      name,
      email,
      password: hashedPassword,
      phone,
      status: 'active'
    });

    // Generate JWT token
    const token = jwt.sign(
      { 
        userId: newUser.id, 
        email: newUser.email,
        name: newUser.name
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    const authResponse: AuthResponse = {
      token,
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        phone: newUser.phone
      }
    };

    const response: ApiResponse<AuthResponse> = {
      success: true,
      message: 'Registration successful',
      data: authResponse
    };

    res.status(201).json(response);
  } catch (error) {
    console.error('Registration error:', error);
    const errorResponse: ApiErrorResponse = {
      error: 'Server Error',
      message: 'An error occurred during registration'
    };
    res.status(500).json(errorResponse);
  }
});

// Verify token endpoint
router.get('/verify', (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      const errorResponse: ApiErrorResponse = {
        error: 'Authentication Error',
        message: 'No token provided'
      };
      return res.status(401).json(errorResponse);
    }

    const decoded = jwt.verify(token, JWT_SECRET) as any;

    const response: ApiResponse = {
      success: true,
      message: 'Token is valid',
      data: {
        userId: decoded.userId,
        email: decoded.email,
        name: decoded.name
      }
    };

    res.json(response);
  } catch (error) {
    console.error('Token verification error:', error);
    const errorResponse: ApiErrorResponse = {
      error: 'Authentication Error',
      message: 'Invalid or expired token'
    };
    res.status(401).json(errorResponse);
  }
});

export default router;
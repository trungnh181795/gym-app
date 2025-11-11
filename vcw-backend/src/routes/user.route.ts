import { Router, Request, Response, NextFunction, RequestHandler } from 'express';
import jwt from 'jsonwebtoken';
import { ApiResponse, ApiErrorResponse } from '../types';
import { benefitManager } from '../services/benefit.service';
import { membershipService } from '../services/membership.service';
import { serviceManager } from '../services/service.service';
import { storageService } from '../services/storage.service';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Extend Express Request type to include user property
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        name: string;
        email: string;
      };
    }
  }
}

const router = Router();

// Middleware to extract user from token or cookie
const authenticateUser: RequestHandler = (req: Request, res: Response, next: NextFunction) => {
  // Extract token from Authorization header or cookie
  let token = req.headers.authorization?.replace('Bearer ', '');
  
  // If no authorization header, check cookies
  if (!token && req.cookies) {
    token = req.cookies['jwt'] || req.cookies['token'] || req.cookies['auth'];
  }

  if (!token) {
    const errorResponse: ApiErrorResponse = {
      error: 'Unauthorized',
      message: 'Authentication token is required (via cookie or Authorization header)'
    };
    return res.status(401).json(errorResponse);
  }

  try {
    // Proper JWT verification
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    req.user = {
      id: decoded.userId,
      name: decoded.name,
      email: decoded.email
    };
    next();
  } catch (error) {
    console.error('JWT verification failed:', error);
    const errorResponse: ApiErrorResponse = {
      error: 'Unauthorized',
      message: 'Invalid or expired authentication token'
    };
    return res.status(401).json(errorResponse);
  }
};

// GET /api/user/benefits - Get current user's benefits
router.get('/benefits', authenticateUser, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      const errorResponse: ApiErrorResponse = {
        error: 'Unauthorized',
        message: 'User ID not found in token'
      };
      return res.status(401).json(errorResponse);
    }

    // Get user's active memberships
    const memberships = await membershipService.getMembershipsByUserId(userId);
    const activeMemberships = memberships.filter(m => 
      m.status === 'active' && 
      new Date(m.validFrom) <= new Date() && 
      new Date(m.validUntil) >= new Date()
    );

    // Handle both old and new membership structures
    let userBenefits: any[] = [];
    
    if (activeMemberships.length > 0) {
      // Check if memberships use new structure (with benefitIds) or old structure (with embedded benefits)
      const firstMembership = activeMemberships[0];
      
      if (firstMembership.benefitIds && firstMembership.benefitIds.length > 0) {
        // New structure: membership references separate benefit entities
        const benefitIds = Array.from(new Set(
          activeMemberships.flatMap(m => m.benefitIds)
        ));
        const allBenefits = await benefitManager.getAllBenefits();
        userBenefits = allBenefits.filter(b => benefitIds.includes(b.id));
      } else if ((firstMembership as any).benefits) {
        // Old structure: benefits are embedded in membership
        userBenefits = activeMemberships.flatMap((m: any) => 
          (m.benefits || []).map((benefit: any, index: number) => ({
            id: `${m.id}-benefit-${index}`,
            name: benefit.name,
            description: benefit.description || 'Gym membership benefit',
            price: 0, // Old structure doesn't have individual benefit prices
            serviceIds: [], // Map these based on benefit type if needed
            startDate: m.validFrom + 'T00:00:00.000Z',
            endDate: m.validUntil + 'T23:59:59.999Z',
            maxUsesPerMonth: undefined,
            requiresBooking: benefit.requiresBooking || false,
            isShareable: false
          }))
        );
      }
    }

    // Get all services for mapping
    const allServices = await serviceManager.getAllServices();

    // Get credentials for this user
    const allCredentials = await storageService.readAllCredentials();
    
    // Get all credentials where this user is the holder (includes both owned and shared)
    const userCredentials = allCredentials.filter(c => 
      c.metadata?.userId === userId && c.status === 'active'
    );
    
    // Get benefit IDs from user's credentials
    const userBenefitIds = userCredentials
      .map(c => c.benefitId)
      .filter(Boolean);
    
    // Get all the benefits for these credentials
    if (userBenefitIds.length > 0) {
      const allBenefits = await benefitManager.getAllBenefits();
      const credentialBenefits = allBenefits.filter(b => userBenefitIds.includes(b.id));
      
      // Add these benefits to userBenefits (avoid duplicates)
      const existingBenefitIds = new Set(userBenefits.map(b => b.id));
      credentialBenefits.forEach(benefit => {
        if (!existingBenefitIds.has(benefit.id)) {
          userBenefits.push(benefit);
        }
      });
    }
    
    // Enrich benefits with service details and credential IDs
    const enrichedBenefits = userBenefits.map(benefit => {
      // Map services
      const serviceIds = benefit.serviceIds || [];
      const services = serviceIds.map(serviceId => 
        allServices.find(s => s.id === serviceId)
      ).filter(Boolean);

      // Find credential for this benefit and user
      const credential = userCredentials.find(c => c.benefitId === benefit.id);
      
      // Check if this is a shared benefit (benefit.sharedWithUserId matches current user)
      const isShared = benefit.sharedWithUserId === userId;

      return {
        id: benefit.id,
        name: benefit.name,
        description: benefit.description,
        price: benefit.price || 0,
        services: services,
        startDate: benefit.startDate || new Date().toISOString(),
        endDate: benefit.endDate || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
        maxUsesPerMonth: benefit.maxUsesPerMonth,
        requiresBooking: benefit.requiresBooking || false,
        isShareable: benefit.isShareable || false,
        credentialId: credential?.id,
        isShared: isShared // Flag to indicate if this is a shared benefit
      };
    });

    const response: ApiResponse = {
      success: true,
      message: 'User benefits retrieved successfully',
      data: enrichedBenefits
    };

    res.json(response);
  } catch (error) {
    console.error('Error fetching user benefits:', error);
    const errorResponse: ApiErrorResponse = {
      error: 'Internal Server Error',
      message: 'Failed to fetch user benefits'
    };
    res.status(500).json(errorResponse);
  }
});

// GET /api/user/memberships - Get current user's memberships
router.get('/memberships', authenticateUser, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      const errorResponse: ApiErrorResponse = {
        error: 'Unauthorized',
        message: 'User ID not found in token'
      };
      return res.status(401).json(errorResponse);
    }

    const memberships = await membershipService.getMembershipsByUserId(userId);

    const response: ApiResponse = {
      success: true,
      message: 'User memberships retrieved successfully',
      data: memberships
    };

    res.json(response);
  } catch (error) {
    console.error('Error fetching user memberships:', error);
    const errorResponse: ApiErrorResponse = {
      error: 'Internal Server Error',
      message: 'Failed to fetch user memberships'
    };
    res.status(500).json(errorResponse);
  }
});

// GET /api/user/credentials - Get current user's credentials
router.get('/credentials', authenticateUser, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      const errorResponse: ApiErrorResponse = {
        error: 'Unauthorized',
        message: 'User ID not found in token'
      };
      return res.status(401).json(errorResponse);
    }

    const allCredentials = await storageService.readAllCredentials();
    
    // Get all credentials where this user is the holder
    const userCredentials = allCredentials.filter(c => c.metadata?.userId === userId);
    
    // For each credential, check if it's a shared benefit
    const enrichedCredentials = await Promise.all(userCredentials.map(async (c) => {
      if (c.benefitId) {
        const benefit = await benefitManager.getBenefitById(c.benefitId);
        const isShared = benefit?.sharedWithUserId === userId;
        return { ...c, isShared };
      }
      return { ...c, isShared: false };
    }));

    const response: ApiResponse = {
      success: true,
      message: 'User credentials retrieved successfully',
      data: enrichedCredentials
    };

    res.json(response);
  } catch (error) {
    console.error('Error fetching user credentials:', error);
    const errorResponse: ApiErrorResponse = {
      error: 'Internal Server Error',
      message: 'Failed to fetch user credentials'
    };
    res.status(500).json(errorResponse);
  }
});

// POST /api/user/credentials/:id/qr - Generate temporary QR code for user's credential
router.post('/credentials/:id/qr', authenticateUser, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    
    if (!userId) {
      const errorResponse: ApiErrorResponse = {
        error: 'Unauthorized',
        message: 'User ID not found in token'
      };
      return res.status(401).json(errorResponse);
    }

    // Verify the credential belongs to the user
    const credential = await storageService.readCredential(id);
    if (!credential) {
      const errorResponse: ApiErrorResponse = {
        error: 'Not Found',
        message: 'Credential not found'
      };
      return res.status(404).json(errorResponse);
    }

    if (credential.metadata?.userId !== userId) {
      const errorResponse: ApiErrorResponse = {
        error: 'Forbidden',
        message: 'Access denied to this credential'
      };
      return res.status(403).json(errorResponse);
    }

    if (credential.status !== 'active') {
      const errorResponse: ApiErrorResponse = {
        error: 'Bad Request',
        message: 'Credential is not active'
      };
      return res.status(400).json(errorResponse);
    }

    // Check if credential is expired
    if (new Date(credential.expireDate) < new Date()) {
      const errorResponse: ApiErrorResponse = {
        error: 'Bad Request',
        message: 'Credential has expired'
      };
      return res.status(400).json(errorResponse);
    }

    // Generate QR code data (in production, this would create a temporary access token)
    const qrData = {
      credentialId: credential.id,
      holder: credential.holderDid,
      benefitId: credential.benefitId,
      timestamp: new Date().toISOString(),
      expiresIn: 60 // seconds
    };

    const response: ApiResponse = {
      success: true,
      message: 'QR code generated successfully',
      data: {
        qrData: JSON.stringify(qrData),
        expiresAt: new Date(Date.now() + 60 * 1000).toISOString(),
        credential: credential
      }
    };

    res.json(response);
  } catch (error) {
    console.error('Error generating QR code:', error);
    const errorResponse: ApiErrorResponse = {
      error: 'Internal Server Error',
      message: 'Failed to generate QR code'
    };
    res.status(500).json(errorResponse);
  }
});

export default router;
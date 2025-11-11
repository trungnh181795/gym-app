import { Router, Request, Response } from 'express';
import { membershipService } from '../services/membership.service';
import { tokenService } from '../services/token.service';
import { ApiResponse, CreateMembershipRequest } from '../types';

const router = Router();

// Create a new membership
router.post('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const createMembershipRequest: CreateMembershipRequest = req.body;
    
    if (!createMembershipRequest.userId || !createMembershipRequest.name) {
      res.status(400).json({
        success: false,
        error: 'User ID and name are required'
      } as ApiResponse);
      return;
    }

    const result = await membershipService.createMembership(createMembershipRequest);
    
    // Create a SHORT token (16 chars) that references the credentials
    const credentialToken = await tokenService.createCredentialToken(result.credentials);
    
    res.status(201).json({
      success: true,
      message: `Membership created successfully with ${result.credentials.length} benefit credentials auto-generated`,
      data: {
        membership: result.membership,
        credentialToken: credentialToken
      }
    } as ApiResponse);
  } catch (error) {
    console.error('Create membership error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create membership',
      message: (error as Error).message
    } as ApiResponse);
  }
});

// Get all memberships with full details (for dashboard)
router.get('/with-details', async (req: Request, res: Response): Promise<void> => {
  try {
    const memberships = await membershipService.getAllMembershipsWithBenefits();
    
    res.json({
      success: true,
      message: 'Memberships with details retrieved successfully',
      data: memberships
    } as ApiResponse);
  } catch (error) {
    console.error('Get memberships with details error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get memberships with details',
      message: (error as Error).message
    } as ApiResponse);
  }
});

// Get all memberships
router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId } = req.query;
    
    let memberships;
    if (userId && typeof userId === 'string') {
      memberships = await membershipService.getMembershipsByUserId(userId);
    } else {
      memberships = await membershipService.getAllMemberships();
    }
    
    res.json({
      success: true,
      message: 'Memberships retrieved successfully',
      data: memberships
    } as ApiResponse);
  } catch (error) {
    console.error('Get memberships error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get memberships',
      message: (error as Error).message
    } as ApiResponse);
  }
});

// Get membership by ID
router.get('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const membership = await membershipService.getMembershipById(id);
    
    if (!membership) {
      res.status(404).json({
        success: false,
        error: 'Membership not found'
      } as ApiResponse);
      return;
    }
    
    res.json({
      success: true,
      message: 'Membership retrieved successfully',
      data: membership
    } as ApiResponse);
  } catch (error) {
    console.error('Get membership error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get membership',
      message: (error as Error).message
    } as ApiResponse);
  }
});

// Update membership
router.put('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    const membership = await membershipService.updateMembership(id, updates);
    
    if (!membership) {
      res.status(404).json({
        success: false,
        error: 'Membership not found'
      } as ApiResponse);
      return;
    }
    
    res.json({
      success: true,
      message: 'Membership updated successfully',
      data: membership
    } as ApiResponse);
  } catch (error) {
    console.error('Update membership error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update membership',
      message: (error as Error).message
    } as ApiResponse);
  }
});

// Delete membership
router.delete('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const deleted = await membershipService.deleteMembership(id);
    
    if (!deleted) {
      res.status(404).json({
        success: false,
        error: 'Membership not found'
      } as ApiResponse);
      return;
    }
    
    res.json({
      success: true,
      message: 'Membership deleted successfully'
    } as ApiResponse);
  } catch (error) {
    console.error('Delete membership error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete membership',
      message: (error as Error).message
    } as ApiResponse);
  }
});

// Get membership with benefits details
router.get('/:id/with-benefits', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const membership = await membershipService.getMembershipWithBenefits(id);
    
    if (!membership) {
      res.status(404).json({
        success: false,
        error: 'Membership not found'
      } as ApiResponse);
      return;
    }
    
    res.json({
      success: true,
      message: 'Membership with benefits retrieved successfully',
      data: membership
    } as ApiResponse);
  } catch (error) {
    console.error('Get membership with benefits error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get membership with benefits',
      message: (error as Error).message
    } as ApiResponse);
  }
});

// Get all memberships with benefits details
router.get('/with-benefits/all', async (req: Request, res: Response): Promise<void> => {
  try {
    const memberships = await membershipService.getAllMembershipsWithBenefits();
    
    res.json({
      success: true,
      message: 'Memberships with benefits retrieved successfully',
      data: memberships
    } as ApiResponse);
  } catch (error) {
    console.error('Get memberships with benefits error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get memberships with benefits',
      message: (error as Error).message
    } as ApiResponse);
  }
});

// Get membership statistics
router.get('/stats/overview', async (req: Request, res: Response): Promise<void> => {
  try {
    const stats = await membershipService.getMembershipStats();
    
    res.json({
      success: true,
      message: 'Membership statistics retrieved successfully',
      data: stats
    } as ApiResponse);
  } catch (error) {
    console.error('Get membership stats error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get membership statistics',
      message: (error as Error).message
    } as ApiResponse);
  }
});

export default router;
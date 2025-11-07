import { Router, Request, Response } from 'express';
import { sharingService } from '../services/sharing.service';
import { ApiResponse, CreateShareRequest } from '../types';

const router = Router();

// Create a new share for a credential
router.post('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const createShareRequest: CreateShareRequest = req.body;
    
    if (!createShareRequest.credentialId) {
      res.status(400).json({
        success: false,
        error: 'Credential ID is required'
      } as ApiResponse);
      return;
    }

    const share = await sharingService.createShare(createShareRequest);
    
    res.status(201).json({
      success: true,
      message: 'Share created successfully',
      data: share
    } as ApiResponse);
  } catch (error) {
    console.error('Create share error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create share',
      message: (error as Error).message
    } as ApiResponse);
  }
});

// Get shared credential by share ID (public endpoint)
router.get('/:shareId', async (req: Request, res: Response): Promise<void> => {
  try {
    const { shareId } = req.params;
    const sharedCredential = await sharingService.getSharedCredential(shareId);
    
    if (!sharedCredential.valid) {
      res.status(404).json({
        success: false,
        error: 'Share not found or expired',
        message: sharedCredential.message
      } as ApiResponse);
      return;
    }
    
    res.json({
      success: true,
      message: 'Shared credential retrieved successfully',
      data: {
        jwt: sharedCredential.jwt,
        credential: sharedCredential.credential,
        valid: sharedCredential.valid
      }
    } as ApiResponse);
  } catch (error) {
    console.error('Get shared credential error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get shared credential',
      message: (error as Error).message
    } as ApiResponse);
  }
});

// Get all active shares for a credential
router.get('/credential/:credentialId', async (req: Request, res: Response): Promise<void> => {
  try {
    const { credentialId } = req.params;
    const shares = await sharingService.getSharesByCredentialId(credentialId);
    
    res.json({
      success: true,
      message: 'Shares retrieved successfully',
      data: shares
    } as ApiResponse);
  } catch (error) {
    console.error('Get shares by credential error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get shares',
      message: (error as Error).message
    } as ApiResponse);
  }
});

// Revoke a share
router.delete('/:shareId', async (req: Request, res: Response): Promise<void> => {
  try {
    const { shareId } = req.params;
    const revoked = await sharingService.revokeShare(shareId);
    
    if (!revoked) {
      res.status(404).json({
        success: false,
        error: 'Share not found'
      } as ApiResponse);
      return;
    }
    
    res.json({
      success: true,
      message: 'Share revoked successfully'
    } as ApiResponse);
  } catch (error) {
    console.error('Revoke share error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to revoke share',
      message: (error as Error).message
    } as ApiResponse);
  }
});

// Clean up expired shares
router.post('/cleanup/expired', async (req: Request, res: Response): Promise<void> => {
  try {
    const cleanedCount = await sharingService.cleanupExpiredShares();
    
    res.json({
      success: true,
      message: `Cleaned up ${cleanedCount} expired shares`,
      data: { cleanedCount }
    } as ApiResponse);
  } catch (error) {
    console.error('Cleanup expired shares error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to cleanup expired shares',
      message: (error as Error).message
    } as ApiResponse);
  }
});

// Get sharing statistics
router.get('/stats/overview', async (req: Request, res: Response): Promise<void> => {
  try {
    const stats = await sharingService.getShareStats();
    
    res.json({
      success: true,
      message: 'Share statistics retrieved successfully',
      data: stats
    } as ApiResponse);
  } catch (error) {
    console.error('Get share stats error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get share statistics',
      message: (error as Error).message
    } as ApiResponse);
  }
});

export default router;
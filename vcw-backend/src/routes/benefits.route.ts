import { Router, Request, Response } from 'express';
import { benefitManager } from '../services/benefit.service';
import { CreateBenefitRequest } from '../types';

const router = Router();

// GET /api/benefits - Get all benefits
router.get('/', async (req: Request, res: Response) => {
    try {
        const benefits = await benefitManager.getAllBenefits();
        res.json({
            success: true,
            message: 'Benefits retrieved successfully',
            data: benefits
        });
    } catch (error) {
        console.error('Error getting benefits:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get benefits',
            error: (error as Error).message
        });
    }
});

// GET /api/benefits/active - Get active benefits
router.get('/active', async (req: Request, res: Response) => {
    try {
        const benefits = await benefitManager.getActiveBenefits();
        res.json({
            success: true,
            message: 'Active benefits retrieved successfully',
            data: benefits
        });
    } catch (error) {
        console.error('Error getting active benefits:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get active benefits',
            error: (error as Error).message
        });
    }
});

// GET /api/benefits/with-services - Get all benefits with their services
router.get('/with-services', async (req: Request, res: Response) => {
    try {
        const benefits = await benefitManager.getAllBenefits();
        const benefitIds = benefits.map(b => b.id);
        const benefitsWithServices = await benefitManager.getBenefitsWithServices(benefitIds);
        
        res.json({
            success: true,
            message: 'Benefits with services retrieved successfully',
            data: benefitsWithServices
        });
    } catch (error) {
        console.error('Error getting benefits with services:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get benefits with services',
            error: (error as Error).message
        });
    }
});

// GET /api/benefits/:id - Get benefit by ID
router.get('/:id', async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const benefit = await benefitManager.getBenefitById(id);

        if (!benefit) {
            res.status(404).json({
                success: false,
                message: 'Benefit not found'
            });
        }

        res.json({
            success: true,
            message: 'Benefit retrieved successfully',
            data: benefit
        });
    } catch (error) {
        console.error('Error getting benefit:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get benefit',
            error: (error as Error).message
        });
    }
});

// GET /api/benefits/:id/with-services - Get benefit with services details
router.get('/:id/with-services', async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const benefits = await benefitManager.getBenefitsWithServices([id]);

        if (benefits.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Benefit not found'
            });
        }

        res.json({
            success: true,
            message: 'Benefit with services retrieved successfully',
            data: benefits[0]
        });
    } catch (error) {
        console.error('Error getting benefit with services:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get benefit with services',
            error: (error as Error).message
        });
    }
});

// POST /api/benefits - Create new benefit
router.post('/', async (req: Request, res: Response) => {
    try {
        const benefitData: CreateBenefitRequest = req.body;

        // Basic validation
        if (!benefitData.name || !benefitData.description || !benefitData.price || !benefitData.serviceIds || !benefitData.startDate || !benefitData.endDate) {
            return res.status(400).json({
                success: false,
                message: 'Name, description, price, serviceIds, startDate, and endDate are required'
            });
        }

        if (!Array.isArray(benefitData.serviceIds) || benefitData.serviceIds.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'At least one service ID must be provided'
            });
        }

        if (benefitData.price <= 0) {
            return res.status(400).json({
                success: false,
                message: 'Price must be greater than 0'
            });
        }

        // Validate dates
        const startDate = new Date(benefitData.startDate);
        const endDate = new Date(benefitData.endDate);

        if (endDate <= startDate) {
            return res.status(400).json({
                success: false,
                message: 'End date must be after start date'
            });
        }

        const benefit = await benefitManager.createBenefit(benefitData);

        res.status(201).json({
            success: true,
            message: 'Benefit created successfully',
            data: benefit
        });
    } catch (error) {
        console.error('Error creating benefit:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create benefit',
            error: (error as Error).message
        });
    }
});

// PUT /api/benefits/:id - Update benefit
router.put('/:id', async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const updates = req.body;

        // Validate price if provided
        if (updates.price !== undefined && updates.price <= 0) {
            return res.status(400).json({
                success: false,
                message: 'Price must be greater than 0'
            });
        }

        // Validate dates if provided
        if (updates.startDate && updates.endDate) {
            const startDate = new Date(updates.startDate);
            const endDate = new Date(updates.endDate);

            if (endDate <= startDate) {
                return res.status(400).json({
                    success: false,
                    message: 'End date must be after start date'
                });
            }
        }

        // Validate service IDs if provided
        if (updates.serviceIds && (!Array.isArray(updates.serviceIds) || updates.serviceIds.length === 0)) {
            return res.status(400).json({
                success: false,
                message: 'At least one service ID must be provided'
            });
        }

        const benefit = await benefitManager.updateBenefit(id, updates);

        if (!benefit) {
            return res.status(404).json({
                success: false,
                message: 'Benefit not found'
            });
        }

        res.json({
            success: true,
            message: 'Benefit updated successfully',
            data: benefit
        });
    } catch (error) {
        console.error('Error updating benefit:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update benefit',
            error: (error as Error).message
        });
    }
});

// POST /api/benefits/:id/share - Share benefit with another user
router.post('/:id/share', async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { targetUserId } = req.body;

        if (!targetUserId) {
            return res.status(400).json({
                success: false,
                message: 'Target user ID is required'
            });
        }

        const sharedBenefit = await benefitManager.shareBenefit(id, targetUserId);

        if (!sharedBenefit) {
            return res.status(404).json({
                success: false,
                message: 'Benefit not found or not shareable'
            });
        }

        res.status(201).json({
            success: true,
            message: 'Benefit shared successfully',
            data: sharedBenefit
        });
    } catch (error) {
        console.error('Error sharing benefit:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to share benefit',
            error: (error as Error).message
        });
    }
});

// DELETE /api/benefits/:id - Delete benefit
router.delete('/:id', async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const success = await benefitManager.deleteBenefit(id);

        if (!success) {
            return res.status(404).json({
                success: false,
                message: 'Benefit not found'
            });
        }

        res.json({
            success: true,
            message: 'Benefit deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting benefit:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete benefit',
            error: (error as Error).message
        });
    }
});

export default router;
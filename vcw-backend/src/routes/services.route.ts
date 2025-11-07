import { Router } from 'express';
import { ServiceManager } from '../services/service.service';
import { CreateServiceRequest } from '../types';

const serviceManager = new ServiceManager();

const router = Router();

// GET /api/services - Get all services
router.get('/', async (req, res) => {
  try {
    const services = await serviceManager.getAllServices();
    res.json({
      success: true,
      message: 'Services retrieved successfully',
      data: services
    });
  } catch (error) {
    console.error('Error getting services:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get services',
      error: (error as Error).message
    });
  }
});

// GET /api/services/:id - Get service by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const service = await serviceManager.getServiceById(id);
    
    if (!service) {
      res.status(404).json({
        success: false,
        message: 'Service not found'
      });
      return;
    }

    res.json({
      success: true,
      message: 'Service retrieved successfully',
      data: service
    });
  } catch (error) {
    console.error('Error getting service:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get service',
      error: (error as Error).message
    });
  }
});

// GET /api/services/category/:category - Get services by category
router.get('/category/:category', async (req, res) => {
  try {
    const { category } = req.params;
    
    if (!['facility', 'equipment', 'program', 'wellness'].includes(category)) {
      res.status(400).json({
        success: false,
        message: 'Invalid category. Must be one of: facility, equipment, program, wellness'
      });
      return;
    }

    const services = await serviceManager.getServicesByCategory(category as any);
    res.json({
      success: true,
      message: 'Services retrieved successfully',
      data: services
    });
  } catch (error) {
    console.error('Error getting services by category:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get services by category',
      error: (error as Error).message
    });
  }
});

// POST /api/services - Create new service
router.post('/', async (req, res) => {
  try {
    const serviceData = req.body;
    
    // Basic validation
    if (!serviceData.name || !serviceData.description || !serviceData.category) {
      res.status(400).json({
        success: false,
        message: 'Name, description, and category are required'
      });
      return;
    }

    if (!['facility', 'equipment', 'program', 'wellness'].includes(serviceData.category)) {
      res.status(400).json({
        success: false,
        message: 'Invalid category. Must be one of: facility, equipment, program, wellness'
      });
      return;
    }

    const service = await serviceManager.createService(serviceData);
    
    res.status(201).json({
      success: true,
      message: 'Service created successfully',
      data: service
    });
  } catch (error) {
    console.error('Error creating service:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create service',
      error: (error as Error).message
    });
  }
});

// PUT /api/services/:id - Update service
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    // Validate category if provided
    if (updates.category && !['facility', 'equipment', 'program', 'wellness'].includes(updates.category)) {
      res.status(400).json({
        success: false,
        message: 'Invalid category. Must be one of: facility, equipment, program, wellness'
      });
      return;
    }

    const service = await serviceManager.updateService(id, updates);
    
    if (!service) {
      res.status(404).json({
        success: false,
        message: 'Service not found'
      });
      return;
    }

    res.json({
      success: true,
      message: 'Service updated successfully',
      data: service
    });
  } catch (error) {
    console.error('Error updating service:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update service',
      error: (error as Error).message
    });
  }
});

// DELETE /api/services/:id - Delete service
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const success = await serviceManager.deleteService(id);
    
    if (!success) {
      res.status(404).json({
        success: false,
        message: 'Service not found'
      });
      return;
    }

    res.json({
      success: true,
      message: 'Service deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting service:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete service',
      error: (error as Error).message
    });
  }
});

export default router;
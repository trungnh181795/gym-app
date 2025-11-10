import { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Snackbar,
  Skeleton
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Build as ServiceIcon
} from '@mui/icons-material';

interface Service {
  id: string;
  name: string;
  description: string;
  category: 'facility' | 'equipment' | 'program' | 'wellness';
  metadata?: {
    capacity?: number;
    duration?: number;
    requirements?: string[];
  };
  createdAt: string;
  updatedAt: string;
}

const categoryColors = {
  facility: 'primary',
  equipment: 'secondary',
  program: 'success',
  wellness: 'warning'
} as const;

export default function AdminServices() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: 'facility' as Service['category'],
    capacity: '',
    duration: '',
    requirements: ''
  });
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });

  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/services');
      const data = await response.json();
      setServices(data.data || []);
    } catch (error) {
      console.error('Error fetching services:', error);
      setSnackbar({ open: true, message: 'Failed to fetch services', severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (service?: Service) => {
    if (service) {
      setEditingService(service);
      setFormData({
        name: service.name,
        description: service.description,
        category: service.category,
        capacity: service.metadata?.capacity?.toString() || '',
        duration: service.metadata?.duration?.toString() || '',
        requirements: service.metadata?.requirements?.join(', ') || ''
      });
    } else {
      setEditingService(null);
      setFormData({
        name: '',
        description: '',
        category: 'facility',
        capacity: '',
        duration: '',
        requirements: ''
      });
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingService(null);
  };

  const handleSave = async () => {
    try {
      const metadata: any = {};
      if (formData.capacity) metadata.capacity = parseInt(formData.capacity);
      if (formData.duration) metadata.duration = parseInt(formData.duration);
      if (formData.requirements) metadata.requirements = formData.requirements.split(',').map(r => r.trim());

      const serviceData = {
        name: formData.name,
        description: formData.description,
        category: formData.category,
        metadata: Object.keys(metadata).length > 0 ? metadata : undefined
      };

      const url = editingService ? `/api/services/${editingService.id}` : '/api/services';
      const method = editingService ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(serviceData)
      });

      if (response.ok) {
        setSnackbar({ 
          open: true, 
          message: `Service ${editingService ? 'updated' : 'created'} successfully`, 
          severity: 'success' 
        });
        handleCloseDialog();
        fetchServices();
      } else {
        throw new Error('Failed to save service');
      }
    } catch (error) {
      console.error('Error saving service:', error);
      setSnackbar({ open: true, message: 'Failed to save service', severity: 'error' });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this service?')) return;

    try {
      const response = await fetch(`/api/services/${id}`, { method: 'DELETE' });
      if (response.ok) {
        setSnackbar({ open: true, message: 'Service deleted successfully', severity: 'success' });
        fetchServices();
      } else {
        throw new Error('Failed to delete service');
      }
    } catch (error) {
      console.error('Error deleting service:', error);
      setSnackbar({ open: true, message: 'Failed to delete service', severity: 'error' });
    }
  };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1">
          Services Management
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          Add Service
        </Button>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Description</TableCell>
              <TableCell>Category</TableCell>
              <TableCell>Capacity</TableCell>
              <TableCell>Duration</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              // Skeleton loading rows
              Array.from({ length: 5 }).map((_, index) => (
                <TableRow key={`skeleton-${index}`}>
                  <TableCell>
                    <Box display="flex" alignItems="center" gap={1}>
                      <Skeleton variant="circular" width={24} height={24} />
                      <Skeleton variant="text" width="60%" height={20} />
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Skeleton variant="text" width="80%" height={20} />
                  </TableCell>
                  <TableCell>
                    <Skeleton variant="rounded" width={80} height={24} />
                  </TableCell>
                  <TableCell>
                    <Skeleton variant="text" width={40} height={20} />
                  </TableCell>
                  <TableCell>
                    <Skeleton variant="text" width={60} height={20} />
                  </TableCell>
                  <TableCell>
                    <Box display="flex" gap={1}>
                      <Skeleton variant="circular" width={32} height={32} />
                      <Skeleton variant="circular" width={32} height={32} />
                    </Box>
                  </TableCell>
                </TableRow>
              ))
            ) : services.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                  <Typography variant="body2" color="text.secondary">
                    No services found. Click "Add Service" to create your first service.
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              services.map((service) => (
                <TableRow key={service.id}>
                  <TableCell>
                    <Box display="flex" alignItems="center" gap={1}>
                      <ServiceIcon color="action" />
                      {service.name}
                    </Box>
                  </TableCell>
                  <TableCell>{service.description}</TableCell>
                  <TableCell>
                    <Chip
                      label={service.category}
                      color={categoryColors[service.category]}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>{service.metadata?.capacity || '-'}</TableCell>
                  <TableCell>{service.metadata?.duration ? `${service.metadata.duration} min` : '-'}</TableCell>
                  <TableCell>
                    <IconButton onClick={() => handleOpenDialog(service)} size="small">
                      <EditIcon />
                    </IconButton>
                    <IconButton onClick={() => handleDelete(service.id)} size="small" color="error">
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingService ? 'Edit Service' : 'Add New Service'}
        </DialogTitle>
        <DialogContent>
          <Box display="flex" flexDirection="column" gap={2} mt={1}>
            <TextField
              label="Service Name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              fullWidth
              required
            />
            <TextField
              label="Description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              fullWidth
              multiline
              rows={3}
              required
            />
            <FormControl fullWidth>
              <InputLabel>Category</InputLabel>
              <Select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value as Service['category'] })}
                label="Category"
              >
                <MenuItem value="facility">Facility</MenuItem>
                <MenuItem value="equipment">Equipment</MenuItem>
                <MenuItem value="program">Program</MenuItem>
                <MenuItem value="wellness">Wellness</MenuItem>
              </Select>
            </FormControl>
            <TextField
              label="Capacity (optional)"
              type="number"
              value={formData.capacity}
              onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
              fullWidth
            />
            <TextField
              label="Duration in minutes (optional)"
              type="number"
              value={formData.duration}
              onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
              fullWidth
            />
            <TextField
              label="Requirements (comma separated, optional)"
              value={formData.requirements}
              onChange={(e) => setFormData({ ...formData, requirements: e.target.value })}
              fullWidth
              placeholder="e.g., Swimming certification, Age 18+"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleSave} variant="contained">
            {editingService ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert severity={snackbar.severity}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
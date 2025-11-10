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
  Switch,
  FormControlLabel,
  OutlinedInput,
  Checkbox,
  ListItemText,
  Skeleton
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  LocalOffer as BenefitIcon,
  Share as ShareIcon
} from '@mui/icons-material';

interface Service {
  id: string;
  name: string;
  category: string;
}

interface User {
  id: string;
  username: string;
  email: string;
}

interface Benefit {
  id: string;
  name: string;
  description: string;
  price: number;
  serviceIds: string[];
  startDate: string;
  endDate: string;
  maxUsesPerMonth?: number;
  requiresBooking?: boolean;
  isShareable: boolean;
  sharedWithUserId?: string;
  category?: string;
  value?: string;
  eligibility?: string[];
  metadata?: {
    validityPeriod?: string;
    restrictions?: string;
    includedServices?: string[];
  };
  createdAt: string;
  updatedAt: string;
}

export default function AdminBenefits() {
  const [benefits, setBenefits] = useState<Benefit[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingBenefit, setEditingBenefit] = useState<Benefit | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    serviceIds: [] as string[],
    startDate: '',
    endDate: '',
    maxUsesPerMonth: '',
    requiresBooking: false,
    isShareable: false,
    sharedWithUserId: ''
  });
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });

  useEffect(() => {
    fetchBenefits();
    fetchServices();
    fetchUsers();
  }, []);

  const fetchBenefits = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/benefits');
      const data = await response.json();
      setBenefits(data.data || []);
    } catch (error) {
      console.error('Error fetching benefits:', error);
      setSnackbar({ open: true, message: 'Failed to fetch benefits', severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const fetchServices = async () => {
    try {
      const response = await fetch('/api/services');
      const data = await response.json();
      setServices(data.data || []);
    } catch (error) {
      console.error('Error fetching services:', error);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/users');
      const data = await response.json();
      setUsers(data.data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const handleOpenDialog = (benefit?: Benefit) => {
    if (benefit) {
      setEditingBenefit(benefit);
      setFormData({
        name: benefit.name,
        description: benefit.description,
        price: benefit.price !== undefined ? benefit.price.toString() : '0',
        serviceIds: benefit.serviceIds || benefit.metadata?.includedServices || [],
        startDate: benefit.startDate.split('T')[0],
        endDate: benefit.endDate.split('T')[0],
        maxUsesPerMonth: benefit.maxUsesPerMonth?.toString() || '',
        requiresBooking: benefit.requiresBooking || false,
        isShareable: benefit.isShareable,
        sharedWithUserId: benefit.sharedWithUserId || ''
      });
    } else {
      setEditingBenefit(null);
      const today = new Date().toISOString().split('T')[0];
      const nextYear = new Date();
      nextYear.setFullYear(nextYear.getFullYear() + 1);
      
      setFormData({
        name: '',
        description: '',
        price: '',
        serviceIds: [],
        startDate: today,
        endDate: nextYear.toISOString().split('T')[0],
        maxUsesPerMonth: '',
        requiresBooking: false,
        isShareable: false,
        sharedWithUserId: ''
      });
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingBenefit(null);
  };

  const handleSave = async () => {
    try {
      const benefitData = {
        name: formData.name,
        description: formData.description,
        price: parseFloat(formData.price),
        serviceIds: formData.serviceIds,
        startDate: new Date(formData.startDate).toISOString(),
        endDate: new Date(formData.endDate).toISOString(),
        maxUsesPerMonth: formData.maxUsesPerMonth ? parseInt(formData.maxUsesPerMonth) : undefined,
        requiresBooking: formData.requiresBooking,
        isShareable: formData.isShareable,
        sharedWithUserId: formData.isShareable ? formData.sharedWithUserId : undefined
      };

      const url = editingBenefit ? `/api/benefits/${editingBenefit.id}` : '/api/benefits';
      const method = editingBenefit ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(benefitData)
      });

      if (response.ok) {
        setSnackbar({ 
          open: true, 
          message: `Benefit ${editingBenefit ? 'updated' : 'created'} successfully`, 
          severity: 'success' 
        });
        handleCloseDialog();
        fetchBenefits();
      } else {
        throw new Error('Failed to save benefit');
      }
    } catch (error) {
      console.error('Error saving benefit:', error);
      setSnackbar({ open: true, message: 'Failed to save benefit', severity: 'error' });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this benefit?')) return;

    try {
      const response = await fetch(`/api/benefits/${id}`, { method: 'DELETE' });
      if (response.ok) {
        setSnackbar({ open: true, message: 'Benefit deleted successfully', severity: 'success' });
        fetchBenefits();
      } else {
        throw new Error('Failed to delete benefit');
      }
    } catch (error) {
      console.error('Error deleting benefit:', error);
      setSnackbar({ open: true, message: 'Failed to delete benefit', severity: 'error' });
    }
  };

  const getServiceNames = (serviceIds: string[] | undefined) => {
    if (!serviceIds || !Array.isArray(serviceIds) || serviceIds.length === 0) return '';
    return serviceIds.map(id => services.find(s => s.id === id)?.name).filter(Boolean).join(', ');
  };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1">
          Benefits Management
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          Add Benefit
        </Button>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Price</TableCell>
              <TableCell>Services</TableCell>
              <TableCell>Valid Period</TableCell>
              <TableCell>Max Uses</TableCell>
              <TableCell>Features</TableCell>
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
                      <Box flex={1}>
                        <Skeleton variant="text" width="60%" height={20} />
                        <Skeleton variant="text" width="80%" height={16} />
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Skeleton variant="text" width={60} height={20} />
                  </TableCell>
                  <TableCell>
                    <Skeleton variant="text" width="70%" height={20} />
                  </TableCell>
                  <TableCell>
                    <Skeleton variant="text" width="80%" height={20} />
                  </TableCell>
                  <TableCell>
                    <Skeleton variant="text" width={60} height={20} />
                  </TableCell>
                  <TableCell>
                    <Box display="flex" gap={1}>
                      <Skeleton variant="rounded" width={80} height={24} />
                      <Skeleton variant="rounded" width={70} height={24} />
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box display="flex" gap={1}>
                      <Skeleton variant="circular" width={32} height={32} />
                      <Skeleton variant="circular" width={32} height={32} />
                    </Box>
                  </TableCell>
                </TableRow>
              ))
            ) : benefits.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                  <Typography variant="body2" color="text.secondary">
                    No benefits found. Click "Add Benefit" to create your first benefit package.
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              benefits.map((benefit) => (
                <TableRow key={benefit.id}>
                  <TableCell>
                    <Box display="flex" alignItems="center" gap={1}>
                      <BenefitIcon color="action" />
                      <Box>
                        <Typography variant="body2" fontWeight="medium">
                          {benefit.name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {benefit.description}
                        </Typography>
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" fontWeight="medium">
                      {benefit.price !== undefined && benefit.price !== null ? `$${benefit.price}` : benefit.value || 'N/A'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {getServiceNames(benefit.serviceIds || benefit.metadata?.includedServices) || 'No services'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {benefit.startDate && benefit.endDate 
                        ? `${new Date(benefit.startDate).toLocaleDateString()} - ${new Date(benefit.endDate).toLocaleDateString()}`
                        : benefit.metadata?.validityPeriod || 'N/A'
                      }
                    </Typography>
                  </TableCell>
                  <TableCell>{benefit.maxUsesPerMonth || 'Unlimited'}</TableCell>
                  <TableCell>
                    <Box display="flex" gap={1}>
                      {benefit.requiresBooking && <Chip label="Booking Required" size="small" />}
                      {benefit.isShareable && <Chip label="Shareable" size="small" color="primary" icon={<ShareIcon />} />}
                      {benefit.category && <Chip label={benefit.category} size="small" variant="outlined" />}
                    </Box>
                  </TableCell>
                  <TableCell>
                    <IconButton onClick={() => handleOpenDialog(benefit)} size="small">
                      <EditIcon />
                    </IconButton>
                    <IconButton onClick={() => handleDelete(benefit.id)} size="small" color="error">
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingBenefit ? 'Edit Benefit' : 'Add New Benefit'}
        </DialogTitle>
        <DialogContent>
          <Box display="flex" flexDirection="column" gap={2} mt={1}>
            <TextField
              label="Benefit Name"
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
            <TextField
              label="Price"
              type="number"
              value={formData.price}
              onChange={(e) => setFormData({ ...formData, price: e.target.value })}
              fullWidth
              required
              inputProps={{ min: 0, step: 0.01 }}
            />
            <FormControl fullWidth>
              <InputLabel>Services</InputLabel>
              <Select
                multiple
                value={formData.serviceIds}
                onChange={(e) => setFormData({ ...formData, serviceIds: e.target.value as string[] })}
                input={<OutlinedInput label="Services" />}
                renderValue={(selected) => getServiceNames(selected) || 'Select services'}
                disabled={services.length === 0}
              >
                {services.length === 0 ? (
                  <MenuItem disabled>
                    <Skeleton variant="text" width="100%" height={20} />
                  </MenuItem>
                ) : (
                  services.map((service) => (
                    <MenuItem key={service.id} value={service.id}>
                      <Checkbox checked={formData.serviceIds.includes(service.id)} />
                      <ListItemText primary={service.name} secondary={service.category} />
                    </MenuItem>
                  ))
                )}
              </Select>
            </FormControl>
            <Box display="flex" gap={2}>
              <TextField
                label="Start Date"
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                fullWidth
                required
                InputLabelProps={{ shrink: true }}
              />
              <TextField
                label="End Date"
                type="date"
                value={formData.endDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                fullWidth
                required
                InputLabelProps={{ shrink: true }}
              />
            </Box>
            <TextField
              label="Max Uses Per Month (optional)"
              type="number"
              value={formData.maxUsesPerMonth}
              onChange={(e) => setFormData({ ...formData, maxUsesPerMonth: e.target.value })}
              fullWidth
              inputProps={{ min: 1 }}
            />
            <Box display="flex" gap={2}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.requiresBooking}
                    onChange={(e) => setFormData({ ...formData, requiresBooking: e.target.checked })}
                  />
                }
                label="Requires Booking"
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.isShareable}
                    onChange={(e) => setFormData({ ...formData, isShareable: e.target.checked, sharedWithUserId: e.target.checked ? formData.sharedWithUserId : '' })}
                  />
                }
                label="Shareable"
              />
            </Box>
            {formData.isShareable && (
              <FormControl fullWidth>
                <InputLabel>Share With User</InputLabel>
                <Select
                  value={formData.sharedWithUserId}
                  onChange={(e) => setFormData({ ...formData, sharedWithUserId: e.target.value })}
                  input={<OutlinedInput label="Share With User" />}
                  disabled={users.length === 0}
                >
                  <MenuItem value="">
                    <em>Select a user to share with</em>
                  </MenuItem>
                  {users.length === 0 ? (
                    <MenuItem disabled>
                      <Skeleton variant="text" width="100%" height={20} />
                    </MenuItem>
                  ) : (
                    users.map((user) => (
                      <MenuItem key={user.id} value={user.id}>
                        {user.username} ({user.email})
                      </MenuItem>
                    ))
                  )}
                </Select>
              </FormControl>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleSave} variant="contained">
            {editingBenefit ? 'Update' : 'Create'}
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
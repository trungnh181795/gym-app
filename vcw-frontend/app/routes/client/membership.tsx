import { useState, useEffect } from 'react';
import QRCode from 'react-qr-code';
import {
  Box,
  Paper,
  Typography,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Snackbar,
  Card,
  CardContent,
  CardActions,
  Grid,
  Chip,
  Checkbox,
  FormControlLabel,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress
} from '@mui/material';
import {
  Person as PersonIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  CardMembership as MembershipIcon,
  Check as CheckIcon,
  Close as CloseIcon
} from '@mui/icons-material';

interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
}

interface Service {
  id: string;
  name: string;
  description: string;
}

interface Benefit {
  id: string;
  name: string;
  description: string;
  price: number;
  serviceId: string;
  isShareable: boolean;
  service?: Service;
}

interface MembershipFormData {
  userId: string;
  name: string;
  description: string;
  benefitIds: string[];
  validFrom: string;
  validUntil: string;
}

interface BenefitSelection {
  benefitId: string;
  isShared: boolean;
  sharedWithUserId?: string;
}

export default function ClientMembership() {
  const [users, setUsers] = useState<User[]>([]);
  const [benefits, setBenefits] = useState<Benefit[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBenefits, setSelectedBenefits] = useState<BenefitSelection[]>([]);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [qrDialogOpen, setQrDialogOpen] = useState(false);
  const [credentialToken, setCredentialToken] = useState<string>('');
  const [qrTimer, setQrTimer] = useState(60);
  const [currentUserId, setCurrentUserId] = useState<string>('');
  const [formData, setFormData] = useState<MembershipFormData>({
    userId: '',
    name: '',
    description: '',
    benefitIds: [],
    validFrom: '',
    validUntil: ''
  });
  const [snackbar, setSnackbar] = useState({ 
    open: false, 
    message: '', 
    severity: 'success' as 'success' | 'error' 
  });

  useEffect(() => {
    // Get current user from localStorage
    const userData = localStorage.getItem('userData');
    if (userData) {
      try {
        const user = JSON.parse(userData);
        setCurrentUserId(user.id);
        setFormData(prev => ({ ...prev, userId: user.id }));
      } catch (error) {
        console.error('Failed to parse user data:', error);
      }
    }
    
    fetchUsers();
    fetchBenefits();
    initializeDates();
  }, []);

  // QR Code timer countdown
  useEffect(() => {
    if (qrDialogOpen && qrTimer > 0) {
      const timer = setTimeout(() => setQrTimer(qrTimer - 1), 1000);
      return () => clearTimeout(timer);
    } else if (qrTimer === 0) {
      setQrDialogOpen(false);
      setQrTimer(60);
    }
  }, [qrDialogOpen, qrTimer]);

  const initializeDates = () => {
    const today = new Date().toISOString().split('T')[0];
    const nextYear = new Date();
    nextYear.setFullYear(nextYear.getFullYear() + 1);
    
    setFormData(prev => ({
      ...prev,
      validFrom: today,
      validUntil: nextYear.toISOString().split('T')[0]
    }));
  };

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/users');
      const data = await response.json();
      setUsers(data.data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
      setSnackbar({ open: true, message: 'Failed to fetch users', severity: 'error' });
    }
  };

  const fetchBenefits = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/benefits/with-services');
      const data = await response.json();
      setBenefits(data.data || []);
    } catch (error) {
      console.error('Error fetching benefits:', error);
      setSnackbar({ open: true, message: 'Failed to fetch benefits', severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleBenefitToggle = (benefitId: string) => {
    setSelectedBenefits(prev => {
      const exists = prev.find(b => b.benefitId === benefitId);
      if (exists) {
        return prev.filter(b => b.benefitId !== benefitId);
      } else {
        return [...prev, { benefitId, isShared: false, sharedWithUserId: undefined }];
      }
    });
  };

  const handleShareToggle = (benefitId: string, isShared: boolean) => {
    setSelectedBenefits(prev =>
      prev.map(b =>
        b.benefitId === benefitId
          ? { ...b, isShared, sharedWithUserId: isShared ? b.sharedWithUserId : undefined }
          : b
      )
    );
  };

  const handleShareUserChange = (benefitId: string, userId: string) => {
    setSelectedBenefits(prev =>
      prev.map(b =>
        b.benefitId === benefitId
          ? { ...b, sharedWithUserId: userId }
          : b
      )
    );
  };

  const getTotalPrice = () => {
    return selectedBenefits.reduce((total, selection) => {
      const benefit = benefits.find(b => b.id === selection.benefitId);
      return total + (benefit?.price || 0);
    }, 0);
  };

  const getSelectedBenefitNames = () => {
    return selectedBenefits
      .map(selection => benefits.find(b => b.id === selection.benefitId)?.name)
      .filter(Boolean)
      .join(', ');
  };

  const handleSubmit = () => {
    if (!formData.userId || !formData.name || selectedBenefits.length === 0) {
      setSnackbar({ 
        open: true, 
        message: 'Please fill in all required fields and select at least one benefit', 
        severity: 'error' 
      });
      return;
    }

    // Check if shared benefits have users selected
    const invalidShares = selectedBenefits.filter(b => b.isShared && !b.sharedWithUserId);
    if (invalidShares.length > 0) {
      setSnackbar({ 
        open: true, 
        message: 'Please select a user for all shared benefits', 
        severity: 'error' 
      });
      return;
    }

    setConfirmDialogOpen(true);
  };

  const confirmRegistration = async () => {
    try {
      const membershipData = {
        userId: formData.userId,
        name: formData.name,
        description: formData.description || `Membership with ${getSelectedBenefitNames()}`,
        status: 'active',
        validFrom: new Date(formData.validFrom).toISOString(),
        validUntil: new Date(formData.validUntil).toISOString(),
        benefits: selectedBenefits.map(selection => {
          const benefit = benefits.find(b => b.id === selection.benefitId);
          return {
            type: 'membership' as const,
            name: benefit?.name || '',
            description: benefit?.description || '',
            price: benefit?.price || 0,
            isShared: selection.isShared,
            sharedWithUserId: selection.isShared ? selection.sharedWithUserId : undefined
          };
        })
      };

      const response = await fetch('/api/memberships', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(membershipData)
      });

      if (response.ok) {
        const result = await response.json();
        
        // Store credential token and show QR code
        if (result.data?.credentialToken) {
          console.log('Received token:', result.data.credentialToken);
          setCredentialToken(result.data.credentialToken);
          setQrTimer(60); // Reset timer
          setQrDialogOpen(true);
        }
        
        setSnackbar({ 
          open: true, 
          message: 'Membership registered successfully!', 
          severity: 'success' 
        });
        
        // Reset form
        setFormData({
          userId: currentUserId,
          name: '',
          description: '',
          benefitIds: [],
          validFrom: formData.validFrom,
          validUntil: formData.validUntil
        });
        setSelectedBenefits([]);
        setConfirmDialogOpen(false);
      } else {
        throw new Error('Failed to register membership');
      }
    } catch (error) {
      console.error('Error registering membership:', error);
      setSnackbar({ 
        open: true, 
        message: 'Failed to register membership. Please try again.', 
        severity: 'error' 
      });
    }
  };

  const groupBenefitsByService = () => {
    const grouped: Record<string, Benefit[]> = {};
    benefits.forEach(benefit => {
      const serviceName = benefit.service?.name || 'Other Services';
      if (!grouped[serviceName]) {
        grouped[serviceName] = [];
      }
      grouped[serviceName].push(benefit);
    });
    return grouped;
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <Typography>Loading benefits...</Typography>
      </Box>
    );
  }

  const groupedBenefits = groupBenefitsByService();

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        Membership Registration
      </Typography>
      <Typography variant="body1" color="text.secondary" paragraph>
        Select your desired benefits and register for a membership package.
      </Typography>

      <Box display="flex" gap={3} flexDirection={{ xs: 'column', md: 'row' }}>
        {/* Registration Form */}
        <Box flex={2}>
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Member Information
            </Typography>
            
            <Box display="flex" flexDirection="column" gap={2}>
              {/* Show current user info instead of selection */}
              <Box sx={{ p: 2, bgcolor: 'action.hover', borderRadius: 1 }}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Registering membership for:
                </Typography>
                <Box display="flex" alignItems="center" gap={1}>
                  <PersonIcon color="primary" />
                  <Typography variant="body1" fontWeight="medium">
                    {users.find(u => u.id === currentUserId)?.name || 'Loading...'}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    ({users.find(u => u.id === currentUserId)?.email})
                  </Typography>
                </Box>
              </Box>
              
              <TextField
                label="Membership Name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                fullWidth
                required
                placeholder="e.g., Premium Gym Membership"
              />
              
              <TextField
                label="Description (Optional)"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                fullWidth
                multiline
                rows={2}
                placeholder="Additional notes about this membership..."
              />
              
              <Box display="flex" gap={2}>
                <TextField
                  label="Valid From"
                  type="date"
                  value={formData.validFrom}
                  onChange={(e) => setFormData({ ...formData, validFrom: e.target.value })}
                  fullWidth
                  required
                  InputLabelProps={{ shrink: true }}
                />
                <TextField
                  label="Valid Until"
                  type="date"
                  value={formData.validUntil}
                  onChange={(e) => setFormData({ ...formData, validUntil: e.target.value })}
                  fullWidth
                  required
                  InputLabelProps={{ shrink: true }}
                />
              </Box>
            </Box>
          </Paper>

          {/* Benefits Selection */}
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Select Benefits
            </Typography>
            
            {Object.entries(groupedBenefits).map(([serviceName, serviceBenefits]) => (
              <Box key={serviceName} mb={3}>
                <Typography variant="subtitle1" fontWeight="medium" gutterBottom>
                  {serviceName}
                </Typography>
                <Box display="flex" flexWrap="wrap" gap={2}>
                  {serviceBenefits.map((benefit) => {
                    const selection = selectedBenefits.find(b => b.benefitId === benefit.id);
                    const isSelected = !!selection;
                    
                    return (
                      <Box key={benefit.id} flex={{ xs: '1 1 100%', sm: '1 1 calc(50% - 8px)' }}>
                        <Card 
                          variant="outlined" 
                          sx={{ 
                            border: isSelected ? 2 : 1,
                            borderColor: isSelected ? 'primary.main' : 'divider',
                            height: '100%'
                          }}
                        >
                          <CardContent>
                            <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                              <Box flex={1}>
                                <Typography variant="subtitle2" gutterBottom>
                                  {benefit.name}
                                </Typography>
                                <Typography variant="body2" color="text.secondary" gutterBottom>
                                  {benefit.description}
                                </Typography>
                                <Box display="flex" gap={1} alignItems="center">
                                  <Chip 
                                    label={`$${benefit.price !== undefined && benefit.price !== null ? benefit.price : '0'}`} 
                                    color="primary" 
                                    size="small" 
                                  />
                                  {benefit.isShareable && (
                                    <Chip 
                                      label="Shareable" 
                                      color="secondary" 
                                      size="small" 
                                    />
                                  )}
                                </Box>
                              </Box>
                              <Checkbox
                                checked={isSelected}
                                onChange={() => handleBenefitToggle(benefit.id)}
                                onClick={(e) => e.stopPropagation()}
                              />
                            </Box>
                            
                            {/* Share options - shown when benefit is selected and shareable */}
                            {isSelected && benefit.isShareable && (
                              <Box sx={{ mt: 2, pt: 2, borderTop: '1px solid', borderColor: 'divider' }}>
                                <FormControlLabel
                                  control={
                                    <Checkbox
                                      checked={selection.isShared}
                                      onChange={(e) => handleShareToggle(benefit.id, e.target.checked)}
                                    />
                                  }
                                  label="Share with another member"
                                />
                                
                                {selection.isShared && (
                                  <FormControl fullWidth sx={{ mt: 1 }} size="small">
                                    <InputLabel>Share with user</InputLabel>
                                    <Select
                                      value={selection.sharedWithUserId || ''}
                                      onChange={(e) => handleShareUserChange(benefit.id, e.target.value)}
                                      label="Share with user"
                                    >
                                      {users
                                        .filter(u => u.id !== currentUserId)
                                        .map(user => (
                                          <MenuItem key={user.id} value={user.id}>
                                            {user.name} - {user.email}
                                          </MenuItem>
                                        ))}
                                    </Select>
                                  </FormControl>
                                )}
                              </Box>
                            )}
                          </CardContent>
                        </Card>
                      </Box>
                    );
                  })}
                </Box>
              </Box>
            ))}
          </Paper>
        </Box>

        {/* Summary Sidebar */}
        <Box flex={1} minWidth={{ xs: '100%', md: '300px' }}>
          <Paper sx={{ p: 3, position: 'sticky', top: 20 }}>
            <Typography variant="h6" gutterBottom>
              Membership Summary
            </Typography>
            
            {selectedBenefits.length === 0 ? (
              <Typography variant="body2" color="text.secondary">
                No benefits selected yet.
              </Typography>
            ) : (
              <>
                <Typography variant="subtitle2" gutterBottom>
                  Selected Benefits ({selectedBenefits.length}):
                </Typography>
                <Box mb={2}>
                  {selectedBenefits.map(selection => {
                    const benefit = benefits.find(b => b.id === selection.benefitId);
                    const sharedUser = selection.isShared ? users.find(u => u.id === selection.sharedWithUserId) : null;
                    return benefit ? (
                      <Box key={selection.benefitId} mb={1}>
                        <Box display="flex" justifyContent="space-between">
                          <Typography variant="body2">{benefit.name}</Typography>
                          <Typography variant="body2">${benefit.price !== undefined && benefit.price !== null ? benefit.price : '0'}</Typography>
                        </Box>
                        {selection.isShared && sharedUser && (
                          <Typography variant="caption" color="text.secondary" sx={{ ml: 2 }}>
                            → Shared with {sharedUser.name}
                          </Typography>
                        )}
                      </Box>
                    ) : null;
                  })}
                </Box>
                
                <Divider sx={{ my: 2 }} />
                
                <Box display="flex" justifyContent="space-between" mb={2}>
                  <Typography variant="subtitle1" fontWeight="bold">
                    Total Price:
                  </Typography>
                  <Typography variant="subtitle1" fontWeight="bold" color="primary">
                    ${getTotalPrice()}
                  </Typography>
                </Box>
                
                <Button
                  variant="contained"
                  fullWidth
                  size="large"
                  startIcon={<MembershipIcon />}
                  onClick={handleSubmit}
                  disabled={!formData.userId || !formData.name}
                >
                  Register Membership
                </Button>
              </>
            )}
          </Paper>
        </Box>
      </Box>

      {/* Confirmation Dialog */}
      <Dialog open={confirmDialogOpen} onClose={() => setConfirmDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Confirm Membership Registration</DialogTitle>
        <DialogContent>
          <Typography variant="body1" paragraph>
            Please confirm your membership registration details:
          </Typography>
          
          <Box mb={2}>
            <Typography variant="subtitle2">Member:</Typography>
            <Typography variant="body2">
              {users.find(u => u.id === formData.userId)?.name}
            </Typography>
          </Box>
          
          <Box mb={2}>
            <Typography variant="subtitle2">Membership Name:</Typography>
            <Typography variant="body2">{formData.name}</Typography>
          </Box>
          
          <Box mb={2}>
            <Typography variant="subtitle2">Benefits:</Typography>
            {selectedBenefits.map(selection => {
              const benefit = benefits.find(b => b.id === selection.benefitId);
              const sharedUser = selection.isShared ? users.find(u => u.id === selection.sharedWithUserId) : null;
              return benefit ? (
                <Box key={selection.benefitId} mb={0.5}>
                  <Typography variant="body2">
                    • {benefit.name}
                    {selection.isShared && sharedUser && (
                      <Typography component="span" variant="caption" color="text.secondary">
                        {' '}(Shared with {sharedUser.name})
                      </Typography>
                    )}
                  </Typography>
                </Box>
              ) : null;
            })}
          </Box>
          
          <Box mb={2}>
            <Typography variant="subtitle2">Total Price:</Typography>
            <Typography variant="h6" color="primary">${getTotalPrice()}</Typography>
          </Box>
          
          <Box>
            <Typography variant="subtitle2">Valid Period:</Typography>
            <Typography variant="body2">
              {new Date(formData.validFrom).toLocaleDateString()} - {new Date(formData.validUntil).toLocaleDateString()}
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDialogOpen(false)}>Cancel</Button>
          <Button onClick={confirmRegistration} variant="contained" color="primary">
            Confirm Registration
          </Button>
        </DialogActions>
      </Dialog>

      {/* QR Code Dialog */}
      <Dialog 
        open={qrDialogOpen} 
        onClose={() => {
          setQrDialogOpen(false);
          setQrTimer(60);
        }}
        maxWidth="sm" 
        fullWidth
      >
        <DialogTitle>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="h6">Your Membership Credentials</Typography>
            <Chip 
              label={`${qrTimer}s remaining`} 
              color={qrTimer < 20 ? 'error' : 'primary'}
              size="small"
            />
          </Box>
        </DialogTitle>
        <DialogContent>
          <Alert severity="warning" sx={{ mb: 3 }}>
            <Typography variant="body2" fontWeight="bold" gutterBottom>
              Important: Capture this QR code now!
            </Typography>
            <Typography variant="body2">
              This QR code will disappear in {qrTimer} seconds. Save a screenshot or photo for check-in verification.
            </Typography>
          </Alert>

          {credentialToken && (
            <Box display="flex" flexDirection="column" alignItems="center" gap={3}>
              <Paper elevation={3} sx={{ p: 3, bgcolor: 'white' }}>
                <QRCode
                  value={credentialToken}
                  size={300}
                  level="L"
                />
              </Paper>
              
              <Box textAlign="center">
                <Typography variant="subtitle2" gutterBottom>
                  Credential Token
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ fontFamily: 'monospace', wordBreak: 'break-all' }}>
                  {credentialToken}
                </Typography>
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => {
              setQrDialogOpen(false);
              setQrTimer(60);
            }}
            variant="contained"
          >
            I've Captured the QR Code
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
import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  CardActions,
  Button,
  Chip,
  Grid,
  Dialog,
  DialogTitle,
  DialogContent,
  Alert,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider
} from '@mui/material';
import { apiClient } from '~/services/apiClient';
import {
  LocalOffer as BenefitIcon,
  QrCode as QRIcon,
  Build as ServiceIcon,
  DateRange as DateIcon,
  MonetizationOn as PriceIcon,
  Share as ShareIcon,
  CheckCircle as CheckIcon
} from '@mui/icons-material';
import QRCodeDisplay from '../../components/QRCodeDisplay';

interface Service {
  id: string;
  name: string;
  category: string;
  description: string;
}

interface Benefit {
  id: string;
  name: string;
  description: string;
  price: number;
  services: Service[];
  startDate: string;
  endDate: string;
  maxUsesPerMonth?: number;
  requiresBooking?: boolean;
  isShareable: boolean;
  credentialId?: string;
  isShared?: boolean; // Flag to indicate if this is a shared benefit
}

export default function ClientBenefits() {
  const [benefits, setBenefits] = useState<Benefit[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBenefit, setSelectedBenefit] = useState<Benefit | null>(null);
  const [qrDialogOpen, setQrDialogOpen] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchUserBenefits();
  }, []);

  const fetchUserBenefits = async () => {
    try {
      setLoading(true);
      const benefits = await apiClient.get<Benefit[]>('/user/benefits');
      setBenefits(benefits || []);
    } catch (error) {
      console.error('Error fetching benefits:', error);
      setError(error instanceof Error ? error.message : 'Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleShowQR = (benefit: Benefit) => {
    setSelectedBenefit(benefit);
    setQrDialogOpen(true);
  };

  const isExpired = (endDate: string) => {
    return new Date(endDate) < new Date();
  };

  const isExpiringSoon = (endDate: string) => {
    const end = new Date(endDate);
    const now = new Date();
    const daysUntilExpiry = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return daysUntilExpiry <= 7 && daysUntilExpiry > 0;
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <Typography>Loading your benefits...</Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 3 }}>
        {error}
      </Alert>
    );
  }

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        My Benefits
      </Typography>
      <Typography variant="body1" color="text.secondary" paragraph>
        Access your gym membership benefits and generate QR codes for check-in.
      </Typography>

      {benefits.length === 0 ? (
        <Card>
          <CardContent sx={{ textAlign: 'center', p: 4 }}>
            <BenefitIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" gutterBottom>
              No Benefits Available
            </Typography>
            <Typography variant="body2" color="text.secondary">
              You don't have any active benefits. Contact the gym to purchase a membership.
            </Typography>
          </CardContent>
        </Card>
      ) : (
        <Grid container spacing={3}>
          {benefits.map((benefit) => (
            <Grid key={benefit.id} size={{ xs: 12, md: 6, lg: 4 }}>
              <Card 
                sx={{ 
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  opacity: isExpired(benefit.endDate) ? 0.6 : 1
                }}
              >
                <CardContent sx={{ flexGrow: 1 }}>
                  <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
                    <Typography variant="h6" component="h2">
                      {benefit.name}
                      {benefit.isShared && (
                        <Chip 
                          label="Shared with you" 
                          color="info" 
                          size="small" 
                          icon={<ShareIcon />}
                          sx={{ ml: 1 }}
                        />
                      )}
                    </Typography>
                    <Box display="flex" gap={1} flexWrap="wrap" justifyContent="flex-end">
                      {isExpired(benefit.endDate) && (
                        <Chip label="Expired" color="error" size="small" />
                      )}
                      {isExpiringSoon(benefit.endDate) && !isExpired(benefit.endDate) && (
                        <Chip label="Expiring Soon" color="warning" size="small" />
                      )}
                      {benefit.isShareable && !benefit.isShared && (
                        <Chip label="Shareable" color="primary" size="small" icon={<ShareIcon />} />
                      )}
                    </Box>
                  </Box>

                  <Typography variant="body2" color="text.secondary" paragraph>
                    {benefit.description}
                  </Typography>

                  <Box display="flex" alignItems="center" gap={1} mb={1}>
                    <PriceIcon fontSize="small" color="action" />
                    <Typography variant="body2">
                      ${benefit.price !== undefined && benefit.price !== null ? benefit.price : '0'}
                    </Typography>
                  </Box>

                  <Box display="flex" alignItems="center" gap={1} mb={2}>
                    <DateIcon fontSize="small" color="action" />
                    <Typography variant="body2">
                      {new Date(benefit.startDate).toLocaleDateString()} - {new Date(benefit.endDate).toLocaleDateString()}
                    </Typography>
                  </Box>

                  {benefit.services.length > 0 && (
                    <Box>
                      <Typography variant="subtitle2" gutterBottom>
                        Included Services:
                      </Typography>
                      {benefit.services.map((service) => (
                        <Chip
                          key={service.id}
                          label={service.name}
                          size="small"
                          variant="outlined"
                          sx={{ mr: 0.5, mb: 0.5 }}
                        />
                      ))}
                    </Box>
                  )}

                  {benefit.maxUsesPerMonth && (
                    <Box mt={1}>
                      <Chip
                        label={`${benefit.maxUsesPerMonth} uses/month`}
                        size="small"
                        color="info"
                      />
                    </Box>
                  )}

                  {benefit.requiresBooking && (
                    <Box mt={1}>
                      <Chip
                        label="Booking Required"
                        size="small"
                        color="warning"
                      />
                    </Box>
                  )}
                </CardContent>

                <CardActions>
                  <Button
                    variant="contained"
                    startIcon={<QRIcon />}
                    onClick={() => handleShowQR(benefit)}
                    disabled={isExpired(benefit.endDate)}
                    fullWidth
                  >
                    Generate QR Code
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* QR Code Dialog */}
      <Dialog 
        open={qrDialogOpen} 
        onClose={() => setQrDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          Check-in QR Code
        </DialogTitle>
        <DialogContent>
          {selectedBenefit && selectedBenefit.credentialId && (
            <Box>
              <Alert severity="info" sx={{ mb: 3 }}>
                This QR code is valid for 60 seconds. Show it to gym staff or scan it at the check-in kiosk.
              </Alert>
              
              <QRCodeDisplay
                credentialId={selectedBenefit.credentialId}
                benefitName={selectedBenefit.name}
                isAdmin={false}
                onExpire={() => {
                  // Auto-close dialog when QR expires
                  setTimeout(() => {
                    setQrDialogOpen(false);
                  }, 2000);
                }}
              />

              <Box mt={3}>
                <Typography variant="subtitle2" gutterBottom>
                  Benefit Details:
                </Typography>
                <List dense>
                  <ListItem>
                    <ListItemIcon>
                      <CheckIcon color="success" />
                    </ListItemIcon>
                    <ListItemText primary={selectedBenefit.name} />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon>
                      <DateIcon color="action" />
                    </ListItemIcon>
                    <ListItemText 
                      primary={`Valid until ${new Date(selectedBenefit.endDate).toLocaleDateString()}`}
                    />
                  </ListItem>
                  {selectedBenefit.maxUsesPerMonth && (
                    <ListItem>
                      <ListItemIcon>
                        <ServiceIcon color="action" />
                      </ListItemIcon>
                      <ListItemText 
                        primary={`${selectedBenefit.maxUsesPerMonth} uses remaining this month`}
                      />
                    </ListItem>
                  )}
                </List>
              </Box>
            </Box>
          )}
        </DialogContent>
      </Dialog>
    </Box>
  );
}
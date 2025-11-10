import { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
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
  Button,
  Alert,
  Snackbar,
  Skeleton
} from '@mui/material';
import {
  Visibility as ViewIcon,
  QrCode as QRIcon,
  Badge as CredentialIcon
} from '@mui/icons-material';
import QRCodeDisplay from '../../components/QRCodeDisplay';

interface Credential {
  id: string;
  holder: string;
  benefitId: string;
  membershipId: string;
  status: 'active' | 'revoked' | 'expired';
  issuedAt: string;
  expiresAt: string;
  proof: {
    type: string;
    created: string;
    proofPurpose: string;
    verificationMethod: string;
  };
  benefitName?: string;
  membershipName?: string;
  holderName?: string;
}

const statusColors = {
  active: 'success',
  revoked: 'error',
  expired: 'warning'
} as const;

export default function AdminCredentials() {
  const [credentials, setCredentials] = useState<Credential[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [qrDialogOpen, setQrDialogOpen] = useState(false);
  const [selectedCredential, setSelectedCredential] = useState<Credential | null>(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });

  useEffect(() => {
    fetchCredentials();
  }, []);

  const fetchCredentials = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/credentials/with-details');
      const data = await response.json();
      setCredentials(data.data || []);
    } catch (error) {
      console.error('Error fetching credentials:', error);
      setSnackbar({ open: true, message: 'Failed to fetch credentials', severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleViewCredential = (credential: Credential) => {
    setSelectedCredential(credential);
    setDialogOpen(true);
  };

  const handleShowQR = (credential: Credential) => {
    setSelectedCredential(credential);
    setQrDialogOpen(true);
  };

  const revokeCredential = async (id: string) => {
    if (!confirm('Are you sure you want to revoke this credential?')) return;

    try {
      const response = await fetch(`/api/credentials/${id}/revoke`, { method: 'POST' });
      if (response.ok) {
        setSnackbar({ open: true, message: 'Credential revoked successfully', severity: 'success' });
        fetchCredentials();
      } else {
        throw new Error('Failed to revoke credential');
      }
    } catch (error) {
      console.error('Error revoking credential:', error);
      setSnackbar({ open: true, message: 'Failed to revoke credential', severity: 'error' });
    }
  };

  const isExpired = (expiresAt: string) => {
    return new Date(expiresAt) < new Date();
  };

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        Credentials Management
      </Typography>
      <Typography variant="body1" color="text.secondary" paragraph>
        View and manage all issued verifiable credentials.
      </Typography>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Credential</TableCell>
              <TableCell>Holder</TableCell>
              <TableCell>Benefit</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Issued</TableCell>
              <TableCell>Expires</TableCell>
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
                      <Box>
                        <Skeleton variant="text" width={120} height={20} />
                        <Skeleton variant="text" width={80} height={16} />
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Skeleton variant="text" width="60%" height={20} />
                  </TableCell>
                  <TableCell>
                    <Skeleton variant="text" width="70%" height={20} />
                  </TableCell>
                  <TableCell>
                    <Skeleton variant="rounded" width={70} height={24} />
                  </TableCell>
                  <TableCell>
                    <Skeleton variant="text" width={80} height={20} />
                  </TableCell>
                  <TableCell>
                    <Skeleton variant="text" width={80} height={20} />
                  </TableCell>
                  <TableCell>
                    <Box display="flex" gap={1}>
                      <Skeleton variant="circular" width={32} height={32} />
                      <Skeleton variant="circular" width={32} height={32} />
                    </Box>
                  </TableCell>
                </TableRow>
              ))
            ) : credentials.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                  <Typography variant="body2" color="text.secondary">
                    No credentials found. Credentials are automatically generated when memberships are created.
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              credentials.map((credential) => (
                <TableRow key={credential.id}>
                  <TableCell>
                    <Box display="flex" alignItems="center" gap={1}>
                      <CredentialIcon color="action" />
                      <Box>
                        <Typography variant="body2" fontWeight="medium">
                          {credential.id.slice(0, 12)}...
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {credential.membershipName}
                        </Typography>
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {credential.holderName || credential.holder}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {credential.benefitName}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={isExpired(credential.expiresAt) ? 'expired' : credential.status}
                      color={isExpired(credential.expiresAt) ? 'warning' : statusColors[credential.status]}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    {new Date(credential.issuedAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    {new Date(credential.expiresAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <IconButton onClick={() => handleViewCredential(credential)} size="small">
                      <ViewIcon />
                    </IconButton>
                    <IconButton 
                      onClick={() => handleShowQR(credential)} 
                      size="small" 
                      color="primary"
                      disabled={credential.status === 'revoked' || isExpired(credential.expiresAt)}
                    >
                      <QRIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Credential Details Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          Credential Details
        </DialogTitle>
        <DialogContent>
          {selectedCredential && (
            <Box>
              <Typography variant="h6" gutterBottom>
                Credential Information
              </Typography>
              
              <Box mb={3}>
                <Typography variant="body2" color="text.secondary">ID:</Typography>
                <Typography variant="body1" sx={{ fontFamily: 'monospace', fontSize: '0.875rem' }}>
                  {selectedCredential.id}
                </Typography>
              </Box>

              <Box mb={3}>
                <Typography variant="body2" color="text.secondary">Holder:</Typography>
                <Typography variant="body1">
                  {selectedCredential.holderName || selectedCredential.holder}
                </Typography>
              </Box>

              <Box mb={3}>
                <Typography variant="body2" color="text.secondary">Benefit:</Typography>
                <Typography variant="body1">
                  {selectedCredential.benefitName}
                </Typography>
              </Box>

              <Box mb={3}>
                <Typography variant="body2" color="text.secondary">Status:</Typography>
                <Chip
                  label={isExpired(selectedCredential.expiresAt) ? 'expired' : selectedCredential.status}
                  color={isExpired(selectedCredential.expiresAt) ? 'warning' : statusColors[selectedCredential.status]}
                  size="small"
                />
              </Box>

              <Box mb={3}>
                <Typography variant="body2" color="text.secondary">Valid Period:</Typography>
                <Typography variant="body1">
                  {new Date(selectedCredential.issuedAt).toLocaleString()} - {new Date(selectedCredential.expiresAt).toLocaleString()}
                </Typography>
              </Box>

              <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
                Proof Information
              </Typography>
              
              <Box mb={2}>
                <Typography variant="body2" color="text.secondary">Type:</Typography>
                <Typography variant="body1">
                  {selectedCredential.proof.type}
                </Typography>
              </Box>

              <Box mb={2}>
                <Typography variant="body2" color="text.secondary">Created:</Typography>
                <Typography variant="body1">
                  {new Date(selectedCredential.proof.created).toLocaleString()}
                </Typography>
              </Box>

              <Box mb={2}>
                <Typography variant="body2" color="text.secondary">Purpose:</Typography>
                <Typography variant="body1">
                  {selectedCredential.proof.proofPurpose}
                </Typography>
              </Box>

              <Box mb={2}>
                <Typography variant="body2" color="text.secondary">Verification Method:</Typography>
                <Typography variant="body1" sx={{ fontFamily: 'monospace', fontSize: '0.875rem' }}>
                  {selectedCredential.proof.verificationMethod}
                </Typography>
              </Box>

              {selectedCredential.status === 'active' && !isExpired(selectedCredential.expiresAt) && (
                <Box mt={3}>
                  <Button
                    variant="outlined"
                    color="error"
                    onClick={() => revokeCredential(selectedCredential.id)}
                  >
                    Revoke Credential
                  </Button>
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
      </Dialog>

      {/* QR Code Dialog */}
      <Dialog open={qrDialogOpen} onClose={() => setQrDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          Admin QR Code
        </DialogTitle>
        <DialogContent>
          {selectedCredential && (
            <Box>
              <Alert severity="info" sx={{ mb: 3 }}>
                This is a permanent admin QR code that can be used multiple times.
              </Alert>
              
              <QRCodeDisplay
                credentialId={selectedCredential.id}
                benefitName={selectedCredential.benefitName || 'Credential'}
                isAdmin={true}
              />
            </Box>
          )}
        </DialogContent>
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
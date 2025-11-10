import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router';
import type { Route } from "./+types/credential-detail";
import {
  Box,
  Paper,
  Typography,
  Button,
  IconButton,
  Chip,
  Alert,
  CircularProgress,
  Divider,
  Card,
  CardContent,
  CardActions,
  Breadcrumbs,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  ContentCopy as CopyIcon,
  Share as ShareIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Block as BlockIcon,
  Visibility as VisibilityIcon,
  Security as SecurityIcon,
  Assignment as AssignmentIcon,
} from '@mui/icons-material';
import { format } from 'date-fns';
import ShareForm from '../components/forms/ShareForm';
import CredentialForm from '../components/forms/CredentialForm';
import type { StoredCredential, BenefitType, VerificationResult } from '../types';
import type { CredentialFormData } from '../schemas';
import apiClient from '../api';
import { verificationService } from '../services/verification.service';
import { useGymInfo } from '../hooks/useGymInfo';

export function meta({ params }: Route.MetaArgs) {
  return [
    { title: `Credential ${params.id} - VCW Dashboard` },
    { name: "description", content: "View detailed information about a verifiable credential" },
  ];
}

export default function CredentialDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getIssuerDisplayName } = useGymInfo();
  
  const [credential, setCredential] = useState<StoredCredential | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [shareFormOpen, setShareFormOpen] = useState(false);
  const [jwtViewerOpen, setJwtViewerOpen] = useState(false);
  const [verificationResult, setVerificationResult] = useState<VerificationResult | null>(null);
  const [verifying, setVerifying] = useState(false);
  const [reissuing, setReissuing] = useState(false);

  const loadCredential = async () => {
    if (!id) return;
    
    try {
      setLoading(true);
      setError(null);
      const credentialData = await apiClient.getCredentialById(id);
      setCredential(credentialData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load credential');
      console.error('Error loading credential:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCredential();
  }, [id]);

  const handleCopyJwt = async () => {
    if (!credential?.jwt) return;
    
    try {
      await navigator.clipboard.writeText(credential.jwt);
      alert('Credential JWT copied to clipboard!');
    } catch (err) {
      console.error('Failed to copy JWT:', err);
      alert('Failed to copy JWT');
    }
  };

  const handleCreateShare = async (shareData: { credentialId: string; expiresInHours: number }) => {
    try {
      const response = await apiClient.createShare({
        credentialId: shareData.credentialId,
        expiresInHours: shareData.expiresInHours,
      });
      
      alert(`Share link created successfully!\n\nURL: ${response.shareUrl}\nExpires: ${response.expiresAt}`);
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Failed to create share link');
    }
  };

  const handleVerifyCredential = async () => {
    if (!credential?.jwt) return;
    
    try {
      setVerifying(true);
      const result = await verificationService.verifyCredential(credential.jwt);
      setVerificationResult(result);
    } catch (err) {
      setVerificationResult({
        valid: false,
        payload: null,
        credential: null,
        message: err instanceof Error ? err.message : 'Verification failed',
        error: err instanceof Error ? err.message : 'Verification failed',
      });
    } finally {
      setVerifying(false);
    }
  };

  const handleRevoke = async () => {
    if (!id || !credential) {
      return;
    }

    const reason = prompt(
      `Are you sure you want to revoke this credential?\n\nCredential: ${credential.metadata?.name || 'Unknown'}\n\nEnter the reason for revocation (optional):`
    );
    
    if (reason === null) {
      // User cancelled
      return;
    }
    
    try {
      await apiClient.revokeCredential(id, reason || undefined);
      console.log('Credential revoked successfully');
      // Refresh credential data
      loadCredential();
    } catch (err) {
      console.error('Failed to revoke credential:', err);
      setError('Failed to revoke credential');
    }
  };

  const handleDelete = async () => {
    if (!id || !confirm('Are you sure you want to delete this credential? This action cannot be undone.')) {
      return;
    }
    
    try {
      await apiClient.deleteCredential(id);
      console.log('Credential deleted successfully');
      navigate('/dashboard/credentials');
    } catch (err) {
      console.error('Failed to delete credential:', err);
      setError('Failed to delete credential');
    }
  };

  const onReissue = async (values: CredentialFormData) => {
    if (!credential) return;
    try {
      setReissuing(true);
      await apiClient.createCredential({
        holderDid: values.holderDid,
        name: values.name,
        plan: values.plan,
        benefitType: values.benefitType,
        membershipId: values.membershipId,
      });
      alert('Credential reissued with updated details.');
      // Optionally navigate back to list
      // navigate('/dashboard/credentials');
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to reissue credential');
    } finally {
      setReissuing(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'success';
      case 'revoked': return 'error';
      case 'expired': return 'warning';
      default: return 'default';
    }
  };

  const formatJson = (obj: unknown) => {
    return JSON.stringify(obj, null, 2);
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 400 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error || !credential) {
    return (
      <Box sx={{ p: 3 }}>
        <Breadcrumbs sx={{ mb: 2 }}>
          <Link to="/dashboard/credentials" style={{ textDecoration: 'none', color: 'inherit' }}>
            Credentials
          </Link>
          <Typography color="text.primary">Detail</Typography>
        </Breadcrumbs>
        
        <Alert severity="error">
          {error || 'Credential not found'}
        </Alert>
        
        <Button
          component={Link}
          to="/dashboard/credentials"
          startIcon={<ArrowBackIcon />}
          sx={{ mt: 2 }}
        >
          Back to Credentials
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3, maxWidth: 1200, mx: 'auto' }}>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Breadcrumbs sx={{ mb: 2 }}>
          <Link to="/dashboard/credentials" style={{ textDecoration: 'none', color: 'inherit' }}>
            Credentials
          </Link>
          <Typography color="text.primary">
            {credential.metadata?.name || credential.id}
          </Typography>
        </Breadcrumbs>
        
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
          <Box>
            <Typography variant="h4" component="h1" gutterBottom>
              {credential.metadata?.name || 'Credential Details'}
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Chip
                label={credential.status}
                color={getStatusColor(credential.status) as any}
                size="medium"
                sx={{ textTransform: 'capitalize', fontWeight: 'medium' }}
              />
              <Typography variant="body2" color="text.secondary">
                Created {format(new Date(credential.createdAt), 'PPP pp')}
              </Typography>
            </Box>
          </Box>
          
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              startIcon={<VisibilityIcon />}
              onClick={() => setJwtViewerOpen(true)}
              variant="outlined"
            >
              View JWT
            </Button>
            <Button
              startIcon={<CopyIcon />}
              onClick={handleCopyJwt}
              variant="outlined"
            >
              Copy JWT
            </Button>
            <Button
              startIcon={<ShareIcon />}
              onClick={() => setShareFormOpen(true)}
              variant="contained"
            >
              Share
            </Button>
            {credential?.status === 'active' && (
              <IconButton
                onClick={handleRevoke}
                color="warning"
                title="Revoke credential"
              >
                <BlockIcon />
              </IconButton>
            )}
            <IconButton
              onClick={handleDelete}
              color="error"
              title="Delete credential"
            >
              <DeleteIcon />
            </IconButton>
          </Box>
        </Box>
      </Box>

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '2fr 1fr' }, gap: 3 }}>
        {/* Main Content */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {/* Basic Information */}
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <AssignmentIcon />
                Reissue Credential
              </Typography>
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2, mb: 3 }}>
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">
                    Credential ID
                  </Typography>
                  <Typography variant="body2" sx={{ fontFamily: 'monospace', wordBreak: 'break-all' }}>
                    {credential.id}
                  </Typography>
                </Box>
                
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">
                    Last Updated
                  </Typography>
                  <Typography variant="body2">
                    {format(new Date(credential.updatedAt), 'PPP pp')}
                  </Typography>
                </Box>
              </Box>
              
              <CredentialForm
                onSubmit={onReissue}
                initialData={{
                  holderDid: credential.holderDid,
                  name: credential?.credential?.credentialSubject?.name || credential?.metadata?.name || '',
                  plan: credential?.metadata?.plan || credential?.credential?.credentialSubject?.membershipPlan || '',
                  membershipId: credential?.metadata?.membershipId || credential?.credential?.credentialSubject?.membershipId || '',
                  benefitType: credential?.metadata?.benefitType || credential?.credential?.credentialSubject?.benefitType || undefined,
                }}
                isEdit={true}
                submitButtonText={reissuing ? 'Reissuing...' : 'Reissue Updated'}
              />
            </CardContent>
          </Card>

          {/* Verifiable Credential */}
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Verifiable Credential
              </Typography>
              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, mb: 2 }}>
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">
                    Issuer
                  </Typography>
                  <Typography variant="body2" sx={{ fontFamily: 'monospace', wordBreak: 'break-all' }}>
                    {getIssuerDisplayName(credential.credential.issuer)}
                  </Typography>
                </Box>
                
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">
                    Valid From
                  </Typography>
                  <Typography variant="body2">
                    {format(new Date(credential.credential.validFrom), 'PPP pp')}
                  </Typography>
                </Box>
              </Box>
              
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Types
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                {credential.credential.type.map((type: string, index: number) => {
                  let label = type.replace('VerifiableCredential', '').replace(/([A-Z])/g, ' $1').trim();
                  // If the result is empty (e.g., "VerifiableCredential" becomes ""), use the original type
                  if (!label) label = type;
                  
                  return (
                    <Chip
                      key={index}
                      label={label}
                      variant="outlined"
                      size="small"
                    />
                  );
                })}
              </Box>
              
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Subject Details
              </Typography>
              <Paper sx={{ p: 2, bgcolor: 'grey.50', maxHeight: 300, overflow: 'auto' }}>
                <pre style={{
                  margin: 0,
                  fontSize: '0.875rem',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                  fontFamily: 'monospace'
                }}>
                  {formatJson(credential.credential.credentialSubject)}
                </pre>
              </Paper>
            </CardContent>
          </Card>
        </Box>

        {/* Sidebar */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {/* Quick Actions */}
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Quick Actions
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Button
                  startIcon={<SecurityIcon />}
                  onClick={handleVerifyCredential}
                  disabled={verifying}
                  fullWidth
                  variant="outlined"
                >
                  {verifying ? 'Verifying...' : 'Verify Credential'}
                </Button>
                
                <Button
                  startIcon={<CopyIcon />}
                  onClick={handleCopyJwt}
                  fullWidth
                  variant="outlined"
                >
                  Copy JWT Token
                </Button>
                
                <Button
                  startIcon={<ShareIcon />}
                  onClick={() => setShareFormOpen(true)}
                  fullWidth
                  variant="contained"
                >
                  Create Share Link
                </Button>
              </Box>
            </CardContent>
          </Card>

          {/* Verification Result */}
          {verificationResult && (
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Verification Result
                </Typography>
                {verificationResult.valid ? (
                  <Alert severity="success" sx={{ mb: 2 }}>
                    ✅ Credential is valid and authentic!
                  </Alert>
                ) : (
                  <Alert severity="error" sx={{ mb: 2 }}>
                    ❌ Verification failed: {verificationResult.error}
                  </Alert>
                )}
                
                {verificationResult.payload && (
                  <Box>
                    <Typography variant="subtitle2" gutterBottom>
                      Decoded Payload:
                    </Typography>
                    <Paper sx={{ p: 2, bgcolor: 'grey.50', maxHeight: 200, overflow: 'auto' }}>
                      <pre style={{
                        margin: 0,
                        fontSize: '0.75rem',
                        whiteSpace: 'pre-wrap',
                        wordBreak: 'break-word',
                        fontFamily: 'monospace'
                      }}>
                        {formatJson(verificationResult.payload)}
                      </pre>
                    </Paper>
                  </Box>
                )}
              </CardContent>
            </Card>
          )}

          {/* Metadata */}
          {credential.metadata && Object.keys(credential.metadata).length > 0 && (
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Metadata
                </Typography>
                <Paper sx={{ p: 2, bgcolor: 'grey.50' }}>
                  <pre style={{
                    margin: 0,
                    fontSize: '0.875rem',
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                    fontFamily: 'monospace'
                  }}>
                    {formatJson(credential.metadata)}
                  </pre>
                </Paper>
              </CardContent>
            </Card>
          )}
        </Box>
      </Box>

      {/* JWT Viewer Dialog */}
      <Dialog open={jwtViewerOpen} onClose={() => setJwtViewerOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>JWT Token</DialogTitle>
        <DialogContent>
          <TextField
            multiline
            rows={10}
            value={credential.jwt}
            fullWidth
            InputProps={{
              readOnly: true,
              sx: { fontFamily: 'monospace', fontSize: '0.875rem' }
            }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCopyJwt} startIcon={<CopyIcon />}>
            Copy
          </Button>
          <Button onClick={() => setJwtViewerOpen(false)}>
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* Share Form */}
      <ShareForm
        open={shareFormOpen}
        onClose={() => setShareFormOpen(false)}
        onSubmit={handleCreateShare}
        initialData={credential ? { credentialId: credential.id, expiresInHours: 24 } : undefined}
        title="Create Share Link"
      />
    </Box>
  );
}
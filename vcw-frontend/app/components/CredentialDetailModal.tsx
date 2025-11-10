import React, { useState, useEffect, useMemo } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Divider,
  Chip,
  IconButton,
  CircularProgress,
  Alert,
  Paper,
  TextField,
  MenuItem,
} from '@mui/material';
import {
  ContentCopy as CopyIcon,
  Close as CloseIcon,
} from '@mui/icons-material';
import { format } from 'date-fns';
import type { StoredCredential, BenefitType } from '../types';
import { useGymInfo } from '../hooks/useGymInfo';
import apiClient from '../api';
import { useForm, Controller } from 'react-hook-form';

interface CredentialDetailModalProps {
  open: boolean;
  onClose: () => void;
  credentialId: string | null;
  onCopyJwt?: (credentialId: string) => void;
}

const formatJson = (obj: unknown) => {
  return JSON.stringify(obj, null, 2);
};

export default function CredentialDetailModal({
  open,
  onClose,
  credentialId,
  onCopyJwt,
}: CredentialDetailModalProps) {
  const { getIssuerDisplayName } = useGymInfo();
  const [credential, setCredential] = useState<StoredCredential | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState<string | null>(null);

  type FormValues = {
    name: string;
    plan: string;
    membershipId: string;
    benefitName?: string;
    benefitType?: BenefitType;
  };

  const {
    control,
    handleSubmit,
    reset,
    formState: { isDirty },
    watch,
  } = useForm<FormValues>({
    defaultValues: {
      name: '',
      plan: '',
      membershipId: '',
      benefitName: '',
      benefitType: undefined,
    },
  });

  useEffect(() => {
    if (open && credentialId) {
      loadCredential();
    } else if (!open) {
      // Reset when modal closes
      setCredential(null);
      setError(null);
    }
  }, [open, credentialId]);

  const loadCredential = async () => {
    if (!credentialId) return;
    
    try {
      setLoading(true);
      setError(null);
      const data = await apiClient.getCredentialById(credentialId);
      setCredential(data);
      // Initialize form with fetched data
      const initial: FormValues = {
        name: data?.credential?.credentialSubject?.name ?? data?.metadata?.name ?? '',
        plan: data?.credential?.credentialSubject?.membershipPlan ?? data?.metadata?.plan ?? '',
        membershipId: data?.credential?.credentialSubject?.membershipId ?? data?.metadata?.membershipId ?? '',
        benefitName: data?.credential?.credentialSubject?.benefitName ?? data?.metadata?.benefitName ?? '',
        benefitType: data?.credential?.credentialSubject?.benefitType ?? data?.metadata?.benefitType ?? undefined,
      };
      reset(initial);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load credential details');
    } finally {
      setLoading(false);
    }
  };

  // Derived display helpers
  const issuedAt = useMemo(() => {
    if (!credential?.credential?.validFrom) return '';
    try {
      return format(new Date(credential.credential.validFrom), 'PPP pp');
    } catch {
      return credential.credential.validFrom;
    }
  }, [credential]);

  // Handle local save (no backend update as requested)
  const onSubmit = (values: FormValues) => {
    if (!credential) return;
    // Update local state to reflect user changes
    setCredential(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        metadata: {
          ...prev.metadata,
          name: values.name,
          plan: values.plan,
          membershipId: values.membershipId,
          benefitName: values.benefitName,
          benefitType: values.benefitType,
        },
        credential: {
          ...prev.credential,
          credentialSubject: {
            ...prev.credential.credentialSubject,
            name: values.name,
            membershipPlan: values.plan,
            membershipId: values.membershipId,
            benefitName: values.benefitName,
            benefitType: values.benefitType,
          },
        },
      } as StoredCredential;
    });
    setSaved('Changes applied locally. No server update was performed.');
  };

  const benefitTypes: { value: BenefitType; label: string }[] = [
    { value: 'gym_access', label: 'Gym Access' },
    { value: 'pool_access', label: 'Pool Access' },
    { value: 'sauna_access', label: 'Sauna Access' },
    { value: 'personal_trainer', label: 'Personal Trainer' },
    { value: 'group_classes', label: 'Group Classes' },
    { value: 'nutrition_consultation', label: 'Nutrition Consultation' },
  ];

  if (!open) return null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h6">Credential Details</Typography>
        <IconButton onClick={onClose} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      
      <DialogContent>
        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 200 }}>
            <CircularProgress />
          </Box>
        )}

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {saved && (
          <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSaved(null)}>
            {saved}
          </Alert>
        )}

        {credential && !loading && (
          <Box component="form" onSubmit={handleSubmit(onSubmit)} sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {/* Basic Information (read-only + editable fields) */}
            <Box>
              <Typography variant="h6" gutterBottom>
                Basic Information
              </Typography>
              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">
                    Credential ID
                  </Typography>
                  <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                    {credential.id}
                  </Typography>
                </Box>

                <Box>
                  <Typography variant="subtitle2" color="text.secondary">
                    Status
                  </Typography>
                  <Chip
                    label={credential.status}
                    color={credential.status === 'active' ? 'success' : credential.status === 'revoked' ? 'error' : 'warning'}
                    size="small"
                    sx={{ textTransform: 'capitalize' }}
                  />
                </Box>

                <Controller
                  name="name"
                  control={control}
                  render={({ field }) => (
                    <TextField {...field} label="Subject Name" size="small" />
                  )}
                />

                <Controller
                  name="plan"
                  control={control}
                  render={({ field }) => (
                    <TextField {...field} label="Plan" size="small" />
                  )}
                />

                <Box>
                  <Typography variant="subtitle2" color="text.secondary">
                    Issued Date
                  </Typography>
                  <Typography variant="body2">
                    {issuedAt || 'N/A'}
                  </Typography>
                </Box>

                <Controller
                  name="membershipId"
                  control={control}
                  render={({ field }) => (
                    <TextField {...field} label="Membership ID" size="small" />
                  )}
                />

                <Box sx={{ gridColumn: '1 / -1' }}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Holder DID
                  </Typography>
                  <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.8rem', wordBreak: 'break-all' }}>
                    {credential.holderDid}
                  </Typography>
                </Box>
              </Box>
            </Box>

            <Divider />

            {/* Benefit */}
            <Box>
              <Typography variant="h6" gutterBottom>
                Benefit
              </Typography>
              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                <Controller
                  name="benefitName"
                  control={control}
                  render={({ field }) => (
                    <TextField {...field} label="Benefit Name" size="small" />
                  )}
                />
                <Controller
                  name="benefitType"
                  control={control}
                  render={({ field }) => (
                    <TextField select {...field} label="Benefit Type" size="small">
                      <MenuItem value={undefined as any}>None</MenuItem>
                      {benefitTypes.map(bt => (
                        <MenuItem key={bt.value} value={bt.value}>{bt.label}</MenuItem>
                      ))}
                    </TextField>
                  )}
                />
              </Box>
              <Box sx={{ mt: 1, display: 'flex', gap: 1, alignItems: 'center' }}>
                {watch('benefitName') && (
                  <Chip label={watch('benefitName') as string} color="primary" variant="outlined" size="small" />
                )}
                {watch('benefitType') && (
                  <Chip label={String(watch('benefitType'))} size="small" />
                )}
              </Box>
            </Box>

            <Divider />

            {/* Subject Details (live) */}
            <Box>
              <Typography variant="h6" gutterBottom>
                Subject Details (live)
              </Typography>
              <Paper sx={{ p: 2, bgcolor: 'grey.50' }}>
                <pre style={{ 
                  margin: 0, 
                  fontSize: '0.875rem', 
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                  fontFamily: 'monospace'
                }}>
{formatJson({
  ...credential.credential.credentialSubject,
  name: watch('name'),
  membershipPlan: watch('plan'),
  membershipId: watch('membershipId'),
  benefitName: watch('benefitName'),
  benefitType: watch('benefitType'),
})}
                </pre>
              </Paper>
            </Box>

            <Divider />

            {/* Issuer Information */}
            <Box>
              <Typography variant="h6" gutterBottom>
                Issuer Information
              </Typography>
              <Typography variant="body2" sx={{ fontFamily: 'monospace', wordBreak: 'break-all' }}>
                {getIssuerDisplayName(credential.credential?.issuer || 'Unknown')}
              </Typography>
            </Box>

            <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
              <Button variant="outlined" onClick={() => reset()} disabled={!isDirty}>
                Reset
              </Button>
              <Button type="submit" variant="contained">
                Apply Changes
              </Button>
            </Box>
          </Box>
        )}
      </DialogContent>
      
      <DialogActions>
        {onCopyJwt && credential && (
          <Button
            startIcon={<CopyIcon />}
            onClick={() => onCopyJwt(credential.id)}
            variant="outlined"
          >
            Copy JWT
          </Button>
        )}
        <Button onClick={onClose} variant="contained">
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
}
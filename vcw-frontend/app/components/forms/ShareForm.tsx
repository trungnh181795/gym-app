import React, { useState, useEffect } from 'react';
import { useForm, Controller, type SubmitHandler } from 'react-hook-form';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
  Alert,
} from '@mui/material';
import type { CredentialListItem } from '../../types';
import apiClient from '../../api';

// Custom interface for the form that ensures expiresInHours is always a number
interface ShareFormData {
  credentialId: string;
  expiresInHours: number;
}

interface ShareFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: ShareFormData) => Promise<void>;
  initialData?: Partial<ShareFormData>;
  title?: string;
}

export default function ShareForm({
  open,
  onClose,
  onSubmit,
  initialData,
  title = 'Create Share Link',
}: ShareFormProps) {
  const [credentials, setCredentials] = useState<CredentialListItem[]>([]);
  const [loadingCredentials, setLoadingCredentials] = useState(true);

  const {
    control,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<ShareFormData>({
    defaultValues: {
      credentialId: initialData?.credentialId || '',
      expiresInHours: initialData?.expiresInHours || 24,
    },
  });

  const expiresInHours = watch('expiresInHours');

  useEffect(() => {
    const loadCredentials = async () => {
      try {
        const credentialData = await apiClient.getCredentials();
        setCredentials(credentialData);
      } catch (error) {
        console.error('Failed to load credentials:', error);
      } finally {
        setLoadingCredentials(false);
      }
    };

    if (open) {
      loadCredentials();
    }
  }, [open]);

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleFormSubmit: SubmitHandler<ShareFormData> = async (data) => {
    try {
      await onSubmit(data);
      handleClose();
    } catch (error) {
      console.error('Form submission error:', error);
    }
  };

  const getExpirationPreview = () => {
    if (!expiresInHours) return '';
    
    const expiresAt = new Date(Date.now() + expiresInHours * 60 * 60 * 1000);
    return `Expires on ${expiresAt.toLocaleDateString()} at ${expiresAt.toLocaleTimeString()}`;
  };

  const getHoursLabel = (hours: number) => {
    if (hours < 24) {
      return `${hours} hour${hours !== 1 ? 's' : ''}`;
    } else if (hours % 24 === 0) {
      const days = hours / 24;
      return `${days} day${days !== 1 ? 's' : ''}`;
    } else {
      const days = Math.floor(hours / 24);
      const remainingHours = hours % 24;
      return `${days}d ${remainingHours}h`;
    }
  };

  const commonDurations = [
    { value: 1, label: '1 hour' },
    { value: 3, label: '3 hours' },
    { value: 6, label: '6 hours' },
    { value: 12, label: '12 hours' },
    { value: 24, label: '1 day' },
    { value: 48, label: '2 days' },
    { value: 72, label: '3 days' },
    { value: 168, label: '1 week' },
  ];

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>{title}</DialogTitle>
      <form onSubmit={handleSubmit(handleFormSubmit)}>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, pt: 1 }}>
            <Controller
              name="credentialId"
              control={control}
              render={({ field }) => (
                <FormControl fullWidth error={!!errors.credentialId}>
                  <InputLabel>Credential to Share</InputLabel>
                  <Select
                    {...field}
                    label="Credential to Share"
                    disabled={loadingCredentials}
                  >
                    {credentials.map((credential) => (
                      <MenuItem key={credential.id} value={credential.id}>
                        <Box>
                          <Typography variant="body1">
                            {credential.subject?.name || credential.id}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Plan: {credential.subject?.plan} | Status: {credential.status}
                          </Typography>
                        </Box>
                      </MenuItem>
                    ))}
                  </Select>
                  {errors.credentialId && (
                    <Typography variant="caption" color="error" sx={{ mt: 0.5 }}>
                      {errors.credentialId.message}
                    </Typography>
                  )}
                </FormControl>
              )}
            />

            <Box>
              <Controller
                name="expiresInHours"
                control={control}
                render={({ field: { onChange, value, ...field } }) => (
                  <TextField
                    {...field}
                    value={value || ''}
                    onChange={(e) => onChange(parseInt(e.target.value) || 24)}
                    label="Expires In (Hours)"
                    type="number"
                    inputProps={{ min: 1, max: 168 }}
                    error={!!errors.expiresInHours}
                    helperText={errors.expiresInHours?.message || `Duration: ${getHoursLabel(value || 24)}`}
                    fullWidth
                  />
                )}
              />

              <Box sx={{ mt: 2, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                <Typography variant="caption" color="text.secondary" sx={{ width: '100%', mb: 1 }}>
                  Quick select:
                </Typography>
                {commonDurations.map((duration) => (
                  <Button
                    key={duration.value}
                    size="small"
                    variant={expiresInHours === duration.value ? 'contained' : 'outlined'}
                    onClick={() => setValue('expiresInHours', duration.value)}
                    sx={{ minWidth: 'auto', px: 1.5 }}
                  >
                    {duration.label}
                  </Button>
                ))}
              </Box>
            </Box>

            {expiresInHours && (
              <Alert severity="info" sx={{ mt: 1 }}>
                <Typography variant="body2">
                  {getExpirationPreview()}
                </Typography>
              </Alert>
            )}

            <Alert severity="warning">
              <Typography variant="body2">
                <strong>Security Notice:</strong> Anyone with the share link will be able to view this credential. 
                The link will automatically expire after the specified time.
              </Typography>
            </Alert>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Creating...' : 'Create Share Link'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
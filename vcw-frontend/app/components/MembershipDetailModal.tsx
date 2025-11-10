import React, { useEffect, useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  CircularProgress,
  Alert,
  TextField,
  Chip,
  Divider,
  IconButton,
} from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';
import { useForm, Controller } from 'react-hook-form';
import type { Membership, Benefit } from '../types';
import apiClient from '../api';

interface MembershipDetailModalProps {
  open: boolean;
  onClose: () => void;
  membershipId: string | null;
}

type FormValues = {
  name: string;
  description: string;
  validFrom: string;
  validUntil: string;
  price: number;
};

export default function MembershipDetailModal({ open, onClose, membershipId }: MembershipDetailModalProps) {
  const [membership, setMembership] = useState<Membership | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState<string | null>(null);

  const { control, handleSubmit, reset, formState: { isDirty } } = useForm<FormValues>({
    defaultValues: {
      name: '',
      description: '',
      validFrom: '',
      validUntil: '',
      price: 0,
    },
  });

  useEffect(() => {
    if (open && membershipId) {
      loadMembership();
    } else if (!open) {
      setMembership(null);
      setError(null);
      setSaved(null);
    }
  }, [open, membershipId]);

  const loadMembership = async () => {
    if (!membershipId) return;
    try {
      setLoading(true);
      setError(null);
      const data = await apiClient.getMembershipById(membershipId);
      setMembership(data);
      reset({
        name: data.name,
        description: data.description,
        validFrom: data.validFrom.slice(0, 10),
        validUntil: data.validUntil.slice(0, 10),
        price: data.price,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load membership');
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (values: FormValues) => {
    if (!membership) return;
    try {
      setLoading(true);
      await apiClient.updateMembership(membership.id, {
        userId: membership.userId,
        name: values.name,
        description: values.description,
        validFrom: values.validFrom,
        validUntil: values.validUntil,
        price: values.price,
        benefits: membership.benefits as Benefit[],
      });
      setSaved('Membership updated successfully');
      await loadMembership();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update membership');
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h6">Membership Details</Typography>
        <IconButton onClick={onClose} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent>
        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 180 }}>
            <CircularProgress />
          </Box>
        )}

        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}
        {saved && (
          <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSaved(null)}>
            {saved}
          </Alert>
        )}

        {membership && !loading && (
          <Box component="form" onSubmit={handleSubmit(onSubmit)} sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
              <Controller
                name="name"
                control={control}
                render={({ field }) => (
                  <TextField {...field} label="Name" size="small" />
                )}
              />
              <Controller
                name="price"
                control={control}
                render={({ field }) => (
                  <TextField {...field} type="number" label="Price" size="small" />
                )}
              />
              <Controller
                name="validFrom"
                control={control}
                render={({ field }) => (
                  <TextField {...field} type="date" label="Valid From" size="small" InputLabelProps={{ shrink: true }} />
                )}
              />
              <Controller
                name="validUntil"
                control={control}
                render={({ field }) => (
                  <TextField {...field} type="date" label="Valid Until" size="small" InputLabelProps={{ shrink: true }} />
                )}
              />
              <Controller
                name="description"
                control={control}
                render={({ field }) => (
                  <TextField {...field} label="Description" size="small" multiline minRows={2} sx={{ gridColumn: '1 / -1' }} />
                )}
              />
            </Box>

            <Divider />

            <Box>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Benefits
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {membership.benefits.map((b, idx) => (
                  <Chip key={idx} label={b.name} variant="outlined" size="small" />
                ))}
              </Box>
            </Box>

            <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
              <Button variant="outlined" onClick={() => reset()} disabled={!isDirty}>Reset</Button>
              <Button type="submit" variant="contained">Save Changes</Button>
            </Box>
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} variant="contained">Close</Button>
      </DialogActions>
    </Dialog>
  );
}

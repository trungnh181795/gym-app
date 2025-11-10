import React, { useState, useEffect } from 'react';
import { useForm, Controller, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  TextField,
  Button,
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
} from '@mui/material';
import { credentialSchema, type CredentialFormData } from '../../schemas';
import type { Membership, User } from '../../types';
import apiClient from '../../api';

interface CredentialFormProps {
  onSubmit: (data: CredentialFormData) => Promise<void>;
  initialData?: Partial<CredentialFormData>;
  isEdit?: boolean;
  submitButtonText?: string;
  showCancelButton?: boolean;
  onCancel?: () => void;
}

const benefitTypes = [
  { value: 'gym_access', label: 'Gym Access' },
  { value: 'pool_access', label: 'Pool Access' },
  { value: 'sauna_access', label: 'Sauna Access' },
  { value: 'personal_trainer', label: 'Personal Trainer' },
  { value: 'group_classes', label: 'Group Classes' },
  { value: 'nutrition_consultation', label: 'Nutrition Consultation' },
];

export default function CredentialForm({
  onSubmit,
  initialData,
  isEdit = false,
  submitButtonText,
  showCancelButton = false,
  onCancel,
}: CredentialFormProps) {
  const [memberships, setMemberships] = useState<Membership[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loadingMemberships, setLoadingMemberships] = useState(true);
  const [loadingUsers, setLoadingUsers] = useState(true);

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CredentialFormData>({
    resolver: zodResolver(credentialSchema),
    defaultValues: {
      holderDid: initialData?.holderDid || '',
      name: initialData?.name || '',
      plan: initialData?.plan || '',
      benefitType: initialData?.benefitType || undefined,
      membershipId: initialData?.membershipId || undefined,
    },
  });

  useEffect(() => {
    const loadData = async () => {
      try {
        const [membershipData, userData] = await Promise.all([
          apiClient.getMemberships(),
          apiClient.getUsers(),
        ]);
        setMemberships(membershipData);
        setUsers(userData);
      } catch (error) {
        console.error('Failed to load data:', error);
      } finally {
        setLoadingMemberships(false);
        setLoadingUsers(false);
      }
    };

    loadData();
  }, []);

  // Reset form when initialData changes
  useEffect(() => {
    if (initialData) {
      reset({
        holderDid: initialData?.holderDid || '',
        name: initialData?.name || '',
        plan: initialData?.plan || '',
        benefitType: initialData?.benefitType || undefined,
        membershipId: initialData?.membershipId || undefined,
      });
    }
  }, [initialData, reset]);

  const handleFormSubmit: SubmitHandler<CredentialFormData> = async (data) => {
    try {
      await onSubmit(data);
    } catch (error) {
      console.error('Form submission error:', error);
    }
  };

  return (
    <Box component="form" onSubmit={handleSubmit(handleFormSubmit)} sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <Controller
        name="holderDid"
        control={control}
        render={({ field }) => (
          <FormControl fullWidth error={!!errors.holderDid}>
            <InputLabel>Holder DID</InputLabel>
            <Select
              {...field}
              label="Holder DID"
              disabled={loadingUsers}
            >
              {users.map((user) => (
                <MenuItem key={user.id} value={user.walletDid}>
                  <Box>
                    <Typography variant="body2" fontWeight="medium">
                      {user.name} ({user.email})
                    </Typography>
                    <Typography 
                      variant="caption" 
                      color="text.secondary"
                      sx={{ fontFamily: 'monospace', fontSize: '0.75rem' }}
                    >
                      {user.walletDid}
                    </Typography>
                  </Box>
                </MenuItem>
              ))}
            </Select>
            {errors.holderDid && (
              <Typography variant="caption" color="error" sx={{ mt: 0.5 }}>
                {errors.holderDid.message}
              </Typography>
            )}
          </FormControl>
        )}
      />

      <Controller
        name="name"
        control={control}
        render={({ field }) => (
          <TextField
            {...field}
            label="Credential Name"
            placeholder="John Doe Gym Membership"
            error={!!errors.name}
            helperText={errors.name?.message}
            fullWidth
          />
        )}
      />

      <Controller
        name="plan"
        control={control}
        render={({ field }) => (
          <TextField
            {...field}
            label="Plan"
            placeholder="Premium Membership"
            error={!!errors.plan}
            helperText={errors.plan?.message}
            fullWidth
          />
        )}
      />

      <Controller
        name="benefitType"
        control={control}
        render={({ field }) => (
          <FormControl fullWidth>
            <InputLabel>Benefit Type (Optional)</InputLabel>
            <Select
              {...field}
              value={field.value || ''}
              label="Benefit Type (Optional)"
            >
              <MenuItem value="">
                <em>None</em>
              </MenuItem>
              {benefitTypes.map((type) => (
                <MenuItem key={type.value} value={type.value}>
                  {type.label}
                </MenuItem>
              ))}
            </Select>
            {errors.benefitType && (
              <Typography variant="caption" color="error" sx={{ mt: 0.5 }}>
                {errors.benefitType.message}
              </Typography>
            )}
          </FormControl>
        )}
      />

      <Controller
        name="membershipId"
        control={control}
        render={({ field }) => (
          <FormControl fullWidth>
            <InputLabel>Membership (Optional)</InputLabel>
            <Select
              {...field}
              value={field.value || ''}
              label="Membership (Optional)"
              disabled={loadingMemberships}
            >
              <MenuItem value="">
                <em>None</em>
              </MenuItem>
              {memberships.map((membership) => (
                <MenuItem key={membership.id} value={membership.id}>
                  {membership.name} (ID: {membership.userId})
                </MenuItem>
              ))}
            </Select>
            {errors.membershipId && (
              <Typography variant="caption" color="error" sx={{ mt: 0.5 }}>
                {errors.membershipId.message}
              </Typography>
            )}
          </FormControl>
        )}
      />

      {/* Action Buttons */}
      <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
        {showCancelButton && (
          <Button onClick={onCancel} disabled={isSubmitting}>
            Cancel
          </Button>
        )}
        <Button
          type="submit"
          variant="contained"
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Creating...' : submitButtonText || (isEdit ? 'Update' : 'Create')}
        </Button>
      </Box>
    </Box>
  );
}
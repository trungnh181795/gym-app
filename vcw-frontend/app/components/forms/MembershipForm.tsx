import React, { useState, useEffect } from 'react';
import { useForm, Controller, useFieldArray, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  TextField,
  Button,
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Checkbox,
  Typography,
  Card,
  CardContent,
  IconButton,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import { membershipSchema, type MembershipFormData } from '../../schemas';
import type { User } from '../../types';
import apiClient from '../../api';

interface MembershipFormProps {
  onSubmit: (data: MembershipFormData) => Promise<void>;
  initialData?: Partial<MembershipFormData>;
  isEdit?: boolean;
  submitButtonText?: string;
  showCancelButton?: boolean;
  onCancel?: () => void;
  currentUserId?: string; // Current logged-in user ID
}

const benefitTypes = [
  { value: 'gym_access', label: 'Gym Floor Access', description: 'Full access to all gym equipment and weights' },
  { value: 'pool_access', label: 'Swimming Pool Access', description: 'Access to pool facilities and aquatic programs' },
  { value: 'sauna_access', label: 'Wellness Facilities', description: 'Sauna, steam room, and relaxation areas' },
  { value: 'personal_trainer', label: 'Personal Training', description: 'One-on-one sessions with certified trainers' },
  { value: 'group_classes', label: 'Group Fitness Classes', description: 'Yoga, pilates, spinning, and more' },
  { value: 'nutrition_consultation', label: 'Nutrition Services', description: 'Professional nutrition guidance and meal planning' },
];

export default function MembershipForm({
  onSubmit,
  initialData,
  isEdit = false,
  submitButtonText,
  showCancelButton = false,
  onCancel,
  currentUserId,
}: MembershipFormProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [benefitShareStates, setBenefitShareStates] = useState<boolean[]>([]);

  const {
    control,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<MembershipFormData>({
    resolver: zodResolver(membershipSchema),
    defaultValues: {
      userId: currentUserId || initialData?.userId || '',
      name: initialData?.name || '',
      description: initialData?.description || '',
      validFrom: initialData?.validFrom || new Date().toISOString().split('T')[0],
      validUntil: initialData?.validUntil || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      price: initialData?.price || 0,
      benefits: initialData?.benefits || [
        {
          type: 'gym_access',
          name: 'Gym Floor Access',
          description: 'Full access to all gym equipment, weights, and cardio machines during operating hours',
          requiresBooking: false,
          isShared: false,
          sharedWithUserId: undefined,
        },
      ],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'benefits',
  });

  useEffect(() => {
    const loadUsers = async () => {
      try {
        const usersData = await apiClient.getUsers();
        setUsers(usersData);
      } catch (error) {
        console.error('Failed to load users:', error);
      } finally {
        setLoadingUsers(false);
      }
    };

    loadUsers();
  }, []);

  // Reset form when initialData changes
  useEffect(() => {
    if (initialData) {
      reset({
        userId: initialData?.userId || '',
        name: initialData?.name || '',
        description: initialData?.description || '',
        validFrom: initialData?.validFrom || new Date().toISOString().split('T')[0],
        validUntil: initialData?.validUntil || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        price: initialData?.price || 0,
        benefits: initialData?.benefits || [
          {
            type: 'gym_access',
            name: 'Gym Floor Access',
            description: 'Full access to all gym equipment, weights, and cardio machines during operating hours',
            requiresBooking: false,
          },
        ],
      });
    }
  }, [initialData, reset]);

  const handleFormSubmit: SubmitHandler<MembershipFormData> = async (data) => {
    try {
      await onSubmit(data);
    } catch (error) {
      console.error('Form submission error:', error);
    }
  };

  const addBenefit = () => {
    append({
      type: 'gym_access',
      name: '',
      description: '',
      requiresBooking: false,
      isShared: false,
      sharedWithUserId: undefined,
    });
    setBenefitShareStates([...benefitShareStates, false]);
  };

  return (
    <Box component="form" onSubmit={handleSubmit(handleFormSubmit)} sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      {/* Hidden userId field - automatically set to current user */}
      <Controller
        name="userId"
        control={control}
        render={({ field }) => <input type="hidden" {...field} />}
      />

      {/* Basic Info */}
      <Box sx={{ display: 'flex', gap: 2 }}>
        <Controller
          name="name"
          control={control}
          render={({ field }) => (
            <TextField
              {...field}
              label="Membership Name"
              error={!!errors.name}
              helperText={errors.name?.message}
              fullWidth
            />
          )}
        />

        <Controller
          name="price"
          control={control}
          render={({ field: { onChange, value, ...field } }) => (
            <TextField
              {...field}
              value={value || ''}
              onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
              label="Price ($)"
              type="number"
              inputProps={{ min: 0, step: 0.01 }}
              error={!!errors.price}
              helperText={errors.price?.message}
              fullWidth
            />
          )}
        />
      </Box>

      <Controller
        name="description"
        control={control}
        render={({ field }) => (
          <TextField
            {...field}
            label="Description (Optional)"
            multiline
            rows={2}
            error={!!errors.description}
            helperText={errors.description?.message || "Optional field"}
            fullWidth
          />
        )}
      />

      {/* Dates */}
      <Box sx={{ display: 'flex', gap: 2 }}>
        <Controller
          name="validFrom"
          control={control}
          render={({ field }) => (
            <TextField
              {...field}
              label="Valid From"
              type="date"
              error={!!errors.validFrom}
              helperText={errors.validFrom?.message}
              fullWidth
              InputLabelProps={{ shrink: true }}
            />
          )}
        />

        <Controller
          name="validUntil"
          control={control}
          render={({ field }) => (
            <TextField
              {...field}
              label="Valid Until"
              type="date"
              error={!!errors.validUntil}
              helperText={errors.validUntil?.message}
              fullWidth
              InputLabelProps={{ shrink: true }}
            />
          )}
        />
      </Box>

      {/* Benefits */}
      <Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6">Benefits</Typography>
          <Button
            startIcon={<AddIcon />}
            onClick={addBenefit}
            variant="outlined"
            size="small"
          >
            Add Benefit
          </Button>
        </Box>

        {fields.map((field, index) => (
          <Card key={field.id} sx={{ mb: 2 }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="subtitle1">Benefit {index + 1}</Typography>
                {fields.length > 1 && (
                  <IconButton
                    onClick={() => remove(index)}
                    color="error"
                    size="small"
                  >
                    <DeleteIcon />
                  </IconButton>
                )}
              </Box>

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Box sx={{ display: 'flex', gap: 2 }}>
                  <Controller
                    name={`benefits.${index}.type`}
                    control={control}
                    render={({ field }) => (
                      <FormControl fullWidth>
                        <InputLabel>Benefit Type</InputLabel>
                        <Select {...field} label="Benefit Type">
                          {benefitTypes.map((type) => (
                            <MenuItem key={type.value} value={type.value}>
                              {type.label}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    )}
                  />

                  <Controller
                    name={`benefits.${index}.name`}
                    control={control}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        label="Benefit Name"
                        fullWidth
                        error={!!errors.benefits?.[index]?.name}
                        helperText={errors.benefits?.[index]?.name?.message}
                      />
                    )}
                  />
                </Box>

                <Controller
                  name={`benefits.${index}.description`}
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Description (Optional)"
                      multiline
                      rows={2}
                      fullWidth
                      error={!!errors.benefits?.[index]?.description}
                      helperText={errors.benefits?.[index]?.description?.message || "Optional field"}
                    />
                  )}
                />

                <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
                  <Controller
                    name={`benefits.${index}.maxUsesPerMonth`}
                    control={control}
                    render={({ field: { onChange, value, ...field } }) => (
                      <TextField
                        {...field}
                        value={value || ''}
                        onChange={(e) => onChange(parseInt(e.target.value) || undefined)}
                        label="Max Uses Per Month (Optional)"
                        type="number"
                        inputProps={{ min: 1 }}
                        placeholder="Unlimited"
                        sx={{ width: 200 }}
                      />
                    )}
                  />

                  <Controller
                    name={`benefits.${index}.requiresBooking`}
                    control={control}
                    render={({ field }) => (
                      <FormControlLabel
                        control={<Checkbox {...field} checked={field.value} />}
                        label="Requires Booking"
                      />
                    )}
                  />

                  <Controller
                    name={`benefits.${index}.isShared`}
                    control={control}
                    render={({ field }) => (
                      <FormControlLabel
                        control={<Checkbox {...field} checked={field.value || false} />}
                        label="Share to other member"
                      />
                    )}
                  />
                </Box>

                {/* Show user selection when benefit is shared */}
                {watch(`benefits.${index}.isShared`) && (
                  <Controller
                    name={`benefits.${index}.sharedWithUserId`}
                    control={control}
                    render={({ field }) => (
                      <FormControl fullWidth error={!!errors.benefits?.[index]?.sharedWithUserId}>
                        <InputLabel>Share with User</InputLabel>
                        <Select
                          {...field}
                          label="Share with User"
                          disabled={loadingUsers}
                        >
                          <MenuItem value="">
                            <em>Select a user</em>
                          </MenuItem>
                          {users
                            .filter(user => user.id !== currentUserId)
                            .map((user) => (
                              <MenuItem key={user.id} value={user.id}>
                                {user.name} ({user.email})
                              </MenuItem>
                            ))}
                        </Select>
                        {errors.benefits?.[index]?.sharedWithUserId && (
                          <Typography variant="caption" color="error" sx={{ mt: 0.5 }}>
                            {errors.benefits?.[index]?.sharedWithUserId?.message}
                          </Typography>
                        )}
                      </FormControl>
                    )}
                  />
                )}
              </Box>
            </CardContent>
          </Card>
        ))}
      </Box>

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
          {isSubmitting ? 'Saving...' : submitButtonText || (isEdit ? 'Update' : 'Create')}
        </Button>
      </Box>
    </Box>
  );
}
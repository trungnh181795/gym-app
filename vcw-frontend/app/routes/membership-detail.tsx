import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router';
import type { Route } from './+types/membership-detail';
import {
  Box,
  Typography,
  Button,
  Chip,
  Alert,
  CircularProgress,
  Card,
  CardContent,
  TextField,
  Breadcrumbs,
  Checkbox,
  FormControlLabel,
  MenuItem,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
} from '@mui/icons-material';
import { format } from 'date-fns';
import type { Membership, Benefit } from '../types';
import apiClient from '../api';
import MembershipForm from '../components/forms/MembershipForm';
import type { MembershipFormData } from '../schemas';

export function meta({ params }: Route.MetaArgs) {
  return [
    { title: `Membership ${params.id} - VCW Dashboard` },
    { name: 'description', content: 'View and manage a membership' },
  ];
}

export default function MembershipDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [membership, setMembership] = useState<Membership | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const load = async () => {
      if (!id) return;
      try {
        setLoading(true);
        setError(null);
        const data = await apiClient.getMembershipById(id);
        setMembership(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load membership');
        console.error('Error loading membership:', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  const onSave = async (values: MembershipFormData) => {
    if (!membership) return;
    try {
      setSaving(true);
      await apiClient.updateMembership(membership.id, {
        userId: values.userId,
        name: values.name,
        description: values.description,
        validFrom: values.validFrom,
        validUntil: values.validUntil,
        price: values.price,
        benefits: values.benefits as Benefit[],
      });
      // Refresh details after save
      const updated = await apiClient.getMembershipById(membership.id);
      setMembership(updated);
      alert('Membership updated successfully');
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to update membership');
    } finally {
      setSaving(false);
    }
  };

  const onDelete = async () => {
    if (!id) return;
    if (!confirm('Delete this membership? This action cannot be undone.')) return;
    try {
      await apiClient.deleteMembership(id);
      alert('Membership deleted');
      navigate('/dashboard/memberships');
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete membership');
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 400 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error || !membership) {
    return (
      <Box sx={{ p: 3 }}>
        <Breadcrumbs sx={{ mb: 2 }}>
          <Link to="/dashboard/memberships" style={{ textDecoration: 'none', color: 'inherit' }}>
            Memberships
          </Link>
          <Typography color="text.primary">Detail</Typography>
        </Breadcrumbs>
        <Alert severity="error">{error || 'Membership not found'}</Alert>
        <Button component={Link} to="/dashboard/memberships" startIcon={<ArrowBackIcon />} sx={{ mt: 2 }}>
          Back to Memberships
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3, maxWidth: 1000, mx: 'auto' }}>
      {/* Header */}
      <Breadcrumbs sx={{ mb: 2 }}>
        <Link to="/dashboard/memberships" style={{ textDecoration: 'none', color: 'inherit' }}>
          Memberships
        </Link>
        <Typography color="text.primary">{membership.name}</Typography>
      </Breadcrumbs>

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
        <Box>
          <Typography variant="h4" component="h1" gutterBottom>
            {membership.name}
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Chip
              label={membership.status}
              color={
                (membership.status === 'active'
                  ? 'success'
                  : membership.status === 'suspended'
                  ? 'warning'
                  : membership.status === 'expired'
                  ? 'error'
                  : 'default') as any
              }
              size="medium"
              sx={{ textTransform: 'capitalize', fontWeight: 'medium' }}
            />
            <Typography variant="body2" color="text.secondary">
              Created {format(new Date(membership.createdAt), 'PPP pp')}
            </Typography>
          </Box>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button startIcon={<DeleteIcon />} onClick={onDelete} color="error" variant="outlined">
            Delete
          </Button>
        </Box>
      </Box>

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '2fr 1fr' }, gap: 3 }}>
        {/* Main content: edit form */}
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <EditIcon /> Edit Membership
            </Typography>
            <MembershipForm
              onSubmit={onSave}
              initialData={{
                userId: membership.userId,
                name: membership.name,
                description: membership.description,
                validFrom: membership.validFrom.slice(0, 10),
                validUntil: membership.validUntil.slice(0, 10),
                price: membership.price,
                benefits: membership.benefits.map(b => ({
                  ...b,
                  requiresBooking: b.requiresBooking ?? false,
                })),
              }}
              isEdit={true}
              submitButtonText={saving ? 'Saving...' : 'Save Changes'}
            />
          </CardContent>
        </Card>

        {/* Sidebar: immutable and metadata */}
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>Details</Typography>
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr', gap: 1 }}>
              <Typography variant="subtitle2" color="text.secondary">Membership ID</Typography>
              <Typography variant="body2" sx={{ fontFamily: 'monospace', wordBreak: 'break-all' }}>{membership.id}</Typography>

              <Typography variant="subtitle2" color="text.secondary" sx={{ mt: 2 }}>User ID</Typography>
              <Typography variant="body2" sx={{ fontFamily: 'monospace', wordBreak: 'break-all' }}>{membership.userId}</Typography>

              <Typography variant="subtitle2" color="text.secondary" sx={{ mt: 2 }}>Updated</Typography>
              <Typography variant="body2">{format(new Date(membership.updatedAt), 'PPP pp')}</Typography>

              <Typography variant="subtitle2" color="text.secondary" sx={{ mt: 2 }}>Benefits</Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {membership.benefits.map((b, idx) => (
                  <Chip key={idx} label={b.name} variant="outlined" size="small" />
                ))}
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Box>

      <Box sx={{ mt: 2 }}>
        <Button component={Link} to="/dashboard/memberships" startIcon={<ArrowBackIcon />}>Back to Memberships</Button>
      </Box>
    </Box>
  );
}

import { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Chip,
  TextField,
  InputAdornment,
  Alert,
  CircularProgress,
  Snackbar,
  Card,
  CardContent,

} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Search as SearchIcon,
  Refresh as RefreshIcon,
  Person as PersonIcon,
  AttachMoney as MoneyIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router';
import { format } from 'date-fns';
import CreateMembershipDialog from '../components/dialogs/CreateMembershipDialog';
import type { Membership, User, CreateMembershipRequest } from '../types';
import apiClient from '../api';

export default function MembershipsPage() {
  const navigate = useNavigate();
  const [memberships, setMemberships] = useState<Membership[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [membershipFormOpen, setMembershipFormOpen] = useState(false);
  const [editingMembership, setEditingMembership] = useState<Membership | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const filteredMemberships = memberships.filter(membership =>
    membership.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    membership.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    getUserName(membership.userId).toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getUserName = (userId: string) => {
    const user = users.find(u => u.id === userId);
    return user ? user.name : 'Unknown User';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'success';
      case 'suspended': return 'warning';
      case 'expired': return 'error';
      case 'cancelled': return 'default';
      default: return 'default';
    }
  };

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [membershipsData, usersData] = await Promise.all([
        apiClient.getMemberships(),
        apiClient.getUsers(),
      ]);
      setMemberships(membershipsData);
      setUsers(usersData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
      console.error('Error loading data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateMembership = async (membershipData: CreateMembershipRequest) => {
    try {
      const result = await apiClient.createMembership(membershipData);
      const benefitCount = membershipData.benefits?.length || 0;
      
      // Show success message with credential info
      const message = `Membership "${membershipData.name}" created successfully! ${benefitCount} benefit credential${benefitCount === 1 ? '' : 's'} ${benefitCount === 1 ? 'has' : 'have'} been automatically generated. You can view them in the Credentials section.`;
      
      setSuccessMessage(message);
      
      await loadData(); // Refresh the list
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Failed to create membership');
    }
  };

  const handleEditMembership = (membership: Membership) => {
    navigate(`/dashboard/memberships/${membership.id}`);
  };

  const handleUpdateMembership = async (membershipData: Partial<CreateMembershipRequest>) => {
    if (!editingMembership) return;
    
    try {
      // Note: We'll need to implement updateMembership in the API client
      await loadData();
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Failed to update membership');
    }
  };

  // Delete handled in detail page

  const handleCloseMembershipForm = () => {
    setMembershipFormOpen(false);
    setEditingMembership(null);
  };

  const stats = {
    total: memberships.length,
    active: memberships.filter(m => m.status === 'active').length,
    expired: memberships.filter(m => m.status === 'expired').length,
    totalRevenue: memberships.reduce((sum, m) => sum + m.price, 0),
    averagePrice: memberships.length > 0 ? memberships.reduce((sum, m) => sum + m.price, 0) / memberships.length : 0,
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 400 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Memberships
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setMembershipFormOpen(true)}
        >
          Add Membership
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Stats Cards */}
      <Box sx={{ display: 'flex', gap: 3, mb: 3, flexWrap: 'wrap' }}>
        <Card sx={{ flex: 1, minWidth: 250 }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box>
                <Typography color="textSecondary" gutterBottom variant="body2">
                  Total Memberships
                </Typography>
                <Typography variant="h5" component="div">
                  {stats.total}
                </Typography>
              </Box>
              <PersonIcon color="primary" sx={{ fontSize: 40 }} />
            </Box>
          </CardContent>
        </Card>
        
        <Card sx={{ flex: 1, minWidth: 250 }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box>
                <Typography color="textSecondary" gutterBottom variant="body2">
                  Active
                </Typography>
                <Typography variant="h5" component="div" color="success.main">
                  {stats.active}
                </Typography>
              </Box>
              <Chip label={`${((stats.active / (stats.total || 1)) * 100).toFixed(0)}%`} color="success" size="small" />
            </Box>
          </CardContent>
        </Card>

        <Card sx={{ flex: 1, minWidth: 250 }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box>
                <Typography color="textSecondary" gutterBottom variant="body2">
                  Total Revenue
                </Typography>
                <Typography variant="h5" component="div">
                  ${stats.totalRevenue.toFixed(2)}
                </Typography>
              </Box>
              <MoneyIcon color="primary" sx={{ fontSize: 40 }} />
            </Box>
          </CardContent>
        </Card>

        <Card sx={{ flex: 1, minWidth: 250 }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box>
                <Typography color="textSecondary" gutterBottom variant="body2">
                  Average Price
                </Typography>
                <Typography variant="h5" component="div">
                  ${stats.averagePrice.toFixed(2)}
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Box>

      <Paper sx={{ mb: 3 }}>
        <Box sx={{ p: 2, display: 'flex', gap: 2, alignItems: 'center' }}>
          <TextField
            placeholder="Search memberships..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            size="small"
            sx={{ minWidth: 300 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
          />
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={loadData}
            disabled={loading}
          >
            Refresh
          </Button>
          <Typography variant="body2" color="text.secondary" sx={{ ml: 'auto' }}>
            {filteredMemberships.length} of {memberships.length} memberships
          </Typography>
        </Box>
      </Paper>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>User</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Price</TableCell>
              <TableCell>Valid From</TableCell>
              <TableCell>Valid Until</TableCell>
              <TableCell>Benefits</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredMemberships.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                  <Typography variant="body2" color="text.secondary">
                    {searchTerm ? 'No memberships match your search criteria.' : 'No memberships found. Create your first membership!'}
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              filteredMemberships.map((membership) => (
                <TableRow key={membership.id} hover>
                  <TableCell>
                    <Box>
                      <Typography variant="body2" fontWeight="medium">
                        {membership.name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {membership.description}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {getUserName(membership.userId)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={membership.status}
                      color={getStatusColor(membership.status) as any}
                      size="small"
                      sx={{ textTransform: 'capitalize' }}
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" fontWeight="medium">
                      ${membership.price.toFixed(2)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {format(new Date(membership.validFrom), 'MMM dd, yyyy')}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {format(new Date(membership.validUntil), 'MMM dd, yyyy')}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {membership.benefits.length} benefit{membership.benefits.length !== 1 ? 's' : ''}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <IconButton
                      size="small"
                      onClick={() => handleEditMembership(membership)}
                      title="Open details"
                    >
                      <EditIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <CreateMembershipDialog
        open={membershipFormOpen}
        onClose={handleCloseMembershipForm}
        onSubmit={editingMembership ? handleUpdateMembership : handleCreateMembership}
        initialData={editingMembership ? {
          userId: editingMembership.userId,
          name: editingMembership.name,
          description: editingMembership.description,
          validFrom: format(new Date(editingMembership.validFrom), 'yyyy-MM-dd'),
          validUntil: format(new Date(editingMembership.validUntil), 'yyyy-MM-dd'),
          price: editingMembership.price,
          benefits: editingMembership.benefits.map(benefit => ({
            ...benefit,
            requiresBooking: benefit.requiresBooking ?? false,
          })),
        } : undefined}
        title={editingMembership ? 'Edit Membership' : 'Add New Membership'}
        isEdit={!!editingMembership}
      />

      {/* Success Message */}
      <Snackbar
        open={!!successMessage}
        autoHideDuration={6000}
        onClose={() => setSuccessMessage(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        <Alert onClose={() => setSuccessMessage(null)} severity="success">
          {successMessage}
        </Alert>
      </Snackbar>

      {/* Detail page handled by route /dashboard/memberships/:id */}
    </Box>
  );
}
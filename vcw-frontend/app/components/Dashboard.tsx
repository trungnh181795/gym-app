import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Paper,
  Card,
  CardContent,
  CardActions,
  Button,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Tabs,
  Tab,
  Alert,
  CircularProgress,
  Fab,
  Stack,
} from '@mui/material';
import {
  Add as AddIcon,
  Person as PersonIcon,
  CardMembership as MembershipIcon,
  Share as ShareIcon,
  Verified as VerifiedIcon,
  Dashboard as DashboardIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  MoreVert as MoreVertIcon,
  Visibility as ViewIcon,
  Group as GroupIcon,
  AttachMoney as MoneyIcon,
} from '@mui/icons-material';
import apiClient from '../api';
import { verificationService } from '../services/verification.service';
import type { VerificationResult } from '../types';
import type { User, Membership, CredentialListItem, DashboardStats } from '../types';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`dashboard-tabpanel-${index}`}
      aria-labelledby={`dashboard-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

export default function Dashboard() {
  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Data state
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [memberships, setMemberships] = useState<Membership[]>([]);
  const [credentials, setCredentials] = useState<CredentialListItem[]>([]);
  
  // Dialog states
  const [userDialogOpen, setUserDialogOpen] = useState(false);
  const [membershipDialogOpen, setMembershipDialogOpen] = useState(false);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [verifyDialogOpen, setVerifyDialogOpen] = useState(false);
  
  // Form states
  const [newUser, setNewUser] = useState({ name: '', email: '' });
  const [shareCredentialId, setShareCredentialId] = useState('');
  const [verifyJwt, setVerifyJwt] = useState('');
  const [verificationResult, setVerificationResult] = useState<VerificationResult | null>(null);



  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [statsData, usersData, membershipsData, credentialsData] = await Promise.all([
        apiClient.getDashboardStats().catch(() => null),
        apiClient.getUsers().catch(() => []),
        apiClient.getMemberships().catch(() => []),
        apiClient.getCredentials().catch(() => []),
      ]);

      setStats(statsData);
      setUsers(usersData);
      setMemberships(membershipsData);
      setCredentials(credentialsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleCreateUser = async () => {
    try {
      await apiClient.createUser(newUser);
      setNewUser({ name: '', email: '' });
      setUserDialogOpen(false);
      loadDashboardData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create user');
    }
  };

  const handleDeleteUser = async (userId: string) => {
    try {
      await apiClient.deleteUser(userId);
      loadDashboardData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete user');
    }
  };

  const handleDeleteMembership = async (membershipId: string) => {
    try {
      await apiClient.deleteMembership(membershipId);
      loadDashboardData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete membership');
    }
  };

  const handleDeleteCredential = async (credentialId: string) => {
    try {
      await apiClient.deleteCredential(credentialId);
      loadDashboardData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete credential');
    }
  };

  const handleCreateShare = async () => {
    try {
      const share = await apiClient.createShare({ credentialId: shareCredentialId });
      alert(`Share created! URL: ${share.shareUrl}`);
      setShareDialogOpen(false);
      setShareCredentialId('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create share');
    }
  };

  const handleVerifyCredential = async () => {
    try {
      const result = await verificationService.verifyCredential(verifyJwt);
      setVerificationResult(result);
    } catch (err) {
      setVerificationResult({ 
        valid: false, 
        payload: null,
        credential: null,
        message: err instanceof Error ? err.message : 'Verification failed' 
      });
    }
  };



  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Typography variant="h3" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <DashboardIcon fontSize="large" />
        Gym Credential Wallet Dashboard
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Stats Cards */}
      {stats && (
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 4 }}>
          <Card sx={{ flex: 1 }}>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Total Users
                  </Typography>
                  <Typography variant="h4">
                    {stats.users.total}
                  </Typography>
                </Box>
                <GroupIcon color="primary" sx={{ fontSize: 40 }} />
              </Box>
            </CardContent>
          </Card>
          
          <Card sx={{ flex: 1 }}>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Active Memberships
                  </Typography>
                  <Typography variant="h4">
                    {stats.memberships.active}
                  </Typography>
                </Box>
                <MembershipIcon color="success" sx={{ fontSize: 40 }} />
              </Box>
            </CardContent>
          </Card>

          <Card sx={{ flex: 1 }}>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Total Revenue
                  </Typography>
                  <Typography variant="h4">
                    ${stats.memberships.totalRevenue.toFixed(2)}
                  </Typography>
                </Box>
                <MoneyIcon color="warning" sx={{ fontSize: 40 }} />
              </Box>
            </CardContent>
          </Card>

          <Card sx={{ flex: 1 }}>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Active Credentials
                  </Typography>
                  <Typography variant="h4">
                    {stats.credentials.active}
                  </Typography>
                </Box>
                <VerifiedIcon color="info" sx={{ fontSize: 40 }} />
              </Box>
            </CardContent>
          </Card>
        </Stack>
      )}

      {/* Tabs */}
      <Paper sx={{ mb: 3 }}>
        <Tabs value={tabValue} onChange={handleTabChange} aria-label="dashboard tabs">
          <Tab label="Users" icon={<PersonIcon />} />
          <Tab label="Memberships" icon={<MembershipIcon />} />
          <Tab label="Credentials" icon={<VerifiedIcon />} />
          <Tab label="Tools" icon={<ShareIcon />} />
        </Tabs>
      </Paper>

      {/* Users Tab */}
      <TabPanel value={tabValue} index={0}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h5">Users Management</Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setUserDialogOpen(true)}
          >
            Add User
          </Button>
        </Box>

        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Wallet DID</TableCell>
                <TableCell>Created</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>{user.name}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    <Typography variant="body2" noWrap sx={{ maxWidth: 200 }}>
                      {user.walletDid}
                    </Typography>
                  </TableCell>
                  <TableCell>{new Date(user.createdAt).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <Button
                      size="small"
                      startIcon={<DeleteIcon />}
                      color="error"
                      onClick={() => handleDeleteUser(user.id)}
                    >
                      Delete
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </TabPanel>

      {/* Memberships Tab */}
      <TabPanel value={tabValue} index={1}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h5">Memberships Management</Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setMembershipDialogOpen(true)}
          >
            Add Membership
          </Button>
        </Box>

        <Stack spacing={2}>
          {memberships.map((membership) => (
            <Card key={membership.id}>
              <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="start">
                  <Box>
                    <Typography variant="h6" gutterBottom>
                      {membership.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" paragraph>
                      {membership.description}
                    </Typography>
                    <Stack direction="row" spacing={1} mb={2}>
                      <Chip
                        label={membership.status}
                        color={membership.status === 'active' ? 'success' : 'default'}
                        size="small"
                      />
                      <Chip
                        label={`$${membership.price}`}
                        color="primary"
                        size="small"
                      />
                    </Stack>
                    <Typography variant="body2" color="text.secondary">
                      Benefits: {membership.benefits.length} | Valid until: {new Date(membership.validUntil).toLocaleDateString()}
                    </Typography>
                  </Box>
                  <Stack direction="row" spacing={1}>
                    <Button size="small" startIcon={<ViewIcon />}>
                      View
                    </Button>
                    <Button
                      size="small"
                      startIcon={<DeleteIcon />}
                      color="error"
                      onClick={() => handleDeleteMembership(membership.id)}
                    >
                      Delete
                    </Button>
                  </Stack>
                </Box>
              </CardContent>
            </Card>
          ))}
        </Stack>
      </TabPanel>

      {/* Credentials Tab */}
      <TabPanel value={tabValue} index={2}>
        <Typography variant="h5" gutterBottom>Issued Credentials</Typography>

        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Type</TableCell>
                <TableCell>Holder</TableCell>
                <TableCell>Plan</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Issued</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {credentials.map((credential) => (
                <TableRow key={credential.id}>
                  <TableCell>
                    <Stack direction="row" spacing={1}>
                      {credential.type.map((type) => (
                        <Chip key={type} label={type} size="small" variant="outlined" />
                      ))}
                    </Stack>
                  </TableCell>
                  <TableCell>{credential.subject.name}</TableCell>
                  <TableCell>{credential.subject.plan}</TableCell>
                  <TableCell>
                    <Chip
                      label={credential.status}
                      color={credential.status === 'active' ? 'success' : 'default'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>{new Date(credential.issuedAt).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <Stack direction="row" spacing={1}>
                      <Button
                        size="small"
                        startIcon={<ShareIcon />}
                        onClick={() => {
                          setShareCredentialId(credential.id);
                          setShareDialogOpen(true);
                        }}
                      >
                        Share
                      </Button>
                      <Button
                        size="small"
                        startIcon={<DeleteIcon />}
                        color="error"
                        onClick={() => handleDeleteCredential(credential.id)}
                      >
                        Delete
                      </Button>
                    </Stack>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </TabPanel>

      {/* Tools Tab */}
      <TabPanel value={tabValue} index={3}>
        <Typography variant="h5" gutterBottom>Credential Tools</Typography>
        
        <Stack spacing={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Share Credential
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                Create a shareable link for any credential that expires in 24 hours
              </Typography>
              <Button
                variant="contained"
                startIcon={<ShareIcon />}
                onClick={() => setShareDialogOpen(true)}
              >
                Create Share Link
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Verify Credential
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                Verify the authenticity of a credential JWT token
              </Typography>
              <Button
                variant="contained"
                startIcon={<VerifiedIcon />}
                onClick={() => setVerifyDialogOpen(true)}
              >
                Verify Credential
              </Button>
            </CardContent>
          </Card>
        </Stack>
      </TabPanel>

      {/* Dialogs */}
      
      {/* Add User Dialog */}
      <Dialog open={userDialogOpen} onClose={() => setUserDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add New User</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Name"
            fullWidth
            variant="outlined"
            value={newUser.name}
            onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            label="Email"
            type="email"
            fullWidth
            variant="outlined"
            value={newUser.email}
            onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setUserDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleCreateUser} variant="contained">Create</Button>
        </DialogActions>
      </Dialog>

      {/* Share Dialog */}
      <Dialog open={shareDialogOpen} onClose={() => setShareDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Create Share Link</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Credential ID"
            fullWidth
            variant="outlined"
            value={shareCredentialId}
            onChange={(e) => setShareCredentialId(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShareDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleCreateShare} variant="contained">Create Share</Button>
        </DialogActions>
      </Dialog>

      {/* Verify Dialog */}
      <Dialog open={verifyDialogOpen} onClose={() => setVerifyDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Verify Credential</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="JWT Token"
            multiline
            rows={4}
            fullWidth
            variant="outlined"
            value={verifyJwt}
            onChange={(e) => setVerifyJwt(e.target.value)}
            sx={{ mb: 2 }}
          />
          {verificationResult && (
            <Alert severity={verificationResult.valid ? 'success' : 'error'}>
              {verificationResult.message}
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setVerifyDialogOpen(false)}>Close</Button>
          <Button onClick={handleVerifyCredential} variant="contained">Verify</Button>
        </DialogActions>
      </Dialog>



      {/* Floating Action Button */}
      <Fab
        color="primary"
        aria-label="add"
        sx={{ position: 'fixed', bottom: 16, right: 16 }}
        onClick={() => {
          switch (tabValue) {
            case 0:
              setUserDialogOpen(true);
              break;
            case 1:
              setMembershipDialogOpen(true);
              break;
            case 3:
              setShareDialogOpen(true);
              break;
          }
        }}
      >
        <AddIcon />
      </Fab>
    </Container>
  );
}
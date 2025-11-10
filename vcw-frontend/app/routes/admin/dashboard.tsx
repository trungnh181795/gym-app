import { 
  Box, 
  Grid, 
  Card, 
  CardContent, 
  Typography, 
  CardActionArea 
} from '@mui/material';
import { useNavigate } from 'react-router';
import { 
  People as PeopleIcon,
  CardMembership as MembershipIcon,
  LocalOffer as BenefitIcon,
  Build as ServiceIcon,
  Badge as CredentialIcon
} from '@mui/icons-material';

export default function AdminDashboard() {
  const navigate = useNavigate();

  const dashboardCards = [
    {
      title: 'Users',
      description: 'Manage user accounts and profiles',
      icon: <PeopleIcon sx={{ fontSize: 48, color: 'primary.main' }} />,
      path: '/admin/users',
      color: '#1976d2'
    },
    {
      title: 'Memberships',
      description: 'Manage gym memberships and user subscriptions',
      icon: <MembershipIcon sx={{ fontSize: 48, color: 'secondary.main' }} />,
      path: '/admin/memberships',
      color: '#dc004e'
    },
    {
      title: 'Benefits',
      description: 'Configure membership benefits and pricing',
      icon: <BenefitIcon sx={{ fontSize: 48, color: 'success.main' }} />,
      path: '/admin/benefits',
      color: '#2e7d32'
    },
    {
      title: 'Services',
      description: 'Manage gym facilities and equipment',
      icon: <ServiceIcon sx={{ fontSize: 48, color: 'warning.main' }} />,
      path: '/admin/services',
      color: '#ed6c02'
    },
    {
      title: 'Credentials',
      description: 'View and manage verifiable credentials',
      icon: <CredentialIcon sx={{ fontSize: 48, color: 'info.main' }} />,
      path: '/admin/credentials',
      color: '#0288d1'
    }
  ];

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        Admin Dashboard
      </Typography>
      <Typography variant="body1" color="text.secondary" paragraph>
        Welcome to the VCW Admin Dashboard. Manage your gym's digital infrastructure from here.
      </Typography>

      <Grid container spacing={3} sx={{ mt: 2 }}>
        {dashboardCards.map((card, index) => (
          <Grid size={{ xs: 12, sm: 6, md: 4 }} key={index}>
            <Card 
              elevation={2} 
              sx={{ 
                height: '100%',
                transition: 'transform 0.2s, box-shadow 0.2s',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: 4
                }
              }}
            >
              <CardActionArea 
                onClick={() => navigate(card.path)}
                sx={{ height: '100%', p: 2 }}
              >
                <CardContent sx={{ textAlign: 'center', height: '100%' }}>
                  <Box sx={{ mb: 2 }}>
                    {card.icon}
                  </Box>
                  <Typography variant="h6" component="h2" gutterBottom>
                    {card.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {card.description}
                  </Typography>
                </CardContent>
              </CardActionArea>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Box sx={{ mt: 4 }}>
        <Typography variant="h6" gutterBottom>
          Quick Stats
        </Typography>
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card elevation={1}>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Total Users
                </Typography>
                <Typography variant="h4">
                  0
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card elevation={1}>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Active Memberships
                </Typography>
                <Typography variant="h4">
                  0
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card elevation={1}>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Available Benefits
                </Typography>
                <Typography variant="h4">
                  0
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card elevation={1}>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Total Credentials
                </Typography>
                <Typography variant="h4">
                  0
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>
    </Box>
  );
}
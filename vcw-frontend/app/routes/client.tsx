import { 
  Box, 
  Container, 
  Paper, 
  Tab, 
  Tabs, 
  Typography, 
  AppBar, 
  Toolbar,
  Button 
} from '@mui/material';
import { Outlet, useLocation, useNavigate } from 'react-router';
import { useState, useEffect } from 'react';
import { 
  LocalOffer as BenefitIcon,
  CardMembership as MembershipIcon,
  QrCodeScanner as CheckinIcon,
  ExitToApp as LogoutIcon
} from '@mui/icons-material';

export default function ClientLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const [currentTab, setCurrentTab] = useState(0);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const tabs = [
    { label: 'My Benefits', path: '/client/benefits', icon: <BenefitIcon /> },
    { label: 'Get Membership', path: '/client/membership', icon: <MembershipIcon /> },
    { label: 'Check In', path: '/client/checkin', icon: <CheckinIcon /> },
  ];

  useEffect(() => {
    // Check if user is authenticated
    const token = localStorage.getItem('clientToken');
    const authenticated = !!token;
    setIsAuthenticated(authenticated);
    
    // Redirect to auth page if not authenticated
    if (!authenticated) {
      navigate('/');
    } else if (location.pathname === '/client') {
      // Redirect to benefits as default client page
      navigate('/client/benefits');
    }
  }, [navigate, location.pathname]);

  useEffect(() => {
    const currentPath = location.pathname;
    const tabIndex = tabs.findIndex(tab => 
      currentPath === tab.path || currentPath.startsWith(tab.path)
    );
    setCurrentTab(tabIndex >= 0 ? tabIndex : 0);
  }, [location.pathname]);

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    const selectedTab = tabs[newValue];
    setCurrentTab(newValue);
    navigate(selectedTab.path);
  };

  const handleLogout = () => {
    localStorage.removeItem('clientToken');
    localStorage.removeItem('userData');
    setIsAuthenticated(false);
    navigate('/');
  };

  // Show loading or redirect if not authenticated
  if (!isAuthenticated) {
    return null; // Will redirect in useEffect
  }

  return (
    <Box sx={{ flexGrow: 1 }}>
      <AppBar position="static" elevation={0} color="secondary">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            VCW Client Portal
          </Typography>
          {isAuthenticated && (
            <Button 
              color="inherit" 
              startIcon={<LogoutIcon />}
              onClick={handleLogout}
            >
              Logout
            </Button>
          )}
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ mt: 3 }}>
        <Paper elevation={1} sx={{ mb: 3 }}>
          <Tabs
            value={currentTab}
            onChange={handleTabChange}
            centered
            sx={{ borderBottom: 1, borderColor: 'divider' }}
          >
            {tabs.map((tab, index) => (
              <Tab
                key={index}
                icon={tab.icon}
                label={tab.label}
                iconPosition="start"
                sx={{ minHeight: 64 }}
              />
            ))}
          </Tabs>
        </Paper>

        <Box sx={{ mt: 2 }}>
          <Outlet context={{ isAuthenticated, setIsAuthenticated }} />
        </Box>
      </Container>
    </Box>
  );
}
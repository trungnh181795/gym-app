import {
  Box,
  Drawer,
  AppBar,
  Toolbar,
  List,
  Typography,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  useTheme,
  useMediaQuery,
  Button,
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  People as PeopleIcon,
  CardMembership as MembershipIcon,
  LocalOffer as BenefitIcon,
  Build as ServiceIcon,
  Badge as CredentialIcon,
  ExitToApp as LogoutIcon,
} from '@mui/icons-material';
import { Outlet, Link, useLocation, useNavigate } from 'react-router';

const drawerWidth = 240;

const navigationItems = [
  { path: '/admin', label: 'Dashboard', icon: <DashboardIcon /> },
  { path: '/admin/users', label: 'Users', icon: <PeopleIcon /> },
  { path: '/admin/memberships', label: 'Memberships', icon: <MembershipIcon /> },
  { path: '/admin/benefits', label: 'Benefits', icon: <BenefitIcon /> },
  { path: '/admin/services', label: 'Services', icon: <ServiceIcon /> },
  { path: '/admin/credentials', label: 'Credentials', icon: <CredentialIcon /> },
];

export default function AdminLayout() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    // Clear any auth tokens/session data
    localStorage.removeItem('adminToken');
    navigate('/');
  };

  const drawer = (
    <Box>
      <Toolbar>
        <Typography variant="h6" noWrap component="div">
          VCW Admin
        </Typography>
      </Toolbar>
      <List>
        {navigationItems.map((item) => (
          <ListItem key={item.path} disablePadding>
            <ListItemButton
              component={Link}
              to={item.path}
              selected={location.pathname === item.path || 
                (item.path !== '/admin' && location.pathname.startsWith(item.path))
              }
            >
              <ListItemIcon>{item.icon}</ListItemIcon>
              <ListItemText primary={item.label} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex' }}>
      <AppBar
        position="fixed"
        sx={{
          width: { md: `calc(100% - ${drawerWidth}px)` },
          ml: { md: `${drawerWidth}px` },
        }}
      >
        <Toolbar>
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
            VCW Admin Dashboard
          </Typography>
          <Button 
            color="inherit" 
            startIcon={<LogoutIcon />}
            onClick={handleLogout}
          >
            Logout
          </Button>
        </Toolbar>
      </AppBar>

      <Box
        component="nav"
        sx={{ width: { md: drawerWidth }, flexShrink: { md: 0 } }}
        aria-label="admin navigation"
      >
        <Drawer
          variant={isMobile ? 'temporary' : 'permanent'}
          open={!isMobile}
          sx={{
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: drawerWidth,
            },
          }}
        >
          {drawer}
        </Drawer>
      </Box>

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { md: `calc(100% - ${drawerWidth}px)` },
        }}
      >
        <Toolbar />
        <Outlet />
      </Box>
    </Box>
  );
}
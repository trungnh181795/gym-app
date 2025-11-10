import React from 'react';
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
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  Person as PersonIcon,
  CardMembership as MembershipIcon,
  Verified as VerifiedIcon,
  Build as ToolsIcon,
} from '@mui/icons-material';
import { Outlet, Link, useLocation } from 'react-router';

const drawerWidth = 240;

const navigationItems = [
  { path: '/dashboard', label: 'Overview', icon: <DashboardIcon /> },
  { path: '/dashboard/users', label: 'Users', icon: <PersonIcon /> },
  { path: '/dashboard/memberships', label: 'Memberships', icon: <MembershipIcon /> },
  { path: '/dashboard/credentials', label: 'Credentials', icon: <VerifiedIcon /> },
  { path: '/dashboard/tools', label: 'Tools', icon: <ToolsIcon /> },
];

export default function DashboardLayout() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const location = useLocation();

  const drawer = (
    <Box>
      <Toolbar>
        <Typography variant="h6" noWrap component="div">
          VCW Dashboard
        </Typography>
      </Toolbar>
      <List>
        {navigationItems.map((item) => (
          <ListItem key={item.path} disablePadding>
            <ListItemButton
              component={Link}
              to={item.path}
              selected={location.pathname === item.path}
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
          <Typography variant="h6" noWrap component="div">
            Gym Credential Wallet
          </Typography>
        </Toolbar>
      </AppBar>

      <Box
        component="nav"
        sx={{ width: { md: drawerWidth }, flexShrink: { md: 0 } }}
        aria-label="dashboard navigation"
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
import React from 'react';
import { Outlet } from 'react-router';
import {
  Box,
  Drawer,
  AppBar,
  Toolbar,
  Typography,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  CssBaseline,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  People as PeopleIcon,
  CardMembership as MembershipIcon,
  Badge as CredentialIcon,
  Build as ToolsIcon,
} from '@mui/icons-material';
import { Link, useLocation } from 'react-router';

const drawerWidth = 240;

const navItems = [
  { text: 'Users', path: '/dashboard/users', icon: <PeopleIcon /> },
  { text: 'Memberships', path: '/dashboard/memberships', icon: <MembershipIcon /> },
  { text: 'Credentials', path: '/dashboard/credentials', icon: <CredentialIcon /> },
  { text: 'Tools', path: '/dashboard/tools', icon: <ToolsIcon /> },
];

export default function DashboardLayout() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const location = useLocation();

  return (
    <Box sx={{ display: 'flex' }}>
      <CssBaseline />
      
      <AppBar
        position="fixed"
        sx={{
          width: { md: `calc(100% - ${drawerWidth}px)` },
          ml: { md: `${drawerWidth}px` },
        }}
      >
        <Toolbar>
          <Typography variant="h6" noWrap component="div">
            VCW Dashboard
          </Typography>
        </Toolbar>
      </AppBar>

      <Box
        component="nav"
        sx={{ width: { md: drawerWidth }, flexShrink: { md: 0 } }}
      >
        <Drawer
          variant={isMobile ? 'temporary' : 'permanent'}
          sx={{
            display: { xs: 'block', md: 'block' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: drawerWidth,
            },
          }}
          open
        >
          <Toolbar>
            <Typography variant="h6" noWrap component="div">
              VCW
            </Typography>
          </Toolbar>
          
          <List>
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              
              return (
                <ListItem key={item.text} disablePadding>
                  <ListItemButton
                    component={Link}
                    to={item.path}
                    selected={isActive}
                    sx={{
                      '&.Mui-selected': {
                        backgroundColor: theme.palette.primary.main + '20',
                        borderRight: `3px solid ${theme.palette.primary.main}`,
                        '&:hover': {
                          backgroundColor: theme.palette.primary.main + '30',
                        },
                      },
                    }}
                  >
                    <ListItemIcon
                      sx={{
                        color: isActive ? theme.palette.primary.main : 'inherit',
                      }}
                    >
                      {item.icon}
                    </ListItemIcon>
                    <ListItemText 
                      primary={item.text}
                      sx={{
                        '& .MuiListItemText-primary': {
                          color: isActive ? theme.palette.primary.main : 'inherit',
                          fontWeight: isActive ? 'medium' : 'normal',
                        },
                      }}
                    />
                  </ListItemButton>
                </ListItem>
              );
            })}
          </List>
        </Drawer>
      </Box>

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          width: { md: `calc(100% - ${drawerWidth}px)` },
        }}
      >
        <Toolbar />
        <Outlet />
      </Box>
    </Box>
  );
}
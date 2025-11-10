import { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Tab,
  Tabs,
  Alert,
  InputAdornment,
  IconButton
} from '@mui/material';
import { apiClient } from '~/services/apiClient';
import type { AuthResponse } from '~/services/apiClient';
import {
  Visibility,
  VisibilityOff,
  Login as LoginIcon,
  PersonAdd as RegisterIcon
} from '@mui/icons-material';
import { useNavigate, useOutletContext } from 'react-router';

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
      id={`auth-tabpanel-${index}`}
      aria-labelledby={`auth-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

export default function ClientAuth() {
  const navigate = useNavigate();
  const { setIsAuthenticated } = useOutletContext<{ 
    isAuthenticated: boolean; 
    setIsAuthenticated: (auth: boolean) => void; 
  }>();
  
  const [currentTab, setCurrentTab] = useState(0);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [loginForm, setLoginForm] = useState({
    email: '',
    password: ''
  });
  
  const [registerForm, setRegisterForm] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: ''
  });

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setCurrentTab(newValue);
    setError('');
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await apiClient.auth<AuthResponse>('/auth/login', loginForm);
      
      if (response.success) {
        localStorage.setItem('clientToken', response.data.token);
        localStorage.setItem('userData', JSON.stringify(response.data.user));
        setIsAuthenticated(true);
        navigate('/client/benefits');
      } else {
        setError(response.message || 'Login failed');
      }
    } catch (error) {
      console.error('Login error:', error);
      setError(error instanceof Error ? error.message : 'Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (registerForm.password !== registerForm.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await apiClient.auth<AuthResponse>('/auth/register', {
        name: registerForm.name,
        email: registerForm.email,
        password: registerForm.password,
        phone: registerForm.phone
      });

      if (response.success) {
        localStorage.setItem('clientToken', response.data.token);
        localStorage.setItem('userData', JSON.stringify(response.data.user));
        setIsAuthenticated(true);
        navigate('/client/benefits');
      } else {
        setError(response.message || 'Registration failed');
      }
    } catch (error) {
      console.error('Registration error:', error);
      setError(error instanceof Error ? error.message : 'Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
      <Paper elevation={3} sx={{ width: '100%', maxWidth: 500 }}>
        <Tabs
          value={currentTab}
          onChange={handleTabChange}
          variant="fullWidth"
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab icon={<LoginIcon />} label="Login" iconPosition="start" />
          <Tab icon={<RegisterIcon />} label="Register" iconPosition="start" />
        </Tabs>

        {error && (
          <Box sx={{ p: 2, pb: 0 }}>
            <Alert severity="error">{error}</Alert>
          </Box>
        )}

        <TabPanel value={currentTab} index={0}>
          <Box component="form" onSubmit={handleLogin}>
            <Typography variant="h5" gutterBottom textAlign="center">
              Welcome Back
            </Typography>
            <Typography variant="body2" color="text.secondary" textAlign="center" mb={3}>
              Sign in to access your membership benefits
            </Typography>

            <TextField
              fullWidth
              label="Email"
              type="email"
              value={loginForm.email}
              onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
              margin="normal"
              required
            />
            
            <TextField
              fullWidth
              label="Password"
              type={showPassword ? 'text' : 'password'}
              value={loginForm.password}
              onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
              margin="normal"
              required
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowPassword(!showPassword)}
                      edge="end"
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                )
              }}
            />

            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{ mt: 3, mb: 2 }}
              disabled={loading}
            >
              {loading ? 'Signing In...' : 'Sign In'}
            </Button>
          </Box>
        </TabPanel>

        <TabPanel value={currentTab} index={1}>
          <Box component="form" onSubmit={handleRegister}>
            <Typography variant="h5" gutterBottom textAlign="center">
              Join Our Gym
            </Typography>
            <Typography variant="body2" color="text.secondary" textAlign="center" mb={3}>
              Create an account to get started
            </Typography>

            <TextField
              fullWidth
              label="Full Name"
              value={registerForm.name}
              onChange={(e) => setRegisterForm({ ...registerForm, name: e.target.value })}
              margin="normal"
              required
            />

            <TextField
              fullWidth
              label="Email"
              type="email"
              value={registerForm.email}
              onChange={(e) => setRegisterForm({ ...registerForm, email: e.target.value })}
              margin="normal"
              required
            />

            <TextField
              fullWidth
              label="Phone Number"
              value={registerForm.phone}
              onChange={(e) => setRegisterForm({ ...registerForm, phone: e.target.value })}
              margin="normal"
            />

            <TextField
              fullWidth
              label="Password"
              type={showPassword ? 'text' : 'password'}
              value={registerForm.password}
              onChange={(e) => setRegisterForm({ ...registerForm, password: e.target.value })}
              margin="normal"
              required
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowPassword(!showPassword)}
                      edge="end"
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                )
              }}
            />

            <TextField
              fullWidth
              label="Confirm Password"
              type={showPassword ? 'text' : 'password'}
              value={registerForm.confirmPassword}
              onChange={(e) => setRegisterForm({ ...registerForm, confirmPassword: e.target.value })}
              margin="normal"
              required
            />

            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{ mt: 3, mb: 2 }}
              disabled={loading}
            >
              {loading ? 'Creating Account...' : 'Create Account'}
            </Button>
          </Box>
        </TabPanel>
      </Paper>
    </Box>
  );
}
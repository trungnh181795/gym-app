import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Card,
  CardContent,
  CardActions,
  Button,
  Alert,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Divider,
} from '@mui/material';
import {
  VerifiedUser as VerifyIcon,
  Key as KeyIcon,
  Security as SecurityIcon,
  Assessment as StatsIcon,
} from '@mui/icons-material';
import apiClient from '../api';
import { verificationService } from '../services/verification.service';
import { useVerification } from '../contexts/VerificationContext';
import { testLocalVerification } from '../utils/test-verification';
import type { VerificationResult } from '../types';

export default function ToolsPage() {
  const { isInitialized, error: verificationError } = useVerification();
  const [verifyJwtOpen, setVerifyJwtOpen] = useState(false);
  const [jwt, setJwt] = useState('');
  const [verificationResult, setVerificationResult] = useState<VerificationResult | null>(null);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Auto-fill JWT from clipboard if available
  const handleOpenVerify = async () => {
    setVerifyJwtOpen(true);
    try {
      const clipboardText = await navigator.clipboard.readText();
      // Check if clipboard contains a JWT (starts with ey and has dots)
      if (clipboardText && clipboardText.startsWith('ey') && clipboardText.split('.').length === 3) {
        setJwt(clipboardText);
      }
    } catch (err) {
      // Clipboard access failed, that's okay
      console.log('Could not access clipboard:', err);
    }
  };

  const handleVerifyJwt = async () => {
    if (!jwt.trim()) {
      setError('Please enter a JWT token');
      return;
    }

    try {
      setVerifying(true);
      setError(null);
      const result = await verificationService.verifyCredential(jwt);
      setVerificationResult(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to verify JWT');
      setVerificationResult(null);
    } finally {
      setVerifying(false);
    }
  };

  const handleCloseVerify = () => {
    setVerifyJwtOpen(false);
    setJwt('');
    setVerificationResult(null);
    setError(null);
  };

  const formatJson = (obj: unknown) => {
    return JSON.stringify(obj, null, 2);
  };

  const tools = [
    {
      title: 'JWT Credential Verifier',
      description: 'Verify the authenticity and validity of JWT-signed verifiable credentials locally using the issuer\'s public key. No data leaves your browser.',
      icon: <VerifyIcon sx={{ fontSize: 40 }} color="primary" />,
      action: handleOpenVerify,
      buttonText: 'Verify JWT',
    },
    {
      title: 'Key Management',
      description: 'Manage cryptographic keys used for signing and verifying credentials. View public keys and regenerate key pairs.',
      icon: <KeyIcon sx={{ fontSize: 40 }} color="secondary" />,
      action: () => alert('Key management functionality coming soon!'),
      buttonText: 'Manage Keys',
    },
    {
      title: 'Security Audit',
      description: 'Run security audits on your credential infrastructure, check for vulnerabilities and best practices.',
      icon: <SecurityIcon sx={{ fontSize: 40 }} color="warning" />,
      action: () => alert('Security audit functionality coming soon!'),
      buttonText: 'Run Audit',
    },
    {
      title: 'Analytics Dashboard',
      description: 'View detailed analytics about credential issuance, verification patterns, and system usage statistics.',
      icon: <StatsIcon sx={{ fontSize: 40 }} color="info" />,
      action: () => alert('Analytics dashboard coming soon!'),
      buttonText: 'View Analytics',
    },
  ];

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" component="h1" sx={{ mb: 3 }}>
        Tools & Utilities
      </Typography>

          <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
        Access various tools and utilities for managing your verifiable credentials infrastructure. 
        JWT verification is now performed locally in your browser for enhanced privacy and performance.
      </Typography>      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: 3 }}>
        {tools.map((tool, index) => (
          <Card key={index} sx={{ height: 'fit-content' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2, mb: 2 }}>
                {tool.icon}
                <Box sx={{ flex: 1 }}>
                  <Typography variant="h6" component="h2" gutterBottom>
                    {tool.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {tool.description}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
            <CardActions>
              <Button 
                variant="contained" 
                onClick={tool.action}
                fullWidth
              >
                {tool.buttonText}
              </Button>
            </CardActions>
          </Card>
        ))}
      </Box>

      <Box sx={{ mt: 6 }}>
        <Typography variant="h5" component="h2" gutterBottom>
          System Information
        </Typography>
        <Paper sx={{ p: 3 }}>
          <Typography variant="body2" color="text.secondary" paragraph>
            <strong>Frontend Version:</strong> 1.0.0
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            <strong>Backend API:</strong> Connected to {process.env.NODE_ENV === 'production' ? 'Production' : 'Development'} environment
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            <strong>Credential Standards:</strong> W3C Verifiable Credentials 2.0, JWT-based signatures
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            <strong>Security:</strong> EdDSA key pairs, JWT signatures
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            <strong>Verification Service:</strong> 
            {!isInitialized && !verificationError && (
              <span style={{ color: '#ff9800' }}> Initializing...</span>
            )}
            {isInitialized && (
              <span style={{ color: '#4caf50' }}> ✓ Ready (Local Verification)</span>
            )}
            {verificationError && (
              <span style={{ color: '#f44336' }}> ✗ Error: {verificationError}</span>
            )}
          </Typography>
          {process.env.NODE_ENV === 'development' && (
            <Box sx={{ mt: 2, pt: 2, borderTop: '1px solid', borderColor: 'divider' }}>
              <Typography variant="body2" color="text.secondary" paragraph>
                <strong>Development Tools:</strong>
              </Typography>
              <Button
                size="small"
                variant="outlined"
                onClick={async () => {
                  const result = await testLocalVerification();
                  alert(`Test Result: ${result.success ? '✅ Success' : '❌ Failed'}\n\n${result.message}${result.details ? '\n\nDetails:\n' + JSON.stringify(result.details, null, 2) : ''}`);
                }}
              >
                Test Verification Service
              </Button>
            </Box>
          )}
        </Paper>
      </Box>

      {/* JWT Verification Dialog */}
      <Dialog open={verifyJwtOpen} onClose={handleCloseVerify} maxWidth="md" fullWidth>
        <DialogTitle>Verify JWT Credential</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1 }}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Paste a JWT-signed verifiable credential below to verify its authenticity and decode its contents.
            </Typography>
            {isInitialized ? (
              <Alert severity="info" sx={{ mb: 2 }}>
                🔒 Verification is performed locally using the issuer's public key. Your credential data never leaves your browser.
              </Alert>
            ) : (
              <Alert severity="warning" sx={{ mb: 2 }}>
                {verificationError ? 
                  `⚠️ Verification service error: ${verificationError}` :
                  '🔄 Initializing verification service...'
                }
              </Alert>
            )}
            
            <Box sx={{ position: 'relative' }}>
              <TextField
                label="JWT Token"
                multiline
                rows={4}
                value={jwt}
                onChange={(e) => setJwt(e.target.value)}
                placeholder="eyJhbGciOiJFUzI1NiIsInR5cCI6IkpXVCJ9..."
                fullWidth
                sx={{ mb: 1 }}
              />
              <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                <Button
                  size="small"
                  variant="outlined"
                  onClick={async () => {
                    try {
                      const text = await navigator.clipboard.readText();
                      setJwt(text);
                    } catch (err) {
                      console.error('Failed to paste:', err);
                    }
                  }}
                >
                  Paste
                </Button>
                <Button
                  size="small"
                  variant="outlined"
                  onClick={() => setJwt('')}
                  disabled={!jwt}
                >
                  Clear
                </Button>
                {jwt && (
                  <Typography variant="caption" color="text.secondary" sx={{ alignSelf: 'center', ml: 'auto' }}>
                    {jwt.length} characters
                  </Typography>
                )}
              </Box>
            </Box>

            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}

            {verificationResult && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="h6" gutterBottom>
                  Verification Result
                </Typography>
                <Divider sx={{ mb: 2 }} />
                
                {verificationResult.valid ? (
                  <Alert severity="success" sx={{ mb: 2 }}>
                    ✅ Credential is valid and authentic!
                  </Alert>
                ) : (
                  <Alert severity="error" sx={{ mb: 2 }}>
                    ❌ Credential verification failed: {verificationResult.error}
                  </Alert>
                )}

                {verificationResult.payload && (
                  <Box>
                    <Typography variant="subtitle2" gutterBottom>
                      Decoded Payload:
                    </Typography>
                    <Paper sx={{ p: 2, bgcolor: 'grey.50' }}>
                      <pre style={{ 
                        margin: 0, 
                        fontSize: '0.875rem', 
                        whiteSpace: 'pre-wrap',
                        wordBreak: 'break-word'
                      }}>
                        {formatJson(verificationResult.payload)}
                      </pre>
                    </Paper>
                  </Box>
                )}

                {verificationResult.header && (
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="subtitle2" gutterBottom>
                      JWT Header:
                    </Typography>
                    <Paper sx={{ p: 2, bgcolor: 'grey.50' }}>
                      <pre style={{ 
                        margin: 0, 
                        fontSize: '0.875rem', 
                        whiteSpace: 'pre-wrap'
                      }}>
                        {formatJson(verificationResult.header)}
                      </pre>
                    </Paper>
                  </Box>
                )}
              </Box>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseVerify}>
            Close
          </Button>
          <Button 
            onClick={handleVerifyJwt} 
            variant="contained" 
            disabled={verifying || !jwt.trim() || !isInitialized}
          >
            {verifying ? 'Verifying...' : !isInitialized ? 'Initializing...' : 'Verify'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
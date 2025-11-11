import { useState, useEffect } from 'react';
import QRCode from 'react-qr-code';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  CircularProgress,
  Alert,
  Chip
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  Download as DownloadIcon,
  Timer as TimerIcon
} from '@mui/icons-material';

interface QRCodeDisplayProps {
  credentialId: string;
  benefitName: string;
  isAdmin?: boolean;
  onExpire?: () => void;
}

export default function QRCodeDisplay({ 
  credentialId, 
  benefitName, 
  isAdmin = false, 
  onExpire 
}: QRCodeDisplayProps) {
  const [qrData, setQrData] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [timeLeft, setTimeLeft] = useState(0);
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    generateQRCode();
  }, [credentialId]);

  useEffect(() => {
    if (!isAdmin && timeLeft > 0) {
      const timer = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            setIsExpired(true);
            onExpire?.();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [timeLeft, isAdmin]);

  const generateQRCode = async () => {
    setLoading(true);
    setError('');
    setIsExpired(false);

    try {
      const endpoint = isAdmin 
        ? `/api/credentials/${credentialId}/qr?admin=true`
        : `/api/credentials/${credentialId}/qr-client`;
      
      // Get token from localStorage
      const token = localStorage.getItem('token') || localStorage.getItem(isAdmin ? 'adminToken' : 'clientToken');
      
      const response = await fetch(endpoint, {
        headers: {
          'Authorization': token ? `Bearer ${token}` : ''
        }
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // Backend returns different structures for admin vs client
        if (isAdmin) {
          // Admin: { success: true, data: { credentialJson: "...", qrType: "permanent" } }
          const qrValue = data.data?.credentialJson
          setQrData(qrValue);
        } else {
          // Client: { success: true, data: { token: "...", expiresAt: "...", expiresIn: 60 } }
          const token = data.data?.token || data.qrData;
          setQrData(token);
          setTimeLeft(data.data?.expiresIn || 60); // 60 seconds for client QR codes
        }
      } else {
        setError(data.message || 'Failed to generate QR code');
      }
    } catch (error) {
      console.error('QR generation error:', error);
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const downloadQR = () => {
    const svgElement = document.getElementById(`qr-${credentialId}`);
    if (!svgElement) return;

    const svgData = new XMLSerializer().serializeToString(svgElement);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx?.drawImage(img, 0, 0);
      
      const link = document.createElement('a');
      link.download = `${benefitName}-credential-qr.png`;
      link.href = canvas.toDataURL();
      link.click();
    };

    img.src = 'data:image/svg+xml;base64,' + btoa(svgData);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <Card>
        <CardContent sx={{ textAlign: 'center', p: 4 }}>
          <CircularProgress />
          <Typography variant="body2" sx={{ mt: 2 }}>
            Generating QR Code...
          </Typography>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent>
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
          <Button
            variant="contained"
            onClick={generateQRCode}
            startIcon={<RefreshIcon />}
            fullWidth
          >
            Try Again
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (isExpired) {
    return (
      <Card>
        <CardContent sx={{ textAlign: 'center' }}>
          <Alert severity="warning" sx={{ mb: 2 }}>
            QR Code has expired
          </Alert>
          <Button
            variant="contained"
            onClick={generateQRCode}
            startIcon={<RefreshIcon />}
          >
            Generate New QR Code
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h6">
            {benefitName} - QR Code
          </Typography>
          <Box display="flex" gap={1}>
            {!isAdmin && timeLeft > 0 && (
              <Chip
                icon={<TimerIcon />}
                label={formatTime(timeLeft)}
                color={timeLeft < 20 ? 'error' : 'primary'}
                size="small"
              />
            )}
            {isAdmin && (
              <Chip
                label="Permanent"
                color="success"
                size="small"
              />
            )}
          </Box>
        </Box>

        <Box display="flex" justifyContent="center" mb={3}>
          {qrData && (
            <QRCode
              id={`qr-${credentialId}`}
              value={qrData}
              size={200}
              level="M"
            />
          )}
        </Box>

        <Box display="flex" gap={2}>
          <Button
            variant="outlined"
            onClick={generateQRCode}
            startIcon={<RefreshIcon />}
            disabled={loading}
            fullWidth
          >
            Refresh
          </Button>
          {isAdmin && (
            <Button
              variant="contained"
              onClick={downloadQR}
              startIcon={<DownloadIcon />}
              fullWidth
            >
              Download
            </Button>
          )}
        </Box>

        <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: 'block' }}>
          {isAdmin 
            ? 'This QR code is permanent and can be used multiple times.'
            : 'This QR code expires in 60 seconds for security purposes.'
          }
        </Typography>
      </CardContent>
    </Card>
  );
}
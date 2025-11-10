import { useState, useRef } from 'react';
import jsQR from 'jsqr';
import {
  Box,
  Paper,
  Typography,
  Button,
  Alert,
  Card,
  CardContent,
  Dialog,
  DialogTitle,
  DialogContent,
  CircularProgress,
  Chip,
  TextField,
  Divider
} from '@mui/material';
import {
  QrCodeScanner as ScanIcon,
  PhotoCamera as CameraIcon,
  CheckCircle as SuccessIcon,
  Error as ErrorIcon,
  Upload as UploadIcon
} from '@mui/icons-material';
import CheckInCard from '~/components/CheckInCard';

interface VerificationResult {
  success: boolean;
  message: string;
  benefitName?: string;
  userName?: string;
  expiryDate?: string;
  usesRemaining?: number;
  credentials?: any[]; // Add credentials to display
}

export default function ClientCheckin() {
  const [verificationResult, setVerificationResult] = useState<VerificationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string>('');
  const [manualToken, setManualToken] = useState<string>('');
  const [decodedCredentials, setDecodedCredentials] = useState<any[] | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handlePhotoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const imageData = e.target?.result as string;
        setCapturedImage(imageData);
        processQRImage(imageData);
      };
      reader.readAsDataURL(file);
    }
    // Reset the input value so the same file can be selected again
    if (event.target) {
      event.target.value = '';
    }
  };

  const processQRImage = async (imageData: string) => {
    setLoading(true);
    setVerificationResult(null);

    try {
      // Decode QR code from image
      const img = new Image();
      img.src = imageData;
      
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
      });

      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d', { willReadFrequently: true });
      
      if (!context) {
        throw new Error('Failed to get canvas context');
      }
      
      // Use original dimensions for better quality
      canvas.width = img.width;
      canvas.height = img.height;
      context.drawImage(img, 0, 0);

      const imageDataObj = context.getImageData(0, 0, canvas.width, canvas.height);
      
      console.log('Image dimensions:', canvas.width, 'x', canvas.height);
      console.log('Attempting to scan QR code...');
      
      // Try multiple scanning strategies
      let code = null;
      
      // Strategy 1: Normal scan
      code = jsQR(imageDataObj.data, imageDataObj.width, imageDataObj.height, {
        inversionAttempts: 'dontInvert',
      });
      
      // Strategy 2: Try with inversion
      if (!code) {
        console.log('Trying with inversion...');
        code = jsQR(imageDataObj.data, imageDataObj.width, imageDataObj.height, {
          inversionAttempts: 'attemptBoth',
        });
      }
      
      // Strategy 3: Try with scaling down for large images
      if (!code && (canvas.width > 1000 || canvas.height > 1000)) {
        console.log('Trying with scaled down image...');
        const scale = Math.min(1000 / canvas.width, 1000 / canvas.height);
        const scaledCanvas = document.createElement('canvas');
        const scaledContext = scaledCanvas.getContext('2d');
        
        if (scaledContext) {
          scaledCanvas.width = canvas.width * scale;
          scaledCanvas.height = canvas.height * scale;
          scaledContext.drawImage(img, 0, 0, scaledCanvas.width, scaledCanvas.height);
          
          const scaledImageData = scaledContext.getImageData(0, 0, scaledCanvas.width, scaledCanvas.height);
          code = jsQR(scaledImageData.data, scaledCanvas.width, scaledCanvas.height, {
            inversionAttempts: 'attemptBoth',
          });
        }
      }

      if (!code) {
        console.error('No QR code detected in image after all attempts');
        setVerificationResult({
          success: false,
          message: 'No QR code found in the image. Please ensure the QR code is clear and well-lit, or try manual entry.'
        });
        setLoading(false);
        return;
      }

      console.log('QR code detected successfully!');
      
      // The QR code contains a SHORT token (16 chars) that references credentials
      const token = code.data.trim();
      console.log('Token from QR:', token, 'Length:', token.length);

      if (!token) {
        setVerificationResult({
          success: false,
          message: 'QR code is empty. Please use a valid membership QR code.'
        });
        setLoading(false);
        return;
      }

      // Send token to backend - backend will lookup credentials and verify
      const response = await fetch('/api/verification/verify-token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ token })
      });

      const result = await response.json();
      
      if (result.success && result.data) {
        // Store decoded credentials for display
        if (result.data.credentials) {
          setDecodedCredentials(result.data.credentials);
        }
        
        setVerificationResult({
          success: true,
          message: result.message || 'Check-in successful!',
          benefitName: result.data.benefitName,
          userName: result.data.userName,
          expiryDate: result.data.expiryDate,
          usesRemaining: result.data.usesRemaining,
          credentials: result.data.credentials
        });
      } else {
        setVerificationResult({
          success: false,
          message: result.message || 'Verification failed. Please check your credential.'
        });
      }
    } catch (error) {
      console.error('Verification error:', error);
      setVerificationResult({
        success: false,
        message: 'Error processing QR code. Please try again.'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleManualVerify = async () => {
    if (!manualToken.trim()) {
      setVerificationResult({
        success: false,
        message: 'Please enter a token'
      });
      return;
    }

    setLoading(true);
    setVerificationResult(null);

    try {
      // Send token to backend - backend will lookup credentials and verify
      const response = await fetch('/api/verification/verify-token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ token: manualToken.trim() })
      });

      const result = await response.json();
      
      if (result.success && result.data) {
        // Store decoded credentials for display
        if (result.data.credentials) {
          setDecodedCredentials(result.data.credentials);
        }
        
        setVerificationResult({
          success: true,
          message: result.message || 'Check-in successful!',
          benefitName: result.data.benefitName,
          userName: result.data.userName,
          expiryDate: result.data.expiryDate,
          usesRemaining: result.data.usesRemaining,
          credentials: result.data.credentials
        });
      } else {
        setVerificationResult({
          success: false,
          message: result.message || 'Verification failed. Please check your token.'
        });
      }
    } catch (error) {
      console.error('Manual verification error:', error);
      setVerificationResult({
        success: false,
        message: 'Error verifying token. Please try again.'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        Check In
      </Typography>
      <Typography variant="body1" color="text.secondary" paragraph>
        Upload a photo of your membership QR code to check in to the gym.
      </Typography>

      <Box display="flex" flexDirection="column" gap={3}>
        {/* Action Button */}
        <Box>
          <Button
            variant="contained"
            size="large"
            startIcon={<UploadIcon />}
            onClick={() => fileInputRef.current?.click()}
            disabled={loading}
            fullWidth
            sx={{ maxWidth: 400 }}
          >
            Upload QR Code Image
          </Button>
          
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handlePhotoUpload}
            style={{ display: 'none' }}
          />
        </Box>

        {/* Manual Token Entry */}
        <Card sx={{ maxWidth: 600 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Or Enter Token Manually
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              If QR scanning fails, you can paste the token shown below the QR code.
            </Typography>
            <Box display="flex" gap={2}>
              <TextField
                fullWidth
                label="Credential Token"
                value={manualToken}
                onChange={(e) => setManualToken(e.target.value)}
                placeholder="e.g., 698899154825734f"
                disabled={loading}
                helperText="Enter the 16-character token from your membership QR code"
              />
              <Button
                variant="contained"
                onClick={handleManualVerify}
                disabled={loading || !manualToken.trim()}
                sx={{ minWidth: 120 }}
              >
                Verify
              </Button>
            </Box>
          </CardContent>
        </Card>

        {/* Loading State */}
        {loading && (
          <Card>
            <CardContent sx={{ textAlign: 'center', p: 4 }}>
              <CircularProgress />
              <Typography variant="body2" sx={{ mt: 2 }}>
                Verifying credential...
              </Typography>
            </CardContent>
          </Card>
        )}

        {/* Captured Image Preview */}
        {capturedImage && !loading && (
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Captured Image
              </Typography>
              <Box display="flex" justifyContent="center" mb={2}>
                <img
                  src={capturedImage}
                  alt="Captured QR code"
                  style={{
                    maxWidth: '100%',
                    maxHeight: 300,
                    borderRadius: 8,
                    objectFit: 'contain'
                  }}
                />
              </Box>
            </CardContent>
          </Card>
        )}

        {/* Verification Result */}
        {verificationResult && (
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={2} mb={2}>
                {verificationResult.success ? (
                  <SuccessIcon color="success" />
                ) : (
                  <ErrorIcon color="error" />
                )}
                <Typography variant="h6">
                  {verificationResult.success ? 'Check-in Successful!' : 'Check-in Failed'}
                </Typography>
              </Box>

              <Alert severity={verificationResult.success ? 'success' : 'error'} sx={{ mb: 2 }}>
                {verificationResult.message}
              </Alert>

              {verificationResult.success && (
                <Box>
                  {verificationResult.benefitName && (
                    <Typography variant="body1" gutterBottom>
                      <strong>Benefit:</strong> {verificationResult.benefitName}
                    </Typography>
                  )}
                  {verificationResult.userName && (
                    <Typography variant="body1" gutterBottom>
                      <strong>Member:</strong> {verificationResult.userName}
                    </Typography>
                  )}
                  {verificationResult.expiryDate && (
                    <Typography variant="body1" gutterBottom>
                      <strong>Valid Until:</strong> {new Date(verificationResult.expiryDate).toLocaleDateString()}
                    </Typography>
                  )}
                  {verificationResult.usesRemaining !== undefined && (
                    <Box mt={1}>
                      <Chip
                        label={`${verificationResult.usesRemaining} uses remaining this month`}
                        color={verificationResult.usesRemaining > 5 ? 'success' : 'warning'}
                        size="small"
                      />
                    </Box>
                  )}
                  
                  {/* Display Decoded Credentials as Member Card */}
                  {decodedCredentials && decodedCredentials.length > 0 && (
                    <Box mt={3}>
                      <Divider sx={{ my: 2 }} />
                      <Typography variant="h6" gutterBottom sx={{ textAlign: 'center' }}>
                        Member Card
                      </Typography>
                      <CheckInCard
                        credentials={decodedCredentials}
                        benefitName={verificationResult.benefitName}
                        userName={verificationResult.userName}
                        expiryDate={verificationResult.expiryDate}
                        usesRemaining={verificationResult.usesRemaining}
                      />
                    </Box>
                  )}
                </Box>
              )}

              <Box mt={2}>
                <Button
                  variant="contained"
                  onClick={() => {
                    setVerificationResult(null);
                    setCapturedImage('');
                    setDecodedCredentials(null);
                    setManualToken('');
                    // Reset file input
                    if (fileInputRef.current) {
                      fileInputRef.current.value = '';
                    }
                  }}
                  fullWidth
                  size="large"
                >
                  New Check-In
                </Button>
              </Box>
            </CardContent>
          </Card>
        )}

        {/* Instructions */}
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              How to Check In
            </Typography>
            <Typography variant="body2" paragraph>
              1. <strong>Get your QR code:</strong> After registering for a membership, save the QR code shown in the confirmation dialog
            </Typography>
            <Typography variant="body2" paragraph>
              2. <strong>Upload QR code:</strong> Click the "Upload QR Code Image" button and select the saved QR code image
            </Typography>
            <Typography variant="body2" paragraph>
              3. <strong>Verification:</strong> The system will automatically decode and verify your credentials
            </Typography>
            <Typography variant="body2" color="text.secondary">
              <strong>Important:</strong> Make sure to capture/save your QR code within 60 seconds after membership registration, as it will disappear for security.
            </Typography>
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
}
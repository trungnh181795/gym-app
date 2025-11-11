import { Router, Request, Response } from 'express';
import { veramoCredentialsService } from '../services/veramo-credentials.service';
import { tokenService } from '../services/token.service';
import { ApiResponse } from '../types';

const router = Router();

// Verify credential by token (from QR code)
router.post('/verify-token', async (req: Request, res: Response): Promise<void> => {
  try {
    const { token } = req.body;

    if (!token) {
      res.status(400).json({
        success: false,
        error: 'Token is required'
      } as ApiResponse);
      return;
    }

    // Get credentials from token
    const credentials = await tokenService.getCredentialsByToken(token);

    if (!credentials || credentials.length === 0) {
      res.status(404).json({
        success: false,
        message: 'Invalid or expired token'
      } as ApiResponse);
      return;
    }

    // Verify the first credential (primary member credential)
    const primaryCredential = credentials[0];
    
    // Extract the JWT string from the credential object
    const jwt = primaryCredential.jwt || primaryCredential;
    const verificationResult = await veramoCredentialsService.verifyCredential(jwt);

    res.json({
      success: true,
      message: 'Credential verified successfully',
      data: {
        ...verificationResult,
        credentials: credentials // Include the full credentials array
      }
    } as ApiResponse);

  } catch (error) {
    console.error('Token verification error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to verify token',
      message: (error as Error).message
    } as ApiResponse);
  }
});

// Original verify endpoint (for direct credential verification)
router.post('/verify', async (req: Request, res: Response): Promise<void> => {
  try {
    const { credentials } = req.body;

    if (!credentials) {
      res.status(400).json({
        success: false,
        error: 'Credentials are required'
      } as ApiResponse);
      return;
    }

    // Handle both single credential and array of credentials
    const credentialToVerify = Array.isArray(credentials) ? credentials[0] : credentials;

    if (!credentialToVerify) {
      res.status(400).json({
        success: false,
        error: 'No valid credential found'
      } as ApiResponse);
      return;
    }

    const verificationResult = await veramoCredentialsService.verifyCredential(credentialToVerify);

    res.json({
      success: true,
      message: 'Credential verified successfully',
      data: verificationResult
    } as ApiResponse);

  } catch (error) {
    console.error('Verification error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to verify credential',
      message: (error as Error).message
    } as ApiResponse);
  }
});

export default router;

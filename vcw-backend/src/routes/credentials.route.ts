import express, { Request, Response } from 'express';
import { veramoCredentialsService } from '../services/veramo-credentials.service';
import { CreateCredentialRequest, CreateBenefitCredentialRequest, ApiResponse, ApiErrorResponse, CreateCredentialResponse } from '../types';

const router = express.Router();

// GET /api/credentials/with-details - Get all credentials with full details
router.get('/with-details', async (req: Request, res: Response) => {
    try {
        const result = await veramoCredentialsService.listCredentials({});
        
        const response: ApiResponse = {
            success: true,
            message: 'Credentials with details retrieved successfully',
            data: result
        };
        
        res.json(response);
    } catch (error) {
        console.error('Error listing credentials with details:', error);
        const errorResponse: ApiErrorResponse = {
            error: 'Internal Server Error',
            message: 'Failed to retrieve credentials with details'
        };
        res.status(500).json(errorResponse);
    }
});

// POST /api/credentials/issue - Issue a new credential
router.post('/issue', async (req: Request, res: Response) => {
    try {
        const { holderDid, name, plan }: CreateCredentialRequest = req.body;

        // Validate required fields
        if (!holderDid || !name || !plan) {
            const errorResponse: ApiErrorResponse = {
                error: 'Validation Error',
                message: 'Missing required fields: holderDid, name, plan'
            };
            res.status(400).json(errorResponse);
            return;
        }

        // This endpoint is deprecated - use POST /api/benefits and let membership service auto-generate credentials
        const errorResponse: ApiErrorResponse = {
            error: 'Deprecated Endpoint',
            message: 'Direct credential creation is deprecated. Create benefits and memberships instead to auto-generate credentials.'
        };
        res.status(400).json(errorResponse);
        return;
    } catch (error) {
        console.error('Error issuing credential:', error);
        const errorResponse: ApiErrorResponse = {
            error: 'Internal Server Error',
            message: 'Failed to issue credential'
        };
        res.status(500).json(errorResponse);
    }
});

// GET /api/credentials - List all credentials with optional filtering
router.get('/', async (req: Request, res: Response) => {
    try {
        const { page, limit, search, holderDid, status } = req.query;
        
        const options = {
            page: page ? parseInt(page as string) : undefined,
            limit: limit ? parseInt(limit as string) : undefined,
            search: search as string,
            holderDid: holderDid as string,
            status: status as 'active' | 'revoked' | 'expired'
        };

        const result = await veramoCredentialsService.listCredentials(options);
        
        const response: ApiResponse = {
            success: true,
            message: 'Credentials retrieved successfully',
            data: result
        };
        
        res.json(response);
    } catch (error) {
        console.error('Error listing credentials:', error);
        const errorResponse: ApiErrorResponse = {
            error: 'Internal Server Error',
            message: 'Failed to retrieve credentials'
        };
        res.status(500).json(errorResponse);
    }
});

// GET /api/credentials/:id - Get a specific credential
router.get('/:id', async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        if (!id) {
            const errorResponse: ApiErrorResponse = {
                error: 'Validation Error',
                message: 'Credential ID is required'
            };
            res.status(400).json(errorResponse);
            return;
        }

        const credential = await veramoCredentialsService.getCredential(id);
        
        if (!credential) {
            const errorResponse: ApiErrorResponse = {
                error: 'Not Found',
                message: 'Credential not found'
            };
            res.status(404).json(errorResponse);
            return;
        }

        const response: ApiResponse = {
            success: true,
            message: 'Credential retrieved successfully',
            data: credential
        };
        
        res.json(response);
    } catch (error) {
        console.error('Error getting credential:', error);
        const errorResponse: ApiErrorResponse = {
            error: 'Internal Server Error',
            message: 'Failed to retrieve credential'
        };
        res.status(500).json(errorResponse);
    }
});

// POST /api/credentials/verify - Verify a credential
router.post('/verify', async (req: Request, res: Response) => {
    try {
        const { jwt } = req.body;

        if (!jwt) {
            const errorResponse: ApiErrorResponse = {
                error: 'Validation Error',
                message: 'JWT is required for verification'
            };
            res.status(400).json(errorResponse);
            return;
        }

        const verificationResult = await veramoCredentialsService.verifyCredential(jwt);
        
        const response: ApiResponse = {
            success: true,
            message: 'Credential verification completed',
            data: verificationResult
        };
        
        res.json(response);
    } catch (error) {
        console.error('Error verifying credential:', error);
        const errorResponse: ApiErrorResponse = {
            error: 'Internal Server Error',
            message: 'Failed to verify credential'
        };
        res.status(500).json(errorResponse);
    }
});

// DELETE /api/credentials/:id - Delete a credential
router.delete('/:id', async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        if (!id) {
            const errorResponse: ApiErrorResponse = {
                error: 'Validation Error',
                message: 'Credential ID is required'
            };
            res.status(400).json(errorResponse);
            return;
        }

        const deleted = await veramoCredentialsService.deleteCredential(id);
        
        if (!deleted) {
            const errorResponse: ApiErrorResponse = {
                error: 'Not Found',
                message: 'Credential not found'
            };
            res.status(404).json(errorResponse);
            return;
        }

        const response: ApiResponse = {
            success: true,
            message: 'Credential deleted successfully'
        };
        
        res.json(response);
    } catch (error) {
        console.error('Error deleting credential:', error);
        const errorResponse: ApiErrorResponse = {
            error: 'Internal Server Error',
            message: 'Failed to delete credential'
        };
        res.status(500).json(errorResponse);
    }
});

// POST /api/credentials/:id/revoke - Revoke a credential
router.post('/:id/revoke', async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { reason } = req.body;

        if (!id) {
            const errorResponse: ApiErrorResponse = {
                error: 'Validation Error',
                message: 'Credential ID is required'
            };
            res.status(400).json(errorResponse);
            return;
        }

        const revoked = await veramoCredentialsService.revokeCredential(id, reason);
        
        if (!revoked) {
            const errorResponse: ApiErrorResponse = {
                error: 'Not Found',
                message: 'Credential not found or could not be revoked'
            };
            res.status(404).json(errorResponse);
            return;
        }

        const response: ApiResponse = {
            success: true,
            message: 'Credential revoked successfully'
        };
        
        res.json(response);
    } catch (error) {
        console.error('Error revoking credential:', error);
        const errorResponse: ApiErrorResponse = {
            error: 'Internal Server Error',
            message: 'Failed to revoke credential'
        };
        res.status(500).json(errorResponse);
    }
});

// POST /api/credentials/issue-membership - Issue credentials for all membership benefits
router.post('/issue-membership', async (req: Request, res: Response) => {
    try {
        const { membership, userWalletDid } = req.body;

        // Validate required fields
        if (!membership || !userWalletDid) {
            const errorResponse: ApiErrorResponse = {
                error: 'Bad Request',
                message: 'Missing required fields: membership and userWalletDid are required'
            };
            res.status(400).json(errorResponse);
            return;
        }

        // This endpoint is deprecated - credentials are auto-generated when memberships are created
        const errorResponse: ApiErrorResponse = {
            error: 'Deprecated Endpoint',
            message: 'Membership credentials are automatically generated when memberships are created.'
        };
        res.status(400).json(errorResponse);
        return;
    } catch (error) {
        console.error('Error issuing membership credentials:', error);
        const errorResponse: ApiErrorResponse = {
            error: 'Internal Server Error',
            message: 'Failed to issue membership credentials'
        };
        res.status(500).json(errorResponse);
    }
});

// POST /api/credentials/issue-benefit - Issue a single benefit credential
router.post('/issue-benefit', async (req: Request, res: Response) => {
    try {
        const benefitCredentialData: CreateBenefitCredentialRequest = req.body;

        // Validate required fields
        if (!benefitCredentialData.userId || !benefitCredentialData.membershipId || !benefitCredentialData.benefitId) {
            const errorResponse: ApiErrorResponse = {
                error: 'Bad Request',
                message: 'Missing required fields: userId, membershipId, and benefitId are required'
            };
            res.status(400).json(errorResponse);
            return;
        }

        const credential = await veramoCredentialsService.createCredential(benefitCredentialData);
        
        const response: ApiResponse<CreateCredentialResponse> = {
            success: true,
            message: 'Benefit credential issued successfully',
            data: credential
        };
        
        res.status(201).json(response);
    } catch (error) {
        console.error('Error issuing benefit credential:', error);
        const errorResponse: ApiErrorResponse = {
            error: 'Internal Server Error',
            message: 'Failed to issue benefit credential'
        };
        res.status(500).json(errorResponse);
    }
});

// GET /api/credentials/stats - Get credential statistics
router.get('/admin/stats', async (req: Request, res: Response) => {
    try {
        const stats = await veramoCredentialsService.getStorageStats();
        
        const response: ApiResponse = {
            success: true,
            message: 'Statistics retrieved successfully',
            data: stats
        };
        
        res.json(response);
    } catch (error) {
        console.error('Error getting stats:', error);
        const errorResponse: ApiErrorResponse = {
            error: 'Internal Server Error',
            message: 'Failed to retrieve statistics'
        };
        res.status(500).json(errorResponse);
    }
});

// GET /api/credentials/:id/qr-client - Generate temporary QR token for client (60 seconds)
router.get('/:id/qr-client', async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        
        // Get the credential
        const credential = await veramoCredentialsService.getCredential(id);
        
        if (!credential) {
            const errorResponse: ApiErrorResponse = {
                error: 'Not Found',
                message: 'Credential not found'
            };
            res.status(404).json(errorResponse);
            return;
        }
        
        // Create a temporary token for this credential (expires in 60 seconds)
        const credentials = [credential];
        const token = await require('../services/token.service').tokenService.createCredentialToken(credentials);
        
        const response: ApiResponse = {
            success: true,
            message: 'Temporary QR token generated',
            data: {
                token: token,
                expiresAt: new Date(Date.now() + 60000).toISOString(), // 60 seconds
                expiresIn: 60
            }
        };
        
        res.json(response);
    } catch (error) {
        console.error('Error generating QR token:', error);
        const errorResponse: ApiErrorResponse = {
            error: 'Internal Server Error',
            message: 'Failed to generate QR token'
        };
        res.status(500).json(errorResponse);
    }
});

// GET /api/credentials/:id/qr - Generate QR code data for credential
router.get('/:id/qr', async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { admin } = req.query; // Admin gets permanent QR, client gets 60-second QR
        
        // Get the credential
        const credential = await veramoCredentialsService.getCredential(id);
        
        if (!credential) {
            const errorResponse: ApiErrorResponse = {
                error: 'Not Found',
                message: 'Credential not found'
            };
            res.status(404).json(errorResponse);
            return;
        }

        if (admin === 'true') {
            // For admin: create a permanent token (no expiration)
            // We'll use a special token that doesn't expire
            const credentials = [credential];
            const token = await require('../services/token.service').tokenService.createCredentialToken(credentials, true); // true = permanent
            
            const response: ApiResponse = {
                success: true,
                message: 'Permanent QR token generated',
                data: {
                    credentialJson: token,
                    qrType: 'permanent',
                    expiresAt: null
                }
            };
            
            res.json(response);
        } else {
            // For client: create temporary 60-second token
            const credentials = [credential];
            const token = await require('../services/token.service').tokenService.createCredentialToken(credentials);
            
            const response: ApiResponse = {
                success: true,
                message: 'Temporary QR token generated',
                data: {
                    credentialJson: token,
                    qrType: 'temporary',
                    expiresAt: new Date(Date.now() + 60000).toISOString() // 60 seconds
                }
            };
            
            res.json(response);
        }
    } catch (error) {
        console.error('Error generating QR code:', error);
        const errorResponse: ApiErrorResponse = {
            error: 'Internal Server Error',
            message: 'Failed to generate QR code data'
        };
        res.status(500).json(errorResponse);
    }
});

// POST /api/credentials/verify-qr - Verify credential from QR code JSON
router.post('/verify-qr', async (req: Request, res: Response) => {
    try {
        const { credentialJson } = req.body;
        
        if (!credentialJson) {
            const errorResponse: ApiErrorResponse = {
                error: 'Bad Request',
                message: 'Credential JSON is required'
            };
            res.status(400).json(errorResponse);
            return;
        }
        
        const verificationResult = await veramoCredentialsService.verifyCredentialFromQR(credentialJson);
        
        const response: ApiResponse = {
            success: verificationResult.valid,
            message: verificationResult.message,
            data: {
                valid: verificationResult.valid,
                credential: verificationResult.credential,
                payload: verificationResult.payload
            }
        };
        
        res.json(response);
    } catch (error) {
        console.error('Error verifying credential from QR:', error);
        const errorResponse: ApiErrorResponse = {
            error: 'Internal Server Error',
            message: 'Failed to verify credential from QR'
        };
        res.status(500).json(errorResponse);
    }
});

export default router;
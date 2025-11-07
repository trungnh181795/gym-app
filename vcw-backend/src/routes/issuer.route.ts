import express, { Request, Response } from 'express';
import { veramoIssuerService } from '../services/veramo-issuer.service';
import { ApiResponse, ApiErrorResponse } from '../types';

const router = express.Router();

// GET /api/issuer - Get issuer DID Document (W3C standard)
router.get('/', async (_req: Request, res: Response) => {
    try {
        // Get the complete DID Document from the issuer service
        const didDocument = await veramoIssuerService.getDIDDocument();
        
        const response: ApiResponse = {
            success: true,
            message: 'Issuer DID Document retrieved successfully',
            data: didDocument
        };
        
        res.json(response);
    } catch (error) {
        console.error('Error getting issuer DID document:', error);
        const errorResponse: ApiErrorResponse = {
            error: 'Internal Server Error',
            message: 'Failed to retrieve issuer DID document'
        };
        res.status(500).json(errorResponse);
    }
});

// GET /api/issuer/info - Get gym business information
router.get('/info', async (_req: Request, res: Response) => {
    try {
        const gymInfo = veramoIssuerService.getGymInfo();
        
        const response: ApiResponse = {
            success: true,
            message: 'Gym business information retrieved successfully',
            data: gymInfo
        };
        
        res.json(response);
    } catch (error) {
        console.error('Error getting gym info:', error);
        const errorResponse: ApiErrorResponse = {
            error: 'Internal Server Error',
            message: 'Failed to retrieve gym information'
        };
        res.status(500).json(errorResponse);
    }
});

// GET /api/issuer/public-key - Get public key for verification (legacy endpoint)
router.get('/public-key', async (_req: Request, res: Response) => {
    try {
        const publicKeyInfo = {
            publicKeyHex: veramoIssuerService.getPublicKey(),
            algorithm: 'EdDSA',
            curve: 'Ed25519',
            format: 'Hex',
            usage: ['verify'],
            note: 'Use this public key to verify credentials issued by this issuer. With Veramo, credentials are self-verifiable.'
        };
        
        const response: ApiResponse = {
            success: true,
            message: 'Public key retrieved for independent verification',
            data: publicKeyInfo
        };
        
        res.json(response);
    } catch (error) {
        console.error('Error getting public key:', error);
        const errorResponse: ApiErrorResponse = {
            error: 'Internal Server Error',
            message: 'Failed to retrieve public key'
        };
        res.status(500).json(errorResponse);
    }
});

export default router;
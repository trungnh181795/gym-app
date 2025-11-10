import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import credentialsRouter from './routes/credentials.route';
import issuerRouter from './routes/issuer.route';
import usersRouter from './routes/users.route';
import membershipsRouter from './routes/memberships.route';
import sharingRouter from './routes/sharing.route';
import servicesRouter from './routes/services.route';
import benefitsRouter from './routes/benefits.route';
import authRouter from './routes/auth.route';
import userRouter from './routes/user.route';
import verificationRouter from './routes/verification.route';
import { ApiResponse, ApiErrorResponse } from './types';
import { ServiceManager } from './services/service.service';
import { getDataSource } from './config/database.config';
import { veramoIssuerService } from './services/veramo-issuer.service';

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json({ limit: '10mb' }));
app.use(cookieParser());
app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true // Allow cookies to be sent
}));

// Logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  const response: ApiResponse = {
    success: true,
    message: 'Service is healthy',
    data: {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: '1.0.0'
    }
  };
  res.json(response);
});

// API routes
app.use('/api/auth', authRouter);
app.use('/api/credentials', credentialsRouter);
app.use('/api/issuer', issuerRouter);
app.use('/api/users', usersRouter);
app.use('/api/user', userRouter); // User-specific endpoints
app.use('/api/memberships', membershipsRouter);
app.use('/api/shares', sharingRouter);
app.use('/api/services', servicesRouter);
app.use('/api/benefits', benefitsRouter);
app.use('/api/verification', verificationRouter);

// Root endpoint
app.get('/', (req, res) => {
  const response: ApiResponse = {
    success: true,
    message: 'Verifiable Credential Wallet API',
    data: {
      version: '1.0.0',
      endpoints: {
        health: '/health',
        credentials: {
          issue: 'POST /api/credentials/issue',
          list: 'GET /api/credentials',
          get: 'GET /api/credentials/:id',
          verify: 'POST /api/credentials/verify',
          delete: 'DELETE /api/credentials/:id',
          stats: 'GET /api/credentials/admin/stats'
        },
        users: {
          create: 'POST /api/users',
          list: 'GET /api/users',
          get: 'GET /api/users/:id',
          update: 'PUT /api/users/:id',
          delete: 'DELETE /api/users/:id',
          stats: 'GET /api/users/stats/overview'
        },
        memberships: {
          create: 'POST /api/memberships',
          list: 'GET /api/memberships',
          get: 'GET /api/memberships/:id',
          update: 'PUT /api/memberships/:id',
          delete: 'DELETE /api/memberships/:id',
          templates: 'GET /api/memberships/templates/list',
          stats: 'GET /api/memberships/stats/overview'
        },
        sharing: {
          create: 'POST /api/shares',
          get: 'GET /api/shares/:shareId',
          revoke: 'DELETE /api/shares/:shareId',
          byCredential: 'GET /api/shares/credential/:credentialId',
          cleanup: 'POST /api/shares/cleanup/expired',
          stats: 'GET /api/shares/stats/overview'
        },
        issuer: {
          info: 'GET /api/issuer'
        }
      },
      documentation: 'See README.md for API documentation'
    }
  };
  res.json(response);
});

// 404 handler - catch all unmatched routes
app.use((req, res, _next) => {
  const errorResponse: ApiErrorResponse = {
    error: 'Not Found',
    message: 'The requested endpoint does not exist',
    path: req.originalUrl
  };
  res.status(404).json(errorResponse);
});

// Global error handler
app.use((err: Error, req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Unhandled error:', err);
  const errorResponse: ApiErrorResponse = {
    error: 'Internal Server Error',
    message: 'An unexpected error occurred'
  };
  res.status(500).json(errorResponse);
});

// Graceful shutdown handler
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  process.exit(0);
});

// Initialize default services and Veramo
async function initializeServices() {
  try {
    // Initialize database
    console.log('🔄 Initializing database...');
    await getDataSource();
    console.log('✅ Database connected');
    
    // Initialize issuer DID
    console.log('🔄 Initializing Veramo issuer service...');
    await veramoIssuerService.initialize();
    console.log('✅ Veramo issuer service initialized');
    
    // Initialize default services
    console.log('🔄 Initializing default services...');
    await ServiceManager.initializeDefaultServices();
    console.log('✅ Default services initialized');
  } catch (error) {
    console.error('❌ Failed to initialize services:', error);
    process.exit(1);
  }
}

// Start server
async function startServer() {
  await initializeServices();
  
  app.listen(PORT, () => {
    console.log(`🚀 Verifiable Credential Wallet API server is running on port ${PORT}`);
    console.log(`📋 Health check: http://localhost:${PORT}/health`);
    console.log(`📚 API documentation: http://localhost:${PORT}/`);
    console.log(`🔐 Using Veramo for W3C Verifiable Credentials`);
  });
}

startServer().catch((error) => {
  console.error('❌ Failed to start server:', error);
  process.exit(1);
});

export default app;
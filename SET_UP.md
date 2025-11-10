# Verifiable Credential Wallet (VCW) Setup Guide

This guide will walk you through setting up the complete Verifiable Credential Wallet system with both backend (API) and frontend (React) components.

## 📋 Prerequisites

- **Node.js** (version 18.x or later)
- **npm** (comes with Node.js)
- **Git** (for cloning the repository)
- **Terminal/Command Line** access

## 🏗️ Project Structure

```
vcw-v2/
├── vcw-backend/     # Express.js API with Veramo framework
├── vcw-frontend/    # React Router v7 frontend with Material-UI
└── SET_UP.md        # This file
```

## 🚀 Quick Start

### 1. Clone the Repository

```bash
git clone https://github.com/trungnh181795/gym-app.git
cd gym-app
```

### 2. Backend Setup

Navigate to the backend directory and install dependencies:

```bash
cd vcw-backend
npm install
```

#### Database Initialization

The backend automatically creates and initializes the SQLite database on first run. Default data includes:

- **Users**: Test users for gym members
- **Services**: Gym facilities (Pool, Sauna, Steam Room, etc.)
- **Benefits**: Membership packages linking to services
- **Memberships**: Sample memberships with credentials

#### Start the Backend Server

```bash
npm run dev
```

The server will start on `http://localhost:3000` with the following features:
- ✅ Veramo W3C Verifiable Credentials
- ✅ DID management (did:key method)
- ✅ SQLite database with TypeORM
- ✅ Auto-restart with nodemon

**Backend API Endpoints:**
- `GET /api/users` - User management
- `GET /api/services` - Gym services
- `GET /api/benefits` - Membership benefits
- `GET /api/memberships` - Membership management
- `GET /api/credentials` - Credential operations
- `POST /api/verification/verify-token` - QR code verification

### 3. Frontend Setup

Open a new terminal and navigate to the frontend directory:

```bash
cd vcw-frontend
npm install
```

#### Start the Frontend Development Server

```bash
npm run dev
```

The frontend will start on `http://localhost:5173` with:
- ✅ React Router v7 with Server-Side Rendering
- ✅ Material-UI components and theming
- ✅ Admin dashboard for gym management
- ✅ Client interface for members
- ✅ QR code generation and scanning
- ✅ API proxy to backend (`/api` → `http://localhost:3000`)

## 👥 User Interfaces

### Admin Dashboard (`/admin`)
**Purpose**: Gym staff and management interface

**Features**:
- **Users Management**: Create and manage gym members
- **Services Management**: Define gym facilities and amenities
- **Benefits Management**: Create membership packages
- **Memberships Management**: Assign benefits to members
- **Credentials Overview**: View issued verifiable credentials

**Default Access**: Visit `http://localhost:5173/admin`

### Client Interface (`/client`)
**Purpose**: Gym member interface

**Features**:
- **Authentication**: Member login/registration
- **My Membership**: View membership details and benefits
- **QR Code Generation**: Generate credentials for check-in
- **Benefits Overview**: See available services
- **Check-in**: QR code scanning for gym access

**Default Access**: Visit `http://localhost:5173/client`

## 🔐 Verifiable Credentials Flow

### 1. Credential Issuance
1. Admin creates a membership for a user
2. Backend generates W3C Verifiable Credentials using Veramo
3. Credentials include embedded service details (gym facilities)
4. QR code contains JWT representation of credentials

### 2. Credential Verification
1. Member generates QR code from their membership
2. Gym staff scans QR code at check-in
3. Backend verifies credential cryptographic proof
4. System displays member details and included services

### 3. Technical Details
- **DID Method**: `did:key` (self-resolving)
- **Proof Format**: JWT with embedded W3C VC
- **Database**: SQLite with encrypted storage
- **Issuer DID**: Auto-generated on first startup

## 📊 Sample Data

The system comes pre-loaded with sample data:

### Services
- Gym Floor Access
- Swimming Pool
- Sauna & Steam Room
- Personal Training
- Group Fitness Classes
- Nutrition Consultation

### Benefits (Membership Packages)
- Premium Wellness Package
- Unlimited Gym Access
- Pool & Wellness Access
- Group Fitness Classes
- Personal Training Sessions

### Test Users
- Sample gym members with different membership types
- Pre-configured for testing the credential flow

## 🛠️ Development Commands

### Backend (`vcw-backend/`)
```bash
npm run dev          # Start development server with auto-reload
npm run build        # Build TypeScript to JavaScript
npm run start        # Run built application
npm run typecheck    # Check TypeScript without building
```

### Frontend (`vcw-frontend/`)

```bash
npm run dev          # Start React Router development server
npm run build        # Build for production with SSR
npm run start        # Start production server
npm run typecheck    # TypeScript type checking + React Router type generation
```

##  API Testing

You can test the API endpoints using curl or any HTTP client:

### Create a Test Benefit
```bash
curl -X POST http://localhost:3000/api/benefits \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Premium Wellness Package",
    "description": "Complete wellness access",
    "price": 99.99,
    "serviceIds": [
      "e0e196fd-f7a4-445e-b73e-dfb1e8a6197c",
      "7007ff41-5850-4feb-b79b-b0e0bda12f6b"
    ],
    "startDate": "2025-11-10T00:00:00.000Z",
    "endDate": "2026-11-10T00:00:00.000Z",
    "requiresBooking": false,
    "isShareable": true
  }'
```

### Verify a Credential
```bash
curl -X POST http://localhost:3000/api/verification/verify-token \
  -H "Content-Type: application/json" \
  -d '{"token": "YOUR_JWT_TOKEN_HERE"}'
```

## 🔧 Troubleshooting

### Backend Issues

**Issue**: Server won't start
**Solution**: Check if port 3000 is available
```bash
lsof -i :3000
# Kill process if needed
kill -9 <PID>
```

**Issue**: Database errors
**Solution**: Delete and recreate the database
```bash
cd vcw-backend
rm storage/veramo.sqlite
npm run dev  # Will recreate database
```

**Issue**: TypeScript compilation errors
**Solution**: Check dependencies and run type check
```bash
npm run typecheck
npm install  # Reinstall if needed
```

### Frontend Issues

**Issue**: Frontend won't start
**Solution**: Check if port 5173 is available and dependencies are installed
```bash
rm -rf node_modules package-lock.json
npm install
npm run dev
```

**Issue**: API connection errors
**Solution**: Ensure backend is running on port 3000
```bash
curl http://localhost:3000/api/users
```

### Common Issues

**Issue**: CORS errors
**Solution**: Backend is configured to allow all origins in development

**Issue**: Credential verification fails
**Solution**: Ensure credentials are generated with the current issuer DID

## 📚 Key Technologies

- **Backend**: Node.js, Express.js, TypeScript, Veramo W3C VC, TypeORM, SQLite
- **Frontend**: React 18, React Router v7 with SSR, Material-UI v7, TypeScript
- **Development**: Vite (bundler), Nodemon (backend auto-reload), ts-node
- **Verifiable Credentials**: W3C VC standard, DID (did:key), JWT proofs, Veramo framework
- **Database**: SQLite with encrypted storage, JSON file backups
- **Styling**: Material-UI components with custom theming

## 🎯 Next Steps

1. **Customize Services**: Add your gym's specific facilities
2. **Configure Benefits**: Create membership packages for your business
3. **Brand the Frontend**: Update colors, logos, and styling
4. **Production Deployment**: Configure environment variables and security
5. **Advanced Features**: Add booking systems, payment integration, etc.

## 📞 Support

For issues or questions:
1. Check the console logs in both backend and frontend
2. Verify all services are running on correct ports
3. Ensure sample data is loaded correctly
4. Test API endpoints independently

---

**🎉 Congratulations!** Your Verifiable Credential Wallet system is now running with a complete gym management interface supporting W3C standard credentials.

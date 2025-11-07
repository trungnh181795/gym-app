# Verifiable Credential Wallet - Docker Setup

This guide explains how to run the entire VCW system using Docker.

## Quick Start

1. **Build and run all services:**
   ```bash
   docker-compose up --build
   ```

2. **Run in background:**
   ```bash
   docker-compose up -d --build
   ```

3. **Access the application:**
   - Frontend: http://localhost (via Nginx)
   - Direct Frontend: http://localhost:8080
   - Backend API: http://localhost:3000
   - API Docs: http://localhost:3000/

## Services

### Backend API (`vcw-backend`)
- **Port:** 3000
- **Technology:** Node.js + TypeScript + Express
- **Features:**
  - User management
  - Membership management with benefits
  - Verifiable credentials issuing
  - Credential sharing
  - JWT-based verification

### Frontend (`vcw-frontend`)
- **Port:** 8080 (direct), 80 (via Nginx)
- **Technology:** React + React Router + Material-UI
- **Features:**
  - User management dashboard
  - Membership management
  - Credential viewing and sharing
  - Credential verification

### Nginx Reverse Proxy
- **Port:** 80 (HTTP), 443 (HTTPS - if configured)
- **Features:**
  - Load balancing
  - CORS handling
  - Rate limiting
  - Static asset caching
  - Security headers

## Development

### Building Individual Services

**Backend:**
```bash
cd vcw-backend
docker build -t vcw-backend .
```

**Frontend:**
```bash
cd vcw-frontend
docker build -t vcw-frontend .
```

### Environment Variables

**Backend:**
- `NODE_ENV`: Environment (production/development)
- `PORT`: Server port (default: 3000)
- `ISSUER_DID`: DID for credential issuer

**Frontend:**
- `NODE_ENV`: Environment (production/development)
- `REACT_APP_API_URL`: Backend API URL

### Volume Mounts

- **Backend Storage:** Persists credentials, users, and memberships
- **Backend Config:** Persists cryptographic keys

## Production Deployment

### SSL Configuration

1. Obtain SSL certificates
2. Update nginx.conf to enable HTTPS
3. Mount certificates:
   ```yaml
   volumes:
     - ./ssl:/etc/nginx/ssl:ro
   ```

### Security Considerations

- Change default ports
- Set strong environment variables
- Enable SSL/TLS
- Configure firewall rules
- Use secrets management
- Regular security updates

### Monitoring

Add monitoring services to docker-compose.yml:

```yaml
  prometheus:
    image: prom/prometheus
    ports:
      - "9090:9090"
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml

  grafana:
    image: grafana/grafana
    ports:
      - "3001:3000"
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=admin
```

## API Endpoints

### Users
- `POST /api/users` - Create user
- `GET /api/users` - List users
- `GET /api/users/:id` - Get user
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user

### Memberships
- `POST /api/memberships` - Create membership
- `GET /api/memberships` - List memberships
- `GET /api/memberships/:id` - Get membership
- `PUT /api/memberships/:id` - Update membership
- `DELETE /api/memberships/:id` - Delete membership
- `GET /api/memberships/templates/list` - Get templates

### Credentials
- `POST /api/credentials/issue` - Issue credential
- `GET /api/credentials` - List credentials
- `GET /api/credentials/:id` - Get credential
- `POST /api/credentials/verify` - Verify credential
- `DELETE /api/credentials/:id` - Delete credential

### Sharing
- `POST /api/shares` - Create share
- `GET /api/shares/:shareId` - Get shared credential
- `DELETE /api/shares/:shareId` - Revoke share

## Troubleshooting

### Common Issues

1. **Port conflicts:**
   ```bash
   docker-compose down
   lsof -i :3000 -i :8080 -i :80
   ```

2. **Permission issues:**
   ```bash
   docker-compose down
   docker system prune -a
   docker-compose up --build
   ```

3. **View logs:**
   ```bash
   docker-compose logs vcw-backend
   docker-compose logs vcw-frontend
   docker-compose logs nginx
   ```

4. **Database issues:**
   ```bash
   docker volume rm vcw_backend_storage
   docker volume rm vcw_backend_config
   ```

### Health Checks

- Backend: http://localhost:3000/health
- Frontend: http://localhost:8080 (or http://localhost via Nginx)

## Architecture Overview

```
┌─────────────┐    ┌──────────────┐    ┌─────────────┐    ┌─────────────┐
│   Client    │    │    Nginx     │    │  Frontend   │    │   Backend   │
│   Browser   │───▶│ Reverse Proxy│───▶│   React     │───▶│   Node.js   │
│             │    │              │    │     App     │    │     API     │
└─────────────┘    └──────────────┘    └─────────────┘    └─────────────┘
                          │                                       │
                          │                                       │
                          ▼                                       ▼
                   ┌──────────────┐                    ┌─────────────┐
                   │   Static     │                    │   File      │
                   │   Assets     │                    │   Storage   │
                   └──────────────┘                    └─────────────┘
```
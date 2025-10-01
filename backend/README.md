# NDEP Backend API

A comprehensive backend API for the National Digital Evidence Portal, built with Node.js, Express, and SQLite.

> **Note**: This is the core backend API. For blockchain-specific functionality, see the separate `blockchain/` module.

## Features

- **Authentication & Authorization**: JWT-based authentication with role-based access control
- **Evidence Management**: Secure file upload, hash verification, and integrity checking
- **Custody Chain**: Complete chain of custody tracking with blockchain simulation
- **Case Management**: Full CRUD operations for case management
- **Blockchain Integration**: Advanced blockchain service with evidence hashing and verification
- **AI-Powered Anomaly Detection**: Rule-based system for detecting custody chain anomalies
- **Custody Timeline Visualization**: Interactive timeline showing complete evidence custody history
- **Real-time Alerts**: Automated anomaly detection with role-based resolution
- **Evidence Verification**: Blockchain-backed integrity verification system
- **Admin Panel**: User management, system analytics, and audit logging
- **Security**: Rate limiting, input validation, and comprehensive error handling

## Quick Start

### Prerequisites

- Node.js 18+ 
- npm or pnpm

### Installation

1. Install dependencies:
```bash
npm install
```

2. Copy environment configuration:
```bash
cp config.env .env
```

3. Start the development server:
```bash
npm run dev
```

The API will be available at `http://localhost:3001`

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration (admin only)
- `GET /api/auth/verify` - Verify JWT token
- `POST /api/auth/logout` - User logout
- `POST /api/auth/change-password` - Change password
- `POST /api/auth/verify-digilocker` - DigiLocker verification
- `GET /api/auth/profile` - Get user profile
- `PUT /api/auth/profile` - Update user profile

### Cases
- `POST /api/cases` - Create new case
- `GET /api/cases` - Get all cases (with filtering)
- `GET /api/cases/:caseId` - Get case by ID
- `PATCH /api/cases/:caseId/status` - Update case status
- `GET /api/cases/stats/overview` - Get case statistics
- `GET /api/cases/search/:query` - Search cases

### Evidence
- `POST /api/evidence/upload` - Upload evidence file
- `GET /api/evidence/case/:caseId` - Get evidence by case
- `GET /api/evidence/:evidenceId` - Get evidence by ID
- `POST /api/evidence/:evidenceId/verify-hash` - Verify evidence hash
- `PATCH /api/evidence/:evidenceId/location` - Update evidence location
- `GET /api/evidence/stats/overview` - Get evidence statistics
- `GET /api/evidence/:evidenceId/download` - Download evidence file

### Custody Chain
- `POST /api/custody/transfer` - Create custody transfer
- `GET /api/custody/evidence/:evidenceId` - Get custody chain for evidence
- `POST /api/custody/verify/:transferId` - Verify custody transfer
- `GET /api/custody/anomalies` - Get custody anomalies
- `GET /api/custody/stats/overview` - Get custody statistics

### Blockchain
- `GET /api/blockchain/status` - Get blockchain status
- `GET /api/blockchain/explorer` - Blockchain explorer
- `GET /api/blockchain/block/:blockHash` - Get specific block
- `GET /api/blockchain/transaction/:transactionHash` - Get specific transaction
- `POST /api/blockchain/hash-evidence` - Create evidence hash transaction
- `POST /api/blockchain/custody-transfer` - Create custody transfer transaction
- `POST /api/blockchain/verify-integrity` - Verify evidence integrity
- `GET /api/blockchain/health` - Get blockchain health metrics
- `POST /api/blockchain/mine` - Force mine block (testing)

### Enhanced Blockchain Features
- `POST /api/blockchain/hash-evidence-file` - Hash evidence file and record on blockchain
- `POST /api/blockchain/verify-evidence` - Verify evidence integrity against blockchain
- `GET /api/blockchain/evidence/:evidenceId/custody` - Get custody timeline for evidence
- `POST /api/blockchain/evidence/:evidenceId/anomalies` - Detect custody anomalies
- `GET /api/blockchain/evidence/:evidenceId/anomalies` - Get stored anomalies for evidence
- `POST /api/blockchain/mine-block` - Force mine block (enhanced)

### Admin
- `GET /api/admin/users` - Get all users
- `GET /api/admin/users/:userId` - Get user by ID
- `POST /api/admin/users` - Create new user
- `PUT /api/admin/users/:userId` - Update user
- `DELETE /api/admin/users/:userId` - Delete user (soft delete)
- `GET /api/admin/stats` - Get system statistics
- `GET /api/admin/audit-logs` - Get audit logs
- `GET /api/admin/settings` - Get system settings
- `PUT /api/admin/settings` - Update system settings
- `GET /api/admin/anomalies` - Get custody anomalies

## Database Schema

The application uses SQLite with the following main tables:

- **users**: User accounts and authentication
- **cases**: Case management and tracking
- **evidence**: Evidence files and metadata
- **custody_chain**: Chain of custody transfers
- **forensic_reports**: Forensic analysis reports
- **blockchain_transactions**: Blockchain transaction records
- **custody_anomalies**: AI-detected custody chain anomalies
- **audit_logs**: System audit trail
- **system_settings**: System configuration

## Security Features

- JWT-based authentication
- Role-based access control (RBAC)
- Rate limiting
- Input validation and sanitization
- File upload security
- SQL injection prevention
- CORS protection
- Helmet.js security headers

## Environment Variables

See `config.env` for all available environment variables.

## Development

### Running Tests
```bash
npm test
```

### Code Formatting
```bash
npm run format
```

### Type Checking
```bash
npm run typecheck
```

## Production Deployment

1. Set `NODE_ENV=production`
2. Update JWT_SECRET to a secure random string
3. Configure proper database backup
4. Set up reverse proxy (nginx)
5. Enable HTTPS
6. Configure monitoring and logging

## Blockchain Integration

The NDEP includes a comprehensive blockchain-backed custody system with AI-powered anomaly detection through a separate blockchain module.

### Blockchain Module

The blockchain functionality is now in a separate module located at `../blockchain/`:

- **Evidence Hashing**: SHA-256 hashing with blockchain recording
- **Custody Timeline**: Complete chain of custody visualization
- **Anomaly Detection**: AI-powered detection of suspicious custody patterns
- **Integrity Verification**: Real-time evidence integrity checking
- **Hyperledger Ready**: Architecture prepared for Hyperledger Fabric integration

### Quick Start with Blockchain Features

1. **Install Blockchain Module**:
```bash
cd ../blockchain
npm install
```

2. **Hash Evidence**:
```bash
curl -X POST http://localhost:3001/api/blockchain/hash-evidence-file \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"evidenceId": "EVD-001", "filePath": "/path/to/evidence.pdf"}'
```

3. **Verify Evidence**:
```bash
curl -X POST http://localhost:3001/api/blockchain/verify-evidence \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"evidenceId": "EVD-001"}'
```

4. **Detect Anomalies**:
```bash
curl -X POST http://localhost:3001/api/blockchain/evidence/EVD-001/anomalies \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"options": {"minTransferInterval": 60000}}'
```

### Frontend Components

The system includes React components for blockchain functionality:

- `BlockchainDashboard`: Main dashboard for blockchain monitoring
- `CustodyTimeline`: Interactive custody chain visualization
- `AlertsPanel`: Anomaly detection and management
- `VerifyEvidence`: Evidence integrity verification

### Documentation

For detailed blockchain integration documentation, see:
- `../blockchain/README.md` - Blockchain module documentation
- `../blockchain/BLOCKCHAIN_INTEGRATION.md` - Comprehensive technical documentation
- Inline code comments in blockchain service modules

## License

MIT License - See LICENSE file for details


# National Digital Evidence Portal (NDEP) - JusticeLedger AI

A comprehensive digital evidence management system with blockchain-backed custody tracking and AI-powered anomaly detection for law enforcement and judicial processes.

## 🏗️ Project Structure

```
Protype1/
├── ReactWebApp/           # Frontend React Application
│   ├── src/
│   │   ├── components/    # React components
│   │   │   ├── blockchain/ # Blockchain-specific components
│   │   │   ├── dashboards/ # Role-based dashboards
│   │   │   └── ui/        # UI components
│   │   ├── pages/         # Application pages
│   │   └── hooks/         # Custom React hooks
│   ├── package.json
│   └── vite.config.ts
├── backend/               # Backend API Server
│   ├── routes/           # API route handlers
│   ├── middleware/       # Express middleware
│   ├── database/         # Database initialization
│   ├── services/         # Core business logic
│   ├── server.js         # Main server file
│   └── package.json
├── blockchain/           # Blockchain Service Module
│   ├── services/         # Blockchain & anomaly detection
│   ├── routes/          # Blockchain API routes
│   ├── database/        # Blockchain-specific database
│   ├── middleware/      # Blockchain middleware
│   ├── package.json     # Blockchain module dependencies
│   └── README.md        # Blockchain module documentation
└── README.md            # This file
```

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- npm or pnpm
- SQLite (included)

### Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd Protype1
```

2. **Install Frontend Dependencies**
```bash
cd ReactWebApp
npm install
```

3. **Install Backend Dependencies**
```bash
cd ../backend
npm install
```

4. **Install Blockchain Module Dependencies**
```bash
cd ../blockchain
npm install
```

### Running the Application

1. **Start the Backend Server**
```bash
cd backend
npm run dev
```
Backend will be available at `http://localhost:3001`

2. **Start the Frontend Application**
```bash
cd ReactWebApp
npm run dev
```
Frontend will be available at `http://localhost:5173`

3. **Test Blockchain Module** (Optional)
```bash
cd blockchain
npm test
```

## 🔧 Configuration

### Environment Variables

Create `.env` files in the respective directories:

**Backend (.env)**
```bash
NODE_ENV=development
PORT=3001
JWT_SECRET=your-secret-key
DATABASE_PATH=./database/ndep.db
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

**Blockchain Module (.env)**
```bash
BLOCKCHAIN_NETWORK_ID=ndep-mainnet-2024
BLOCKCHAIN_DATA_PATH=./blockchain-data
MIN_TRANSFER_INTERVAL=60000
MAX_GAP_HOURS=24
ENABLE_ML_DETECTION=false
```

## 🎯 Key Features

### Core System
- **Multi-Role Authentication**: Field officers, forensic analysts, prosecutors, judges
- **Case Management**: Complete case lifecycle management
- **Evidence Management**: Secure file upload and metadata tracking
- **DigiLocker Integration**: Government identity verification

### Blockchain Integration
- **Evidence Hashing**: SHA-256 hashing with blockchain recording
- **Custody Timeline**: Complete chain of custody visualization
- **Integrity Verification**: Real-time evidence integrity checking
- **Hyperledger Ready**: Architecture prepared for Hyperledger Fabric

### AI-Powered Anomaly Detection
- **Rule-Based Detection**: 6 different anomaly types
- **Risk Scoring**: 0-100 risk assessment
- **Real-time Alerts**: Automated anomaly detection
- **ML-Ready Architecture**: Future ML integration support

### Security Features
- **JWT Authentication**: Secure token-based authentication
- **Role-Based Access Control**: Granular permission system
- **Rate Limiting**: API protection against abuse
- **Audit Logging**: Complete system audit trail

## 📚 Documentation

### Module Documentation
- **Backend**: `backend/README.md` - API documentation and setup
- **Blockchain**: `blockchain/README.md` - Blockchain service documentation
- **Frontend**: `ReactWebApp/README.md` - React application documentation

### Technical Documentation
- **Blockchain Integration**: `blockchain/BLOCKCHAIN_INTEGRATION.md` - Comprehensive technical guide
- **API Reference**: Available at `/api/docs` when running backend
- **Database Schema**: Documented in backend README

## 🔌 API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `GET /api/auth/verify` - Verify JWT token

### Cases
- `POST /api/cases` - Create new case
- `GET /api/cases` - Get all cases
- `GET /api/cases/:id` - Get case by ID

### Evidence
- `POST /api/evidence/upload` - Upload evidence file
- `GET /api/evidence/case/:caseId` - Get evidence by case
- `GET /api/evidence/:id` - Get evidence by ID

### Blockchain
- `POST /api/blockchain/hash-evidence-file` - Hash and record evidence
- `POST /api/blockchain/verify-evidence` - Verify evidence integrity
- `GET /api/blockchain/evidence/:id/custody` - Get custody timeline
- `POST /api/blockchain/evidence/:id/anomalies` - Detect anomalies

## 🧪 Testing

### Backend Tests
```bash
cd backend
npm test
```

### Blockchain Module Tests
```bash
cd blockchain
npm test
```

### Frontend Tests
```bash
cd ReactWebApp
npm test
```

## 🚀 Deployment

### Production Setup

1. **Environment Configuration**
```bash
NODE_ENV=production
JWT_SECRET=secure-production-secret
DATABASE_PATH=/var/lib/ndep/ndep.db
```

2. **Database Setup**
```bash
cd backend
npm run db:migrate
```

3. **Build Frontend**
```bash
cd ReactWebApp
npm run build
```

4. **Start Production Server**
```bash
cd backend
npm start
```

### Docker Deployment (Optional)

```bash
# Build and run with Docker Compose
docker-compose up -d
```

## 🔧 Development

### Adding New Features

1. **Backend Features**: Add to `backend/routes/` and `backend/services/`
2. **Blockchain Features**: Add to `blockchain/services/` and `blockchain/routes/`
3. **Frontend Features**: Add to `ReactWebApp/src/components/` and `ReactWebApp/src/pages/`

### Code Style

- **Backend**: ESLint + Prettier
- **Frontend**: ESLint + Prettier + TypeScript
- **Blockchain**: ESLint + Prettier

### Git Workflow

```bash
# Create feature branch
git checkout -b feature/new-feature

# Make changes and commit
git add .
git commit -m "feat: add new feature"

# Push and create PR
git push origin feature/new-feature
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📄 License

MIT License - See LICENSE file for details

## 🆘 Support

For technical support or questions:

- **Documentation**: Check module-specific README files
- **Issues**: Create GitHub issues for bugs or feature requests
- **Discussions**: Use GitHub Discussions for questions

## 🔮 Roadmap

### Phase 1 (Current)
- ✅ Core evidence management
- ✅ Blockchain simulation
- ✅ Basic anomaly detection
- ✅ Multi-role authentication

### Phase 2 (Next)
- 🔄 Hyperledger Fabric integration
- 🔄 Advanced ML anomaly detection
- 🔄 Mobile application
- 🔄 Real-time notifications

### Phase 3 (Future)
- 📋 Cross-chain interoperability
- 📋 Advanced analytics dashboard
- 📋 Third-party integrations
- 📋 International compliance

---

**National Digital Evidence Portal** - Empowering justice through technology

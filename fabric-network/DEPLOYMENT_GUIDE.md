# 🚀 Complete NDEP Blockchain Deployment Guide

## 📋 Prerequisites Checklist

### System Requirements
- [ ] **Docker Desktop** installed and running
- [ ] **Docker Compose** (v2.0+) available
- [ ] **Node.js** (v16+) installed
- [ ] **Git** for Windows installed
- [ ] **PowerShell** (Administrator access)
- [ ] **8GB+ RAM** available for Docker containers
- [ ] **20GB+ free disk space**

### Network Requirements
- [ ] **Ports 7050-10051** available (Fabric network)
- [ ] **Port 3001** available (NDEP backend)
- [ ] **Port 5173** available (React frontend)
- [ ] **Internet connection** for downloading Fabric binaries

---

## 🛠️ Step-by-Step Deployment

### Phase 1: Environment Setup

#### 1.1 Install Prerequisites
```powershell
# Run as Administrator
# Install Docker Desktop from: https://docs.docker.com/desktop/windows/install/
# Install Node.js from: https://nodejs.org/
# Install Git from: https://git-scm.com/download/win

# Verify installations
docker --version
docker-compose --version
node --version
git --version
```

#### 1.2 Download Hyperledger Fabric
```powershell
# Navigate to fabric-network directory
cd fabric-network

# Download Fabric binaries (requires Git Bash or WSL)
curl -sSL https://raw.githubusercontent.com/hyperledger/fabric/main/scripts/bootstrap.sh | bash -s -- 2.5.0 1.5.0

# Alternative: Manual download
# Visit: https://github.com/hyperledger/fabric/releases
# Download fabric-samples-2.5.0.tar.gz
# Extract to fabric-network directory
```

### Phase 2: Network Configuration

#### 2.1 Generate Certificates
```powershell
# Run certificate generation script
bash scripts/generate-certs.sh

# Verify certificates were created
ls crypto-config/
```

#### 2.2 Create Genesis Block
```powershell
# Create genesis block and channel artifacts
bash scripts/create-genesis.sh

# Verify artifacts were created
ls channel-artifacts/
```

#### 2.3 Start Fabric Network
```powershell
# Start the network
docker-compose up -d

# Check if containers are running
docker-compose ps

# View logs if needed
docker-compose logs -f
```

### Phase 3: Chaincode Deployment

#### 3.1 Deploy Evidence Management Chaincode
```powershell
# Deploy chaincode to all organizations
bash scripts/deploy-chaincode.sh

# Verify deployment
peer lifecycle chaincode querycommitted --channelID evidence-channel --name evidence-management
```

### Phase 4: Backend Integration

#### 4.1 Install Backend Dependencies
```powershell
# Navigate to backend directory
cd ../backend

# Install Fabric SDK
npm install fabric-network fabric-ca-client

# Install additional dependencies if needed
npm install
```

#### 4.2 Update Backend Configuration
```powershell
# Copy integration files to backend
cp ../fabric-network/BACKEND_INTEGRATION.js services/
cp ../fabric-network/BLOCKCHAIN_ROUTES.js routes/

# Update server.js to use new blockchain routes
# Replace the existing blockchain routes import with:
# import blockchainRoutes from './routes/BLOCKCHAIN_ROUTES.js';
```

#### 4.3 Create Connection Profile
```powershell
# Create connection profile in backend directory
# Copy the connection-profile.json from fabric-network to backend root
cp ../fabric-network/connection-profile.json .
```

#### 4.4 Start Backend Server
```powershell
# Start the backend server
npm run dev

# Verify backend is running
curl http://localhost:3001/health
```

### Phase 5: Frontend Integration

#### 5.1 Update Frontend Components
```powershell
# Navigate to ReactWebApp directory
cd ../ReactWebApp

# Copy blockchain components
cp ../fabric-network/FRONTEND_COMPONENTS.tsx src/components/blockchain/

# Update App.tsx to include blockchain routes
# Add import for BlockchainTabs component
```

#### 5.2 Start Frontend Application
```powershell
# Install dependencies
npm install

# Start development server
npm run dev

# Verify frontend is running
# Open http://localhost:5173 in browser
```

---

## 🧪 End-to-End Testing

### Test 1: Network Health Check
```bash
# Check network status
curl http://localhost:3001/api/blockchain/status

# Expected response:
{
  "success": true,
  "data": {
    "fabric": {
      "status": "connected",
      "message": "Network is operational"
    },
    "initialized": true,
    "timestamp": "2025-09-24T..."
  }
}
```

### Test 2: Evidence Creation
```bash
# Create evidence on blockchain
curl -X POST http://localhost:3001/api/blockchain/evidence \
  -H "Authorization: Bearer <your-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "evidenceId": "EVD-001",
    "caseId": "CASE-001",
    "fileName": "test_evidence.pdf",
    "fileHash": "sha256:abcd1234efgh5678",
    "fileSize": 1024000,
    "mimeType": "application/pdf",
    "description": "Test evidence file",
    "location": "Crime Scene A",
    "collectedBy": "Officer John Doe"
  }'

# Expected response:
{
  "success": true,
  "data": {
    "evidenceId": "EVD-001",
    "status": "ACTIVE",
    "custodyChain": [...]
  },
  "message": "Evidence created on blockchain successfully"
}
```

### Test 3: Custody Transfer
```bash
# Transfer custody
curl -X POST http://localhost:3001/api/blockchain/evidence/EVD-001/transfer \
  -H "Authorization: Bearer <your-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "toUser": "forensic.analyst1",
    "reason": "Forensic analysis required"
  }'

# Expected response:
{
  "success": true,
  "data": {
    "from": "PoliceMSP.admin",
    "to": "forensic.analyst1",
    "transferredAt": "2025-09-24T...",
    "reason": "Forensic analysis required"
  },
  "message": "Custody transferred successfully"
}
```

### Test 4: Integrity Verification
```bash
# Verify evidence integrity
curl -X POST http://localhost:3001/api/blockchain/evidence/EVD-001/verify \
  -H "Authorization: Bearer <your-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "providedHash": "sha256:abcd1234efgh5678"
  }'

# Expected response:
{
  "success": true,
  "data": {
    "evidenceId": "EVD-001",
    "providedHash": "sha256:abcd1234efgh5678",
    "storedHash": "sha256:abcd1234efgh5678",
    "isIntegrityValid": true,
    "verifiedAt": "2025-09-24T..."
  },
  "message": "Integrity verification PASSED"
}
```

### Test 5: Frontend Integration
1. **Open Browser**: Navigate to `http://localhost:5173`
2. **Login**: Use admin credentials
3. **Navigate to Blockchain**: Click on Blockchain tab
4. **Check Dashboard**: Verify network status shows "connected"
5. **Upload Evidence**: Use the upload form to create new evidence
6. **Verify Operations**: Test custody transfer and integrity verification

---

## 🔒 Security Validation

### Access Control Testing
```bash
# Test without authentication (should fail)
curl http://localhost:3001/api/blockchain/evidence

# Test with invalid token (should fail)
curl -H "Authorization: Bearer invalid-token" http://localhost:3001/api/blockchain/evidence

# Test with valid token (should succeed)
curl -H "Authorization: Bearer <valid-token>" http://localhost:3001/api/blockchain/evidence
```

### Role-Based Access Testing
```bash
# Test evidence creation (requires evidence:create permission)
curl -X POST http://localhost:3001/api/blockchain/evidence \
  -H "Authorization: Bearer <police-officer-token>" \
  -H "Content-Type: application/json" \
  -d '{"evidenceId": "EVD-002", ...}'

# Test custody transfer (requires evidence:transfer permission)
curl -X POST http://localhost:3001/api/blockchain/evidence/EVD-002/transfer \
  -H "Authorization: Bearer <forensic-analyst-token>" \
  -H "Content-Type: application/json" \
  -d '{"toUser": "court.clerk1", "reason": "Court submission"}'
```

### Data Integrity Testing
```bash
# Test with tampered hash (should fail verification)
curl -X POST http://localhost:3001/api/blockchain/evidence/EVD-001/verify \
  -H "Authorization: Bearer <valid-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "providedHash": "sha256:tampered_hash"
  }'

# Expected response:
{
  "success": true,
  "data": {
    "isIntegrityValid": false,
    ...
  },
  "message": "Integrity verification FAILED"
}
```

---

## 🚨 Troubleshooting

### Common Issues and Solutions

#### Issue 1: Docker Containers Not Starting
```bash
# Check Docker status
docker info

# Restart Docker Desktop
# Check available resources
docker system df

# Clean up if needed
docker system prune -a
```

#### Issue 2: Certificate Generation Fails
```bash
# Check if cryptogen is available
which cryptogen

# If not found, ensure Fabric binaries are in PATH
export PATH=$PWD/fabric-samples/bin:$PATH

# Regenerate certificates
rm -rf crypto-config
bash scripts/generate-certs.sh
```

#### Issue 3: Chaincode Deployment Fails
```bash
# Check network status
docker-compose ps

# Check chaincode logs
docker-compose logs peer0.police.ndep.com

# Redeploy chaincode
bash scripts/deploy-chaincode.sh
```

#### Issue 4: Backend Connection Fails
```bash
# Check if wallet exists
ls backend/wallet/

# If not, create admin identity
# (This requires Fabric CA setup)

# Check connection profile
cat backend/connection-profile.json
```

#### Issue 5: Frontend API Calls Fail
```bash
# Check backend is running
curl http://localhost:3001/health

# Check CORS settings in backend
# Verify API endpoints are accessible
curl http://localhost:3001/api/blockchain/status
```

---

## 📊 Performance Monitoring

### Network Health Monitoring
```bash
# Check container resource usage
docker stats

# Check network logs
docker-compose logs --tail=100

# Monitor blockchain transactions
peer chaincode query -C evidence-channel -n evidence-management -c '{"function":"GetAllEvidence","Args":[]}'
```

### Backend Performance
```bash
# Check backend logs
tail -f backend/logs/app.log

# Monitor API response times
curl -w "@curl-format.txt" -o /dev/null -s http://localhost:3001/api/blockchain/status
```

---

## 🎯 Production Readiness Checklist

### Infrastructure
- [ ] **Docker containers** running stably
- [ ] **Network connectivity** between all components
- [ ] **Certificate management** properly configured
- [ ] **Backup strategy** for blockchain data
- [ ] **Monitoring and alerting** set up

### Security
- [ ] **TLS encryption** enabled for all communications
- [ ] **Access control** properly configured
- [ ] **Audit logging** enabled and monitored
- [ ] **Data encryption** at rest and in transit
- [ ] **Regular security updates** scheduled

### Performance
- [ ] **Load testing** completed
- [ ] **Response times** within acceptable limits
- [ ] **Resource utilization** optimized
- [ ] **Scalability** tested and validated
- [ ] **Disaster recovery** procedures documented

### Compliance
- [ ] **Data retention** policies implemented
- [ ] **Chain of custody** procedures validated
- [ ] **Evidence integrity** verification working
- [ ] **Audit trail** complete and accessible
- [ ] **Regulatory compliance** requirements met

---

## 🎉 Success Criteria

Your NDEP system is **fully blockchain-powered and production-ready** when:

✅ **Fabric Network**: All containers running, chaincode deployed  
✅ **Backend Integration**: API endpoints responding with blockchain data  
✅ **Frontend Integration**: UI components displaying real blockchain data  
✅ **End-to-End Workflows**: Evidence creation, custody transfer, integrity verification working  
✅ **Security Validation**: Access control, authentication, data integrity verified  
✅ **Performance**: Response times acceptable, system stable under load  
✅ **Monitoring**: Health checks, logging, and alerting operational  

**Congratulations! Your NDEP is now a fully blockchain-powered digital evidence management system! 🚀**

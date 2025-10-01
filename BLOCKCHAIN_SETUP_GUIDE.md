# 🚀 NDEP Blockchain Setup Guide

## 📋 Prerequisites Installation

### 1. Install Docker Desktop
1. **Download Docker Desktop**: https://docs.docker.com/desktop/windows/install/
2. **Install and Start**: Make sure Docker Desktop is running
3. **Verify Installation**:
   ```powershell
   docker --version
   docker-compose --version
   ```

### 2. Install Node.js (if not already installed)
- **Download**: https://nodejs.org/
- **Verify**: `node --version` (should be v16+)

### 3. Install Git (if not already installed)
- **Download**: https://git-scm.com/download/win
- **Verify**: `git --version`

---

## 🛠️ Blockchain Setup Options

### **Option A: Full Hyperledger Fabric (Production-Ready)**

#### Step 1: Navigate to Fabric Network
```powershell
cd fabric-network
```

#### Step 2: Run Setup Script
```powershell
# Run the Windows setup script
.\setup-windows.ps1
```

#### Step 3: Start Fabric Network
```powershell
# Start the Fabric network
docker-compose up -d
```

#### Step 4: Deploy Chaincode
```powershell
# Deploy evidence management chaincode
.\scripts\deploy-chaincode.sh
```

#### Step 5: Test the Network
```powershell
# Run test suite
node TEST_SUITE.js
```

---

### **Option B: Simulated Blockchain (Quick Start)**

If you want to test the blockchain functionality without Docker:

#### Step 1: Use Simulated Blockchain Service
```powershell
cd blockchain
npm install
npm start
```

#### Step 2: Test Simulated Blockchain
```powershell
node services/blockchain.js
```

---

### **Option C: IPFS-Only Setup (File Storage)**

For just the decentralized file storage:

#### Step 1: Configure Pinata
```powershell
cd fabric-network
node SIMPLE_IPFS_TEST.js
```

#### Step 2: Test IPFS Integration
```powershell
node IPFS_TEST_SUITE.js
```

---

## 🔧 Integration with Backend

### Step 1: Enable Blockchain Routes
In `backend/server.js`, uncomment:
```javascript
// Uncomment these lines:
app.use('/api/blockchain', blockchainRoutes);
```

### Step 2: Start Backend with Blockchain
```powershell
cd backend
npm start
```

### Step 3: Test Integration
```powershell
node END_TO_END_TEST.cjs
```

---

## 🧪 Testing the Blockchain

### Test Evidence Upload with Blockchain
1. **Start Backend**: `cd backend && npm start`
2. **Start Frontend**: `cd ReactWebApp && npm run dev`
3. **Login**: Use admin credentials
4. **Upload Evidence**: Test evidence upload with blockchain verification

### Test Custody Chain
1. **Create Case**: Register a new case
2. **Upload Evidence**: Add evidence to the case
3. **Transfer Custody**: Test custody transfers
4. **Verify Chain**: Check custody timeline

---

## 🚨 Troubleshooting

### Docker Issues
- **Docker not starting**: Restart Docker Desktop
- **Port conflicts**: Check if ports 7050-10051 are free
- **Memory issues**: Allocate more RAM to Docker

### Network Issues
- **Connection refused**: Check if Fabric network is running
- **Certificate errors**: Regenerate certificates
- **Chaincode errors**: Redeploy chaincode

### Backend Issues
- **Blockchain routes not working**: Check if blockchain module is enabled
- **IPFS errors**: Verify Pinata API keys
- **Database errors**: Check database connection

---

## 📊 What Each Component Does

### Hyperledger Fabric
- **Immutable Ledger**: Stores evidence metadata and custody chain
- **Smart Contracts**: Evidence management chaincode
- **Consensus**: Multi-organization agreement on transactions
- **Security**: Certificate-based authentication

### IPFS (Pinata)
- **Decentralized Storage**: Stores actual evidence files
- **Content Addressing**: Files identified by hash
- **Redundancy**: Multiple copies across network
- **Accessibility**: Files accessible from anywhere

### Backend Integration
- **API Endpoints**: RESTful API for blockchain operations
- **File Management**: Upload to IPFS, metadata to blockchain
- **Custody Tracking**: Record all custody transfers
- **Verification**: Hash verification and integrity checks

---

## 🎯 Quick Start Commands

```powershell
# Option 1: Full Setup (requires Docker)
cd fabric-network
.\setup-windows.ps1
docker-compose up -d
.\scripts\deploy-chaincode.sh

# Option 2: Simulated Blockchain (no Docker needed)
cd blockchain
npm install
npm start

# Option 3: Test IPFS only
cd fabric-network
node SIMPLE_IPFS_TEST.js

# Start Backend with Blockchain
cd backend
npm start

# Test Everything
node END_TO_END_TEST.cjs
```

---

## 📞 Need Help?

1. **Check Logs**: Look at console output for errors
2. **Verify Prerequisites**: Make sure Docker, Node.js, Git are installed
3. **Check Ports**: Ensure required ports are available
4. **Review Configuration**: Check config files for correct settings

**Choose the option that best fits your needs and follow the steps!** 🚀

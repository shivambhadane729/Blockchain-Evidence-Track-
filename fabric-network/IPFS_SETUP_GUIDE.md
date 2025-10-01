# IPFS Integration Setup Guide for NDEP

This guide will help you set up IPFS storage integration with your NDEP blockchain system using Web3.Storage.

## 🚀 **Quick Start**

### 1. **Get Web3.Storage API Token**

1. Visit [Web3.Storage](https://web3.storage/)
2. Sign up for a free account
3. Go to your dashboard and create a new API token
4. Copy the token (starts with `eyJ...`)

### 2. **Install Dependencies**

```bash
# Navigate to your project root
cd /path/to/your/ndep/project

# Install IPFS dependencies
npm install web3.storage

# Or if using yarn
yarn add web3.storage
```

### 3. **Environment Configuration**

Create or update your `.env` file:

```env
# Web3.Storage Configuration
WEB3_STORAGE_TOKEN=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
WEB3_STORAGE_ENDPOINT=https://api.web3.storage

# Fabric Network Configuration
FABRIC_NETWORK_CONFIG_PATH=./fabric-network/connection-profile.json
FABRIC_WALLET_PATH=./wallet
FABRIC_USER_IDENTITY=admin

# Backend Configuration
PORT=3001
NODE_ENV=development
```

### 4. **Update Backend Package.json**

Add IPFS dependencies to your backend:

```json
{
  "dependencies": {
    "web3.storage": "^4.0.0",
    "fabric-network": "^2.2.0",
    "fabric-ca-client": "^2.2.0"
  }
}
```

## 🔧 **Integration Steps**

### Step 1: Update Backend Server

Update your main backend server file to include IPFS routes:

```javascript
// backend/server.js
import ipfsRoutes from '../fabric-network/BACKEND_IPFS_ROUTES.js';

// Add IPFS routes
app.use('/api/blockchain', authenticateToken, ipfsRoutes);
```

### Step 2: Initialize IPFS Service

Create an initialization script:

```javascript
// backend/scripts/init-ipfs.js
import fabricIPFSService from '../fabric-network/BACKEND_IPFS_INTEGRATION.js';

async function initializeServices() {
    console.log('🔗 Initializing Fabric + IPFS services...');
    
    const success = await fabricIPFSService.initialize();
    if (success) {
        console.log('✅ Services initialized successfully');
    } else {
        console.error('❌ Service initialization failed');
        process.exit(1);
    }
}

initializeServices();
```

### Step 3: Update Frontend

Add IPFS components to your React app:

```tsx
// ReactWebApp/src/App.tsx
import { IPFSDashboard } from '../fabric-network/FRONTEND_IPFS_COMPONENTS';

// Add IPFS route
<Route path="/ipfs-dashboard" element={<IPFSDashboard />} />
```

## 📁 **File Structure**

After integration, your project structure should look like:

```
NDEP/
├── backend/
│   ├── server.js
│   ├── routes/
│   └── middleware/
├── fabric-network/
│   ├── IPFS_INTEGRATION.js
│   ├── BACKEND_IPFS_INTEGRATION.js
│   ├── BACKEND_IPFS_ROUTES.js
│   ├── FRONTEND_IPFS_COMPONENTS.tsx
│   ├── chaincode/
│   │   └── evidence-management/
│   │       └── index.js (updated with IPFS methods)
│   └── connection-profile.json
├── ReactWebApp/
│   └── src/
│       └── components/
└── .env
```

## 🧪 **Testing the Integration**

### 1. **Test IPFS Connection**

```javascript
// Test script
import ipfsService from './fabric-network/IPFS_INTEGRATION.js';

async function testIPFS() {
    await ipfsService.initialize();
    const status = await ipfsService.getStatus();
    console.log('IPFS Status:', status);
}

testIPFS();
```

### 2. **Test File Upload**

```bash
# Test file upload via API
curl -X POST http://localhost:3001/api/blockchain/evidence/upload \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "evidenceFile=@test-document.pdf" \
  -F "evidenceId=EVD-001" \
  -F "caseId=CASE-001" \
  -F "description=Test evidence" \
  -F "location=Test location" \
  -F "collectedBy=Test Officer"
```

### 3. **Test File Retrieval**

```bash
# Test file retrieval
curl -X GET http://localhost:3001/api/blockchain/evidence/EVD-001 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## 🔒 **Security Considerations**

### 1. **API Token Security**
- Store Web3.Storage token in environment variables
- Never commit tokens to version control
- Rotate tokens regularly

### 2. **File Access Control**
- Implement proper authentication for file access
- Use signed URLs for temporary access
- Log all file access attempts

### 3. **Data Privacy**
- Consider encryption for sensitive evidence
- Implement data retention policies
- Ensure GDPR compliance if applicable

## 📊 **Monitoring and Maintenance**

### 1. **Service Health Checks**

```javascript
// Health check endpoint
app.get('/api/health', async (req, res) => {
    const fabricStatus = await fabricIPFSService.getServiceStatus();
    res.json({
        status: 'healthy',
        services: fabricStatus,
        timestamp: new Date().toISOString()
    });
});
```

### 2. **Storage Monitoring**

- Monitor Web3.Storage usage quotas
- Set up alerts for storage limits
- Track file access patterns

### 3. **Backup Strategy**

- IPFS provides redundancy through its distributed nature
- Consider additional backup for critical evidence
- Implement disaster recovery procedures

## 🚨 **Troubleshooting**

### Common Issues:

#### 1. **"Web3.Storage token not provided"**
```bash
# Solution: Set environment variable
export WEB3_STORAGE_TOKEN=your_token_here
```

#### 2. **"IPFS upload failed"**
```bash
# Check network connectivity
ping api.web3.storage

# Verify token validity
curl -H "Authorization: Bearer YOUR_TOKEN" https://api.web3.storage/status
```

#### 3. **"Fabric service not initialized"**
```bash
# Ensure Fabric network is running
docker-compose -f fabric-network/docker-compose.yml up -d

# Check connection profile
cat fabric-network/connection-profile.json
```

## 📈 **Performance Optimization**

### 1. **File Size Limits**
- Set appropriate file size limits (default: 50MB)
- Implement chunked uploads for large files
- Use compression for text files

### 2. **Caching Strategy**
- Cache frequently accessed files
- Implement CDN for global access
- Use browser caching for static assets

### 3. **Concurrent Uploads**
- Implement queue system for multiple uploads
- Use worker threads for file processing
- Batch operations when possible

## 🔄 **Migration from Local Storage**

If you're migrating from local file storage:

### 1. **Data Migration Script**

```javascript
// migration-script.js
import fs from 'fs';
import path from 'path';
import ipfsService from './fabric-network/IPFS_INTEGRATION.js';

async function migrateFiles() {
    const uploadsDir = './uploads/evidence';
    const files = fs.readdirSync(uploadsDir);
    
    for (const file of files) {
        const filePath = path.join(uploadsDir, file);
        const fileBuffer = fs.readFileSync(filePath);
        
        // Upload to IPFS
        const result = await ipfsService.uploadFile(fileBuffer, file, `MIGRATED-${file}`);
        
        // Update database with IPFS hash
        // ... update logic here
        
        console.log(`Migrated ${file} to IPFS: ${result.ipfsHash}`);
    }
}

migrateFiles();
```

### 2. **Gradual Migration**
- Migrate files in batches
- Keep local copies during transition
- Verify integrity after migration

## 📚 **Additional Resources**

- [Web3.Storage Documentation](https://web3.storage/docs/)
- [IPFS Documentation](https://docs.ipfs.io/)
- [Hyperledger Fabric Documentation](https://hyperledger-fabric.readthedocs.io/)
- [NDEP Project Documentation](./README.md)

## 🆘 **Support**

For issues and questions:
1. Check the troubleshooting section above
2. Review the logs for error messages
3. Consult the official documentation
4. Create an issue in the project repository

---

**🎉 Congratulations!** Your NDEP system now has decentralized IPFS storage integrated with blockchain technology for maximum security and reliability!

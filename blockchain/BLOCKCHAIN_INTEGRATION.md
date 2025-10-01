# Blockchain Integration Documentation

## Overview

The National Digital Evidence Portal (NDEP) now includes a comprehensive blockchain-backed custody system with AI-powered anomaly detection. This document provides detailed information about the blockchain integration, API endpoints, and usage instructions.

## Architecture

### Blockchain Service Layer

The blockchain integration consists of two main service modules:

1. **Blockchain Service** (`/services/blockchain.js`)
   - Evidence hashing and recording
   - Custody transfer logging
   - Blockchain integrity verification
   - Local blockchain simulation (Hyperledger Fabric ready)

2. **Anomaly Detection Service** (`/services/anomalyDetection.js`)
   - Rule-based anomaly detection
   - ML-ready architecture for future enhancements
   - Custody chain analysis
   - Risk scoring and alerting

### Database Schema

New tables added for blockchain functionality:

```sql
-- Custody anomalies tracking
CREATE TABLE custody_anomalies (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  evidence_id TEXT NOT NULL,
  anomaly_type TEXT NOT NULL,
  severity TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  details TEXT,
  confidence REAL DEFAULT 0.0,
  detected_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  resolved BOOLEAN DEFAULT FALSE,
  resolved_at DATETIME,
  resolved_by INTEGER,
  resolution TEXT,
  FOREIGN KEY (evidence_id) REFERENCES evidence (evidence_id),
  FOREIGN KEY (resolved_by) REFERENCES users (id)
);
```

## API Endpoints

### Blockchain Operations

#### 1. Hash Evidence File
```http
POST /api/blockchain/hash-evidence-file
Content-Type: application/json
Authorization: Bearer <token>

{
  "evidenceId": "EVD-2024-001",
  "filePath": "/uploads/evidence/document.pdf"
}
```

**Response:**
```json
{
  "message": "Evidence hashed and recorded on blockchain",
  "evidenceId": "EVD-2024-001",
  "fileHash": "a1b2c3d4e5f6...",
  "blockchainResult": {
    "success": true,
    "transactionHash": "tx123...",
    "blockNumber": 42,
    "timestamp": "2024-01-15T10:30:00Z"
  }
}
```

#### 2. Verify Evidence Integrity
```http
POST /api/blockchain/verify-evidence
Content-Type: application/json
Authorization: Bearer <token>

{
  "evidenceId": "EVD-2024-001"
}
```

**Response:**
```json
{
  "evidenceId": "EVD-2024-001",
  "verificationResult": {
    "exists": true,
    "verified": true,
    "transactionHash": "tx123...",
    "blockNumber": 42,
    "recordedAt": "2024-01-15T10:30:00Z",
    "custodyTimeline": [...],
    "message": "Evidence verified successfully"
  },
  "verifiedAt": "2024-01-15T11:00:00Z"
}
```

#### 3. Get Custody Timeline
```http
GET /api/blockchain/evidence/{evidenceId}/custody
Authorization: Bearer <token>
```

**Response:**
```json
{
  "evidenceId": "EVD-2024-001",
  "custodyTimeline": [
    {
      "id": 1,
      "evidenceId": "EVD-2024-001",
      "fromUser": {
        "id": 1,
        "name": "John Doe",
        "role": "field-investigating-officer"
      },
      "toUser": {
        "id": 2,
        "name": "Jane Smith",
        "role": "evidence-custodian"
      },
      "fromLocation": "Crime Scene",
      "toLocation": "Evidence Room A",
      "transferType": "HANDOVER",
      "transferReason": "Initial collection",
      "isVerified": true,
      "transferredAt": "2024-01-15T10:30:00Z",
      "blockNumber": 42,
      "transactionHash": "tx123..."
    }
  ],
  "totalTransfers": 1,
  "retrievedAt": "2024-01-15T11:00:00Z"
}
```

### Anomaly Detection

#### 1. Detect Custody Anomalies
```http
POST /api/blockchain/evidence/{evidenceId}/anomalies
Content-Type: application/json
Authorization: Bearer <token>

{
  "options": {
    "minTransferInterval": 60000,
    "maxGapHours": 24,
    "enableML": false
  }
}
```

**Response:**
```json
{
  "evidenceId": "EVD-2024-001",
  "anomalyResults": {
    "evidenceId": "EVD-2024-001",
    "anomalies": [
      {
        "type": "rapid_transfer",
        "severity": "high",
        "title": "Rapid Custody Transfer Detected",
        "description": "Custody transferred in 30 seconds",
        "details": {
          "timeDifference": 30000,
          "threshold": 60000
        },
        "confidence": 0.95,
        "detectedAt": "2024-01-15T11:00:00Z"
      }
    ],
    "riskScore": 30,
    "status": "anomalies_detected",
    "totalAnomalies": 1,
    "highRiskAnomalies": 1
  },
  "analyzedAt": "2024-01-15T11:00:00Z"
}
```

#### 2. Get Stored Anomalies
```http
GET /api/blockchain/evidence/{evidenceId}/anomalies
Authorization: Bearer <token>
```

**Response:**
```json
{
  "evidenceId": "EVD-2024-001",
  "anomalies": [
    {
      "id": 1,
      "evidenceId": "EVD-2024-001",
      "type": "rapid_transfer",
      "severity": "high",
      "title": "Rapid Custody Transfer Detected",
      "description": "Custody transferred in 30 seconds",
      "confidence": 0.95,
      "detectedAt": "2024-01-15T11:00:00Z",
      "resolved": false
    }
  ],
  "totalAnomalies": 1,
  "unresolvedAnomalies": 1,
  "retrievedAt": "2024-01-15T11:00:00Z"
}
```

### Blockchain Status

#### 1. Get Blockchain Status
```http
GET /api/blockchain/status
Authorization: Bearer <token>
```

**Response:**
```json
{
  "status": "operational",
  "evidenceChain": {
    "chainId": "ndep-evidence-chain",
    "blockCount": 150,
    "lastBlockNumber": 150,
    "integrity": true
  },
  "custodyChain": {
    "chainId": "ndep-custody-chain",
    "blockCount": 75,
    "lastBlockNumber": 75,
    "integrity": true
  },
  "timestamp": "2024-01-15T11:00:00Z"
}
```

#### 2. Get Blockchain Health
```http
GET /api/blockchain/health
Authorization: Bearer <token>
```

**Response:**
```json
{
  "healthScore": 85,
  "verificationRate": 0.95,
  "totalTransactions": 200,
  "verifiedTransactions": 190,
  "uniqueEvidenceCount": 50,
  "avgVerificationCount": 3.8,
  "recentActivity": [
    {
      "transaction_type": "evidence_hash",
      "count": 15
    },
    {
      "transaction_type": "custody_transfer",
      "count": 8
    }
  ],
  "chainValid": true,
  "blockHeight": 150,
  "pendingTransactions": 3
}
```

## Frontend Components

### 1. BlockchainDashboard
Main dashboard component for blockchain monitoring and evidence management.

**Usage:**
```tsx
import BlockchainDashboard from '@/components/blockchain/BlockchainDashboard';

<BlockchainDashboard 
  evidenceId="EVD-2024-001"
  showEvidenceSpecific={true}
/>
```

### 2. CustodyTimeline
Visual timeline component showing complete custody chain for evidence.

**Usage:**
```tsx
import CustodyTimeline from '@/components/blockchain/CustodyTimeline';

<CustodyTimeline 
  evidenceId="EVD-2024-001"
  onRefresh={() => console.log('Refreshed')}
  showActions={true}
/>
```

### 3. AlertsPanel
Component for displaying and managing custody anomalies.

**Usage:**
```tsx
import AlertsPanel from '@/components/blockchain/AlertsPanel';

<AlertsPanel 
  evidenceId="EVD-2024-001"
  onAnomalyResolve={(anomalyId) => console.log('Resolved:', anomalyId)}
  onRefresh={() => console.log('Refreshed')}
/>
```

### 4. VerifyEvidence
Component for verifying evidence integrity against blockchain.

**Usage:**
```tsx
import VerifyEvidence from '@/components/blockchain/VerifyEvidence';

<VerifyEvidence 
  evidenceId="EVD-2024-001"
  evidenceDescription="Crime scene photograph"
  onVerificationComplete={(result) => console.log('Verified:', result)}
  showDetails={true}
/>
```

## Anomaly Detection Rules

### Rule-Based Detection

The system currently implements the following anomaly detection rules:

1. **Rapid Transfers**
   - Detects custody changes occurring too quickly (< 1 minute)
   - Severity: High if < 30 seconds, Medium if < 1 minute

2. **Hash Mismatches**
   - Detects when evidence file hash doesn't match stored hash
   - Severity: High (indicates potential tampering)

3. **Circular Transfers**
   - Detects when evidence returns to a previous custodian
   - Severity: Medium

4. **Excessive Transfers**
   - Flags evidence with > 10 custody transfers
   - Severity: Medium

5. **Time Gaps**
   - Detects unusual gaps between custody transfers
   - Severity: High if > 72 hours, Medium if > 24 hours

6. **Location Mismatches**
   - Detects impossible location transitions
   - Severity: Medium

### ML Integration (Future)

The system is architected to support ML-based anomaly detection:

```javascript
// Placeholder for future ML implementation
async function mlAnomalyDetection(custodyChain, options = {}) {
  // TODO: Implement ML-based anomaly detection
  // This would use time-series analysis, pattern recognition, etc.
  
  return [
    {
      type: 'ml_placeholder',
      severity: 'low',
      title: 'ML Detection Placeholder',
      description: 'ML-based anomaly detection is not yet implemented',
      confidence: 0.0
    }
  ];
}
```

## Hyperledger Fabric Integration

### Current Implementation

The current system uses local JSON files to simulate blockchain operations. This allows for:

- Complete blockchain functionality testing
- Easy development and debugging
- Seamless transition to real blockchain

### Migration to Hyperledger Fabric

To migrate to Hyperledger Fabric, replace the blockchain service functions:

```javascript
// Current implementation (local simulation)
export function recordEvidence(hash, caseId, officerId, timestamp, metadata) {
  // Local JSON file operations
}

// Future Hyperledger Fabric implementation
export function recordEvidence(hash, caseId, officerId, timestamp, metadata) {
  // Hyperledger Fabric SDK calls
  const contract = await getContract();
  await contract.submitTransaction('RecordEvidence', 
    hash, caseId, officerId, timestamp, JSON.stringify(metadata)
  );
}
```

### Required Hyperledger Fabric Setup

1. **Network Configuration**
   - Channel: `ndep-channel`
   - Chaincode: `evidence-chaincode`
   - Organizations: Law Enforcement, Courts, Forensic Labs

2. **Chaincode Functions**
   - `RecordEvidence(hash, caseId, officerId, timestamp, metadata)`
   - `RecordCustodyTransfer(evidenceId, fromUser, toUser, timestamp, data)`
   - `VerifyEvidence(hash)`
   - `GetCustodyTimeline(evidenceId)`

3. **Identity Management**
   - MSP (Membership Service Provider) integration
   - Certificate-based authentication
   - Role-based access control

## Security Considerations

### Blockchain Security

1. **Hash Integrity**
   - SHA-256 hashing for evidence files
   - Blockchain hash verification
   - Tamper detection

2. **Access Control**
   - JWT-based authentication
   - Role-based permissions
   - Audit logging

3. **Data Privacy**
   - Encrypted evidence storage
   - Secure file handling
   - Privacy-preserving blockchain records

### Anomaly Detection Security

1. **False Positive Management**
   - Confidence scoring
   - Manual review process
   - Resolution tracking

2. **Alert Management**
   - Severity-based prioritization
   - Role-based resolution permissions
   - Audit trail for resolutions

## Performance Considerations

### Blockchain Performance

1. **Local Simulation**
   - Fast development and testing
   - No network latency
   - Immediate consistency

2. **Production Blockchain**
   - Network latency considerations
   - Consensus mechanism overhead
   - Scalability planning

### Anomaly Detection Performance

1. **Rule-Based Detection**
   - O(n) complexity for custody chain analysis
   - Real-time detection capabilities
   - Minimal computational overhead

2. **ML-Based Detection**
   - Batch processing for complex analysis
   - Model training and inference
   - Resource requirements planning

## Monitoring and Maintenance

### Blockchain Monitoring

1. **Health Metrics**
   - Chain integrity status
   - Transaction throughput
   - Verification rates

2. **Alerting**
   - Blockchain connectivity issues
   - Integrity violations
   - Performance degradation

### Anomaly Detection Monitoring

1. **Detection Metrics**
   - Anomaly detection rates
   - False positive rates
   - Resolution times

2. **System Health**
   - Detection algorithm performance
   - Database query performance
   - API response times

## Troubleshooting

### Common Issues

1. **Blockchain Connection Issues**
   - Check network connectivity
   - Verify authentication tokens
   - Review blockchain status endpoint

2. **Anomaly Detection Issues**
   - Verify custody chain data
   - Check detection rule parameters
   - Review anomaly storage

3. **Performance Issues**
   - Monitor database performance
   - Check API response times
   - Review blockchain operation logs

### Debug Mode

Enable debug logging by setting environment variables:

```bash
DEBUG=blockchain:*
DEBUG=anomaly:*
NODE_ENV=development
```

## Future Enhancements

### Planned Features

1. **Advanced ML Detection**
   - Time-series anomaly detection
   - Pattern recognition algorithms
   - Predictive analytics

2. **Enhanced Blockchain Features**
   - Smart contracts for automated compliance
   - Cross-chain interoperability
   - Privacy-preserving techniques

3. **Integration Enhancements**
   - Real-time notifications
   - Mobile app integration
   - Third-party system integration

### API Versioning

The blockchain API follows semantic versioning:

- Current version: v1.0.0
- Breaking changes will increment major version
- New features will increment minor version
- Bug fixes will increment patch version

## Support and Contact

For technical support or questions about the blockchain integration:

- Documentation: This file and inline code comments
- API Reference: Available at `/api/docs` (when implemented)
- Issue Tracking: GitHub issues or internal ticketing system

---

*This documentation is maintained as part of the NDEP project. Last updated: January 2024*

# NDEP Blockchain Module

A comprehensive blockchain service module for the National Digital Evidence Portal, providing evidence hashing, custody tracking, and AI-powered anomaly detection.

## Features

- **Evidence Hashing**: SHA-256 hashing with blockchain recording
- **Custody Timeline**: Complete chain of custody tracking
- **Anomaly Detection**: AI-powered detection of suspicious custody patterns
- **Integrity Verification**: Real-time evidence integrity checking
- **Hyperledger Ready**: Architecture prepared for Hyperledger Fabric integration

## Quick Start

### Installation

```bash
cd blockchain
npm install
```

### Usage

```javascript
import { 
  hashEvidence, 
  recordEvidence, 
  verifyEvidence, 
  recordCustodyTransfer,
  detectCustodyAnomalies 
} from './services/blockchain.js';

// Hash evidence file
const fileHash = hashEvidence('/path/to/evidence.pdf');

// Record evidence on blockchain
const result = recordEvidence(
  fileHash,
  'CASE-2024-001',
  officerId,
  new Date().toISOString(),
  { evidenceId: 'EVD-001', description: 'Crime scene photo' }
);

// Verify evidence integrity
const verification = verifyEvidence(fileHash);

// Detect anomalies
const anomalies = await detectCustodyAnomalies('EVD-001');
```

## API Reference

### Blockchain Service

#### `hashEvidence(evidenceFile)`
Generate SHA-256 hash for evidence file.

**Parameters:**
- `evidenceFile` (Buffer|string): File buffer or file path

**Returns:** SHA-256 hash string

#### `recordEvidence(hash, caseId, officerId, timestamp, metadata)`
Record evidence metadata on blockchain.

**Parameters:**
- `hash` (string): Evidence file hash
- `caseId` (string): Case identifier
- `officerId` (number): Officer who collected the evidence
- `timestamp` (string): Collection timestamp
- `metadata` (Object): Additional evidence metadata

**Returns:** Transaction result object

#### `verifyEvidence(hash)`
Verify evidence integrity against blockchain.

**Parameters:**
- `hash` (string): Evidence file hash to verify

**Returns:** Verification result with custody timeline

#### `recordCustodyTransfer(evidenceId, fromUserId, toUserId, timestamp, transferData)`
Record custody transfer on blockchain.

**Parameters:**
- `evidenceId` (string): Evidence identifier
- `fromUserId` (number): User transferring custody
- `toUserId` (number): User receiving custody
- `timestamp` (string): Transfer timestamp
- `transferData` (Object): Additional transfer metadata

**Returns:** Transaction result object

### Anomaly Detection Service

#### `detectCustodyAnomalies(evidenceId, options)`
Detect anomalies in custody chain.

**Parameters:**
- `evidenceId` (string): Evidence identifier to analyze
- `options` (Object): Detection options

**Returns:** Anomaly detection results

#### `getStoredAnomalies(evidenceId)`
Get stored anomalies for evidence.

**Parameters:**
- `evidenceId` (string): Evidence identifier

**Returns:** Array of stored anomalies

## Anomaly Detection Rules

The system implements the following anomaly detection rules:

1. **Rapid Transfers**: Detects custody changes occurring too quickly (< 1 minute)
2. **Hash Mismatches**: Detects when evidence file hash doesn't match stored hash
3. **Circular Transfers**: Detects when evidence returns to a previous custodian
4. **Excessive Transfers**: Flags evidence with > 10 custody transfers
5. **Time Gaps**: Detects unusual gaps between custody transfers
6. **Location Mismatches**: Detects impossible location transitions

## Hyperledger Fabric Integration

The module is designed for easy migration to Hyperledger Fabric:

### Current Implementation
- Local JSON file-based blockchain simulation
- Complete functionality testing
- Easy development and debugging

### Migration Path
Replace blockchain service functions with Hyperledger Fabric SDK calls:

```javascript
// Current (local simulation)
export function recordEvidence(hash, caseId, officerId, timestamp, metadata) {
  // Local JSON file operations
}

// Future (Hyperledger Fabric)
export function recordEvidence(hash, caseId, officerId, timestamp, metadata) {
  const contract = await getContract();
  await contract.submitTransaction('RecordEvidence', 
    hash, caseId, officerId, timestamp, JSON.stringify(metadata)
  );
}
```

## Configuration

### Environment Variables

```bash
# Blockchain Configuration
BLOCKCHAIN_NETWORK_ID=ndep-mainnet-2024
BLOCKCHAIN_DATA_PATH=./blockchain-data

# Anomaly Detection
MIN_TRANSFER_INTERVAL=60000
MAX_GAP_HOURS=24
ENABLE_ML_DETECTION=false
```

## Testing

```bash
npm test
```

## Development

```bash
npm run dev
```

## Documentation

For detailed technical documentation, see:
- `BLOCKCHAIN_INTEGRATION.md` - Comprehensive technical documentation
- Inline code comments in service modules

## License

MIT License - See LICENSE file for details

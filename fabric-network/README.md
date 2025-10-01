# Hyperledger Fabric Network for NDEP

## 🏗️ Network Architecture

### Network Topology
```
NDEP Fabric Network
├── Orderer Organization (OrdererOrg)
│   └── Orderer Node (orderer.ndep.com)
├── Police Organization (PoliceOrg)
│   ├── Peer Node 1 (peer0.police.ndep.com)
│   └── Peer Node 2 (peer1.police.ndep.com)
├── Forensic Organization (ForensicOrg)
│   ├── Peer Node 1 (peer0.forensic.ndep.com)
│   └── Peer Node 2 (peer1.forensic.ndep.com)
└── Court Organization (CourtOrg)
    ├── Peer Node 1 (peer0.court.ndep.com)
    └── Peer Node 2 (peer1.court.ndep.com)
```

### Certificate Authorities
- **Orderer CA**: Issues certificates for orderer organization
- **Police CA**: Issues certificates for police department
- **Forensic CA**: Issues certificates for forensic labs
- **Court CA**: Issues certificates for court system

### Channels
- **evidence-channel**: Main channel for evidence transactions
- **custody-channel**: Dedicated channel for custody transfers
- **audit-channel**: Audit and compliance transactions

## 🚀 Quick Start

### Prerequisites
1. Docker and Docker Compose
2. Hyperledger Fabric binaries
3. Node.js (for chaincode)

### Installation Steps
1. Install prerequisites: `./scripts/install-prerequisites.sh`
2. Generate certificates: `./scripts/generate-certs.sh`
3. Start network: `docker-compose up -d`
4. Deploy chaincode: `./scripts/deploy-chaincode.sh`

### Network Management
- Start network: `docker-compose up -d`
- Stop network: `docker-compose down`
- View logs: `docker-compose logs -f`
- Clean network: `./scripts/clean-network.sh`

## 📋 Chaincode

### Evidence Management Chaincode
- **Functions**: CreateEvidence, UpdateEvidence, TransferCustody, VerifyIntegrity
- **Language**: Node.js
- **Version**: 1.0

### Custody Chaincode
- **Functions**: RecordTransfer, GetCustodyHistory, ValidateTransfer
- **Language**: Node.js
- **Version**: 1.0

## 🔐 Security

### MSP (Membership Service Provider)
- Each organization has its own MSP
- Role-based access control
- Certificate-based authentication

### Policies
- **Channel Policies**: Majority endorsement
- **Chaincode Policies**: Organization-specific access
- **Admin Policies**: Multi-org admin requirements

## 📊 Monitoring

### Network Status
- Orderer status: `docker-compose logs orderer`
- Peer status: `docker-compose logs peer0.police`
- CA status: `docker-compose logs ca.police`

### Health Checks
- Network health: `./scripts/health-check.sh`
- Channel status: `./scripts/channel-status.sh`
- Chaincode status: `./scripts/chaincode-status.sh`

## 🔧 Configuration

### Environment Variables
- `FABRIC_VERSION`: Hyperledger Fabric version
- `CHANNEL_NAME`: Default channel name
- `CHAINCODE_VERSION`: Chaincode version
- `NETWORK_NAME`: Network identifier

### Network Parameters
- **Block Size**: 10 transactions per block
- **Block Timeout**: 2 seconds
- **Max Message Count**: 10
- **Absolute Max Bytes**: 10MB

## 📚 Documentation

- [Network Setup Guide](docs/network-setup.md)
- [Chaincode Development](docs/chaincode-development.md)
- [Security Configuration](docs/security.md)
- [Troubleshooting](docs/troubleshooting.md)

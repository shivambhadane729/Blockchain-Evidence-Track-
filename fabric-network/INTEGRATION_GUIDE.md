# NDEP Hyperledger Fabric Integration Guide

## 🔗 Connecting Fabric Network with NDEP Backend

This guide explains how to integrate the Hyperledger Fabric network with your existing NDEP backend system.

---

## 📋 Prerequisites

- ✅ Hyperledger Fabric network running
- ✅ Evidence Management chaincode deployed
- ✅ NDEP backend server running
- ✅ Node.js SDK for Fabric installed

---

## 🛠️ Installation Steps

### 1. Install Fabric SDK

```bash
cd ../backend
npm install fabric-network fabric-ca-client
```

### 2. Create Fabric Service

Create a new service to handle Fabric operations:

```javascript
// backend/services/fabricService.js
const { Gateway, Wallets } = require('fabric-network');
const fs = require('fs');
const path = require('path');

class FabricService {
    constructor() {
        this.gateway = new Gateway();
        this.wallet = null;
        this.network = null;
        this.contract = null;
    }

    async initialize() {
        // Load connection profile
        const ccpPath = path.resolve(__dirname, '../../fabric-network/connection-profile.json');
        const ccp = JSON.parse(fs.readFileSync(ccpPath, 'utf8'));

        // Create wallet
        const walletPath = path.join(process.cwd(), 'wallet');
        this.wallet = await Wallets.newFileSystemWallet(walletPath);

        // Connect to gateway
        await this.gateway.connect(ccp, {
            wallet: this.wallet,
            identity: 'admin',
            discovery: { enabled: true, asLocalhost: true }
        });

        // Get network and contract
        this.network = await this.gateway.getNetwork('evidence-channel');
        this.contract = this.network.getContract('evidence-management');
    }

    async createEvidence(evidenceData) {
        const result = await this.contract.submitTransaction(
            'CreateEvidence',
            evidenceData.evidenceId,
            evidenceData.caseId,
            evidenceData.fileName,
            evidenceData.fileHash,
            evidenceData.fileSize.toString(),
            evidenceData.mimeType,
            evidenceData.description,
            evidenceData.location,
            evidenceData.collectedBy
        );
        return JSON.parse(result.toString());
    }

    async getEvidence(evidenceId) {
        const result = await this.contract.evaluateTransaction('GetEvidence', evidenceId);
        return JSON.parse(result.toString());
    }

    async transferCustody(evidenceId, toUser, reason, newHash = null) {
        const result = await this.contract.submitTransaction(
            'TransferCustody',
            evidenceId,
            toUser,
            reason,
            newHash
        );
        return JSON.parse(result.toString());
    }

    async verifyIntegrity(evidenceId, providedHash) {
        const result = await this.contract.evaluateTransaction(
            'VerifyIntegrity',
            evidenceId,
            providedHash
        );
        return JSON.parse(result.toString());
    }

    async getCustodyChain(evidenceId) {
        const result = await this.contract.evaluateTransaction('GetCustodyChain', evidenceId);
        return JSON.parse(result.toString());
    }

    async getEvidenceByCase(caseId) {
        const result = await this.contract.evaluateTransaction('GetEvidenceByCase', caseId);
        return JSON.parse(result.toString());
    }

    async updateEvidenceStatus(evidenceId, status, reason) {
        const result = await this.contract.submitTransaction(
            'UpdateEvidenceStatus',
            evidenceId,
            status,
            reason
        );
        return JSON.parse(result.toString());
    }

    async disconnect() {
        await this.gateway.disconnect();
    }
}

module.exports = new FabricService();
```

### 3. Create Connection Profile

```json
// fabric-network/connection-profile.json
{
    "name": "ndep-network",
    "version": "1.0.0",
    "client": {
        "organization": "PoliceMSP",
        "connection": {
            "timeout": {
                "peer": {
                    "endorser": "300"
                }
            }
        }
    },
    "organizations": {
        "PoliceMSP": {
            "mspid": "PoliceMSP",
            "peers": [
                "peer0.police.ndep.com",
                "peer1.police.ndep.com"
            ],
            "certificateAuthorities": [
                "ca.police"
            ]
        },
        "ForensicMSP": {
            "mspid": "ForensicMSP",
            "peers": [
                "peer0.forensic.ndep.com"
            ],
            "certificateAuthorities": [
                "ca.forensic"
            ]
        },
        "CourtMSP": {
            "mspid": "CourtMSP",
            "peers": [
                "peer0.court.ndep.com"
            ],
            "certificateAuthorities": [
                "ca.court"
            ]
        }
    },
    "orderers": {
        "orderer.ndep.com": {
            "url": "grpcs://localhost:7050",
            "grpcOptions": {
                "ssl-target-name-override": "orderer.ndep.com"
            },
            "tlsCACerts": {
                "path": "crypto-config/ordererOrganizations/ndep.com/orderers/orderer.ndep.com/tls/ca.crt"
            }
        }
    },
    "peers": {
        "peer0.police.ndep.com": {
            "url": "grpcs://localhost:7051",
            "eventUrl": "grpcs://localhost:7053",
            "grpcOptions": {
                "ssl-target-name-override": "peer0.police.ndep.com"
            },
            "tlsCACerts": {
                "path": "crypto-config/peerOrganizations/police.ndep.com/peers/peer0.police.ndep.com/tls/ca.crt"
            }
        },
        "peer1.police.ndep.com": {
            "url": "grpcs://localhost:8051",
            "eventUrl": "grpcs://localhost:8053",
            "grpcOptions": {
                "ssl-target-name-override": "peer1.police.ndep.com"
            },
            "tlsCACerts": {
                "path": "crypto-config/peerOrganizations/police.ndep.com/peers/peer1.police.ndep.com/tls/ca.crt"
            }
        },
        "peer0.forensic.ndep.com": {
            "url": "grpcs://localhost:9051",
            "eventUrl": "grpcs://localhost:9053",
            "grpcOptions": {
                "ssl-target-name-override": "peer0.forensic.ndep.com"
            },
            "tlsCACerts": {
                "path": "crypto-config/peerOrganizations/forensic.ndep.com/peers/peer0.forensic.ndep.com/tls/ca.crt"
            }
        },
        "peer0.court.ndep.com": {
            "url": "grpcs://localhost:10051",
            "eventUrl": "grpcs://localhost:10053",
            "grpcOptions": {
                "ssl-target-name-override": "peer0.court.ndep.com"
            },
            "tlsCACerts": {
                "path": "crypto-config/peerOrganizations/court.ndep.com/peers/peer0.court.ndep.com/tls/ca.crt"
            }
        }
    },
    "certificateAuthorities": {
        "ca.police": {
            "url": "https://localhost:7054",
            "caName": "ca-police",
            "tlsCACerts": {
                "path": "crypto-config/peerOrganizations/police.ndep.com/ca/ca.police.ndep.com-cert.pem"
            },
            "httpOptions": {
                "verify": false
            }
        },
        "ca.forensic": {
            "url": "https://localhost:8054",
            "caName": "ca-forensic",
            "tlsCACerts": {
                "path": "crypto-config/peerOrganizations/forensic.ndep.com/ca/ca.forensic.ndep.com-cert.pem"
            },
            "httpOptions": {
                "verify": false
            }
        },
        "ca.court": {
            "url": "https://localhost:9054",
            "caName": "ca-court",
            "tlsCACerts": {
                "path": "crypto-config/peerOrganizations/court.ndep.com/ca/ca.court.ndep.com-cert.pem"
            },
            "httpOptions": {
                "verify": false
            }
        }
    }
}
```

### 4. Update Backend Routes

```javascript
// backend/routes/blockchain.js
const express = require('express');
const fabricService = require('../services/fabricService');
const { authenticateToken, requirePermission } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');

const router = express.Router();

// Initialize Fabric service
router.use(asyncHandler(async (req, res, next) => {
    if (!fabricService.network) {
        await fabricService.initialize();
    }
    next();
}));

// Create evidence on blockchain
router.post('/evidence', authenticateToken, requirePermission('evidence:create'), 
    asyncHandler(async (req, res) => {
        const evidenceData = req.body;
        const result = await fabricService.createEvidence(evidenceData);
        res.json({
            success: true,
            data: result,
            message: 'Evidence created on blockchain'
        });
    })
);

// Get evidence from blockchain
router.get('/evidence/:evidenceId', authenticateToken, requirePermission('evidence:read'),
    asyncHandler(async (req, res) => {
        const { evidenceId } = req.params;
        const result = await fabricService.getEvidence(evidenceId);
        res.json({
            success: true,
            data: result
        });
    })
);

// Transfer custody
router.post('/evidence/:evidenceId/transfer', authenticateToken, requirePermission('evidence:transfer'),
    asyncHandler(async (req, res) => {
        const { evidenceId } = req.params;
        const { toUser, reason, newHash } = req.body;
        const result = await fabricService.transferCustody(evidenceId, toUser, reason, newHash);
        res.json({
            success: true,
            data: result,
            message: 'Custody transferred successfully'
        });
    })
);

// Verify evidence integrity
router.post('/evidence/:evidenceId/verify', authenticateToken, requirePermission('evidence:verify'),
    asyncHandler(async (req, res) => {
        const { evidenceId } = req.params;
        const { providedHash } = req.body;
        const result = await fabricService.verifyIntegrity(evidenceId, providedHash);
        res.json({
            success: true,
            data: result
        });
    })
);

// Get custody chain
router.get('/evidence/:evidenceId/custody', authenticateToken, requirePermission('evidence:read'),
    asyncHandler(async (req, res) => {
        const { evidenceId } = req.params;
        const result = await fabricService.getCustodyChain(evidenceId);
        res.json({
            success: true,
            data: result
        });
    })
);

// Get evidence by case
router.get('/case/:caseId/evidence', authenticateToken, requirePermission('case:read'),
    asyncHandler(async (req, res) => {
        const { caseId } = req.params;
        const result = await fabricService.getEvidenceByCase(caseId);
        res.json({
            success: true,
            data: result
        });
    })
);

module.exports = router;
```

### 5. Update Frontend Components

```typescript
// ReactWebApp/src/components/blockchain/BlockchainDashboard.tsx
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface BlockchainEvidence {
    evidenceId: string;
    caseId: string;
    fileName: string;
    fileHash: string;
    status: string;
    custodyChain: Array<{
        from: string;
        to: string;
        transferredAt: string;
        reason: string;
    }>;
}

export const BlockchainDashboard: React.FC = () => {
    const [evidence, setEvidence] = useState<BlockchainEvidence[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchBlockchainEvidence();
    }, []);

    const fetchBlockchainEvidence = async () => {
        try {
            const response = await fetch('/api/blockchain/evidence', {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            const data = await response.json();
            setEvidence(data.data);
        } catch (error) {
            console.error('Error fetching blockchain evidence:', error);
        } finally {
            setLoading(false);
        }
    };

    const verifyIntegrity = async (evidenceId: string, fileHash: string) => {
        try {
            const response = await fetch(`/api/blockchain/evidence/${evidenceId}/verify`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({ providedHash: fileHash })
            });
            const result = await response.json();
            alert(`Integrity verification: ${result.data.isIntegrityValid ? 'PASSED' : 'FAILED'}`);
        } catch (error) {
            console.error('Error verifying integrity:', error);
        }
    };

    if (loading) {
        return <div>Loading blockchain data...</div>;
    }

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Blockchain Evidence Dashboard</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid gap-4">
                        {evidence.map((item) => (
                            <div key={item.evidenceId} className="border rounded-lg p-4">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h3 className="font-semibold">{item.fileName}</h3>
                                        <p className="text-sm text-gray-600">Case: {item.caseId}</p>
                                        <p className="text-xs text-gray-500">Hash: {item.fileHash}</p>
                                    </div>
                                    <Badge variant={item.status === 'ACTIVE' ? 'default' : 'secondary'}>
                                        {item.status}
                                    </Badge>
                                </div>
                                <div className="mt-4">
                                    <h4 className="text-sm font-medium">Custody Chain:</h4>
                                    <div className="space-y-1 mt-2">
                                        {item.custodyChain.map((transfer, index) => (
                                            <div key={index} className="text-xs text-gray-600">
                                                {transfer.from} → {transfer.to} ({transfer.transferredAt})
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                <div className="mt-4 flex gap-2">
                                    <Button
                                        size="sm"
                                        onClick={() => verifyIntegrity(item.evidenceId, item.fileHash)}
                                    >
                                        Verify Integrity
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};
```

---

## 🧪 Testing the Integration

### 1. Test Evidence Creation

```bash
curl -X POST http://localhost:3001/api/blockchain/evidence \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "evidenceId": "EVD-001",
    "caseId": "CASE-001",
    "fileName": "test_evidence.pdf",
    "fileHash": "sha256:abcd1234...",
    "fileSize": 1024000,
    "mimeType": "application/pdf",
    "description": "Test evidence file",
    "location": "Crime Scene A",
    "collectedBy": "Officer John Doe"
  }'
```

### 2. Test Custody Transfer

```bash
curl -X POST http://localhost:3001/api/blockchain/evidence/EVD-001/transfer \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "toUser": "forensic.analyst1",
    "reason": "Forensic analysis required"
  }'
```

### 3. Test Integrity Verification

```bash
curl -X POST http://localhost:3001/api/blockchain/evidence/EVD-001/verify \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "providedHash": "sha256:abcd1234..."
  }'
```

---

## 🔧 Troubleshooting

### Common Issues

1. **Connection Failed**
   - Check if Fabric network is running: `docker-compose ps`
   - Verify certificates are generated: `ls crypto-config/`

2. **Chaincode Not Found**
   - Ensure chaincode is deployed: `bash scripts/deploy-chaincode.sh`
   - Check chaincode status: `peer lifecycle chaincode querycommitted`

3. **Permission Denied**
   - Verify user has correct MSP identity
   - Check wallet contains valid certificates

### Debug Commands

```bash
# Check network status
docker-compose logs

# Check chaincode status
peer lifecycle chaincode querycommitted --channelID evidence-channel

# Test chaincode functions
peer chaincode invoke -C evidence-channel -n evidence-management -c '{"function":"GetEvidence","Args":["EVD-001"]}'
```

---

## 📚 Next Steps

1. **Deploy to Production**: Configure for production environment
2. **Add More Chaincode**: Implement additional business logic
3. **Monitor Network**: Set up monitoring and alerting
4. **Scale Network**: Add more organizations and peers
5. **Integrate AI**: Connect anomaly detection with blockchain events

---

## 🎯 Benefits of Integration

- ✅ **Immutable Evidence Records**: Tamper-proof evidence storage
- ✅ **Complete Audit Trail**: Every action recorded on blockchain
- ✅ **Multi-Organization Access**: Secure cross-department collaboration
- ✅ **Real-Time Verification**: Instant integrity checking
- ✅ **Automated Compliance**: Built-in regulatory compliance
- ✅ **Enhanced Security**: Cryptographic protection of sensitive data

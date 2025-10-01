// Updated Backend Integration with IPFS for NDEP
// This service integrates Hyperledger Fabric with IPFS storage

const { Gateway, Wallets } = require('fabric-network');
const ipfsService = require('./IPFS_INTEGRATION');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

class FabricIPFSService {
    constructor() {
        this.gateway = new Gateway();
        this.wallet = null;
        this.network = null;
        this.contract = null;
        this.initialized = false;
    }

    /**
     * Initialize both Fabric and IPFS services
     */
    async initialize() {
        try {
            console.log('🔗 Initializing Fabric + IPFS service...');
            
            // Initialize IPFS first
            const ipfsInitialized = await ipfsService.initialize();
            if (!ipfsInitialized) {
                throw new Error('IPFS service initialization failed');
            }

            // Load Fabric connection profile
            const ccpPath = path.resolve(__dirname, 'connection-profile.json');
            if (!fs.existsSync(ccpPath)) {
                throw new Error('Connection profile not found. Please create connection-profile.json');
            }
            const ccp = JSON.parse(fs.readFileSync(ccpPath, 'utf8'));

            // Create wallet
            const walletPath = path.join(process.cwd(), 'wallet');
            this.wallet = await Wallets.newFileSystemWallet(walletPath);

            // Check if admin identity exists
            const adminExists = await this.wallet.get('admin');
            if (!adminExists) {
                console.log('⚠️ Admin identity not found. Please enroll admin user first.');
                return false;
            }

            // Connect to gateway
            await this.gateway.connect(ccp, {
                wallet: this.wallet,
                identity: 'admin',
                discovery: { enabled: true, asLocalhost: true }
            });

            // Get network and contract
            this.network = await this.gateway.getNetwork('evidence-channel');
            this.contract = this.network.getContract('evidence-management');
            
            this.initialized = true;
            console.log('✅ Fabric + IPFS service initialized successfully');
            return true;
        } catch (error) {
            console.error('❌ Failed to initialize Fabric + IPFS service:', error.message);
            return false;
        }
    }

    /**
     * Create evidence with IPFS storage
     * @param {Object} evidenceData - Evidence data
     * @param {Buffer} fileBuffer - File content
     * @returns {Object} Created evidence with IPFS hash
     */
    async createEvidenceWithIPFS(evidenceData, fileBuffer) {
        if (!this.initialized) {
            throw new Error('Fabric + IPFS service not initialized');
        }

        try {
            console.log(`📤 Creating evidence with IPFS: ${evidenceData.evidenceId}`);

            // Upload file to IPFS
            const ipfsResult = await ipfsService.uploadFile(
                fileBuffer,
                evidenceData.fileName,
                evidenceData.evidenceId,
                {
                    caseId: evidenceData.caseId,
                    mimeType: evidenceData.mimeType,
                    description: evidenceData.description,
                    location: evidenceData.location,
                    collectedBy: evidenceData.collectedBy
                }
            );

            // Create evidence record on blockchain with IPFS hash
            const blockchainEvidenceData = {
                evidenceId: evidenceData.evidenceId,
                caseId: evidenceData.caseId,
                fileName: evidenceData.fileName,
                fileHash: ipfsResult.sha256Hash, // SHA-256 for integrity
                ipfsHash: ipfsResult.ipfsHash,   // IPFS hash for storage
                fileSize: evidenceData.fileSize,
                mimeType: evidenceData.mimeType,
                description: evidenceData.description,
                location: evidenceData.location,
                collectedBy: evidenceData.collectedBy
            };

            // Store on blockchain
            const result = await this.contract.submitTransaction(
                'CreateEvidenceWithIPFS',
                blockchainEvidenceData.evidenceId,
                blockchainEvidenceData.caseId,
                blockchainEvidenceData.fileName,
                blockchainEvidenceData.fileHash,
                blockchainEvidenceData.ipfsHash,
                blockchainEvidenceData.fileSize.toString(),
                blockchainEvidenceData.mimeType,
                blockchainEvidenceData.description,
                blockchainEvidenceData.location,
                blockchainEvidenceData.collectedBy
            );

            const blockchainResult = JSON.parse(result.toString());

            console.log(`✅ Evidence created with IPFS: ${evidenceData.evidenceId}`);

            return {
                success: true,
                evidenceId: evidenceData.evidenceId,
                ipfsHash: ipfsResult.ipfsHash,
                fileHash: ipfsResult.sha256Hash,
                blockchainResult,
                ipfsResult,
                url: ipfsResult.url,
                uploadedAt: new Date().toISOString()
            };

        } catch (error) {
            console.error('Error creating evidence with IPFS:', error);
            throw error;
        }
    }

    /**
     * Get evidence from blockchain and retrieve file from IPFS
     * @param {string} evidenceId - Evidence identifier
     * @returns {Object} Evidence data with file content
     */
    async getEvidenceWithIPFS(evidenceId) {
        if (!this.initialized) {
            throw new Error('Fabric + IPFS service not initialized');
        }

        try {
            console.log(`📥 Getting evidence with IPFS: ${evidenceId}`);

            // Get evidence from blockchain
            const result = await this.contract.evaluateTransaction('GetEvidence', evidenceId);
            const evidence = JSON.parse(result.toString());

            if (!evidence.ipfsHash) {
                throw new Error('Evidence does not have IPFS hash');
            }

            // Retrieve file from IPFS
            const ipfsResult = await ipfsService.retrieveFile(evidence.ipfsHash, evidence.fileName);

            console.log(`✅ Evidence retrieved with IPFS: ${evidenceId}`);

            return {
                success: true,
                evidence,
                fileContent: ipfsResult.fileContent,
                fileSize: ipfsResult.fileSize,
                mimeType: ipfsResult.mimeType,
                ipfsMetadata: ipfsResult.metadata,
                retrievedAt: new Date().toISOString()
            };

        } catch (error) {
            console.error('Error getting evidence with IPFS:', error);
            throw error;
        }
    }

    /**
     * Transfer custody with IPFS verification
     * @param {string} evidenceId - Evidence identifier
     * @param {string} toUser - User receiving custody
     * @param {string} reason - Reason for transfer
     * @param {Buffer} newFileBuffer - New file content if modified
     * @returns {Object} Transfer result
     */
    async transferCustodyWithIPFS(evidenceId, toUser, reason, newFileBuffer = null) {
        if (!this.initialized) {
            throw new Error('Fabric + IPFS service not initialized');
        }

        try {
            console.log(`🔄 Transferring custody with IPFS: ${evidenceId}`);

            let newIpfsHash = null;
            let newFileHash = null;

            // If new file provided, upload to IPFS
            if (newFileBuffer) {
                const evidence = await this.getEvidenceFromBlockchain(evidenceId);
                const ipfsResult = await ipfsService.uploadFile(
                    newFileBuffer,
                    evidence.fileName,
                    evidenceId,
                    {
                        caseId: evidence.caseId,
                        mimeType: evidence.mimeType,
                        description: evidence.metadata.description,
                        location: evidence.metadata.location,
                        collectedBy: evidence.metadata.collectedBy
                    }
                );
                newIpfsHash = ipfsResult.ipfsHash;
                newFileHash = ipfsResult.sha256Hash;
            }

            // Transfer custody on blockchain
            const result = await this.contract.submitTransaction(
                'TransferCustodyWithIPFS',
                evidenceId,
                toUser,
                reason,
                newFileHash,
                newIpfsHash
            );

            const transferResult = JSON.parse(result.toString());

            console.log(`✅ Custody transferred with IPFS: ${evidenceId}`);

            return {
                success: true,
                transferResult,
                newIpfsHash,
                newFileHash,
                transferredAt: new Date().toISOString()
            };

        } catch (error) {
            console.error('Error transferring custody with IPFS:', error);
            throw error;
        }
    }

    /**
     * Verify evidence integrity using both blockchain and IPFS
     * @param {string} evidenceId - Evidence identifier
     * @param {string} providedHash - Hash to verify against
     * @returns {Object} Verification result
     */
    async verifyIntegrityWithIPFS(evidenceId, providedHash) {
        if (!this.initialized) {
            throw new Error('Fabric + IPFS service not initialized');
        }

        try {
            console.log(`🔍 Verifying integrity with IPFS: ${evidenceId}`);

            // Get evidence from blockchain
            const evidence = await this.getEvidenceFromBlockchain(evidenceId);

            // Verify against blockchain hash
            const blockchainValid = evidence.fileHash === providedHash;

            // Verify against IPFS hash
            let ipfsValid = false;
            if (evidence.ipfsHash) {
                const ipfsResult = await ipfsService.verifyFileIntegrity(evidence.ipfsHash, providedHash);
                ipfsValid = ipfsResult.isIntegrityValid;
            }

            const isIntegrityValid = blockchainValid && ipfsValid;

            const verificationResult = {
                evidenceId,
                providedHash,
                blockchainHash: evidence.fileHash,
                ipfsHash: evidence.ipfsHash,
                blockchainValid,
                ipfsValid,
                isIntegrityValid,
                verifiedAt: new Date().toISOString(),
                verifiedBy: 'system'
            };

            console.log(`✅ Integrity verified with IPFS: ${evidenceId}`);

            return {
                success: true,
                result: verificationResult
            };

        } catch (error) {
            console.error('Error verifying integrity with IPFS:', error);
            throw error;
        }
    }

    /**
     * Get evidence from blockchain only (without IPFS retrieval)
     * @param {string} evidenceId - Evidence identifier
     * @returns {Object} Evidence data
     */
    async getEvidenceFromBlockchain(evidenceId) {
        if (!this.initialized) {
            throw new Error('Fabric + IPFS service not initialized');
        }

        try {
            const result = await this.contract.evaluateTransaction('GetEvidence', evidenceId);
            return JSON.parse(result.toString());
        } catch (error) {
            console.error('Error getting evidence from blockchain:', error);
            throw error;
        }
    }

    /**
     * Get custody chain from blockchain
     * @param {string} evidenceId - Evidence identifier
     * @returns {Array} Custody chain
     */
    async getCustodyChain(evidenceId) {
        if (!this.initialized) {
            throw new Error('Fabric + IPFS service not initialized');
        }

        try {
            const result = await this.contract.evaluateTransaction('GetCustodyChain', evidenceId);
            return JSON.parse(result.toString());
        } catch (error) {
            console.error('Error getting custody chain:', error);
            throw error;
        }
    }

    /**
     * Get evidence by case
     * @param {string} caseId - Case identifier
     * @returns {Array} Evidence list
     */
    async getEvidenceByCase(caseId) {
        if (!this.initialized) {
            throw new Error('Fabric + IPFS service not initialized');
        }

        try {
            const result = await this.contract.evaluateTransaction('GetEvidenceByCase', caseId);
            return JSON.parse(result.toString());
        } catch (error) {
            console.error('Error getting evidence by case:', error);
            throw error;
        }
    }

    /**
     * Update evidence status
     * @param {string} evidenceId - Evidence identifier
     * @param {string} status - New status
     * @param {string} reason - Reason for status change
     * @returns {Object} Update result
     */
    async updateEvidenceStatus(evidenceId, status, reason) {
        if (!this.initialized) {
            throw new Error('Fabric + IPFS service not initialized');
        }

        try {
            const result = await this.contract.submitTransaction(
                'UpdateEvidenceStatus',
                evidenceId,
                status,
                reason
            );
            return JSON.parse(result.toString());
        } catch (error) {
            console.error('Error updating evidence status:', error);
            throw error;
        }
    }

    /**
     * Get all evidence
     * @returns {Array} All evidence
     */
    async getAllEvidence() {
        if (!this.initialized) {
            throw new Error('Fabric + IPFS service not initialized');
        }

        try {
            const result = await this.contract.evaluateTransaction('GetAllEvidence');
            return JSON.parse(result.toString());
        } catch (error) {
            console.error('Error getting all evidence:', error);
            throw error;
        }
    }

    /**
     * Get service status
     * @returns {Object} Service status
     */
    async getServiceStatus() {
        try {
            const fabricStatus = this.initialized ? 'connected' : 'disconnected';
            const ipfsStatus = await ipfsService.getStatus();

            return {
                fabric: {
                    status: fabricStatus,
                    initialized: this.initialized
                },
                ipfs: ipfsStatus,
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            return {
                fabric: {
                    status: 'error',
                    initialized: this.initialized
                },
                ipfs: {
                    status: 'error',
                    message: error.message
                },
                timestamp: new Date().toISOString()
            };
        }
    }

    /**
     * Disconnect services
     */
    async disconnect() {
        if (this.gateway) {
            await this.gateway.disconnect();
            this.initialized = false;
            console.log('🔌 Fabric + IPFS service disconnected');
        }
    }
}

module.exports = new FabricIPFSService();

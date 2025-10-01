// NDEP Backend Integration with Hyperledger Fabric
// This file contains the complete backend integration code

const { Gateway, Wallets } = require('fabric-network');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

class FabricService {
    constructor() {
        this.gateway = new Gateway();
        this.wallet = null;
        this.network = null;
        this.contract = null;
        this.initialized = false;
    }

    async initialize() {
        try {
            console.log('🔗 Initializing Fabric service...');
            
            // Load connection profile
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
            console.log('✅ Fabric service initialized successfully');
            return true;
        } catch (error) {
            console.error('❌ Failed to initialize Fabric service:', error.message);
            return false;
        }
    }

    async createEvidence(evidenceData) {
        if (!this.initialized) {
            throw new Error('Fabric service not initialized');
        }

        try {
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
        } catch (error) {
            console.error('Error creating evidence:', error);
            throw error;
        }
    }

    async getEvidence(evidenceId) {
        if (!this.initialized) {
            throw new Error('Fabric service not initialized');
        }

        try {
            const result = await this.contract.evaluateTransaction('GetEvidence', evidenceId);
            return JSON.parse(result.toString());
        } catch (error) {
            console.error('Error getting evidence:', error);
            throw error;
        }
    }

    async transferCustody(evidenceId, toUser, reason, newHash = null) {
        if (!this.initialized) {
            throw new Error('Fabric service not initialized');
        }

        try {
            const result = await this.contract.submitTransaction(
                'TransferCustody',
                evidenceId,
                toUser,
                reason,
                newHash
            );
            return JSON.parse(result.toString());
        } catch (error) {
            console.error('Error transferring custody:', error);
            throw error;
        }
    }

    async verifyIntegrity(evidenceId, providedHash) {
        if (!this.initialized) {
            throw new Error('Fabric service not initialized');
        }

        try {
            const result = await this.contract.evaluateTransaction(
                'VerifyIntegrity',
                evidenceId,
                providedHash
            );
            return JSON.parse(result.toString());
        } catch (error) {
            console.error('Error verifying integrity:', error);
            throw error;
        }
    }

    async getCustodyChain(evidenceId) {
        if (!this.initialized) {
            throw new Error('Fabric service not initialized');
        }

        try {
            const result = await this.contract.evaluateTransaction('GetCustodyChain', evidenceId);
            return JSON.parse(result.toString());
        } catch (error) {
            console.error('Error getting custody chain:', error);
            throw error;
        }
    }

    async getEvidenceByCase(caseId) {
        if (!this.initialized) {
            throw new Error('Fabric service not initialized');
        }

        try {
            const result = await this.contract.evaluateTransaction('GetEvidenceByCase', caseId);
            return JSON.parse(result.toString());
        } catch (error) {
            console.error('Error getting evidence by case:', error);
            throw error;
        }
    }

    async updateEvidenceStatus(evidenceId, status, reason) {
        if (!this.initialized) {
            throw new Error('Fabric service not initialized');
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

    async getAllEvidence() {
        if (!this.initialized) {
            throw new Error('Fabric service not initialized');
        }

        try {
            const result = await this.contract.evaluateTransaction('GetAllEvidence');
            return JSON.parse(result.toString());
        } catch (error) {
            console.error('Error getting all evidence:', error);
            throw error;
        }
    }

    async disconnect() {
        if (this.gateway) {
            await this.gateway.disconnect();
            this.initialized = false;
            console.log('🔌 Fabric service disconnected');
        }
    }

    // Utility function to calculate file hash
    calculateFileHash(fileBuffer) {
        return crypto.createHash('sha256').update(fileBuffer).digest('hex');
    }

    // Utility function to get network status
    async getNetworkStatus() {
        if (!this.initialized) {
            return { status: 'disconnected', message: 'Fabric service not initialized' };
        }

        try {
            // Try to query the chaincode to check if it's responsive
            await this.contract.evaluateTransaction('GetAllEvidence');
            return { status: 'connected', message: 'Network is operational' };
        } catch (error) {
            return { status: 'error', message: error.message };
        }
    }
}

module.exports = new FabricService();

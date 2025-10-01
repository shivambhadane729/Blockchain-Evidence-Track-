// IPFS Integration for NDEP Blockchain System
// This service handles file storage using IPFS and Pinata

const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

class IPFSService {
    constructor() {
        this.initialized = false;
        this.config = {
            apiKey: process.env.PINATA_API_KEY || '',
            secretKey: process.env.PINATA_SECRET_KEY || '',
            gateway: process.env.PINATA_GATEWAY || 'https://gateway.pinata.cloud',
            maxRetries: 3,
            retryDelay: 1000
        };
    }

    /**
     * Initialize IPFS service with Pinata
     */
    async initialize() {
        try {
            if (!this.config.apiKey || !this.config.secretKey) {
                throw new Error('Pinata API keys not provided. Set PINATA_API_KEY and PINATA_SECRET_KEY environment variables.');
            }

            // Test connection
            await this.testConnection();
            this.initialized = true;
            console.log('✅ IPFS service initialized successfully with Pinata');
            return true;
        } catch (error) {
            console.error('❌ Failed to initialize IPFS service:', error.message);
            return false;
        }
    }

    /**
     * Test Pinata connection
     */
    async testConnection() {
        try {
            const response = await axios.get('https://api.pinata.cloud/data/testAuthentication', {
                headers: {
                    'pinata_api_key': this.config.apiKey,
                    'pinata_secret_api_key': this.config.secretKey
                }
            });
            
            console.log(`📊 Pinata Status: ${response.status === 200 ? 'Connected' : 'Failed'}`);
            return true;
        } catch (error) {
            throw new Error(`Pinata connection test failed: ${error.message}`);
        }
    }

    /**
     * Upload file to IPFS via Pinata
     * @param {Buffer} fileBuffer - File content as buffer
     * @param {string} fileName - Original file name
     * @param {string} evidenceId - Evidence identifier
     * @param {Object} metadata - Additional metadata
     * @returns {Object} Upload result with IPFS hash
     */
    async uploadFile(fileBuffer, fileName, evidenceId, metadata = {}) {
        if (!this.initialized) {
            throw new Error('IPFS service not initialized');
        }

        try {
            console.log(`📤 Uploading file to Pinata IPFS: ${fileName}`);

            // Create form data for Pinata
            const formData = new FormData();
            formData.append('file', fileBuffer, fileName);

            // Create metadata for Pinata
            const pinataMetadata = {
                name: `evidence-${evidenceId}-${fileName}`,
                keyvalues: {
                    evidenceId: evidenceId,
                    caseId: metadata.caseId || '',
                    description: metadata.description || '',
                    location: metadata.location || '',
                    collectedBy: metadata.collectedBy || '',
                    mimeType: metadata.mimeType || 'application/octet-stream',
                    fileSize: fileBuffer.length.toString(),
                    uploadedAt: new Date().toISOString(),
                    sha256Hash: crypto.createHash('sha256').update(fileBuffer).digest('hex')
                }
            };

            formData.append('pinataMetadata', JSON.stringify(pinataMetadata));

            // Upload to Pinata
            const response = await axios.post('https://api.pinata.cloud/pinning/pinFileToIPFS', formData, {
                headers: {
                    'pinata_api_key': this.config.apiKey,
                    'pinata_secret_api_key': this.config.secretKey,
                    ...formData.getHeaders()
                }
            });

            const ipfsHash = response.data.IpfsHash;
            console.log(`✅ File uploaded to Pinata IPFS: ${ipfsHash}`);

            return {
                success: true,
                ipfsHash: ipfsHash,
                fileName,
                fileSize: fileBuffer.length,
                sha256Hash: crypto.createHash('sha256').update(fileBuffer).digest('hex'),
                uploadedAt: new Date().toISOString(),
                url: `${this.config.gateway}/ipfs/${ipfsHash}`,
                pinataUrl: `https://gateway.pinata.cloud/ipfs/${ipfsHash}`,
                metadata: {
                    evidenceId,
                    caseId: metadata.caseId,
                    description: metadata.description,
                    location: metadata.location,
                    collectedBy: metadata.collectedBy
                }
            };

        } catch (error) {
            console.error('❌ Pinata upload failed:', error);
            throw new Error(`Pinata upload failed: ${error.message}`);
        }
    }

    /**
     * Retrieve file from IPFS
     * @param {string} ipfsHash - IPFS content identifier
     * @param {string} fileName - File name to retrieve
     * @returns {Object} File data and metadata
     */
    async retrieveFile(ipfsHash, fileName) {
        if (!this.initialized) {
            throw new Error('IPFS service not initialized');
        }

        try {
            console.log(`📥 Retrieving file from IPFS: ${ipfsHash}/${fileName}`);

            // Get file from IPFS
            const res = await this.client.get(ipfsHash);
            if (!res.ok) {
                throw new Error(`Failed to retrieve file: ${res.status} ${res.statusText}`);
            }

            const files = await res.files();
            const targetFile = files.find(file => file.name.endsWith(fileName));
            const metadataFile = files.find(file => file.name.endsWith('metadata.json'));

            if (!targetFile) {
                throw new Error(`File ${fileName} not found in IPFS`);
            }

            // Read file content
            const fileBuffer = await targetFile.arrayBuffer();
            const fileContent = Buffer.from(fileBuffer);

            // Read metadata if available
            let metadata = {};
            if (metadataFile) {
                const metadataBuffer = await metadataFile.arrayBuffer();
                metadata = JSON.parse(Buffer.from(metadataBuffer).toString());
            }

            console.log(`✅ File retrieved from IPFS: ${fileName}`);

            return {
                success: true,
                fileName: targetFile.name,
                fileContent,
                fileSize: fileContent.length,
                mimeType: targetFile.type,
                metadata,
                retrievedAt: new Date().toISOString()
            };

        } catch (error) {
            console.error('❌ IPFS retrieval failed:', error);
            throw new Error(`IPFS retrieval failed: ${error.message}`);
        }
    }

    /**
     * Get file metadata from IPFS
     * @param {string} ipfsHash - IPFS content identifier
     * @returns {Object} File metadata
     */
    async getFileMetadata(ipfsHash) {
        if (!this.initialized) {
            throw new Error('IPFS service not initialized');
        }

        try {
            console.log(`📋 Getting metadata from IPFS: ${ipfsHash}`);

            const res = await this.client.get(ipfsHash);
            if (!res.ok) {
                throw new Error(`Failed to retrieve metadata: ${res.status} ${res.statusText}`);
            }

            const files = await res.files();
            const metadataFile = files.find(file => file.name.endsWith('metadata.json'));

            if (!metadataFile) {
                throw new Error('Metadata file not found in IPFS');
            }

            const metadataBuffer = await metadataFile.arrayBuffer();
            const metadata = JSON.parse(Buffer.from(metadataBuffer).toString());

            console.log(`✅ Metadata retrieved from IPFS`);

            return {
                success: true,
                metadata,
                retrievedAt: new Date().toISOString()
            };

        } catch (error) {
            console.error('❌ IPFS metadata retrieval failed:', error);
            throw new Error(`IPFS metadata retrieval failed: ${error.message}`);
        }
    }

    /**
     * Verify file integrity using IPFS hash
     * @param {string} ipfsHash - IPFS content identifier
     * @param {string} providedHash - Hash to verify against
     * @returns {Object} Verification result
     */
    async verifyFileIntegrity(ipfsHash, providedHash) {
        try {
            const metadata = await this.getFileMetadata(ipfsHash);
            const storedHash = metadata.metadata.sha256Hash;
            
            const isIntegrityValid = storedHash === providedHash;

            return {
                success: true,
                ipfsHash,
                providedHash,
                storedHash,
                isIntegrityValid,
                verifiedAt: new Date().toISOString()
            };

        } catch (error) {
            console.error('❌ IPFS integrity verification failed:', error);
            throw new Error(`IPFS integrity verification failed: ${error.message}`);
        }
    }

    /**
     * List files in IPFS directory
     * @param {string} ipfsHash - IPFS content identifier
     * @returns {Array} List of files
     */
    async listFiles(ipfsHash) {
        if (!this.initialized) {
            throw new Error('IPFS service not initialized');
        }

        try {
            console.log(`📁 Listing files in IPFS: ${ipfsHash}`);

            const res = await this.client.get(ipfsHash);
            if (!res.ok) {
                throw new Error(`Failed to list files: ${res.status} ${res.statusText}`);
            }

            const files = await res.files();
            const fileList = files.map(file => ({
                name: file.name,
                size: file.size,
                type: file.type,
                cid: ipfsHash
            }));

            console.log(`✅ Listed ${fileList.length} files from IPFS`);

            return {
                success: true,
                files: fileList,
                count: fileList.length,
                retrievedAt: new Date().toISOString()
            };

        } catch (error) {
            console.error('❌ IPFS file listing failed:', error);
            throw new Error(`IPFS file listing failed: ${error.message}`);
        }
    }

    /**
     * Delete file from IPFS (Note: IPFS is immutable, this removes from pinning service)
     * @param {string} ipfsHash - IPFS content identifier
     * @returns {Object} Deletion result
     */
    async deleteFile(ipfsHash) {
        if (!this.initialized) {
            throw new Error('IPFS service not initialized');
        }

        try {
            console.log(`🗑️ Deleting file from IPFS: ${ipfsHash}`);

            // Note: IPFS is immutable, so we can't actually delete the content
            // This would typically involve removing from a pinning service
            // For Web3.Storage, files are automatically garbage collected after 30 days if not pinned

            console.log(`⚠️ IPFS is immutable. File ${ipfsHash} will be garbage collected if not pinned.`);

            return {
                success: true,
                message: 'File marked for garbage collection (IPFS is immutable)',
                ipfsHash,
                deletedAt: new Date().toISOString()
            };

        } catch (error) {
            console.error('❌ IPFS deletion failed:', error);
            throw new Error(`IPFS deletion failed: ${error.message}`);
        }
    }

    /**
     * Get IPFS service status
     * @returns {Object} Service status
     */
    async getStatus() {
        try {
            if (!this.initialized) {
                return {
                    status: 'not_initialized',
                    message: 'IPFS service not initialized'
                };
            }

            const status = await this.client.status();
            return {
                status: 'connected',
                message: 'IPFS service is operational',
                web3StorageStatus: status,
                timestamp: new Date().toISOString()
            };

        } catch (error) {
            return {
                status: 'error',
                message: `IPFS service error: ${error.message}`,
                timestamp: new Date().toISOString()
            };
        }
    }

    /**
     * Calculate file hash for integrity verification
     * @param {Buffer} fileBuffer - File content
     * @returns {string} SHA-256 hash
     */
    calculateFileHash(fileBuffer) {
        return crypto.createHash('sha256').update(fileBuffer).digest('hex');
    }

    /**
     * Generate IPFS URL for file access
     * @param {string} ipfsHash - IPFS content identifier
     * @param {string} fileName - File name
     * @returns {string} IPFS URL
     */
    generateIPFSUrl(ipfsHash, fileName) {
        return `https://${ipfsHash}.ipfs.w3s.link/${fileName}`;
    }
}

module.exports = new IPFSService();

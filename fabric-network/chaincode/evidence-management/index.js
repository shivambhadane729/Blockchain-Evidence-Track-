'use strict';

const { Contract } = require('fabric-contract-api');
const crypto = require('crypto');

/**
 * Evidence Management Chaincode for NDEP
 * 
 * This chaincode manages digital evidence on the blockchain including:
 * - Evidence creation and registration
 * - Custody chain tracking
 * - Integrity verification
 * - Access control and permissions
 */
class EvidenceManagementContract extends Contract {

    /**
     * Initialize the chaincode
     */
    async InitLedger(ctx) {
        console.info('============= START : Initialize Ledger ===========');
        
        // Initialize with sample data
        const evidence = [
            {
                evidenceId: 'EVD-001',
                caseId: 'CASE-001',
                fileName: 'sample_evidence.pdf',
                fileHash: 'sha256:abcd1234...',
                fileSize: 1024000,
                mimeType: 'application/pdf',
                uploadedBy: 'police.officer1',
                uploadedAt: new Date().toISOString(),
                status: 'ACTIVE',
                custodyChain: [],
                metadata: {
                    description: 'Sample evidence file',
                    location: 'Crime Scene A',
                    collectedBy: 'Officer John Doe',
                    collectedAt: new Date().toISOString()
                }
            }
        ];

        for (let i = 0; i < evidence.length; i++) {
            await ctx.stub.putState(evidence[i].evidenceId, Buffer.from(JSON.stringify(evidence[i])));
            console.info('Added <--> ', evidence[i]);
        }
        
        console.info('============= END : Initialize Ledger ===========');
    }

    /**
     * Create new evidence record
     * @param {Context} ctx - Transaction context
     * @param {string} evidenceId - Unique evidence identifier
     * @param {string} caseId - Associated case identifier
     * @param {string} fileName - Name of the evidence file
     * @param {string} fileHash - SHA-256 hash of the file
     * @param {number} fileSize - Size of the file in bytes
     * @param {string} mimeType - MIME type of the file
     * @param {string} description - Description of the evidence
     * @param {string} location - Location where evidence was collected
     * @param {string} collectedBy - Officer who collected the evidence
     */
    async CreateEvidence(ctx, evidenceId, caseId, fileName, fileHash, fileSize, mimeType, description, location, collectedBy) {
        console.info('============= START : Create Evidence ===========');

        // Check if evidence already exists
        const evidenceAsBytes = await ctx.stub.getState(evidenceId);
        if (evidenceAsBytes && evidenceAsBytes.length > 0) {
            throw new Error(`Evidence ${evidenceId} already exists`);
        }

        // Get current user information
        const clientIdentity = ctx.clientIdentity;
        const uploadedBy = clientIdentity.getMSPID() + '.' + clientIdentity.getID();

        // Create evidence object
        const evidence = {
            evidenceId: evidenceId,
            caseId: caseId,
            fileName: fileName,
            fileHash: fileHash,
            fileSize: parseInt(fileSize),
            mimeType: mimeType,
            uploadedBy: uploadedBy,
            uploadedAt: new Date().toISOString(),
            status: 'ACTIVE',
            custodyChain: [{
                from: 'SYSTEM',
                to: uploadedBy,
                transferredAt: new Date().toISOString(),
                reason: 'Initial upload',
                hash: fileHash
            }],
            metadata: {
                description: description,
                location: location,
                collectedBy: collectedBy,
                collectedAt: new Date().toISOString()
            },
            lastModified: new Date().toISOString(),
            version: 1
        };

        // Store evidence in ledger
        await ctx.stub.putState(evidenceId, Buffer.from(JSON.stringify(evidence)));

        // Create composite key for case-based queries
        const caseIndexKey = ctx.stub.createCompositeKey('case~evidence', [caseId, evidenceId]);
        await ctx.stub.putState(caseIndexKey, Buffer.from('\u0000'));

        console.info('============= END : Create Evidence ===========');
        return JSON.stringify(evidence);
    }

    /**
     * Get evidence by ID
     * @param {Context} ctx - Transaction context
     * @param {string} evidenceId - Evidence identifier
     */
    async GetEvidence(ctx, evidenceId) {
        console.info('============= START : Get Evidence ===========');

        const evidenceAsBytes = await ctx.stub.getState(evidenceId);
        if (!evidenceAsBytes || evidenceAsBytes.length === 0) {
            throw new Error(`Evidence ${evidenceId} does not exist`);
        }

        console.info('============= END : Get Evidence ===========');
        return evidenceAsBytes.toString();
    }

    /**
     * Transfer custody of evidence
     * @param {Context} ctx - Transaction context
     * @param {string} evidenceId - Evidence identifier
     * @param {string} toUser - User receiving custody
     * @param {string} reason - Reason for transfer
     * @param {string} newHash - New hash if file was modified
     */
    async TransferCustody(ctx, evidenceId, toUser, reason, newHash = null) {
        console.info('============= START : Transfer Custody ===========');

        // Get current evidence
        const evidenceAsBytes = await ctx.stub.getState(evidenceId);
        if (!evidenceAsBytes || evidenceAsBytes.length === 0) {
            throw new Error(`Evidence ${evidenceId} does not exist`);
        }

        const evidence = JSON.parse(evidenceAsBytes.toString());

        // Check if evidence is active
        if (evidence.status !== 'ACTIVE') {
            throw new Error(`Evidence ${evidenceId} is not active`);
        }

        // Get current user
        const clientIdentity = ctx.clientIdentity;
        const fromUser = clientIdentity.getMSPID() + '.' + clientIdentity.getID();

        // Verify current custody
        const lastCustody = evidence.custodyChain[evidence.custodyChain.length - 1];
        if (lastCustody.to !== fromUser) {
            throw new Error(`User ${fromUser} does not have custody of evidence ${evidenceId}`);
        }

        // Create custody transfer record
        const custodyTransfer = {
            from: fromUser,
            to: toUser,
            transferredAt: new Date().toISOString(),
            reason: reason,
            hash: newHash || evidence.fileHash,
            transactionId: ctx.stub.getTxID()
        };

        // Update evidence
        evidence.custodyChain.push(custodyTransfer);
        evidence.lastModified = new Date().toISOString();
        evidence.version += 1;

        // Update hash if provided
        if (newHash) {
            evidence.fileHash = newHash;
        }

        // Store updated evidence
        await ctx.stub.putState(evidenceId, Buffer.from(JSON.stringify(evidence)));

        console.info('============= END : Transfer Custody ===========');
        return JSON.stringify(custodyTransfer);
    }

    /**
     * Verify evidence integrity
     * @param {Context} ctx - Transaction context
     * @param {string} evidenceId - Evidence identifier
     * @param {string} providedHash - Hash to verify against
     */
    async VerifyIntegrity(ctx, evidenceId, providedHash) {
        console.info('============= START : Verify Integrity ===========');

        const evidenceAsBytes = await ctx.stub.getState(evidenceId);
        if (!evidenceAsBytes || evidenceAsBytes.length === 0) {
            throw new Error(`Evidence ${evidenceId} does not exist`);
        }

        const evidence = JSON.parse(evidenceAsBytes.toString());
        const storedHash = evidence.fileHash;

        const isIntegrityValid = storedHash === providedHash;

        const verificationResult = {
            evidenceId: evidenceId,
            providedHash: providedHash,
            storedHash: storedHash,
            isIntegrityValid: isIntegrityValid,
            verifiedAt: new Date().toISOString(),
            verifiedBy: ctx.clientIdentity.getMSPID() + '.' + ctx.clientIdentity.getID(),
            transactionId: ctx.stub.getTxID()
        };

        console.info('============= END : Verify Integrity ===========');
        return JSON.stringify(verificationResult);
    }

    /**
     * Get custody chain for evidence
     * @param {Context} ctx - Transaction context
     * @param {string} evidenceId - Evidence identifier
     */
    async GetCustodyChain(ctx, evidenceId) {
        console.info('============= START : Get Custody Chain ===========');

        const evidenceAsBytes = await ctx.stub.getState(evidenceId);
        if (!evidenceAsBytes || evidenceAsBytes.length === 0) {
            throw new Error(`Evidence ${evidenceId} does not exist`);
        }

        const evidence = JSON.parse(evidenceAsBytes.toString());

        console.info('============= END : Get Custody Chain ===========');
        return JSON.stringify(evidence.custodyChain);
    }

    /**
     * Get all evidence for a case
     * @param {Context} ctx - Transaction context
     * @param {string} caseId - Case identifier
     */
    async GetEvidenceByCase(ctx, caseId) {
        console.info('============= START : Get Evidence By Case ===========');

        const caseEvidenceIterator = await ctx.stub.getStateByPartialCompositeKey('case~evidence', [caseId]);
        const evidenceList = [];

        while (true) {
            const response = await caseEvidenceIterator.next();
            if (response.value && response.value.value.toString()) {
                const evidenceId = response.value.key.split('\u0000')[1];
                const evidenceAsBytes = await ctx.stub.getState(evidenceId);
                if (evidenceAsBytes && evidenceAsBytes.length > 0) {
                    evidenceList.push(JSON.parse(evidenceAsBytes.toString()));
                }
            }

            if (response.done) {
                await caseEvidenceIterator.close();
                break;
            }
        }

        console.info('============= END : Get Evidence By Case ===========');
        return JSON.stringify(evidenceList);
    }

    /**
     * Update evidence status
     * @param {Context} ctx - Transaction context
     * @param {string} evidenceId - Evidence identifier
     * @param {string} status - New status (ACTIVE, ARCHIVED, DESTROYED)
     * @param {string} reason - Reason for status change
     */
    async UpdateEvidenceStatus(ctx, evidenceId, status, reason) {
        console.info('============= START : Update Evidence Status ===========');

        const evidenceAsBytes = await ctx.stub.getState(evidenceId);
        if (!evidenceAsBytes || evidenceAsBytes.length === 0) {
            throw new Error(`Evidence ${evidenceId} does not exist`);
        }

        const evidence = JSON.parse(evidenceAsBytes.toString());

        // Validate status
        const validStatuses = ['ACTIVE', 'ARCHIVED', 'DESTROYED'];
        if (!validStatuses.includes(status)) {
            throw new Error(`Invalid status: ${status}. Valid statuses are: ${validStatuses.join(', ')}`);
        }

        // Update evidence
        evidence.status = status;
        evidence.lastModified = new Date().toISOString();
        evidence.version += 1;

        // Add status change to custody chain
        const statusChange = {
            from: evidence.custodyChain[evidence.custodyChain.length - 1].to,
            to: 'SYSTEM',
            transferredAt: new Date().toISOString(),
            reason: `Status changed to ${status}: ${reason}`,
            hash: evidence.fileHash,
            transactionId: ctx.stub.getTxID()
        };

        evidence.custodyChain.push(statusChange);

        // Store updated evidence
        await ctx.stub.putState(evidenceId, Buffer.from(JSON.stringify(evidence)));

        console.info('============= END : Update Evidence Status ===========');
        return JSON.stringify(evidence);
    }

    /**
     * Get all evidence (with pagination)
     * @param {Context} ctx - Transaction context
     * @param {string} startKey - Start key for pagination
     * @param {string} endKey - End key for pagination
     */
    async GetAllEvidence(ctx, startKey = '', endKey = '') {
        console.info('============= START : Get All Evidence ===========');

        const iterator = await ctx.stub.getStateByRange(startKey, endKey);
        const evidenceList = [];

        while (true) {
            const response = await iterator.next();
            if (response.value && response.value.value.toString()) {
                const evidence = JSON.parse(response.value.value.toString());
                // Only include evidence records (not composite keys)
                if (evidence.evidenceId && evidence.caseId) {
                    evidenceList.push(evidence);
                }
            }

            if (response.done) {
                await iterator.close();
                break;
            }
        }

        console.info('============= END : Get All Evidence ===========');
        return JSON.stringify(evidenceList);
    }

    /**
     * Create evidence with IPFS storage
     * @param {Context} ctx - Transaction context
     * @param {string} evidenceId - Evidence ID
     * @param {string} caseId - Case ID
     * @param {string} fileName - File name
     * @param {string} fileHash - File hash (SHA-256)
     * @param {string} ipfsHash - IPFS content identifier
     * @param {number} fileSize - File size
     * @param {string} mimeType - MIME type
     * @param {string} description - Description
     * @param {string} location - Location
     * @param {string} collectedBy - Collected by
     */
    async CreateEvidenceWithIPFS(ctx, evidenceId, caseId, fileName, fileHash, ipfsHash, fileSize, mimeType, description, location, collectedBy) {
        console.info('============= START : Create Evidence With IPFS ===========');

        // Check if evidence already exists
        const evidenceAsBytes = await ctx.stub.getState(evidenceId);
        if (evidenceAsBytes && evidenceAsBytes.length > 0) {
            throw new Error(`Evidence ${evidenceId} already exists`);
        }

        // Get current user information
        const clientIdentity = ctx.clientIdentity;
        const uploadedBy = clientIdentity.getMSPID() + '.' + clientIdentity.getID();

        // Create evidence object with IPFS hash
        const evidence = {
            evidenceId: evidenceId,
            caseId: caseId,
            fileName: fileName,
            fileHash: fileHash, // SHA-256 hash for integrity verification
            ipfsHash: ipfsHash, // IPFS content identifier for file storage
            fileSize: parseInt(fileSize),
            mimeType: mimeType,
            uploadedBy: uploadedBy,
            uploadedAt: new Date().toISOString(),
            status: 'ACTIVE',
            custodyChain: [{
                from: 'SYSTEM',
                to: uploadedBy,
                transferredAt: new Date().toISOString(),
                reason: 'Initial upload with IPFS storage',
                hash: fileHash,
                ipfsHash: ipfsHash
            }],
            metadata: {
                description: description,
                location: location,
                collectedBy: collectedBy,
                collectedAt: new Date().toISOString(),
                storageType: 'IPFS',
                ipfsUrl: `https://${ipfsHash}.ipfs.w3s.link/${fileName}`
            },
            lastModified: new Date().toISOString(),
            version: 1
        };

        // Store evidence in ledger
        await ctx.stub.putState(evidenceId, Buffer.from(JSON.stringify(evidence)));

        // Create composite key for case-based queries
        const caseIndexKey = ctx.stub.createCompositeKey('case~evidence', [caseId, evidenceId]);
        await ctx.stub.putState(caseIndexKey, Buffer.from('\u0000'));

        // Emit event
        ctx.stub.setEvent('EvidenceCreatedWithIPFS', Buffer.from(JSON.stringify({
            evidenceId,
            caseId,
            fileName,
            fileHash,
            ipfsHash,
            uploadedAt: evidence.uploadedAt
        })));

        console.info('============= END : Create Evidence With IPFS ===========');
        return JSON.stringify(evidence);
    }

    /**
     * Transfer custody with IPFS verification
     * @param {Context} ctx - Transaction context
     * @param {string} evidenceId - Evidence identifier
     * @param {string} toUser - User receiving custody
     * @param {string} reason - Reason for transfer
     * @param {string} newHash - New hash if file was modified
     * @param {string} newIpfsHash - New IPFS hash if file was modified
     */
    async TransferCustodyWithIPFS(ctx, evidenceId, toUser, reason, newHash = null, newIpfsHash = null) {
        console.info('============= START : Transfer Custody With IPFS ===========');

        // Get current evidence
        const evidenceAsBytes = await ctx.stub.getState(evidenceId);
        if (!evidenceAsBytes || evidenceAsBytes.length === 0) {
            throw new Error(`Evidence ${evidenceId} does not exist`);
        }

        const evidence = JSON.parse(evidenceAsBytes.toString());

        // Check if evidence is active
        if (evidence.status !== 'ACTIVE') {
            throw new Error(`Evidence ${evidenceId} is not active`);
        }

        // Get current user
        const clientIdentity = ctx.clientIdentity;
        const fromUser = clientIdentity.getMSPID() + '.' + clientIdentity.getID();

        // Verify current custody
        const lastCustody = evidence.custodyChain[evidence.custodyChain.length - 1];
        if (lastCustody.to !== fromUser) {
            throw new Error(`User ${fromUser} does not have custody of evidence ${evidenceId}`);
        }

        // Create custody transfer record
        const custodyTransfer = {
            from: fromUser,
            to: toUser,
            transferredAt: new Date().toISOString(),
            reason: reason,
            hash: newHash || evidence.fileHash,
            ipfsHash: newIpfsHash || evidence.ipfsHash,
            transactionId: ctx.stub.getTxID()
        };

        // Update evidence
        evidence.custodyChain.push(custodyTransfer);
        evidence.lastModified = new Date().toISOString();
        evidence.version += 1;

        // Update hash and IPFS hash if provided
        if (newHash) {
            evidence.fileHash = newHash;
        }
        if (newIpfsHash) {
            evidence.ipfsHash = newIpfsHash;
            evidence.metadata.ipfsUrl = `https://${newIpfsHash}.ipfs.w3s.link/${evidence.fileName}`;
        }

        // Store updated evidence
        await ctx.stub.putState(evidenceId, Buffer.from(JSON.stringify(evidence)));

        // Emit event
        ctx.stub.setEvent('CustodyTransferredWithIPFS', Buffer.from(JSON.stringify({
            evidenceId,
            from: fromUser,
            to: toUser,
            reason,
            newHash,
            newIpfsHash,
            transferredAt: custodyTransfer.transferredAt
        })));

        console.info('============= END : Transfer Custody With IPFS ===========');
        return JSON.stringify(custodyTransfer);
    }

    /**
     * Verify evidence integrity with IPFS
     * @param {Context} ctx - Transaction context
     * @param {string} evidenceId - Evidence identifier
     * @param {string} providedHash - Hash to verify against
     */
    async VerifyIntegrityWithIPFS(ctx, evidenceId, providedHash) {
        console.info('============= START : Verify Integrity With IPFS ===========');

        const evidenceAsBytes = await ctx.stub.getState(evidenceId);
        if (!evidenceAsBytes || evidenceAsBytes.length === 0) {
            throw new Error(`Evidence ${evidenceId} does not exist`);
        }

        const evidence = JSON.parse(evidenceAsBytes.toString());
        const storedHash = evidence.fileHash;
        const ipfsHash = evidence.ipfsHash;

        const isIntegrityValid = storedHash === providedHash;

        const verificationResult = {
            evidenceId: evidenceId,
            providedHash: providedHash,
            storedHash: storedHash,
            ipfsHash: ipfsHash,
            isIntegrityValid: isIntegrityValid,
            verifiedAt: new Date().toISOString(),
            verifiedBy: ctx.clientIdentity.getMSPID() + '.' + ctx.clientIdentity.getID(),
            transactionId: ctx.stub.getTxID(),
            storageType: 'IPFS'
        };

        // Emit event
        ctx.stub.setEvent('IntegrityVerifiedWithIPFS', Buffer.from(JSON.stringify(verificationResult)));

        console.info('============= END : Verify Integrity With IPFS ===========');
        return JSON.stringify(verificationResult);
    }

    /**
     * Get IPFS URL for evidence
     * @param {Context} ctx - Transaction context
     * @param {string} evidenceId - Evidence identifier
     */
    async GetIPFSUrl(ctx, evidenceId) {
        console.info('============= START : Get IPFS URL ===========');

        const evidenceAsBytes = await ctx.stub.getState(evidenceId);
        if (!evidenceAsBytes || evidenceAsBytes.length === 0) {
            throw new Error(`Evidence ${evidenceId} does not exist`);
        }

        const evidence = JSON.parse(evidenceAsBytes.toString());

        if (!evidence.ipfsHash) {
            throw new Error(`Evidence ${evidenceId} does not have IPFS storage`);
        }

        const ipfsUrl = `https://${evidence.ipfsHash}.ipfs.w3s.link/${evidence.fileName}`;

        const result = {
            evidenceId: evidenceId,
            ipfsHash: evidence.ipfsHash,
            fileName: evidence.fileName,
            ipfsUrl: ipfsUrl,
            retrievedAt: new Date().toISOString()
        };

        console.info('============= END : Get IPFS URL ===========');
        return JSON.stringify(result);
    }

    /**
     * Calculate hash for data
     * @param {string} data - Data to hash
     */
    calculateHash(data) {
        return crypto.createHash('sha256').update(data).digest('hex');
    }
}

module.exports = EvidenceManagementContract;

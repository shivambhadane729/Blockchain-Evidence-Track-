// Updated Backend Routes with IPFS Integration for NDEP
// This file contains the Express routes that integrate with Fabric + IPFS

const express = require('express');
const multer = require('multer');
const { body, validationResult } = require('express-validator');
const fabricIPFSService = require('./BACKEND_IPFS_INTEGRATION');
const { requirePermission, logAudit } = require('../backend/middleware/auth');
const { asyncHandler } = require('../backend/middleware/errorHandler');

const router = express.Router();

// Configure multer for file uploads
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 50 * 1024 * 1024, // 50MB limit
        files: 1
    },
    fileFilter: (req, file, cb) => {
        // Allow common evidence file types
        const allowedTypes = [
            'application/pdf',
            'image/jpeg',
            'image/png',
            'image/gif',
            'video/mp4',
            'video/avi',
            'video/mov',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'text/plain',
            'application/zip',
            'application/x-rar-compressed'
        ];
        
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('File type not allowed'), false);
        }
    }
});

/**
 * @route   POST /api/blockchain/evidence/upload
 * @desc    Upload evidence file to IPFS and create blockchain record
 * @access  Private (Evidence Officer, Forensic Lab Manager, Admin)
 */
router.post('/evidence/upload', 
    requirePermission('evidence:create'),
    upload.single('evidenceFile'),
    [
        body('evidenceId').notEmpty().withMessage('Evidence ID is required'),
        body('caseId').notEmpty().withMessage('Case ID is required'),
        body('description').notEmpty().withMessage('Description is required'),
        body('location').notEmpty().withMessage('Location is required'),
        body('collectedBy').notEmpty().withMessage('Collected by is required')
    ],
    asyncHandler(async (req, res) => {
        try {
            // Validate request
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({
                    success: false,
                    message: 'Validation failed',
                    errors: errors.array()
                });
            }

            if (!req.file) {
                return res.status(400).json({
                    success: false,
                    message: 'Evidence file is required'
                });
            }

            const {
                evidenceId,
                caseId,
                description,
                location,
                collectedBy
            } = req.body;

            // Prepare evidence data
            const evidenceData = {
                evidenceId,
                caseId,
                fileName: req.file.originalname,
                fileSize: req.file.size,
                mimeType: req.file.mimetype,
                description,
                location,
                collectedBy
            };

            // Create evidence with IPFS storage
            const result = await fabricIPFSService.createEvidenceWithIPFS(
                evidenceData,
                req.file.buffer
            );

            // Log audit trail
            await logAudit(req.user.id, 'evidence:create', {
                evidenceId,
                caseId,
                fileName: req.file.originalname,
                fileSize: req.file.size,
                ipfsHash: result.ipfsHash
            });

            res.status(201).json({
                success: true,
                message: 'Evidence uploaded successfully to IPFS and blockchain',
                data: {
                    evidenceId: result.evidenceId,
                    ipfsHash: result.ipfsHash,
                    fileHash: result.fileHash,
                    url: result.url,
                    uploadedAt: result.uploadedAt
                }
            });

        } catch (error) {
            console.error('Error uploading evidence to IPFS:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to upload evidence',
                error: error.message
            });
        }
    })
);

/**
 * @route   GET /api/blockchain/evidence/:id
 * @desc    Get evidence from blockchain and retrieve file from IPFS
 * @access  Private (All authenticated users)
 */
router.get('/evidence/:id',
    requirePermission('evidence:read'),
    asyncHandler(async (req, res) => {
        try {
            const { id: evidenceId } = req.params;

            // Get evidence with IPFS file content
            const result = await fabricIPFSService.getEvidenceWithIPFS(evidenceId);

            // Log audit trail
            await logAudit(req.user.id, 'evidence:read', {
                evidenceId,
                ipfsHash: result.evidence.ipfsHash
            });

            res.json({
                success: true,
                data: {
                    evidence: result.evidence,
                    fileContent: result.fileContent.toString('base64'),
                    fileSize: result.fileSize,
                    mimeType: result.mimeType,
                    ipfsMetadata: result.ipfsMetadata,
                    retrievedAt: result.retrievedAt
                }
            });

        } catch (error) {
            console.error('Error getting evidence from IPFS:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to retrieve evidence',
                error: error.message
            });
        }
    })
);

/**
 * @route   GET /api/blockchain/evidence/:id/file
 * @desc    Get evidence file content from IPFS
 * @access  Private (All authenticated users)
 */
router.get('/evidence/:id/file',
    requirePermission('evidence:read'),
    asyncHandler(async (req, res) => {
        try {
            const { id: evidenceId } = req.params;

            // Get evidence from blockchain first
            const evidence = await fabricIPFSService.getEvidenceFromBlockchain(evidenceId);
            
            if (!evidence.ipfsHash) {
                return res.status(404).json({
                    success: false,
                    message: 'Evidence does not have IPFS storage'
                });
            }

            // Retrieve file from IPFS
            const result = await fabricIPFSService.retrieveFile(evidence.ipfsHash, evidence.fileName);

            // Set appropriate headers
            res.set({
                'Content-Type': result.mimeType,
                'Content-Length': result.fileSize,
                'Content-Disposition': `inline; filename="${evidence.fileName}"`,
                'Cache-Control': 'public, max-age=3600'
            });

            // Send file content
            res.send(result.fileContent);

        } catch (error) {
            console.error('Error getting evidence file from IPFS:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to retrieve evidence file',
                error: error.message
            });
        }
    })
);

/**
 * @route   POST /api/blockchain/evidence/:id/transfer
 * @desc    Transfer custody with optional file update
 * @access  Private (Evidence Officer, Forensic Lab Manager, Admin)
 */
router.post('/evidence/:id/transfer',
    requirePermission('evidence:transfer'),
    upload.single('updatedFile'),
    [
        body('toUser').notEmpty().withMessage('Recipient user is required'),
        body('reason').notEmpty().withMessage('Transfer reason is required')
    ],
    asyncHandler(async (req, res) => {
        try {
            const { id: evidenceId } = req.params;
            const { toUser, reason } = req.body;

            // Validate request
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({
                    success: false,
                    message: 'Validation failed',
                    errors: errors.array()
                });
            }

            let newFileBuffer = null;
            if (req.file) {
                newFileBuffer = req.file.buffer;
            }

            // Transfer custody with IPFS
            const result = await fabricIPFSService.transferCustodyWithIPFS(
                evidenceId,
                toUser,
                reason,
                newFileBuffer
            );

            // Log audit trail
            await logAudit(req.user.id, 'evidence:transfer', {
                evidenceId,
                toUser,
                reason,
                newIpfsHash: result.newIpfsHash,
                newFileHash: result.newFileHash
            });

            res.json({
                success: true,
                message: 'Custody transferred successfully',
                data: {
                    transferResult: result.transferResult,
                    newIpfsHash: result.newIpfsHash,
                    newFileHash: result.newFileHash,
                    transferredAt: result.transferredAt
                }
            });

        } catch (error) {
            console.error('Error transferring custody with IPFS:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to transfer custody',
                error: error.message
            });
        }
    })
);

/**
 * @route   POST /api/blockchain/evidence/:id/verify
 * @desc    Verify evidence integrity using blockchain and IPFS
 * @access  Private (All authenticated users)
 */
router.post('/evidence/:id/verify',
    requirePermission('evidence:verify'),
    [
        body('providedHash').notEmpty().withMessage('File hash is required for verification')
    ],
    asyncHandler(async (req, res) => {
        try {
            const { id: evidenceId } = req.params;
            const { providedHash } = req.body;

            // Validate request
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({
                    success: false,
                    message: 'Validation failed',
                    errors: errors.array()
                });
            }

            // Verify integrity with IPFS
            const result = await fabricIPFSService.verifyIntegrityWithIPFS(
                evidenceId,
                providedHash
            );

            // Log audit trail
            await logAudit(req.user.id, 'evidence:verify', {
                evidenceId,
                providedHash,
                isIntegrityValid: result.result.isIntegrityValid
            });

            res.json({
                success: true,
                message: 'Evidence integrity verification completed',
                data: result.result
            });

        } catch (error) {
            console.error('Error verifying evidence integrity with IPFS:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to verify evidence integrity',
                error: error.message
            });
        }
    })
);

/**
 * @route   GET /api/blockchain/evidence/:id/custody
 * @desc    Get custody chain for evidence
 * @access  Private (All authenticated users)
 */
router.get('/evidence/:id/custody',
    requirePermission('evidence:read'),
    asyncHandler(async (req, res) => {
        try {
            const { id: evidenceId } = req.params;

            // Get custody chain from blockchain
            const custodyChain = await fabricIPFSService.getCustodyChain(evidenceId);

            res.json({
                success: true,
                data: {
                    evidenceId,
                    custodyChain,
                    retrievedAt: new Date().toISOString()
                }
            });

        } catch (error) {
            console.error('Error getting custody chain:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to retrieve custody chain',
                error: error.message
            });
        }
    })
);

/**
 * @route   GET /api/blockchain/evidence/case/:caseId
 * @desc    Get all evidence for a case
 * @access  Private (All authenticated users)
 */
router.get('/evidence/case/:caseId',
    requirePermission('evidence:read'),
    asyncHandler(async (req, res) => {
        try {
            const { caseId } = req.params;

            // Get evidence by case from blockchain
            const evidenceList = await fabricIPFSService.getEvidenceByCase(caseId);

            res.json({
                success: true,
                data: {
                    caseId,
                    evidenceList,
                    count: evidenceList.length,
                    retrievedAt: new Date().toISOString()
                }
            });

        } catch (error) {
            console.error('Error getting evidence by case:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to retrieve evidence for case',
                error: error.message
            });
        }
    })
);

/**
 * @route   GET /api/blockchain/evidence/:id/ipfs-url
 * @desc    Get IPFS URL for evidence file
 * @access  Private (All authenticated users)
 */
router.get('/evidence/:id/ipfs-url',
    requirePermission('evidence:read'),
    asyncHandler(async (req, res) => {
        try {
            const { id: evidenceId } = req.params;

            // Get evidence from blockchain
            const evidence = await fabricIPFSService.getEvidenceFromBlockchain(evidenceId);

            if (!evidence.ipfsHash) {
                return res.status(404).json({
                    success: false,
                    message: 'Evidence does not have IPFS storage'
                });
            }

            const ipfsUrl = `https://${evidence.ipfsHash}.ipfs.w3s.link/${evidence.fileName}`;

            res.json({
                success: true,
                data: {
                    evidenceId,
                    ipfsHash: evidence.ipfsHash,
                    fileName: evidence.fileName,
                    ipfsUrl,
                    retrievedAt: new Date().toISOString()
                }
            });

        } catch (error) {
            console.error('Error getting IPFS URL:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to get IPFS URL',
                error: error.message
            });
        }
    })
);

/**
 * @route   PUT /api/blockchain/evidence/:id/status
 * @desc    Update evidence status
 * @access  Private (Forensic Lab Manager, Admin)
 */
router.put('/evidence/:id/status',
    requirePermission('evidence:update'),
    [
        body('status').isIn(['ACTIVE', 'ARCHIVED', 'DESTROYED']).withMessage('Invalid status'),
        body('reason').notEmpty().withMessage('Reason is required')
    ],
    asyncHandler(async (req, res) => {
        try {
            const { id: evidenceId } = req.params;
            const { status, reason } = req.body;

            // Validate request
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({
                    success: false,
                    message: 'Validation failed',
                    errors: errors.array()
                });
            }

            // Update evidence status
            const result = await fabricIPFSService.updateEvidenceStatus(
                evidenceId,
                status,
                reason
            );

            // Log audit trail
            await logAudit(req.user.id, 'evidence:update', {
                evidenceId,
                status,
                reason
            });

            res.json({
                success: true,
                message: 'Evidence status updated successfully',
                data: result
            });

        } catch (error) {
            console.error('Error updating evidence status:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to update evidence status',
                error: error.message
            });
        }
    })
);

/**
 * @route   GET /api/blockchain/evidence
 * @desc    Get all evidence
 * @access  Private (Admin only)
 */
router.get('/evidence',
    requirePermission('evidence:read_all'),
    asyncHandler(async (req, res) => {
        try {
            // Get all evidence from blockchain
            const evidenceList = await fabricIPFSService.getAllEvidence();

            res.json({
                success: true,
                data: {
                    evidenceList,
                    count: evidenceList.length,
                    retrievedAt: new Date().toISOString()
                }
            });

        } catch (error) {
            console.error('Error getting all evidence:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to retrieve evidence list',
                error: error.message
            });
        }
    })
);

/**
 * @route   GET /api/blockchain/status
 * @desc    Get blockchain and IPFS service status
 * @access  Private (All authenticated users)
 */
router.get('/status',
    asyncHandler(async (req, res) => {
        try {
            // Get service status
            const status = await fabricIPFSService.getServiceStatus();

            res.json({
                success: true,
                data: status
            });

        } catch (error) {
            console.error('Error getting service status:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to get service status',
                error: error.message
            });
        }
    })
);

module.exports = router;

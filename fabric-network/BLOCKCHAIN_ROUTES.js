// Updated Blockchain Routes for NDEP Backend
// This file contains the complete blockchain API routes with Fabric integration

const express = require('express');
const fabricService = require('./BACKEND_INTEGRATION');
const { authenticateToken, requirePermission } = require('../backend/middleware/auth');
const { asyncHandler } = require('../backend/middleware/errorHandler');
const { body, validationResult } = require('express-validator');

const router = express.Router();

// Initialize Fabric service on startup
let fabricInitialized = false;

const initializeFabric = async () => {
    if (!fabricInitialized) {
        console.log('🚀 Initializing Fabric service...');
        fabricInitialized = await fabricService.initialize();
        if (fabricInitialized) {
            console.log('✅ Fabric service ready');
        } else {
            console.log('⚠️ Fabric service initialization failed - running in simulation mode');
        }
    }
};

// Initialize on module load
initializeFabric();

// Middleware to check Fabric service status
const checkFabricStatus = (req, res, next) => {
    if (!fabricInitialized) {
        return res.status(503).json({
            error: 'Blockchain service unavailable',
            message: 'Fabric network is not initialized. Please check network status.',
            fallback: 'Using simulation mode'
        });
    }
    next();
};

// Validation middleware
const validateEvidence = [
    body('evidenceId').notEmpty().withMessage('Evidence ID is required'),
    body('caseId').notEmpty().withMessage('Case ID is required'),
    body('fileName').notEmpty().withMessage('File name is required'),
    body('fileHash').notEmpty().withMessage('File hash is required'),
    body('fileSize').isNumeric().withMessage('File size must be numeric'),
    body('mimeType').notEmpty().withMessage('MIME type is required'),
    body('description').notEmpty().withMessage('Description is required'),
    body('location').notEmpty().withMessage('Location is required'),
    body('collectedBy').notEmpty().withMessage('Collected by is required')
];

const validateCustodyTransfer = [
    body('toUser').notEmpty().withMessage('To user is required'),
    body('reason').notEmpty().withMessage('Reason is required')
];

const validateIntegrityCheck = [
    body('providedHash').notEmpty().withMessage('Provided hash is required')
];

// Get blockchain network status
router.get('/status', authenticateToken, asyncHandler(async (req, res) => {
    const status = await fabricService.getNetworkStatus();
    res.json({
        success: true,
        data: {
            fabric: status,
            initialized: fabricInitialized,
            timestamp: new Date().toISOString()
        }
    });
}));

// Create evidence on blockchain
router.post('/evidence', 
    authenticateToken, 
    requirePermission('evidence:create'),
    validateEvidence,
    checkFabricStatus,
    asyncHandler(async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                error: 'Validation failed',
                details: errors.array()
            });
        }

        const evidenceData = req.body;
        const result = await fabricService.createEvidence(evidenceData);
        
        res.status(201).json({
            success: true,
            data: result,
            message: 'Evidence created on blockchain successfully'
        });
    })
);

// Get evidence from blockchain
router.get('/evidence/:evidenceId', 
    authenticateToken, 
    requirePermission('evidence:read'),
    checkFabricStatus,
    asyncHandler(async (req, res) => {
        const { evidenceId } = req.params;
        const result = await fabricService.getEvidence(evidenceId);
        
        res.json({
            success: true,
            data: result
        });
    })
);

// Get all evidence from blockchain
router.get('/evidence', 
    authenticateToken, 
    requirePermission('evidence:read'),
    checkFabricStatus,
    asyncHandler(async (req, res) => {
        const result = await fabricService.getAllEvidence();
        
        res.json({
            success: true,
            data: result,
            count: result.length
        });
    })
);

// Transfer custody of evidence
router.post('/evidence/:evidenceId/transfer', 
    authenticateToken, 
    requirePermission('evidence:transfer'),
    validateCustodyTransfer,
    checkFabricStatus,
    asyncHandler(async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                error: 'Validation failed',
                details: errors.array()
            });
        }

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
router.post('/evidence/:evidenceId/verify', 
    authenticateToken, 
    requirePermission('evidence:verify'),
    validateIntegrityCheck,
    checkFabricStatus,
    asyncHandler(async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                error: 'Validation failed',
                details: errors.array()
            });
        }

        const { evidenceId } = req.params;
        const { providedHash } = req.body;
        
        const result = await fabricService.verifyIntegrity(evidenceId, providedHash);
        
        res.json({
            success: true,
            data: result,
            message: `Integrity verification ${result.isIntegrityValid ? 'PASSED' : 'FAILED'}`
        });
    })
);

// Get custody chain for evidence
router.get('/evidence/:evidenceId/custody', 
    authenticateToken, 
    requirePermission('evidence:read'),
    checkFabricStatus,
    asyncHandler(async (req, res) => {
        const { evidenceId } = req.params;
        const result = await fabricService.getCustodyChain(evidenceId);
        
        res.json({
            success: true,
            data: result,
            count: result.length
        });
    })
);

// Get evidence by case
router.get('/case/:caseId/evidence', 
    authenticateToken, 
    requirePermission('case:read'),
    checkFabricStatus,
    asyncHandler(async (req, res) => {
        const { caseId } = req.params;
        const result = await fabricService.getEvidenceByCase(caseId);
        
        res.json({
            success: true,
            data: result,
            count: result.length
        });
    })
);

// Update evidence status
router.put('/evidence/:evidenceId/status', 
    authenticateToken, 
    requirePermission('evidence:update'),
    [
        body('status').isIn(['ACTIVE', 'ARCHIVED', 'DESTROYED']).withMessage('Invalid status'),
        body('reason').notEmpty().withMessage('Reason is required')
    ],
    checkFabricStatus,
    asyncHandler(async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                error: 'Validation failed',
                details: errors.array()
            });
        }

        const { evidenceId } = req.params;
        const { status, reason } = req.body;
        
        const result = await fabricService.updateEvidenceStatus(evidenceId, status, reason);
        
        res.json({
            success: true,
            data: result,
            message: `Evidence status updated to ${status}`
        });
    })
);

// Upload file and create evidence (combined operation)
router.post('/evidence/upload', 
    authenticateToken, 
    requirePermission('evidence:create'),
    checkFabricStatus,
    asyncHandler(async (req, res) => {
        // This would integrate with multer for file upload
        // For now, we'll expect the file hash to be calculated client-side
        
        const { 
            evidenceId, 
            caseId, 
            fileName, 
            fileHash, 
            fileSize, 
            mimeType, 
            description, 
            location, 
            collectedBy 
        } = req.body;

        // Validate required fields
        if (!evidenceId || !caseId || !fileName || !fileHash) {
            return res.status(400).json({
                error: 'Missing required fields',
                message: 'evidenceId, caseId, fileName, and fileHash are required'
            });
        }

        const evidenceData = {
            evidenceId,
            caseId,
            fileName,
            fileHash,
            fileSize: parseInt(fileSize),
            mimeType,
            description,
            location,
            collectedBy
        };

        const result = await fabricService.createEvidence(evidenceData);
        
        res.status(201).json({
            success: true,
            data: result,
            message: 'Evidence uploaded and registered on blockchain'
        });
    })
);

// Get blockchain explorer data
router.get('/explorer', 
    authenticateToken, 
    requirePermission('blockchain:explore'),
    checkFabricStatus,
    asyncHandler(async (req, res) => {
        const allEvidence = await fabricService.getAllEvidence();
        
        // Calculate statistics
        const stats = {
            totalEvidence: allEvidence.length,
            activeEvidence: allEvidence.filter(e => e.status === 'ACTIVE').length,
            archivedEvidence: allEvidence.filter(e => e.status === 'ARCHIVED').length,
            destroyedEvidence: allEvidence.filter(e => e.status === 'DESTROYED').length,
            totalCustodyTransfers: allEvidence.reduce((sum, e) => sum + e.custodyChain.length, 0),
            organizations: [...new Set(allEvidence.map(e => e.uploadedBy.split('.')[0]))]
        };

        res.json({
            success: true,
            data: {
                evidence: allEvidence,
                statistics: stats,
                lastUpdated: new Date().toISOString()
            }
        });
    })
);

// Health check endpoint
router.get('/health', asyncHandler(async (req, res) => {
    const status = await fabricService.getNetworkStatus();
    
    res.json({
        status: status.status === 'connected' ? 'healthy' : 'unhealthy',
        fabric: status,
        initialized: fabricInitialized,
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
    });
}));

// Error handling middleware
router.use((error, req, res, next) => {
    console.error('Blockchain route error:', error);
    
    if (error.message.includes('does not exist')) {
        return res.status(404).json({
            error: 'Not found',
            message: error.message
        });
    }
    
    if (error.message.includes('not initialized')) {
        return res.status(503).json({
            error: 'Service unavailable',
            message: 'Blockchain service is not available'
        });
    }
    
    res.status(500).json({
        error: 'Internal server error',
        message: 'An error occurred while processing the blockchain request'
    });
});

module.exports = router;

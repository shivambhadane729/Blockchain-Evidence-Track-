import express from 'express';
import { body, validationResult, query } from 'express-validator';
import { getDatabase } from '../database/init-simple.js';
import { requirePermission, logAudit } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import crypto from 'crypto';

const router = express.Router();

// Validation rules
const transferValidation = [
  body('evidenceId').notEmpty().withMessage('Evidence ID is required'),
  body('toUserId').isInt({ min: 1 }).withMessage('Valid recipient user ID is required'),
  body('toLocation').notEmpty().withMessage('Transfer destination is required'),
  body('transferType').isIn(['handover', 'transport', 'analysis', 'court', 'storage']).withMessage('Invalid transfer type'),
  body('transferReason').optional().isString(),
  body('transferNotes').optional().isString()
];

// Create custody transfer
router.post('/transfer', requirePermission('manage_transfers'), transferValidation, logAudit('CREATE_CUSTODY_TRANSFER', 'CUSTODY'), asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Validation failed',
      code: 'VALIDATION_ERROR',
      details: errors.array()
    });
  }

  const {
    evidenceId,
    toUserId,
    toLocation,
    transferType,
    transferReason,
    transferNotes
  } = req.body;

  const db = getDatabase();

  // Verify evidence exists and get current location
  const evidence = db.prepare(`
    SELECT e.*, c.title as case_title
    FROM evidence e
    JOIN cases c ON e.case_id = c.case_id
    WHERE e.evidence_id = ?
  `).get(evidenceId);

  if (!evidence) {
    return res.status(404).json({
      error: 'Evidence not found',
      code: 'EVIDENCE_NOT_FOUND'
    });
  }

  // Verify recipient user exists
  const recipient = db.prepare(`
    SELECT id, name, role, department FROM users WHERE id = ? AND is_active = TRUE
  `).get(toUserId);

  if (!recipient) {
    return res.status(404).json({
      error: 'Recipient user not found',
      code: 'USER_NOT_FOUND'
    });
  }

  // Check if user has permission to transfer this evidence
  if (req.user.role === 'field-investigating-officer' && evidence.collected_by !== req.user.id) {
    return res.status(403).json({
      error: 'Access denied to transfer this evidence',
      code: 'ACCESS_DENIED'
    });
  }

  // Generate blockchain hash for this transfer
  const transferData = {
    evidenceId,
    fromUserId: req.user.id,
    toUserId,
    fromLocation: evidence.current_location,
    toLocation,
    transferType,
    timestamp: new Date().toISOString()
  };
  
  const blockchainHash = crypto.createHash('sha256')
    .update(JSON.stringify(transferData))
    .digest('hex');

  // Create custody transfer record
  const createTransfer = db.prepare(`
    INSERT INTO custody_chain (
      evidence_id, from_user_id, to_user_id, from_location, 
      to_location, transfer_type, transfer_reason, transfer_notes,
      blockchain_hash, transferred_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
  `);

  const result = createTransfer.run(
    evidenceId,
    req.user.id,
    toUserId,
    evidence.current_location,
    toLocation,
    transferType,
    transferReason || '',
    transferNotes || '',
    blockchainHash
  );

  // Update evidence location and status
  let newStatus = evidence.status;
  if (transferType === 'analysis') {
    newStatus = 'in-analysis';
  } else if (transferType === 'court') {
    newStatus = 'in-court';
  } else if (transferType === 'storage') {
    newStatus = 'stored';
  }

  db.prepare(`
    UPDATE evidence 
    SET current_location = ?, status = ?, updated_at = CURRENT_TIMESTAMP
    WHERE evidence_id = ?
  `).run(toLocation, newStatus, evidenceId);

  // Get created transfer record
  const transferRecord = db.prepare(`
    SELECT cc.*, 
           u1.name as from_user_name, u1.role as from_user_role,
           u2.name as to_user_name, u2.role as to_user_role
    FROM custody_chain cc
    JOIN users u1 ON cc.from_user_id = u1.id
    JOIN users u2 ON cc.to_user_id = u2.id
    WHERE cc.id = ?
  `).get(result.lastInsertRowid);

  res.status(201).json({
    message: 'Custody transfer created successfully',
    transfer: transferRecord
  });
}));

// Get custody chain for evidence
router.get('/evidence/:evidenceId', requirePermission('verify_chain_integrity'), asyncHandler(async (req, res) => {
  const { evidenceId } = req.params;
  const db = getDatabase();

  // Verify evidence exists
  const evidence = db.prepare(`
    SELECT * FROM evidence WHERE evidence_id = ?
  `).get(evidenceId);

  if (!evidence) {
    return res.status(404).json({
      error: 'Evidence not found',
      code: 'EVIDENCE_NOT_FOUND'
    });
  }

  // Get custody chain
  const custodyChain = db.prepare(`
    SELECT cc.*, 
           u1.name as from_user_name, u1.role as from_user_role, u1.department as from_user_department,
           u2.name as to_user_name, u2.role as to_user_role, u2.department as to_user_department
    FROM custody_chain cc
    LEFT JOIN users u1 ON cc.from_user_id = u1.id
    LEFT JOIN users u2 ON cc.to_user_id = u2.id
    WHERE cc.evidence_id = ?
    ORDER BY cc.transferred_at ASC
  `).all(evidenceId);

  // Calculate chain integrity
  const integrityCheck = calculateChainIntegrity(custodyChain);

  res.json({
    evidence: {
      evidenceId: evidence.evidence_id,
      description: evidence.description,
      currentLocation: evidence.current_location,
      status: evidence.status
    },
    custodyChain,
    integrityCheck
  });
}));

// Verify custody transfer
router.post('/verify/:transferId', requirePermission('verify_chain_integrity'), [
  body('isVerified').isBoolean().withMessage('Verification status is required'),
  body('verificationNotes').optional().isString()
], logAudit('VERIFY_CUSTODY_TRANSFER', 'CUSTODY'), asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Validation failed',
      code: 'VALIDATION_ERROR',
      details: errors.array()
    });
  }

  const { transferId } = req.params;
  const { isVerified, verificationNotes } = req.body;
  const db = getDatabase();

  // Get transfer record
  const transfer = db.prepare(`
    SELECT * FROM custody_chain WHERE id = ?
  `).get(transferId);

  if (!transfer) {
    return res.status(404).json({
      error: 'Transfer record not found',
      code: 'TRANSFER_NOT_FOUND'
    });
  }

  // Update verification status
  db.prepare(`
    UPDATE custody_chain 
    SET is_verified = ?, verified_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(isVerified, transferId);

  // Get updated transfer record
  const updatedTransfer = db.prepare(`
    SELECT cc.*, 
           u1.name as from_user_name, u1.role as from_user_role,
           u2.name as to_user_name, u2.role as to_user_role
    FROM custody_chain cc
    LEFT JOIN users u1 ON cc.from_user_id = u1.id
    LEFT JOIN users u2 ON cc.to_user_id = u2.id
    WHERE cc.id = ?
  `).get(transferId);

  res.json({
    message: `Transfer ${isVerified ? 'verified' : 'rejected'} successfully`,
    transfer: updatedTransfer
  });
}));

// Get custody anomalies
router.get('/anomalies', requirePermission('verify_chain_integrity'), [
  query('severity').optional().isIn(['low', 'medium', 'high', 'critical']).withMessage('Invalid severity level'),
  query('resolved').optional().isBoolean().withMessage('Resolved must be boolean')
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Validation failed',
      code: 'VALIDATION_ERROR',
      details: errors.array()
    });
  }

  const { severity, resolved } = req.query;
  const db = getDatabase();

  // Get all custody chains and detect anomalies
  const allTransfers = db.prepare(`
    SELECT cc.*, 
           u1.name as from_user_name, u1.role as from_user_role,
           u2.name as to_user_name, u2.role as to_user_role,
           e.description as evidence_description,
           c.title as case_title
    FROM custody_chain cc
    LEFT JOIN users u1 ON cc.from_user_id = u1.id
    LEFT JOIN users u2 ON cc.to_user_id = u2.id
    JOIN evidence e ON cc.evidence_id = e.evidence_id
    JOIN cases c ON e.case_id = c.case_id
    ORDER BY cc.transferred_at ASC
  `).all();

  const anomalies = detectCustodyAnomalies(allTransfers);

  // Filter by severity and resolved status
  let filteredAnomalies = anomalies;
  if (severity) {
    filteredAnomalies = filteredAnomalies.filter(a => a.severity === severity);
  }
  if (resolved !== undefined) {
    filteredAnomalies = filteredAnomalies.filter(a => a.resolved === (resolved === 'true'));
  }

  res.json({
    anomalies: filteredAnomalies,
    total: filteredAnomalies.length
  });
}));

// Get custody statistics
router.get('/stats/overview', asyncHandler(async (req, res) => {
  const db = getDatabase();

  // Get transfer counts by type
  const transferTypeStats = db.prepare(`
    SELECT transfer_type, COUNT(*) as count
    FROM custody_chain
    GROUP BY transfer_type
  `).all();

  // Get verification statistics
  const verificationStats = db.prepare(`
    SELECT 
      COUNT(*) as total_transfers,
      SUM(CASE WHEN is_verified = 1 THEN 1 ELSE 0 END) as verified_transfers,
      SUM(CASE WHEN is_verified = 0 THEN 1 ELSE 0 END) as unverified_transfers
    FROM custody_chain
  `).get();

  // Get recent transfers
  const recentTransfers = db.prepare(`
    SELECT cc.*, 
           u1.name as from_user_name,
           u2.name as to_user_name,
           e.description as evidence_description
    FROM custody_chain cc
    LEFT JOIN users u1 ON cc.from_user_id = u1.id
    LEFT JOIN users u2 ON cc.to_user_id = u2.id
    JOIN evidence e ON cc.evidence_id = e.evidence_id
    ORDER BY cc.transferred_at DESC
    LIMIT 10
  `).all();

  res.json({
    transferTypeStats,
    verificationStats,
    recentTransfers
  });
}));

// Helper function to calculate chain integrity
function calculateChainIntegrity(custodyChain) {
  if (custodyChain.length === 0) {
    return {
      isIntact: true,
      score: 100,
      issues: []
    };
  }

  const issues = [];
  let score = 100;

  // Check for gaps in chain
  for (let i = 1; i < custodyChain.length; i++) {
    const prev = custodyChain[i - 1];
    const current = custodyChain[i];
    
    if (prev.to_location !== current.from_location) {
      issues.push({
        type: 'location_gap',
        description: `Location mismatch between transfers ${prev.id} and ${current.id}`,
        severity: 'high'
      });
      score -= 20;
    }
  }

  // Check for unverified transfers
  const unverifiedCount = custodyChain.filter(t => !t.is_verified).length;
  if (unverifiedCount > 0) {
    issues.push({
      type: 'unverified_transfers',
      description: `${unverifiedCount} unverified transfers in chain`,
      severity: unverifiedCount > 2 ? 'high' : 'medium'
    });
    score -= unverifiedCount * 10;
  }

  // Check for time gaps
  for (let i = 1; i < custodyChain.length; i++) {
    const prev = new Date(custodyChain[i - 1].transferred_at);
    const current = new Date(custodyChain[i].transferred_at);
    const timeDiff = (current - prev) / (1000 * 60 * 60); // hours
    
    if (timeDiff > 24) {
      issues.push({
        type: 'time_gap',
        description: `Gap of ${Math.round(timeDiff)} hours between transfers`,
        severity: timeDiff > 72 ? 'high' : 'medium'
      });
      score -= Math.min(15, timeDiff / 24 * 5);
    }
  }

  return {
    isIntact: issues.length === 0,
    score: Math.max(0, Math.round(score)),
    issues
  };
}

// Helper function to detect custody anomalies
function detectCustodyAnomalies(transfers) {
  const anomalies = [];
  const transfersByEvidence = {};

  // Group transfers by evidence
  transfers.forEach(transfer => {
    if (!transfersByEvidence[transfer.evidence_id]) {
      transfersByEvidence[transfer.evidence_id] = [];
    }
    transfersByEvidence[transfer.evidence_id].push(transfer);
  });

  // Check each evidence chain
  Object.entries(transfersByEvidence).forEach(([evidenceId, evidenceTransfers]) => {
    const sortedTransfers = evidenceTransfers.sort((a, b) => 
      new Date(a.transferred_at) - new Date(b.transferred_at)
    );

    // Check for location gaps
    for (let i = 1; i < sortedTransfers.length; i++) {
      const prev = sortedTransfers[i - 1];
      const current = sortedTransfers[i];
      
      if (prev.to_location !== current.from_location) {
        anomalies.push({
          id: `ANOM-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          evidenceId,
          caseId: evidenceTransfers[0].case_title,
          type: 'location_gap',
          description: `Location gap: ${prev.to_location} → ${current.from_location}`,
          severity: 'high',
          timestamp: current.transferred_at,
          resolved: false
        });
      }
    }

    // Check for time gaps
    for (let i = 1; i < sortedTransfers.length; i++) {
      const prev = new Date(sortedTransfers[i - 1].transferred_at);
      const current = new Date(sortedTransfers[i].transferred_at);
      const timeDiff = (current - prev) / (1000 * 60 * 60); // hours
      
      if (timeDiff > 24) {
        anomalies.push({
          id: `ANOM-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          evidenceId,
          caseId: evidenceTransfers[0].case_title,
          type: 'time_gap',
          description: `Gap of ${Math.round(timeDiff)} hours in custody chain`,
          severity: timeDiff > 72 ? 'critical' : 'high',
          timestamp: current.transferred_at,
          resolved: false
        });
      }
    }

    // Check for unverified transfers
    const unverifiedTransfers = sortedTransfers.filter(t => !t.is_verified);
    if (unverifiedTransfers.length > 0) {
      anomalies.push({
        id: `ANOM-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        evidenceId,
        caseId: evidenceTransfers[0].case_title,
        type: 'unverified_transfers',
        description: `${unverifiedTransfers.length} unverified transfers`,
        severity: unverifiedTransfers.length > 2 ? 'high' : 'medium',
        timestamp: new Date().toISOString(),
        resolved: false
      });
    }
  });

  return anomalies;
}

export default router;

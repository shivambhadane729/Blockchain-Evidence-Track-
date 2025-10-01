import express from 'express';
import multer from 'multer';
import path from 'path';
import crypto from 'crypto';
import fs from 'fs';
import { body, validationResult, query } from 'express-validator';
import { getDatabase } from '../database/init-simple.js';
import { requirePermission, logAudit } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { v4 as uuidv4 } from 'uuid';
import { hashEvidence, recordEvidence } from '../../blockchain/services/blockchain.js';

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = process.env.UPLOAD_PATH || './uploads';
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = (process.env.ALLOWED_FILE_TYPES || 'pdf,doc,docx,jpg,jpeg,png,mp4,avi,mov').split(',');
  const fileExt = path.extname(file.originalname).toLowerCase().substring(1);
  
  if (allowedTypes.includes(fileExt)) {
    cb(null, true);
  } else {
    cb(new Error(`File type .${fileExt} is not allowed`), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024 // 10MB default
  }
});

// Helper function to calculate file hash
function calculateFileHash(filePath) {
  return new Promise((resolve, reject) => {
    const hash = crypto.createHash('sha256');
    const stream = fs.createReadStream(filePath);
    
    stream.on('data', (data) => hash.update(data));
    stream.on('end', () => resolve(hash.digest('hex')));
    stream.on('error', reject);
  });
}

// Upload evidence
router.post('/upload', requirePermission('upload_evidence'), upload.single('file'), [
  body('caseId').notEmpty().withMessage('Case ID is required'),
  body('description').notEmpty().withMessage('Evidence description is required'),
  body('evidenceType').isIn(['document', 'image', 'video', 'audio', 'physical', 'digital']).withMessage('Invalid evidence type'),
  body('currentLocation').notEmpty().withMessage('Current location is required')
], logAudit('UPLOAD_EVIDENCE', 'EVIDENCE'), asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Validation failed',
      code: 'VALIDATION_ERROR',
      details: errors.array()
    });
  }

  if (!req.file) {
    return res.status(400).json({
      error: 'No file uploaded',
      code: 'NO_FILE_UPLOADED'
    });
  }

  const { caseId, description, evidenceType, currentLocation, dueDate, transferTo } = req.body;
  const db = getDatabase();

  // Verify case exists and user has access
  const caseData = db.prepare(`
    SELECT * FROM cases WHERE case_id = ?
  `).get(caseId);

  if (!caseData) {
    return res.status(404).json({
      error: 'Case not found',
      code: 'CASE_NOT_FOUND'
    });
  }

  // Check access permissions
  if (req.user.role === 'field-investigating-officer' && caseData.officer_id !== req.user.id) {
    return res.status(403).json({
      error: 'Access denied to this case',
      code: 'ACCESS_DENIED'
    });
  }

  // Calculate file hash
  const fileHash = await calculateFileHash(req.file.path);

  // Generate evidence ID
  const year = new Date().getFullYear();
  const randomNum = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  const evidenceId = `EVID-${year}-${randomNum}`;

  // Save evidence record
  const createEvidence = db.prepare(`
    INSERT INTO evidence (
      evidence_id, case_id, description, evidence_type, file_path, 
      file_hash, file_size, mime_type, current_location, status,
      collected_by, due_date, transfer_to, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
  `);

  const result = createEvidence.run(
    evidenceId,
    caseId,
    description,
    evidenceType,
    req.file.path,
    fileHash,
    req.file.size,
    req.file.mimetype,
    currentLocation,
    'stored',
    req.user.id,
    dueDate || null,
    transferTo || null
  );

  // Get created evidence
  const newEvidence = db.prepare(`
    SELECT e.*, u.name as collected_by_name, c.title as case_title
    FROM evidence e
    JOIN users u ON e.collected_by = u.id
    JOIN cases c ON e.case_id = c.case_id
    WHERE e.id = ?
  `).get(result.lastInsertRowid);

  // Blockchain Integration: Record evidence on blockchain
  try {
    console.log('🔗 Recording evidence on blockchain...');
    
    // Read the uploaded file for blockchain hashing
    const fileBuffer = fs.readFileSync(req.file.path);
    
    // Hash the evidence file using blockchain service
    const blockchainHash = await hashEvidence(fileBuffer);
    console.log('🔐 Evidence blockchain hash generated:', blockchainHash);

    // Record evidence on blockchain
    const blockchainResult = await recordEvidence({
      evidenceId: newEvidence.evidence_id,
      caseId: newEvidence.case_id,
      officerId: req.user.id,
      fileHash: blockchainHash,
      fileName: req.file.originalname,
      fileSize: req.file.size,
      evidenceType: newEvidence.evidence_type,
      description: newEvidence.description
    });

    console.log('✅ Evidence recorded on blockchain:', blockchainResult);

    // Update evidence with blockchain info
    const updateEvidence = db.prepare(`
      UPDATE evidence 
      SET blockchain_hash = ?, blockchain_transaction_id = ?, blockchain_block_number = ?
      WHERE id = ?
    `);
    
    updateEvidence.run(
      blockchainHash,
      blockchainResult.transactionId,
      blockchainResult.blockNumber,
      newEvidence.id
    );

    // Add blockchain info to response
    newEvidence.blockchain_hash = blockchainHash;
    newEvidence.blockchain_transaction_id = blockchainResult.transactionId;
    newEvidence.blockchain_block_number = blockchainResult.blockNumber;

  } catch (blockchainError) {
    console.error('❌ Blockchain recording failed:', blockchainError.message);
    // Don't fail the evidence upload if blockchain fails
    newEvidence.blockchain_error = blockchainError.message;
  }

  res.status(201).json({
    message: 'Evidence uploaded successfully',
    evidence: newEvidence,
    blockchain: {
      hash: newEvidence.blockchain_hash,
      transactionId: newEvidence.blockchain_transaction_id,
      blockNumber: newEvidence.blockchain_block_number,
      error: newEvidence.blockchain_error
    }
  });
}));

// Get evidence by case ID
router.get('/case/:caseId', requirePermission('view_evidence'), asyncHandler(async (req, res) => {
  const { caseId } = req.params;
  const db = getDatabase();

  // Verify case access
  const caseData = db.prepare(`
    SELECT * FROM cases WHERE case_id = ?
  `).get(caseId);

  if (!caseData) {
    return res.status(404).json({
      error: 'Case not found',
      code: 'CASE_NOT_FOUND'
    });
  }

  // Check access permissions
  if (req.user.role === 'field-investigating-officer' && caseData.officer_id !== req.user.id) {
    return res.status(403).json({
      error: 'Access denied to this case',
      code: 'ACCESS_DENIED'
    });
  }

  // Get evidence for this case
  const evidence = db.prepare(`
    SELECT e.*, u.name as collected_by_name
    FROM evidence e
    JOIN users u ON e.collected_by = u.id
    WHERE e.case_id = ?
    ORDER BY e.collected_at DESC
  `).all(caseId);

  res.json({
    evidence,
    case: caseData
  });
}));

// Get evidence by ID
router.get('/:evidenceId', requirePermission('view_evidence'), asyncHandler(async (req, res) => {
  const { evidenceId } = req.params;
  const db = getDatabase();

  const evidence = db.prepare(`
    SELECT e.*, u.name as collected_by_name, c.title as case_title
    FROM evidence e
    JOIN users u ON e.collected_by = u.id
    JOIN cases c ON e.case_id = c.case_id
    WHERE e.evidence_id = ?
  `).get(evidenceId);

  if (!evidence) {
    return res.status(404).json({
      error: 'Evidence not found',
      code: 'EVIDENCE_NOT_FOUND'
    });
  }

  // Check access permissions
  if (req.user.role === 'field-investigating-officer' && evidence.collected_by !== req.user.id) {
    return res.status(403).json({
      error: 'Access denied to this evidence',
      code: 'ACCESS_DENIED'
    });
  }

  // Get custody chain for this evidence
  const custodyChain = db.prepare(`
    SELECT cc.*, 
           u1.name as from_user_name,
           u2.name as to_user_name
    FROM custody_chain cc
    LEFT JOIN users u1 ON cc.from_user_id = u1.id
    LEFT JOIN users u2 ON cc.to_user_id = u2.id
    WHERE cc.evidence_id = ?
    ORDER BY cc.transferred_at ASC
  `).all(evidenceId);

  res.json({
    evidence,
    custodyChain
  });
}));

// Verify evidence hash
router.post('/:evidenceId/verify-hash', requirePermission('verify_evidence_integrity'), [
  body('providedHash').notEmpty().withMessage('Hash to verify is required')
], logAudit('VERIFY_EVIDENCE_HASH', 'EVIDENCE'), asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Validation failed',
      code: 'VALIDATION_ERROR',
      details: errors.array()
    });
  }

  const { evidenceId } = req.params;
  const { providedHash } = req.body;
  const db = getDatabase();

  const evidence = db.prepare(`
    SELECT * FROM evidence WHERE evidence_id = ?
  `).get(evidenceId);

  if (!evidence) {
    return res.status(404).json({
      error: 'Evidence not found',
      code: 'EVIDENCE_NOT_FOUND'
    });
  }

  // Check if file still exists
  if (!fs.existsSync(evidence.file_path)) {
    return res.status(404).json({
      error: 'Evidence file not found on disk',
      code: 'FILE_NOT_FOUND'
    });
  }

  // Calculate current file hash
  const currentHash = await calculateFileHash(evidence.file_path);
  const isMatch = currentHash === providedHash;

  // Update verification status
  db.prepare(`
    UPDATE evidence 
    SET updated_at = CURRENT_TIMESTAMP
    WHERE evidence_id = ?
  `).run(evidenceId);

  res.json({
    isMatch,
    storedHash: evidence.file_hash,
    currentHash,
    providedHash,
    evidenceId,
    verifiedAt: new Date().toISOString()
  });
}));

// Update evidence location
router.patch('/:evidenceId/location', requirePermission('track_evidence_location'), [
  body('newLocation').notEmpty().withMessage('New location is required'),
  body('notes').optional().isString()
], logAudit('UPDATE_EVIDENCE_LOCATION', 'EVIDENCE'), asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Validation failed',
      code: 'VALIDATION_ERROR',
      details: errors.array()
    });
  }

  const { evidenceId } = req.params;
  const { newLocation, notes } = req.body;
  const db = getDatabase();

  const evidence = db.prepare(`
    SELECT * FROM evidence WHERE evidence_id = ?
  `).get(evidenceId);

  if (!evidence) {
    return res.status(404).json({
      error: 'Evidence not found',
      code: 'EVIDENCE_NOT_FOUND'
    });
  }

  const oldLocation = evidence.current_location;

  // Update location
  db.prepare(`
    UPDATE evidence 
    SET current_location = ?, updated_at = CURRENT_TIMESTAMP
    WHERE evidence_id = ?
  `).run(newLocation, evidenceId);

  // Log location change in custody chain
  db.prepare(`
    INSERT INTO custody_chain (
      evidence_id, from_user_id, to_user_id, from_location, 
      to_location, transfer_type, transfer_reason, transferred_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
  `).run(
    evidenceId,
    req.user.id,
    req.user.id,
    oldLocation,
    newLocation,
    'location_update',
    notes || 'Location updated'
  );

  res.json({
    message: 'Evidence location updated successfully',
    evidenceId,
    oldLocation,
    newLocation
  });
}));

// Get evidence statistics
router.get('/stats/overview', asyncHandler(async (req, res) => {
  const db = getDatabase();

  // Build WHERE clause based on user role
  let whereClause = 'WHERE 1=1';
  const params = [];

  if (req.user.role === 'field-investigating-officer') {
    whereClause += ' AND e.collected_by = ?';
    params.push(req.user.id);
  } else if (req.user.role === 'station-house-officer') {
    whereClause += ' AND c.jurisdiction = ?';
    params.push(req.user.department || '');
  }

  // Get evidence counts by type
  const typeStats = db.prepare(`
    SELECT e.evidence_type, COUNT(*) as count
    FROM evidence e
    JOIN cases c ON e.case_id = c.case_id
    ${whereClause}
    GROUP BY e.evidence_type
  `).all(...params);

  // Get evidence counts by status
  const statusStats = db.prepare(`
    SELECT e.status, COUNT(*) as count
    FROM evidence e
    JOIN cases c ON e.case_id = c.case_id
    ${whereClause}
    GROUP BY e.status
  `).all(...params);

  // Get recent evidence
  const recentEvidence = db.prepare(`
    SELECT e.evidence_id, e.description, e.evidence_type, e.status, e.collected_at, c.title as case_title
    FROM evidence e
    JOIN cases c ON e.case_id = c.case_id
    ${whereClause}
    ORDER BY e.collected_at DESC
    LIMIT 10
  `).all(...params);

  res.json({
    typeStats,
    statusStats,
    recentEvidence
  });
}));

// Download evidence file
router.get('/:evidenceId/download', requirePermission('view_evidence'), asyncHandler(async (req, res) => {
  const { evidenceId } = req.params;
  const db = getDatabase();

  const evidence = db.prepare(`
    SELECT * FROM evidence WHERE evidence_id = ?
  `).get(evidenceId);

  if (!evidence) {
    return res.status(404).json({
      error: 'Evidence not found',
      code: 'EVIDENCE_NOT_FOUND'
    });
  }

  // Check access permissions
  if (req.user.role === 'field-investigating-officer' && evidence.collected_by !== req.user.id) {
    return res.status(403).json({
      error: 'Access denied to this evidence',
      code: 'ACCESS_DENIED'
    });
  }

  // Check if file exists
  if (!fs.existsSync(evidence.file_path)) {
    return res.status(404).json({
      error: 'Evidence file not found on disk',
      code: 'FILE_NOT_FOUND'
    });
  }

  // Set appropriate headers
  res.setHeader('Content-Type', evidence.mime_type);
  res.setHeader('Content-Disposition', `attachment; filename="${evidence.evidence_id}${path.extname(evidence.file_path)}"`);
  res.setHeader('X-Evidence-ID', evidence.evidence_id);
  res.setHeader('X-File-Hash', evidence.file_hash);

  // Stream the file
  const fileStream = fs.createReadStream(evidence.file_path);
  fileStream.pipe(res);

  // Log download
  const auditLog = db.prepare(`
    INSERT INTO audit_logs (user_id, action, resource_type, resource_id, details, ip_address, user_agent)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  
  auditLog.run(
    req.user.id,
    'DOWNLOAD_EVIDENCE',
    'EVIDENCE',
    evidenceId,
    JSON.stringify({ filePath: evidence.file_path }),
    req.ip || req.connection.remoteAddress,
    req.get('User-Agent') || 'Unknown'
  );
}));

export default router;

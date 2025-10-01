import express from 'express';
import { body, validationResult, query } from 'express-validator';
import { getDatabase } from '../database/init-simple.js';
import { requirePermission, logAudit } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { v4 as uuidv4 } from 'uuid';
// import { hashEvidence, recordEvidence } from '../../blockchain/services/blockchain.js';

const router = express.Router();

// Validation rules
const caseValidation = [
  body('title').notEmpty().withMessage('Case title is required'),
  body('description').notEmpty().withMessage('Case description is required'),
  body('category').notEmpty().withMessage('Case category is required'),
  body('priority').isIn(['low', 'medium', 'high', 'critical']).withMessage('Invalid priority level'),
  body('incidentDate').notEmpty().withMessage('Valid incident date is required'),
  body('location').notEmpty().withMessage('Incident location is required'),
  body('jurisdiction').notEmpty().withMessage('Jurisdiction is required'),
  body('initialNotes').optional().isString(),
  body('tags').optional().isString()
];

// Create new case
router.post('/', caseValidation, asyncHandler(async (req, res) => {
  console.log('📝 Received case data:', JSON.stringify(req.body, null, 2));
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.log('❌ Validation errors:', errors.array());
    return res.status(400).json({
      error: 'Validation failed',
      code: 'VALIDATION_ERROR',
      details: errors.array()
    });
  }

  const {
    title,
    description,
    category,
    priority,
    incidentDate,
    location,
    jurisdiction,
    initialNotes,
    tags
  } = req.body;

  const db = getDatabase();

  // Generate case ID
  const year = new Date().getFullYear();
  const randomNum = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  const caseId = `CASE-${year}-${randomNum}`;

  // Create case
  const createCase = db.prepare(`
    INSERT INTO cases (
      case_id, title, description, category, priority, incident_date, 
      incident_location, assigned_officer, created_by, case_number, case_title, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
  `);

  // Use default officer info since we're not using authentication
  const defaultOfficerId = 'rajesh.kumar@police.gov.in';
  const defaultOfficerName = 'Rajesh Kumar';
  const defaultOfficerEmail = 'rajesh.kumar@police.gov.in';

  const result = createCase.run(
    caseId,
    title,
    description,
    category,
    priority,
    incidentDate,
    location, // incident_location
    defaultOfficerId, // assigned_officer
    defaultOfficerId, // created_by
    caseId, // case_number (same as case_id)
    title   // case_title (same as title)
  );

  // Get created case
  const newCase = db.prepare(`
    SELECT c.*
    FROM cases c
    WHERE c.id = ?
  `).get(result.lastInsertRowid);

  // Blockchain Integration: Record case metadata on blockchain
  // Temporarily disabled for testing
  /*
  try {
    console.log('🔗 Recording case on blockchain...');
    
    // Create case metadata for blockchain
    const caseMetadata = {
      caseId: newCase.case_id,
      title: newCase.title,
      description: newCase.description,
      category: newCase.category,
      priority: newCase.priority,
      incidentDate: newCase.incident_date,
      location: newCase.incident_location,
      createdBy: newCase.created_by,
      createdAt: newCase.created_at,
      status: newCase.status
    };

    // Hash the case metadata
    const caseHash = await hashEvidence(Buffer.from(JSON.stringify(caseMetadata)));
    console.log('🔐 Case hash generated:', caseHash);

    // Record on blockchain
    const blockchainResult = await recordEvidence({
      evidenceId: `CASE-${newCase.case_id}`,
      caseId: newCase.case_id,
      officerId: defaultOfficerId,
      fileHash: caseHash,
      fileName: `case-${newCase.case_id}.json`,
      fileSize: JSON.stringify(caseMetadata).length,
      evidenceType: 'case_metadata',
      description: `Case registration metadata for ${newCase.title}`
    });

    console.log('✅ Case recorded on blockchain:', blockchainResult);

    // Update case with blockchain info
    const updateCase = db.prepare(`
      UPDATE cases 
      SET blockchain_hash = ?, blockchain_transaction_id = ?, blockchain_block_number = ?
      WHERE id = ?
    `);
    
    updateCase.run(
      caseHash,
      blockchainResult.transactionId,
      blockchainResult.blockNumber,
      newCase.id
    );

    // Add blockchain info to response
    newCase.blockchain_hash = caseHash;
    newCase.blockchain_transaction_id = blockchainResult.transactionId;
    newCase.blockchain_block_number = blockchainResult.blockNumber;

  } catch (blockchainError) {
    console.error('❌ Blockchain recording failed:', blockchainError.message);
    // Don't fail the case creation if blockchain fails
    newCase.blockchain_error = blockchainError.message;
  }
  */

  res.status(201).json({
    message: 'Case created successfully',
    case: newCase
  });
}));

// Get all cases (with filtering and pagination) - No auth required for now
router.get('/', [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('status').optional().isIn(['registered', 'under-investigation', 'closed']).withMessage('Invalid status'),
  query('priority').optional().isIn(['low', 'medium', 'high', 'critical']).withMessage('Invalid priority'),
  query('category').optional().isString().withMessage('Category must be a string'),
  query('search').optional().isString().withMessage('Search must be a string')
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Validation failed',
      code: 'VALIDATION_ERROR',
      details: errors.array()
    });
  }

  const {
    page = 1,
    limit = 20,
    status,
    priority,
    category,
    search
  } = req.query;

  const db = getDatabase();
  const offset = (page - 1) * limit;

  // Build WHERE clause based on user role and filters
  let whereClause = 'WHERE 1=1';
  const params = [];

  // Role-based access control - temporarily disabled
  // if (req.user && req.user.role === 'field-investigating-officer') {
  //   whereClause += ' AND c.officer_id = ?';
  //   params.push(req.user.id);
  // } else if (req.user && req.user.role === 'station-house-officer') {
  //   // SHO can see all cases in their jurisdiction
  //   whereClause += ' AND c.jurisdiction = ?';
  //   params.push(req.user.department || '');
  // }

  // Apply filters
  if (status) {
    whereClause += ' AND c.status = ?';
    params.push(status);
  }
  if (priority) {
    whereClause += ' AND c.priority = ?';
    params.push(priority);
  }
  if (category) {
    whereClause += ' AND c.category = ?';
    params.push(category);
  }
  if (search) {
    whereClause += ' AND (c.title LIKE ? OR c.description LIKE ? OR c.case_id LIKE ?)';
    const searchTerm = `%${search}%`;
    params.push(searchTerm, searchTerm, searchTerm);
  }

  // Get total count
  const countQuery = `
    SELECT COUNT(*) as total
    FROM cases c
    ${whereClause}
  `;
  const totalResult = db.prepare(countQuery).get(...params);
  const total = totalResult.total;

  // Get cases with pagination
  const casesQuery = `
    SELECT c.*, 
           COUNT(e.id) as evidence_count
    FROM cases c
    LEFT JOIN evidence e ON c.case_id = e.case_id
    ${whereClause}
    GROUP BY c.id
    ORDER BY c.created_at DESC
    LIMIT ? OFFSET ?
  `;
  
  const casesResult = db.prepare(casesQuery).all(...params, limit, offset);
  console.log('🔍 Cases query result:', casesResult);
  console.log('🔍 Query params:', [...params, limit, offset]);
  const cases = Array.isArray(casesResult) ? casesResult : (casesResult ? [casesResult] : []);

  res.json({
    cases,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / limit)
    }
  });
}));

// Get case by ID
router.get('/:caseId', asyncHandler(async (req, res) => {
  const { caseId } = req.params;
  const db = getDatabase();

  const caseData = db.prepare(`
    SELECT c.*, u.name as officer_name, u.email as officer_contact
    FROM cases c
    JOIN users u ON c.officer_id = u.id
    WHERE c.case_id = ?
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
      error: 'Access denied',
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

  // Get custody chain for this case
  const custodyChain = db.prepare(`
    SELECT cc.*, 
           u1.name as from_user_name,
           u2.name as to_user_name
    FROM custody_chain cc
    LEFT JOIN users u1 ON cc.from_user_id = u1.id
    LEFT JOIN users u2 ON cc.to_user_id = u2.id
    WHERE cc.evidence_id IN (
      SELECT evidence_id FROM evidence WHERE case_id = ?
    )
    ORDER BY cc.transferred_at ASC
  `).all(caseId);

  res.json({
    case: caseData,
    evidence,
    custodyChain
  });
}));

// Update case status
router.patch('/:caseId/status', requirePermission('update_case_status'), [
  body('status').isIn(['registered', 'under-investigation', 'closed']).withMessage('Invalid status'),
  body('notes').optional().isString()
], logAudit('UPDATE_CASE_STATUS', 'CASE'), asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Validation failed',
      code: 'VALIDATION_ERROR',
      details: errors.array()
    });
  }

  const { caseId } = req.params;
  const { status, notes } = req.body;
  const db = getDatabase();

  // Check if case exists
  const caseData = db.prepare(`
    SELECT * FROM cases WHERE case_id = ?
  `).get(caseId);

  if (!caseData) {
    return res.status(404).json({
      error: 'Case not found',
      code: 'CASE_NOT_FOUND'
    });
  }

  // Update case status
  db.prepare(`
    UPDATE cases 
    SET status = ?, updated_at = CURRENT_TIMESTAMP
    WHERE case_id = ?
  `).run(status, caseId);

  // Log status change
  if (notes) {
    const auditLog = db.prepare(`
      INSERT INTO audit_logs (user_id, action, resource_type, resource_id, details, ip_address, user_agent)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    
    auditLog.run(
      req.user.id,
      'UPDATE_CASE_STATUS',
      'CASE',
      caseId,
      JSON.stringify({ status, notes }),
      req.ip || req.connection.remoteAddress,
      req.get('User-Agent') || 'Unknown'
    );
  }

  // Get updated case
  const updatedCase = db.prepare(`
    SELECT c.*, u.name as officer_name, u.email as officer_contact
    FROM cases c
    JOIN users u ON c.officer_id = u.id
    WHERE c.case_id = ?
  `).get(caseId);

  res.json({
    message: 'Case status updated successfully',
    case: updatedCase
  });
}));

// Get case statistics
router.get('/stats/overview', asyncHandler(async (req, res) => {
  const db = getDatabase();

  // Build WHERE clause based on user role
  let whereClause = 'WHERE 1=1';
  const params = [];

  if (req.user.role === 'field-investigating-officer') {
    whereClause += ' AND officer_id = ?';
    params.push(req.user.id);
  } else if (req.user.role === 'station-house-officer') {
    whereClause += ' AND jurisdiction = ?';
    params.push(req.user.department || '');
  }

  // Get case counts by status
  const statusStats = db.prepare(`
    SELECT status, COUNT(*) as count
    FROM cases
    ${whereClause}
    GROUP BY status
  `).all(...params);

  // Get case counts by priority
  const priorityStats = db.prepare(`
    SELECT priority, COUNT(*) as count
    FROM cases
    ${whereClause}
    GROUP BY priority
  `).all(...params);

  // Get case counts by category
  const categoryStats = db.prepare(`
    SELECT category, COUNT(*) as count
    FROM cases
    ${whereClause}
    GROUP BY category
  `).all(...params);

  // Get recent cases
  const recentCases = db.prepare(`
    SELECT case_id, title, status, priority, created_at
    FROM cases
    ${whereClause}
    ORDER BY created_at DESC
    LIMIT 5
  `).all(...params);

  res.json({
    statusStats,
    priorityStats,
    categoryStats,
    recentCases
  });
}));

// Search cases
router.get('/search/:query', asyncHandler(async (req, res) => {
  const { query: searchQuery } = req.params;
  const db = getDatabase();

  // Build WHERE clause based on user role
  let whereClause = 'WHERE (c.title LIKE ? OR c.description LIKE ? OR c.case_id LIKE ?)';
  const params = [`%${searchQuery}%`, `%${searchQuery}%`, `%${searchQuery}%`];

  if (req.user.role === 'field-investigating-officer') {
    whereClause += ' AND c.officer_id = ?';
    params.push(req.user.id);
  } else if (req.user.role === 'station-house-officer') {
    whereClause += ' AND c.jurisdiction = ?';
    params.push(req.user.department || '');
  }

  const cases = db.prepare(`
    SELECT c.*, u.name as officer_name, u.email as officer_contact
    FROM cases c
    JOIN users u ON c.officer_id = u.id
    ${whereClause}
    ORDER BY c.created_at DESC
    LIMIT 20
  `).all(...params);

  res.json({
    cases,
    query: searchQuery
  });
}));

export default router;

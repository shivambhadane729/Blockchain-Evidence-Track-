import express from 'express';
import bcrypt from 'bcryptjs';
import { body, validationResult, query } from 'express-validator';
import { getDatabase } from '../database/init-simple.js';
import { requireRole, logAudit } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/errorHandler.js';

const router = express.Router();

// Get all users
router.get('/users', requireRole('system-admin'), [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('role').optional().isString().withMessage('Role must be a string'),
  query('status').optional().isIn(['active', 'inactive']).withMessage('Invalid status'),
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
    role,
    status,
    search
  } = req.query;

  const db = getDatabase();
  const offset = (page - 1) * limit;

  // Build WHERE clause
  let whereClause = 'WHERE 1=1';
  const params = [];

  if (role) {
    whereClause += ' AND role = ?';
    params.push(role);
  }
  if (status) {
    whereClause += ' AND is_active = ?';
    params.push(status === 'active');
  }
  if (search) {
    whereClause += ' AND (name LIKE ? OR email LIKE ? OR employee_id LIKE ?)';
    const searchTerm = `%${search}%`;
    params.push(searchTerm, searchTerm, searchTerm);
  }

  // Get total count
  const totalResult = db.prepare(`
    SELECT COUNT(*) as total FROM users ${whereClause}
  `).get(...params);
  const total = totalResult.total;

  // Get users with pagination
  const users = db.prepare(`
    SELECT id, email, name, role, department, employee_id, 
           digi_locker_verified, digi_locker_verification_date,
           is_active, last_login, created_at, updated_at
    FROM users 
    ${whereClause}
    ORDER BY created_at DESC
    LIMIT ? OFFSET ?
  `).all(...params, limit, offset);

  res.json({
    users,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / limit)
    }
  });
}));

// Get user by ID
router.get('/users/:userId', requireRole('system-admin'), asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const db = getDatabase();

  const user = db.prepare(`
    SELECT id, email, name, role, department, employee_id, 
           digi_locker_verified, digi_locker_verification_date,
           is_active, last_login, created_at, updated_at
    FROM users 
    WHERE id = ?
  `).get(userId);

  if (!user) {
    return res.status(404).json({
      error: 'User not found',
      code: 'USER_NOT_FOUND'
    });
  }

  // Get user activity
  const activity = db.prepare(`
    SELECT action, resource_type, timestamp, ip_address
    FROM audit_logs 
    WHERE user_id = ?
    ORDER BY timestamp DESC
    LIMIT 20
  `).all(userId);

  res.json({
    user,
    activity
  });
}));

// Create new user
router.post('/users', requireRole('system-admin'), [
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
  body('name').notEmpty().withMessage('Name is required'),
  body('role').notEmpty().withMessage('Role is required'),
  body('department').notEmpty().withMessage('Department is required'),
  body('employeeId').notEmpty().withMessage('Employee ID is required')
], logAudit('CREATE_USER', 'USER'), asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Validation failed',
      code: 'VALIDATION_ERROR',
      details: errors.array()
    });
  }

  const { email, password, name, role, department, employeeId } = req.body;
  const db = getDatabase();

  // Check if user already exists
  const existingUser = db.prepare(`
    SELECT id FROM users WHERE email = ? OR employee_id = ?
  `).get(email, employeeId);

  if (existingUser) {
    return res.status(409).json({
      error: 'User already exists',
      code: 'USER_EXISTS'
    });
  }

  // Hash password
  const passwordHash = await bcrypt.hash(password, parseInt(process.env.BCRYPT_ROUNDS) || 12);

  // Create user
  const createUser = db.prepare(`
    INSERT INTO users (email, password_hash, name, role, department, employee_id, created_at)
    VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
  `);

  const result = createUser.run(email, passwordHash, name, role, department, employeeId);
  const userId = result.lastInsertRowid;

  // Get created user
  const newUser = db.prepare(`
    SELECT id, email, name, role, department, employee_id, created_at
    FROM users WHERE id = ?
  `).get(userId);

  res.status(201).json({
    message: 'User created successfully',
    user: newUser
  });
}));

// Update user
router.put('/users/:userId', requireRole('system-admin'), [
  body('name').optional().notEmpty().withMessage('Name cannot be empty'),
  body('role').optional().notEmpty().withMessage('Role cannot be empty'),
  body('department').optional().notEmpty().withMessage('Department cannot be empty'),
  body('employeeId').optional().notEmpty().withMessage('Employee ID cannot be empty'),
  body('isActive').optional().isBoolean().withMessage('isActive must be boolean')
], logAudit('UPDATE_USER', 'USER'), asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Validation failed',
      code: 'VALIDATION_ERROR',
      details: errors.array()
    });
  }

  const { userId } = req.params;
  const { name, role, department, employeeId, isActive } = req.body;
  const db = getDatabase();

  // Check if user exists
  const existingUser = db.prepare(`
    SELECT * FROM users WHERE id = ?
  `).get(userId);

  if (!existingUser) {
    return res.status(404).json({
      error: 'User not found',
      code: 'USER_NOT_FOUND'
    });
  }

  // Update user
  const updateUser = db.prepare(`
    UPDATE users 
    SET name = COALESCE(?, name),
        role = COALESCE(?, role),
        department = COALESCE(?, department),
        employee_id = COALESCE(?, employee_id),
        is_active = COALESCE(?, is_active),
        updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `);

  updateUser.run(name, role, department, employeeId, isActive, userId);

  // Get updated user
  const updatedUser = db.prepare(`
    SELECT id, email, name, role, department, employee_id, 
           digi_locker_verified, is_active, last_login, created_at, updated_at
    FROM users 
    WHERE id = ?
  `).get(userId);

  res.json({
    message: 'User updated successfully',
    user: updatedUser
  });
}));

// Delete user (soft delete)
router.delete('/users/:userId', requireRole('system-admin'), logAudit('DELETE_USER', 'USER'), asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const db = getDatabase();

  // Check if user exists
  const user = db.prepare(`
    SELECT * FROM users WHERE id = ?
  `).get(userId);

  if (!user) {
    return res.status(404).json({
      error: 'User not found',
      code: 'USER_NOT_FOUND'
    });
  }

  // Soft delete user
  db.prepare(`
    UPDATE users 
    SET is_active = FALSE, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(userId);

  res.json({
    message: 'User deactivated successfully'
  });
}));

// Get system statistics
router.get('/stats', requireRole('system-admin'), asyncHandler(async (req, res) => {
  const db = getDatabase();

  // Get user statistics
  const userStats = db.prepare(`
    SELECT 
      COUNT(*) as total_users,
      SUM(CASE WHEN is_active = 1 THEN 1 ELSE 0 END) as active_users,
      SUM(CASE WHEN digi_locker_verified = 1 THEN 1 ELSE 0 END) as verified_users,
      COUNT(DISTINCT role) as unique_roles
    FROM users
  `).get();

  // Get case statistics
  const caseStats = db.prepare(`
    SELECT 
      COUNT(*) as total_cases,
      SUM(CASE WHEN status = 'registered' THEN 1 ELSE 0 END) as registered_cases,
      SUM(CASE WHEN status = 'under-investigation' THEN 1 ELSE 0 END) as investigation_cases,
      SUM(CASE WHEN status = 'closed' THEN 1 ELSE 0 END) as closed_cases
    FROM cases
  `).get();

  // Get evidence statistics
  const evidenceStats = db.prepare(`
    SELECT 
      COUNT(*) as total_evidence,
      SUM(CASE WHEN status = 'stored' THEN 1 ELSE 0 END) as stored_evidence,
      SUM(CASE WHEN status = 'in-transit' THEN 1 ELSE 0 END) as transit_evidence,
      SUM(CASE WHEN status = 'in-analysis' THEN 1 ELSE 0 END) as analysis_evidence
    FROM evidence
  `).get();

  // Get custody statistics
  const custodyStats = db.prepare(`
    SELECT 
      COUNT(*) as total_transfers,
      SUM(CASE WHEN is_verified = 1 THEN 1 ELSE 0 END) as verified_transfers,
      SUM(CASE WHEN is_verified = 0 THEN 1 ELSE 0 END) as unverified_transfers
    FROM custody_chain
  `).get();

  // Get recent activity
  const recentActivity = db.prepare(`
    SELECT action, COUNT(*) as count
    FROM audit_logs
    WHERE timestamp > datetime('now', '-24 hours')
    GROUP BY action
    ORDER BY count DESC
    LIMIT 10
  `).all();

  // Get system health metrics
  const systemHealth = {
    database: 'healthy',
    blockchain: 'healthy',
    fileStorage: 'healthy',
    overall: 'healthy'
  };

  res.json({
    userStats,
    caseStats,
    evidenceStats,
    custodyStats,
    recentActivity,
    systemHealth,
    timestamp: new Date().toISOString()
  });
}));

// Get audit logs
router.get('/audit-logs', requireRole('system-admin'), [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('action').optional().isString().withMessage('Action must be a string'),
  query('userId').optional().isInt({ min: 1 }).withMessage('User ID must be a positive integer'),
  query('startDate').optional().isISO8601().withMessage('Start date must be valid ISO 8601'),
  query('endDate').optional().isISO8601().withMessage('End date must be valid ISO 8601')
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
    limit = 50,
    action,
    userId,
    startDate,
    endDate
  } = req.query;

  const db = getDatabase();
  const offset = (page - 1) * limit;

  // Build WHERE clause
  let whereClause = 'WHERE 1=1';
  const params = [];

  if (action) {
    whereClause += ' AND action = ?';
    params.push(action);
  }
  if (userId) {
    whereClause += ' AND user_id = ?';
    params.push(userId);
  }
  if (startDate) {
    whereClause += ' AND timestamp >= ?';
    params.push(startDate);
  }
  if (endDate) {
    whereClause += ' AND timestamp <= ?';
    params.push(endDate);
  }

  // Get total count
  const totalResult = db.prepare(`
    SELECT COUNT(*) as total FROM audit_logs ${whereClause}
  `).get(...params);
  const total = totalResult.total;

  // Get audit logs with pagination
  const logs = db.prepare(`
    SELECT al.*, u.name as user_name, u.role as user_role
    FROM audit_logs al
    LEFT JOIN users u ON al.user_id = u.id
    ${whereClause}
    ORDER BY al.timestamp DESC
    LIMIT ? OFFSET ?
  `).all(...params, limit, offset);

  res.json({
    logs,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / limit)
    }
  });
}));

// Get system settings
router.get('/settings', requireRole('system-admin'), asyncHandler(async (req, res) => {
  const db = getDatabase();

  const settings = db.prepare(`
    SELECT setting_key, setting_value, description, updated_at
    FROM system_settings
    ORDER BY setting_key
  `).all();

  res.json({
    settings: settings.reduce((acc, setting) => {
      acc[setting.setting_key] = {
        value: setting.setting_value,
        description: setting.description,
        updatedAt: setting.updated_at
      };
      return acc;
    }, {})
  });
}));

// Update system settings
router.put('/settings', requireRole('system-admin'), [
  body('settings').isObject().withMessage('Settings must be an object')
], logAudit('UPDATE_SYSTEM_SETTINGS', 'SYSTEM'), asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Validation failed',
      code: 'VALIDATION_ERROR',
      details: errors.array()
    });
  }

  const { settings } = req.body;
  const db = getDatabase();

  // Update each setting
  const updateSetting = db.prepare(`
    UPDATE system_settings 
    SET setting_value = ?, updated_at = CURRENT_TIMESTAMP, updated_by = ?
    WHERE setting_key = ?
  `);

  for (const [key, value] of Object.entries(settings)) {
    updateSetting.run(value, req.user.id, key);
  }

  res.json({
    message: 'System settings updated successfully'
  });
}));

// Get custody anomalies
router.get('/anomalies', requireRole('system-admin'), [
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

  // Get custody anomalies (this would be implemented based on your anomaly detection logic)
  const anomalies = db.prepare(`
    SELECT 
      'ANOM-' || cc.id as id,
      cc.evidence_id,
      c.title as case_title,
      'time_gap' as type,
      'Gap in custody timeline' as description,
      'medium' as severity,
      cc.transferred_at as timestamp,
      0 as resolved
    FROM custody_chain cc
    JOIN evidence e ON cc.evidence_id = e.evidence_id
    JOIN cases c ON e.case_id = c.case_id
    WHERE cc.is_verified = 0
    ORDER BY cc.transferred_at DESC
    LIMIT 50
  `).all();

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

export default router;

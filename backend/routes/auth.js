import express from 'express';
import bcrypt from 'bcryptjs';
import { body, validationResult } from 'express-validator';
import sqlite3 from 'sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Direct database connection
const dbPath = path.join(__dirname, '..', 'database', 'ndep.db');
const db = new sqlite3.Database(dbPath);
import { authenticateToken, requireRole, logAudit } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/errorHandler.js';

const router = express.Router();

// Validation rules
const loginValidation = [
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('role').notEmpty().withMessage('Role is required'),
  body('otp').optional().isLength({ min: 6, max: 6 }).withMessage('OTP must be 6 digits')
];

const registerValidation = [
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
  body('name').notEmpty().withMessage('Name is required'),
  body('role').notEmpty().withMessage('Role is required'),
  body('department').notEmpty().withMessage('Department is required'),
  body('employeeId').notEmpty().withMessage('Employee ID is required')
];

// Login endpoint
router.post('/login', loginValidation, asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Validation failed',
      code: 'VALIDATION_ERROR',
      details: errors.array()
    });
  }

  const { email, password, role, otp } = req.body;
  // Find user using direct database connection
  const user = await new Promise((resolve, reject) => {
    db.get(`
      SELECT id, email, password_hash, name, role, department, employee_id, 
             digi_locker_verified, created_at
      FROM users 
      WHERE email = ?
    `, [email], (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });

  if (!user) {
    return res.status(401).json({
      error: 'Invalid credentials',
      code: 'INVALID_CREDENTIALS'
    });
  }

  // Check if the provided role matches the user's role
  if (user.role !== role) {
    return res.status(401).json({
      error: 'Invalid role for this user',
      code: 'INVALID_ROLE',
      expected: user.role,
      provided: role
    });
  }

  // Verify password
  const isValidPassword = await bcrypt.compare(password, user.password_hash);
  if (!isValidPassword) {
    return res.status(401).json({
      error: 'Invalid credentials',
      code: 'INVALID_CREDENTIALS'
    });
  }

  // Verify OTP (simplified - in production, use proper OTP service)
  if (otp !== '123456') {
    return res.status(401).json({
      error: 'Invalid OTP',
      code: 'INVALID_OTP'
    });
  }

  // JWT token generation removed - using simple session-based auth

  // Update last login (skip if column doesn't exist)
  try {
    db.prepare(`
      UPDATE users 
      SET updated_at = CURRENT_TIMESTAMP 
      WHERE id = ?
    `).run(user.id);
  } catch (err) {
    console.log('Note: Could not update last login timestamp');
  }

  // Log audit (skip if table doesn't exist)
  try {
    const auditLog = db.prepare(`
      INSERT INTO audit_logs (user_id, action, resource_type, details, ip_address, user_agent)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    
    auditLog.run(
      user.id,
      'LOGIN',
      'USER',
      JSON.stringify({ email, role }),
      req.ip || req.connection.remoteAddress,
      req.get('User-Agent') || 'Unknown'
    );
  } catch (err) {
    console.log('Note: Could not log audit entry');
  }

  // Remove password from response
  const { password_hash, ...userWithoutPassword } = user;

  res.json({
    message: 'Login successful',
    user: userWithoutPassword
  });
}));

// Register endpoint (for admin use)
router.post('/register', authenticateToken, requireRole('system-admin'), registerValidation, asyncHandler(async (req, res) => {
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

  // Log audit
  const auditLog = db.prepare(`
    INSERT INTO audit_logs (user_id, action, resource_type, resource_id, details, ip_address, user_agent)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  
  auditLog.run(
    req.user.id,
    'CREATE_USER',
    'USER',
    userId.toString(),
    JSON.stringify({ email, role, department }),
    req.ip || req.connection.remoteAddress,
    req.get('User-Agent') || 'Unknown'
  );

  res.status(201).json({
    message: 'User created successfully',
    user: newUser
  });
}));

// Verify token endpoint
router.get('/verify', authenticateToken, asyncHandler(async (req, res) => {
  res.json({
    valid: true,
    user: req.user
  });
}));

// Logout endpoint
router.post('/logout', authenticateToken, logAudit('LOGOUT', 'USER'), asyncHandler(async (req, res) => {
  // In a real application, you might want to blacklist the token
  // For now, we'll just log the logout action
  res.json({
    message: 'Logout successful'
  });
}));

// Change password endpoint
router.post('/change-password', authenticateToken, [
  body('currentPassword').notEmpty().withMessage('Current password is required'),
  body('newPassword').isLength({ min: 8 }).withMessage('New password must be at least 8 characters')
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Validation failed',
      code: 'VALIDATION_ERROR',
      details: errors.array()
    });
  }

  const { currentPassword, newPassword } = req.body;
  const db = getDatabase();

  // Get current user with password
  const user = db.prepare(`
    SELECT password_hash FROM users WHERE id = ?
  `).get(req.user.id);

  // Verify current password
  const isValidPassword = await bcrypt.compare(currentPassword, user.password_hash);
  if (!isValidPassword) {
    return res.status(401).json({
      error: 'Current password is incorrect',
      code: 'INVALID_CURRENT_PASSWORD'
    });
  }

  // Hash new password
  const newPasswordHash = await bcrypt.hash(newPassword, parseInt(process.env.BCRYPT_ROUNDS) || 12);

  // Update password
  db.prepare(`
    UPDATE users 
    SET password_hash = ?, updated_at = CURRENT_TIMESTAMP 
    WHERE id = ?
  `).run(newPasswordHash, req.user.id);

  // Log audit
  const auditLog = db.prepare(`
    INSERT INTO audit_logs (user_id, action, resource_type, details, ip_address, user_agent)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  
  auditLog.run(
    req.user.id,
    'CHANGE_PASSWORD',
    'USER',
    JSON.stringify({ userId: req.user.id }),
    req.ip || req.connection.remoteAddress,
    req.get('User-Agent') || 'Unknown'
  );

  res.json({
    message: 'Password changed successfully'
  });
}));

// DigiLocker verification endpoint
router.post('/verify-digilocker', authenticateToken, [
  body('verificationData').isObject().withMessage('Verification data is required')
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Validation failed',
      code: 'VALIDATION_ERROR',
      details: errors.array()
    });
  }

  const { verificationData } = req.body;
  const db = getDatabase();

  // Update user with DigiLocker verification
  db.prepare(`
    UPDATE users 
    SET digi_locker_verified = TRUE, 
        digi_locker_verification_date = CURRENT_TIMESTAMP,
        name = COALESCE(?, name),
        department = COALESCE(?, department),
        employee_id = COALESCE(?, employee_id),
        updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(
    verificationData.name,
    verificationData.department,
    verificationData.employeeId,
    req.user.id
  );

  // Log audit
  const auditLog = db.prepare(`
    INSERT INTO audit_logs (user_id, action, resource_type, details, ip_address, user_agent)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  
  auditLog.run(
    req.user.id,
    'VERIFY_DIGILOCKER',
    'USER',
    JSON.stringify(verificationData),
    req.ip || req.connection.remoteAddress,
    req.get('User-Agent') || 'Unknown'
  );

  res.json({
    message: 'DigiLocker verification completed successfully'
  });
}));

// Get user profile endpoint
router.get('/profile', authenticateToken, asyncHandler(async (req, res) => {
  const db = getDatabase();
  const user = db.prepare(`
    SELECT id, email, name, role, department, employee_id, 
           digi_locker_verified, digi_locker_verification_date, 
           last_login, created_at
    FROM users 
    WHERE id = ?
  `).get(req.user.id);

  if (!user) {
    return res.status(404).json({
      error: 'User not found',
      code: 'USER_NOT_FOUND'
    });
  }

  res.json({
    user
  });
}));

// Update user profile endpoint
router.put('/profile', authenticateToken, [
  body('name').optional().notEmpty().withMessage('Name cannot be empty'),
  body('department').optional().notEmpty().withMessage('Department cannot be empty')
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Validation failed',
      code: 'VALIDATION_ERROR',
      details: errors.array()
    });
  }

  const { name, department } = req.body;
  const db = getDatabase();

  // Update user profile
  db.prepare(`
    UPDATE users 
    SET name = COALESCE(?, name),
        department = COALESCE(?, department),
        updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(name, department, req.user.id);

  // Get updated user
  const updatedUser = db.prepare(`
    SELECT id, email, name, role, department, employee_id, 
           digi_locker_verified, digi_locker_verification_date, 
           last_login, created_at, updated_at
    FROM users 
    WHERE id = ?
  `).get(req.user.id);

  // Log audit
  const auditLog = db.prepare(`
    INSERT INTO audit_logs (user_id, action, resource_type, details, ip_address, user_agent)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  
  auditLog.run(
    req.user.id,
    'UPDATE_PROFILE',
    'USER',
    JSON.stringify({ name, department }),
    req.ip || req.connection.remoteAddress,
    req.get('User-Agent') || 'Unknown'
  );

  res.json({
    message: 'Profile updated successfully',
    user: updatedUser
  });
}));

export default router;

import jwt from 'jsonwebtoken';
import { getDatabase } from '../database/init.js';

export function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({
      error: 'Access token required',
      code: 'MISSING_TOKEN'
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Get user from database to ensure they still exist
    const db = getDatabase();
    const user = db.prepare(`
      SELECT id, email, name, role, department, employee_id, 
             digi_locker_verified, created_at
      FROM users 
      WHERE id = ?
    `).get(decoded.userId);

    if (!user) {
      return res.status(401).json({
        error: 'Invalid or expired token',
        code: 'INVALID_TOKEN'
      });
    }

    // User is valid and active

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        error: 'Token has expired',
        code: 'TOKEN_EXPIRED'
      });
    } else if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        error: 'Invalid token',
        code: 'INVALID_TOKEN'
      });
    } else {
      console.error('JWT verification error:', error);
      return res.status(500).json({
        error: 'Token verification failed',
        code: 'TOKEN_VERIFICATION_ERROR'
      });
    }
  }
}

export function requireRole(roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        error: 'Authentication required',
        code: 'AUTH_REQUIRED'
      });
    }

    const userRole = req.user.role;
    const allowedRoles = Array.isArray(roles) ? roles : [roles];

    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({
        error: 'Insufficient permissions',
        code: 'INSUFFICIENT_PERMISSIONS',
        required: allowedRoles,
        current: userRole
      });
    }

    next();
  };
}

export function requirePermission(permission) {
  const rolePermissions = {
    'evidence-officer': [
      'upload_evidence', 'view_evidence', 'initiate_case', 'hash_evidence', 
      'request_analysis', 'transfer_evidence', 'update_case_status'
    ],
    'field-investigating-officer': [
      'upload_evidence', 'view_evidence', 'initiate_case', 'hash_evidence', 
      'request_analysis', 'transfer_evidence', 'update_case_status'
    ],
    'station-house-officer': [
      'approve_evidence_submissions', 'authorize_transfers', 'view_all_cases', 
      'supervise_investigations', 'approve_analysis_requests', 'manage_team'
    ],
    'evidence-custodian': [
      'store_physical_evidence', 'track_evidence_location', 'manage_transfers', 
      'update_custody_records', 'verify_chain_integrity', 'inventory_management'
    ],
    'forensic-lab-technician': [
      'analyze_evidence', 'upload_analysis_reports', 'update_analysis_status', 
      'attach_artifacts', 'verify_evidence_integrity', 'request_additional_samples'
    ],
    'forensic-lab-manager': [
      'review_analysis_reports', 'approve_lab_reports', 'validate_chain_integrity', 
      'manage_lab_operations', 'quality_control', 'lab_approvals'
    ],
    'prosecutor': [
      'view_evidence_readonly', 'prepare_case_files', 'request_evidence_review', 
      'court_submission_prep', 'legal_analysis', 'case_strategy'
    ],
    'public-prosecutor': [
      'view_evidence_readonly', 'prepare_case_files', 'request_evidence_review', 
      'court_submission_prep', 'legal_analysis', 'case_strategy'
    ],
    'court-clerk': [
      'upload_case_records', 'manage_court_filings', 'digital_case_management', 
      'bridge_prosecutor_judge', 'maintain_case_files', 'court_documentation'
    ],
    'judge-magistrate': [
      'verify_chain_of_custody', 'admit_evidence_court', 'final_evidence_verification', 
      'court_verification', 'trial_evidence_management', 'judicial_oversight'
    ],
    'system-admin': [
      'all_permissions', 'manage_user_accounts', 'system_configuration', 
      'audit_logs', 'blockchain_monitoring', 'security_management', 'backup_restore'
    ],
    'courier-transport': [
      'track_evidence_transport', 'update_transport_status', 'verify_handover', 
      'transport_documentation', 'chain_of_custody_transport'
    ],
    'external-lab': [
      'analyze_outsourced_evidence', 'upload_external_reports', 'quality_assurance', 
      'specialized_testing', 'external_verification'
    ],
    'ngo-verifier': [
      'verify_special_cases', 'wildlife_crime_verification', 'human_rights_cases', 
      'independent_verification', 'ngo_documentation'
    ],
    'law-enforcement-hq': [
      'oversight_dashboards', 'analytics_reporting', 'command_oversight', 
      'strategic_analysis', 'hq_management', 'policy_implementation'
    ]
  };

  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        error: 'Authentication required',
        code: 'AUTH_REQUIRED'
      });
    }

    const userRole = req.user.role;
    const userPermissions = rolePermissions[userRole] || [];

    // System admin has all permissions
    if (userRole === 'system-admin' || userPermissions.includes(permission)) {
      next();
    } else {
      return res.status(403).json({
        error: 'Insufficient permissions',
        code: 'INSUFFICIENT_PERMISSIONS',
        required: permission,
        current: userPermissions
      });
    }
  };
}

export function logAudit(action, resourceType, resourceId, details = {}) {
  return (req, res, next) => {
    // Store the original res.json to intercept the response
    const originalJson = res.json;
    
    res.json = function(data) {
      // Log the audit entry after the response is sent
      try {
        const db = getDatabase();
        const auditLog = db.prepare(`
          INSERT INTO audit_logs (user_id, action, resource_type, resource_id, details, ip_address, user_agent)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `);
        
        auditLog.run(
          req.user?.id || null,
          action,
          resourceType,
          resourceId,
          JSON.stringify(details),
          req.ip || req.connection.remoteAddress,
          req.get('User-Agent') || 'Unknown'
        );
      } catch (error) {
        console.error('Failed to log audit entry:', error);
      }
      
      // Call the original json method
      return originalJson.call(this, data);
    };
    
    next();
  };
}


import sqlite3 from 'sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { promisify } from 'util';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let db;

export async function initializeDatabase() {
  try {
    // Create database directory if it doesn't exist
    const dbDir = path.join(__dirname, '..', '..', 'database');
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
    }

    // Initialize database
    const dbPath = path.join(dbDir, 'ndep.db');
    db = new sqlite3.Database(dbPath);
    
    // Promisify database methods
    db.run = promisify(db.run.bind(db));
    db.get = promisify(db.get.bind(db));
    db.all = promisify(db.all.bind(db));
    
    // Enable foreign keys
    await db.run('PRAGMA foreign_keys = ON');
    
    // Create tables
    await createTables();
    
    // Insert initial data
    await insertInitialData();
    
    console.log('✅ Database initialized successfully');
    return db;
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    throw error;
  }
}

async function createTables() {
  // Users table
  await db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      name TEXT NOT NULL,
      role TEXT NOT NULL,
      department TEXT,
      employee_id TEXT,
      digi_locker_verified BOOLEAN DEFAULT FALSE,
      digi_locker_verification_date TEXT,
      is_active BOOLEAN DEFAULT TRUE,
      last_login TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Cases table
  await db.run(`
    CREATE TABLE IF NOT EXISTS cases (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      case_id TEXT UNIQUE NOT NULL,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      category TEXT NOT NULL,
      priority TEXT NOT NULL,
      status TEXT DEFAULT 'registered',
      incident_date TEXT NOT NULL,
      location TEXT NOT NULL,
      jurisdiction TEXT NOT NULL,
      officer_id INTEGER NOT NULL,
      officer_name TEXT NOT NULL,
      officer_contact TEXT NOT NULL,
      initial_notes TEXT,
      tags TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (officer_id) REFERENCES users (id)
    )
  `);

  // Evidence table
  await db.run(`
    CREATE TABLE IF NOT EXISTS evidence (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      evidence_id TEXT UNIQUE NOT NULL,
      case_id TEXT NOT NULL,
      description TEXT NOT NULL,
      evidence_type TEXT NOT NULL,
      file_path TEXT,
      file_hash TEXT,
      file_size INTEGER,
      mime_type TEXT,
      current_location TEXT NOT NULL,
      status TEXT DEFAULT 'stored',
      collected_by INTEGER NOT NULL,
      collected_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      due_date TEXT,
      transfer_to TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (case_id) REFERENCES cases (case_id),
      FOREIGN KEY (collected_by) REFERENCES users (id)
    )
  `);

  // Custody chain table
  db.exec(`
    CREATE TABLE IF NOT EXISTS custody_chain (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      evidence_id TEXT NOT NULL,
      from_user_id INTEGER,
      to_user_id INTEGER,
      from_location TEXT NOT NULL,
      to_location TEXT NOT NULL,
      transfer_type TEXT NOT NULL,
      transfer_reason TEXT,
      transfer_notes TEXT,
      blockchain_hash TEXT,
      is_verified BOOLEAN DEFAULT FALSE,
      transferred_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      verified_at DATETIME,
      FOREIGN KEY (evidence_id) REFERENCES evidence (evidence_id),
      FOREIGN KEY (from_user_id) REFERENCES users (id),
      FOREIGN KEY (to_user_id) REFERENCES users (id)
    )
  `);

  // Forensic reports table
  db.exec(`
    CREATE TABLE IF NOT EXISTS forensic_reports (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      report_id TEXT UNIQUE NOT NULL,
      evidence_id TEXT NOT NULL,
      case_id TEXT NOT NULL,
      analyst_id INTEGER NOT NULL,
      report_type TEXT NOT NULL,
      file_path TEXT NOT NULL,
      file_hash TEXT NOT NULL,
      findings TEXT NOT NULL,
      conclusion TEXT,
      recommendations TEXT,
      status TEXT DEFAULT 'draft',
      submitted_at DATETIME,
      approved_by INTEGER,
      approved_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (evidence_id) REFERENCES evidence (evidence_id),
      FOREIGN KEY (case_id) REFERENCES cases (case_id),
      FOREIGN KEY (analyst_id) REFERENCES users (id),
      FOREIGN KEY (approved_by) REFERENCES users (id)
    )
  `);

  // Blockchain transactions table
  db.exec(`
    CREATE TABLE IF NOT EXISTS blockchain_transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      transaction_hash TEXT UNIQUE NOT NULL,
      block_number INTEGER NOT NULL,
      evidence_id TEXT,
      case_id TEXT,
      transaction_type TEXT NOT NULL,
      from_address TEXT,
      to_address TEXT,
      data_hash TEXT NOT NULL,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
      is_verified BOOLEAN DEFAULT FALSE,
      verification_count INTEGER DEFAULT 0,
      FOREIGN KEY (evidence_id) REFERENCES evidence (evidence_id),
      FOREIGN KEY (case_id) REFERENCES cases (case_id)
    )
  `);

  // Audit logs table
  db.exec(`
    CREATE TABLE IF NOT EXISTS audit_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      action TEXT NOT NULL,
      resource_type TEXT NOT NULL,
      resource_id TEXT,
      details TEXT,
      ip_address TEXT,
      user_agent TEXT,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users (id)
    )
  `);

  // System settings table
  db.exec(`
    CREATE TABLE IF NOT EXISTS system_settings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      setting_key TEXT UNIQUE NOT NULL,
      setting_value TEXT NOT NULL,
      description TEXT,
      updated_by INTEGER,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (updated_by) REFERENCES users (id)
    )
  `);

  // Create indexes for better performance
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
    CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
    CREATE INDEX IF NOT EXISTS idx_cases_case_id ON cases(case_id);
    CREATE INDEX IF NOT EXISTS idx_cases_officer_id ON cases(officer_id);
    CREATE INDEX IF NOT EXISTS idx_evidence_evidence_id ON evidence(evidence_id);
    CREATE INDEX IF NOT EXISTS idx_evidence_case_id ON evidence(case_id);
    CREATE INDEX IF NOT EXISTS idx_custody_evidence_id ON custody_chain(evidence_id);
    CREATE INDEX IF NOT EXISTS idx_forensic_evidence_id ON forensic_reports(evidence_id);
    CREATE INDEX IF NOT EXISTS idx_blockchain_evidence_id ON blockchain_transactions(evidence_id);
    CREATE INDEX IF NOT EXISTS idx_audit_user_id ON audit_logs(user_id);
    CREATE INDEX IF NOT EXISTS idx_audit_timestamp ON audit_logs(timestamp);
  `);
}

async function insertInitialData() {
  // Insert default admin user
  const bcrypt = await import('bcryptjs');
  const adminPassword = await bcrypt.hash('admin123', 12);
  
  const adminUser = db.prepare(`
    INSERT OR IGNORE INTO users (email, password_hash, name, role, department, employee_id, digi_locker_verified)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  
  adminUser.run(
    'admin@ndep.gov.in',
    adminPassword,
    'System Administrator',
    'system-admin',
    'IT Department',
    'ADMIN-001',
    true
  );

  // Insert system settings
  const settings = [
    ['system_name', 'National Digital Evidence Portal', 'Official name of the system'],
    ['version', '1.0.0', 'Current system version'],
    ['maintenance_mode', 'false', 'System maintenance mode'],
    ['max_file_size', '10485760', 'Maximum file upload size in bytes'],
    ['allowed_file_types', 'pdf,doc,docx,jpg,jpeg,png,mp4,avi,mov', 'Allowed file types for upload'],
    ['session_timeout', '3600', 'Session timeout in seconds'],
    ['blockchain_enabled', 'true', 'Enable blockchain integration'],
    ['digilocker_enabled', 'true', 'Enable DigiLocker integration']
  ];

  const insertSetting = db.prepare(`
    INSERT OR IGNORE INTO system_settings (setting_key, setting_value, description)
    VALUES (?, ?, ?)
  `);

  settings.forEach(([key, value, description]) => {
    insertSetting.run(key, value, description);
  });

  console.log('✅ Initial data inserted successfully');
}

export function getDatabase() {
  if (!db) {
    throw new Error('Database not initialized. Call initializeDatabase() first.');
  }
  return db;
}

export function closeDatabase() {
  if (db) {
    db.close();
    console.log('✅ Database connection closed');
  }
}

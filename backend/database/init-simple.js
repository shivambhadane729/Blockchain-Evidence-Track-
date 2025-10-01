import sqlite3 from 'sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import bcrypt from 'bcryptjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let db;

export async function initializeDatabase() {
  return new Promise((resolve, reject) => {
    try {
      // Create database directory if it doesn't exist
      const dbDir = path.join(__dirname);
      if (!fs.existsSync(dbDir)) {
        fs.mkdirSync(dbDir, { recursive: true });
      }

      // Initialize database
      const dbPath = path.join(dbDir, 'ndep.db');
      db = new sqlite3.Database(dbPath, (err) => {
        if (err) {
          console.error('❌ Database connection failed:', err);
          reject(err);
          return;
        }
        
        console.log('✅ Connected to SQLite database');
        
        // Create tables
        createTables()
          .then(() => insertInitialData())
          .then(() => {
            console.log('✅ Database initialized successfully');
            resolve(db);
          })
          .catch(reject);
      });
    } catch (error) {
      console.error('❌ Database initialization failed:', error);
      reject(error);
    }
  });
}

function createTables() {
  return new Promise((resolve, reject) => {
    const createTablesSQL = `
      -- Users table
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
      );

      -- Cases table
      CREATE TABLE IF NOT EXISTS cases (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        case_id TEXT UNIQUE NOT NULL,
        title TEXT NOT NULL,
        description TEXT NOT NULL,
        category TEXT NOT NULL,
        case_number TEXT UNIQUE NOT NULL,
        case_title TEXT NOT NULL,
        case_description TEXT,
        case_type TEXT,
        status TEXT DEFAULT 'open',
        priority TEXT DEFAULT 'medium',
        assigned_officer TEXT,
        complainant_name TEXT,
        complainant_contact TEXT,
        incident_date DATE,
        incident_location TEXT,
        created_by TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (assigned_officer) REFERENCES users (email),
        FOREIGN KEY (created_by) REFERENCES users (email)
      );

      -- Evidence table
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
      );

      -- Custody chain table
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
      );

      -- Forensic reports table
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
      );

      -- Blockchain transactions table
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
      );

      -- Audit logs table
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
      );

      -- System settings table
      CREATE TABLE IF NOT EXISTS system_settings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        setting_key TEXT UNIQUE NOT NULL,
        setting_value TEXT NOT NULL,
        description TEXT,
        updated_by INTEGER,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (updated_by) REFERENCES users (id)
      );

      -- Custody anomalies table
      CREATE TABLE IF NOT EXISTS custody_anomalies (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        evidence_id TEXT NOT NULL,
        anomaly_type TEXT NOT NULL,
        severity TEXT NOT NULL,
        title TEXT NOT NULL,
        description TEXT NOT NULL,
        details TEXT,
        confidence REAL DEFAULT 0.0,
        detected_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        resolved BOOLEAN DEFAULT FALSE,
        resolved_at DATETIME,
        resolved_by INTEGER,
        resolution TEXT,
        FOREIGN KEY (evidence_id) REFERENCES evidence (evidence_id),
        FOREIGN KEY (resolved_by) REFERENCES users (id)
      );

      -- Create indexes
      CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
      CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
      CREATE INDEX IF NOT EXISTS idx_cases_case_id ON cases(case_id);
      CREATE INDEX IF NOT EXISTS idx_cases_created_by ON cases(created_by);
      CREATE INDEX IF NOT EXISTS idx_cases_assigned_officer ON cases(assigned_officer);
      CREATE INDEX IF NOT EXISTS idx_evidence_evidence_id ON evidence(evidence_id);
      CREATE INDEX IF NOT EXISTS idx_evidence_case_id ON evidence(case_id);
      CREATE INDEX IF NOT EXISTS idx_custody_evidence_id ON custody_chain(evidence_id);
      CREATE INDEX IF NOT EXISTS idx_forensic_evidence_id ON forensic_reports(evidence_id);
      CREATE INDEX IF NOT EXISTS idx_blockchain_evidence_id ON blockchain_transactions(evidence_id);
      CREATE INDEX IF NOT EXISTS idx_audit_user_id ON audit_logs(user_id);
      CREATE INDEX IF NOT EXISTS idx_audit_timestamp ON audit_logs(timestamp);
      CREATE INDEX IF NOT EXISTS idx_custody_anomalies_evidence_id ON custody_anomalies(evidence_id);
      CREATE INDEX IF NOT EXISTS idx_custody_anomalies_severity ON custody_anomalies(severity);
      CREATE INDEX IF NOT EXISTS idx_custody_anomalies_resolved ON custody_anomalies(resolved);
    `;

    db.exec(createTablesSQL, (err) => {
      if (err) {
        console.error('❌ Error creating tables:', err);
        reject(err);
      } else {
        console.log('✅ Database tables created successfully');
        resolve();
      }
    });
  });
}

async function insertInitialData() {
  return new Promise(async (resolve, reject) => {
    try {
      const adminPassword = await bcrypt.hash('admin123', 12);
      const adminUser = `
        INSERT OR IGNORE INTO users (email, password_hash, name, role, department, employee_id, digi_locker_verified)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `;
      
      db.run(adminUser, [
        'admin@ndep.gov.in',
        adminPassword,
        'System Administrator',
        'system-admin',
        'IT Department',
        'ADMIN-001',
        1
      ], (err) => {
        if (err) {
          console.error('❌ Error inserting admin user:', err);
          reject(err);
          return;
        }
        
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

        let completed = 0;
        const total = settings.length;

        settings.forEach(([key, value, description]) => {
          const insertSetting = `
            INSERT OR IGNORE INTO system_settings (setting_key, setting_value, description)
            VALUES (?, ?, ?)
          `;
          
          db.run(insertSetting, [key, value, description], (err) => {
            if (err) {
              console.error(`❌ Error inserting setting ${key}:`, err);
            }
            
            completed++;
            if (completed === total) {
              console.log('✅ Initial data inserted successfully');
              resolve();
            }
          });
        });
      });
    } catch (error) {
      console.error('❌ Error in insertInitialData:', error);
      reject(error);
    }
  });
}

export function getDatabase() {
  if (!db) {
    throw new Error('Database not initialized. Call initializeDatabase() first.');
  }
  return db;
}

export function closeDatabase() {
  if (db) {
    db.close((err) => {
      if (err) {
        console.error('❌ Error closing database:', err);
      } else {
        console.log('✅ Database connection closed');
      }
    });
  }
}


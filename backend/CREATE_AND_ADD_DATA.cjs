// Create Tables and Add Sample Data
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const path = require('path');

class DatabaseSetup {
    constructor() {
        this.db = new sqlite3.Database(path.join(__dirname, 'database', 'ndep.db'));
    }

    async setupDatabase() {
        console.log('🔧 Setting up database with tables and sample data...\n');

        try {
            // Create tables
            await this.createTables();
            
            // Add sample data
            await this.addSampleData();
            
            console.log('✅ Database setup completed successfully!');
            
        } catch (error) {
            console.error('❌ Error setting up database:', error);
        } finally {
            this.db.close();
        }
    }

    async createTables() {
        console.log('📋 Creating database tables...');
        
        const tables = [
            // Users table
            `CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                email TEXT UNIQUE NOT NULL,
                password_hash TEXT NOT NULL,
                name TEXT NOT NULL,
                role TEXT NOT NULL,
                department TEXT,
                employee_id TEXT UNIQUE,
                digi_locker_verified BOOLEAN DEFAULT FALSE,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )`,
            
            // Cases table
            `CREATE TABLE IF NOT EXISTS cases (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                case_id TEXT UNIQUE NOT NULL,
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
            )`,
            
            // Evidence table
            `CREATE TABLE IF NOT EXISTS evidence (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                evidence_id TEXT UNIQUE NOT NULL,
                case_id TEXT NOT NULL,
                evidence_type TEXT NOT NULL,
                evidence_category TEXT,
                description TEXT,
                location_found TEXT,
                collected_by TEXT,
                collected_at DATETIME,
                file_name TEXT,
                file_size INTEGER,
                file_hash TEXT,
                ipfs_hash TEXT,
                status TEXT DEFAULT 'active',
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (case_id) REFERENCES cases (case_id),
                FOREIGN KEY (collected_by) REFERENCES users (email)
            )`,
            
            // Custody transfers table
            `CREATE TABLE IF NOT EXISTS custody_transfers (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                evidence_id TEXT NOT NULL,
                from_user TEXT,
                to_user TEXT,
                transfer_reason TEXT,
                transfer_date DATETIME,
                status TEXT DEFAULT 'pending',
                notes TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (evidence_id) REFERENCES evidence (evidence_id),
                FOREIGN KEY (from_user) REFERENCES users (email),
                FOREIGN KEY (to_user) REFERENCES users (email)
            )`
        ];

        for (const table of tables) {
            await new Promise((resolve, reject) => {
                this.db.run(table, (err) => {
                    if (err) reject(err);
                    else resolve();
                });
            });
        }
        
        console.log('✅ Database tables created successfully');
    }

    async addSampleData() {
        console.log('\n📊 Adding sample data...');
        
        // Add users
        await this.addUsers();
        
        // Add cases
        await this.addCases();
        
        // Add evidence
        await this.addEvidence();
    }

    async addUsers() {
        console.log('👥 Adding sample users...');
        
        const users = [
            {
                email: 'officer.rajesh@police.gov.in',
                password: 'officer123',
                name: 'Rajesh Kumar',
                role: 'evidence-officer',
                department: 'Cyber Crime Unit',
                employee_id: 'PC-001'
            },
            {
                email: 'forensic.dr.singh@lab.gov.in',
                password: 'forensic123',
                name: 'Dr. Priya Singh',
                role: 'forensic-lab-manager',
                department: 'Forensic Science Laboratory',
                employee_id: 'FSL-001'
            },
            {
                email: 'prosecutor.sharma@court.gov.in',
                password: 'prosecutor123',
                name: 'Advocate Vikram Sharma',
                role: 'prosecutor',
                department: 'Public Prosecutor Office',
                employee_id: 'PP-001'
            }
        ];

        for (const user of users) {
            const hashedPassword = await bcrypt.hash(user.password, 12);
            
            await new Promise((resolve, reject) => {
                this.db.run(`
                    INSERT OR REPLACE INTO users (email, password_hash, name, role, department, employee_id, digi_locker_verified)
                    VALUES (?, ?, ?, ?, ?, ?, ?)
                `, [user.email, hashedPassword, user.name, user.role, user.department, user.employee_id, 1], (err) => {
                    if (err) reject(err);
                    else resolve();
                });
            });
            
            console.log(`✅ Added user: ${user.name} (${user.role})`);
        }
    }

    async addCases() {
        console.log('\n📋 Adding sample cases...');
        
        const cases = [
            {
                case_id: 'CASE-2024-001',
                case_number: 'FIR-123/2024',
                case_title: 'Cyber Fraud Investigation',
                case_description: 'Online banking fraud case involving multiple victims',
                case_type: 'cyber-crime',
                status: 'under-investigation',
                priority: 'high',
                assigned_officer: 'officer.rajesh@police.gov.in',
                complainant_name: 'Amit Patel',
                complainant_contact: '+91-9876543210',
                incident_date: '2024-09-20',
                incident_location: 'Mumbai, Maharashtra',
                created_by: 'officer.rajesh@police.gov.in'
            },
            {
                case_id: 'CASE-2024-002',
                case_number: 'FIR-124/2024',
                case_title: 'Digital Evidence Tampering',
                case_description: 'Suspected tampering of digital evidence in drug case',
                case_type: 'drug-offense',
                status: 'evidence-analysis',
                priority: 'medium',
                assigned_officer: 'forensic.dr.singh@lab.gov.in',
                complainant_name: 'Narcotics Control Bureau',
                complainant_contact: '+91-9876543211',
                incident_date: '2024-09-18',
                incident_location: 'Delhi, NCR',
                created_by: 'forensic.dr.singh@lab.gov.in'
            }
        ];

        for (const caseData of cases) {
            await new Promise((resolve, reject) => {
                this.db.run(`
                    INSERT OR REPLACE INTO cases (case_id, case_number, case_title, case_description, case_type, status, priority, assigned_officer, complainant_name, complainant_contact, incident_date, incident_location, created_by)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                `, [
                    caseData.case_id, caseData.case_number, caseData.case_title, 
                    caseData.case_description, caseData.case_type, caseData.status, 
                    caseData.priority, caseData.assigned_officer, caseData.complainant_name, 
                    caseData.complainant_contact, caseData.incident_date, caseData.incident_location, 
                    caseData.created_by
                ], (err) => {
                    if (err) reject(err);
                    else resolve();
                });
            });
            
            console.log(`✅ Added case: ${caseData.case_title} (${caseData.case_id})`);
        }
    }

    async addEvidence() {
        console.log('\n📁 Adding sample evidence...');
        
        const evidence = [
            {
                evidence_id: 'EVD-2024-001',
                case_id: 'CASE-2024-001',
                evidence_type: 'digital',
                evidence_category: 'mobile-phone',
                description: 'Samsung Galaxy S21 mobile phone recovered from suspect',
                location_found: 'Suspect residence, Andheri West, Mumbai',
                collected_by: 'officer.rajesh@police.gov.in',
                collected_at: '2024-09-20 14:30:00',
                file_name: 'mobile_evidence_001.zip',
                file_size: 2048576,
                file_hash: 'sha256:a1b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef123456',
                ipfs_hash: 'QmTestHash1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
                status: 'active'
            },
            {
                evidence_id: 'EVD-2024-002',
                case_id: 'CASE-2024-001',
                evidence_type: 'digital',
                evidence_category: 'computer',
                description: 'Dell Laptop with banking transaction records',
                location_found: 'Suspect office, Bandra Kurla Complex, Mumbai',
                collected_by: 'officer.rajesh@police.gov.in',
                collected_at: '2024-09-20 16:45:00',
                file_name: 'laptop_evidence_002.zip',
                file_size: 5242880,
                file_hash: 'sha256:b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef1234567890',
                ipfs_hash: 'QmTestHash2345678901bcdef1234567890abcdef1234567890abcdef1234567890ab',
                status: 'active'
            }
        ];

        for (const evidenceData of evidence) {
            await new Promise((resolve, reject) => {
                this.db.run(`
                    INSERT OR REPLACE INTO evidence (evidence_id, case_id, evidence_type, evidence_category, description, location_found, collected_by, collected_at, file_name, file_size, file_hash, ipfs_hash, status)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                `, [
                    evidenceData.evidence_id, evidenceData.case_id, evidenceData.evidence_type,
                    evidenceData.evidence_category, evidenceData.description, evidenceData.location_found,
                    evidenceData.collected_by, evidenceData.collected_at, evidenceData.file_name,
                    evidenceData.file_size, evidenceData.file_hash, evidenceData.ipfs_hash,
                    evidenceData.status
                ], (err) => {
                    if (err) reject(err);
                    else resolve();
                });
            });
            
            console.log(`✅ Added evidence: ${evidenceData.description} (${evidenceData.evidence_id})`);
        }
    }
}

// Run the setup
const setup = new DatabaseSetup();
setup.setupDatabase().catch(console.error);

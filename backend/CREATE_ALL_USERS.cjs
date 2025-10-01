const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const path = require('path');
const fs = require('fs');

const dbPath = path.join(__dirname, 'database', 'ndep.db');

class UserCreator {
    constructor() {
        this.db = new sqlite3.Database(dbPath);
    }

    async createAllUsers() {
        console.log('🔧 Creating all user accounts for NDEP...\n');
        
        try {
            // Create database tables first
            await this.createTables();
            
            // Clear existing users (except admin)
            await this.clearExistingUsers();
            
            // Create all users
            await this.addAllUsers();
            
            console.log('\n✅ All users created successfully!');
            console.log('📋 Login credentials are ready for testing');
            
        } catch (error) {
            console.error('❌ Error creating users:', error);
        } finally {
            this.db.close();
        }
    }

    async createTables() {
        console.log('📋 Creating database tables...');
        
        const tables = [
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
            `CREATE TABLE IF NOT EXISTS cases (
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
            )`,
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
                FOREIGN KEY (case_id) REFERENCES cases (case_id)
            )`,
            `CREATE TABLE IF NOT EXISTS custody_chain (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                evidence_id TEXT NOT NULL,
                from_user TEXT,
                to_user TEXT,
                transfer_type TEXT,
                location TEXT,
                notes TEXT,
                timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (evidence_id) REFERENCES evidence (evidence_id)
            )`,
            `CREATE TABLE IF NOT EXISTS blockchain_transactions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                transaction_hash TEXT UNIQUE NOT NULL,
                evidence_id TEXT,
                transaction_type TEXT,
                block_number INTEGER,
                timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
                details TEXT
            )`
        ];

        for (const table of tables) {
            await this.runAsync(table);
        }
        
        console.log('✅ Database tables created successfully');
    }

    async clearExistingUsers() {
        console.log('🗑️ Clearing existing users (keeping admin)...');
        
        await this.runAsync("DELETE FROM users WHERE email != 'admin@ndep.gov.in'");
        console.log('✅ Existing users cleared');
    }

    async addAllUsers() {
        console.log('👥 Creating all user accounts...\n');
        
        const users = [
            // 1. Field/Investigating Officer
            {
                email: 'officer.rajesh@police.gov.in',
                password: 'officer123',
                name: 'Rajesh Kumar',
                role: 'evidence-officer',
                department: 'Cyber Crime Unit',
                employee_id: 'PC-001'
            },
            
            // 2. Station House Officer (SHO)
            {
                email: 'sho.vikram@police.gov.in',
                password: 'sho123',
                name: 'Vikram Singh',
                role: 'station-house-officer',
                department: 'Police Station',
                employee_id: 'SHO-001'
            },
            
            // 3. Evidence Custodian
            {
                email: 'custodian.priya@police.gov.in',
                password: 'custodian123',
                name: 'Priya Sharma',
                role: 'evidence-custodian',
                department: 'Evidence Storage',
                employee_id: 'CUST-001'
            },
            
            // 4. Forensic Lab Manager
            {
                email: 'manager.dr.singh@lab.gov.in',
                password: 'manager123',
                name: 'Dr. Amit Singh',
                role: 'forensic-lab-manager',
                department: 'Forensic Science Laboratory',
                employee_id: 'FSL-MGR-001'
            },
            
            // 5. Forensic Lab Technician
            {
                email: 'tech.sneha@lab.gov.in',
                password: 'tech123',
                name: 'Sneha Patel',
                role: 'forensic-lab-technician',
                department: 'Forensic Science Laboratory',
                employee_id: 'FSL-TECH-001'
            },
            
            // 6. Court Clerk
            {
                email: 'clerk.anita@court.gov.in',
                password: 'clerk123',
                name: 'Anita Verma',
                role: 'court-clerk',
                department: 'District Court',
                employee_id: 'CLERK-001'
            },
            
            // 7. Judge/Magistrate
            {
                email: 'judge.sharma@court.gov.in',
                password: 'judge123',
                name: 'Hon. Justice Ramesh Sharma',
                role: 'judge-magistrate',
                department: 'District Court',
                employee_id: 'JUDGE-001'
            },
            
            // 8. System Administrator
            {
                email: 'admin@ndep.gov.in',
                password: 'admin123',
                name: 'System Administrator',
                role: 'system-admin',
                department: 'IT Department',
                employee_id: 'ADMIN-001'
            }
        ];

        for (const user of users) {
            await this.addUser(user);
        }
    }

    async addUser(userData) {
        try {
            const hashedPassword = await bcrypt.hash(userData.password, 12);
            
            await this.runAsync(`
                INSERT OR REPLACE INTO users (email, password_hash, name, role, department, employee_id, digi_locker_verified)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            `, [
                userData.email,
                hashedPassword,
                userData.name,
                userData.role,
                userData.department,
                userData.employee_id,
                1 // DigiLocker verified
            ]);
            
            console.log(`✅ Created: ${userData.name} (${userData.role})`);
            console.log(`   Email: ${userData.email}`);
            console.log(`   Password: ${userData.password}`);
            console.log(`   Department: ${userData.department}`);
            console.log('');
            
        } catch (error) {
            console.error(`❌ Error creating user ${userData.name}:`, error.message);
        }
    }

    runAsync(sql, params = []) {
        return new Promise((resolve, reject) => {
            this.db.run(sql, params, function (err) {
                if (err) reject(err);
                else resolve(this);
            });
        });
    }
}

// Create and run the user creator
const creator = new UserCreator();
creator.createAllUsers();

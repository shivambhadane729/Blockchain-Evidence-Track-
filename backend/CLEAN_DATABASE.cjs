// Clean Database - Remove All Fake/Unwanted Data
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

class DatabaseCleaner {
    constructor() {
        this.db = new sqlite3.Database(path.join(__dirname, 'database', 'ndep.db'));
    }

    async cleanDatabase() {
        console.log('🧹 Cleaning database - removing all fake/unwanted data...\n');

        try {
            // Clean all tables
            await this.cleanTables();
            
            // Keep only essential admin user
            await this.addEssentialAdmin();
            
            console.log('✅ Database cleaned successfully!');
            console.log('📋 Only essential admin user remains');
            console.log('🚫 All fake cases and evidence removed');
            
        } catch (error) {
            console.error('❌ Error cleaning database:', error);
        } finally {
            this.db.close();
        }
    }

    async cleanTables() {
        console.log('🗑️ Removing all fake data...');
        
        const cleanQueries = [
            'DELETE FROM custody_transfers',
            'DELETE FROM evidence', 
            'DELETE FROM cases',
            'DELETE FROM users WHERE email != "admin@ndep.gov.in"'
        ];

        for (const query of cleanQueries) {
            await new Promise((resolve, reject) => {
                this.db.run(query, (err) => {
                    if (err) reject(err);
                    else resolve();
                });
            });
        }
        
        console.log('✅ All fake data removed');
    }

    async addEssentialAdmin() {
        console.log('👤 Ensuring admin user exists...');
        
        // Check if admin exists
        const adminExists = await new Promise((resolve, reject) => {
            this.db.get('SELECT id FROM users WHERE email = ?', ['admin@ndep.gov.in'], (err, row) => {
                if (err) reject(err);
                else resolve(!!row);
            });
        });

        if (!adminExists) {
            const bcrypt = require('bcryptjs');
            const hashedPassword = await bcrypt.hash('admin123', 12);
            
            await new Promise((resolve, reject) => {
                this.db.run(`
                    INSERT INTO users (email, password_hash, name, role, department, employee_id, digi_locker_verified)
                    VALUES (?, ?, ?, ?, ?, ?, ?)
                `, [
                    'admin@ndep.gov.in',
                    hashedPassword,
                    'System Administrator',
                    'system-admin',
                    'IT Department',
                    'ADMIN-001',
                    1
                ], (err) => {
                    if (err) reject(err);
                    else resolve();
                });
            });
            
            console.log('✅ Admin user created');
        } else {
            console.log('✅ Admin user already exists');
        }
    }
}

// Run the cleaner
const cleaner = new DatabaseCleaner();
cleaner.cleanDatabase().catch(console.error);

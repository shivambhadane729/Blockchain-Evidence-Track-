import sqlite3 from 'sqlite3';
import bcrypt from 'bcryptjs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.join(__dirname, 'database', 'ndep.db');
const db = new sqlite3.Database(dbPath);

console.log('🔍 Checking admin user...');

// Check if admin user exists
db.get('SELECT * FROM users WHERE email = ?', ['admin@ndep.gov.in'], async (err, row) => {
  if (err) {
    console.error('❌ Error checking admin user:', err);
    db.close();
    return;
  }

  if (row) {
    console.log('✅ Admin user exists:');
    console.log('   Email:', row.email);
    console.log('   Role:', row.role);
    console.log('   Name:', row.name);
    console.log('   Active:', row.is_active);
  } else {
    console.log('❌ Admin user does not exist. Creating...');
    
    const hashedPassword = await bcrypt.hash('admin123', 12);
    
    db.run(`
      INSERT INTO users (email, password_hash, name, role, department, employee_id, digi_locker_verified, is_active)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      'admin@ndep.gov.in',
      hashedPassword,
      'System Administrator',
      'system-admin',
      'IT Department',
      'ADMIN-001',
      1,
      1
    ], function(err) {
      if (err) {
        console.error('❌ Error creating admin user:', err);
      } else {
        console.log('✅ Admin user created successfully!');
        console.log('   Email: admin@ndep.gov.in');
        console.log('   Password: admin123');
        console.log('   Role: system-admin');
      }
      db.close();
    });
  }
});

import { getDatabase } from './database/init-simple.js';
import { initializeDatabase } from './database/init-simple.js';

async function debugLogin() {
  console.log('🔍 Debugging Login Issue...\n');

  try {
    await initializeDatabase();
    const db = getDatabase();
    
    console.log('1️⃣ Testing database query...');
    const user = db.prepare(`
      SELECT id, email, password_hash, name, role, department, employee_id, 
             digi_locker_verified, created_at
      FROM users 
      WHERE email = ?
    `).get('officer.rajesh@police.gov.in');

    if (!user) {
      console.log('❌ User not found in database');
      return;
    }

    console.log('✅ User found:');
    console.log('   ID:', user.id);
    console.log('   Email:', user.email);
    console.log('   Name:', user.name);
    console.log('   Role:', user.role);
    console.log('   Department:', user.department);
    console.log('   Employee ID:', user.employee_id);
    console.log('   DigiLocker Verified:', user.digi_locker_verified);
    console.log('   Created At:', user.created_at);
    console.log('');

    console.log('2️⃣ Testing role comparison...');
    const providedRole = 'evidence-officer';
    const userRole = user.role;
    
    console.log('   Provided role:', providedRole);
    console.log('   User role:', userRole);
    console.log('   Roles match:', userRole === providedRole);
    console.log('   Role type (provided):', typeof providedRole);
    console.log('   Role type (user):', typeof userRole);
    console.log('   Role length (provided):', providedRole.length);
    console.log('   Role length (user):', userRole.length);
    
    // Check for hidden characters
    console.log('   Role bytes (provided):', Buffer.from(providedRole));
    console.log('   Role bytes (user):', Buffer.from(userRole));

  } catch (error) {
    console.error('❌ Debug failed:', error.message);
    console.error('   Stack:', error.stack);
  }
}

debugLogin();

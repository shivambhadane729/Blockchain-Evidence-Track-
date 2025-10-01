import { getDatabase } from './database/init-simple.js';
import { initializeDatabase } from './database/init-simple.js';

async function debugAuthFinal() {
  console.log('🔍 Final Authentication Debug...\n');

  try {
    await initializeDatabase();
    const db = getDatabase();
    
    console.log('1️⃣ Testing user lookup for Rajesh...');
    const user = db.prepare(`
      SELECT id, email, password_hash, name, role, department, employee_id, 
             digi_locker_verified, created_at
      FROM users 
      WHERE email = ?
    `).get('officer.rajesh@police.gov.in');
    
    if (!user) {
      console.log('   ❌ User not found');
      return;
    }
    
    console.log('   ✅ User found:');
    console.log('   ID:', user.id);
    console.log('   Email:', user.email);
    console.log('   Name:', user.name);
    console.log('   Role:', user.role);
    console.log('   Department:', user.department);
    console.log('   Employee ID:', user.employee_id);
    console.log('   DigiLocker Verified:', user.digi_locker_verified);
    console.log('   Created At:', user.created_at);
    
    console.log('\n2️⃣ Testing role comparison...');
    const providedRole = 'evidence-officer';
    const userRole = user.role;
    
    console.log('   Provided role:', `"${providedRole}"`);
    console.log('   User role:', `"${userRole}"`);
    console.log('   Roles match:', userRole === providedRole);
    console.log('   Role type (provided):', typeof providedRole);
    console.log('   Role type (user):', typeof userRole);
    
    // Check for hidden characters
    console.log('   Role bytes (provided):', Array.from(Buffer.from(providedRole)));
    console.log('   Role bytes (user):', Array.from(Buffer.from(userRole)));
    
    console.log('\n3️⃣ Testing password verification...');
    const bcrypt = await import('bcryptjs');
    const isValidPassword = await bcrypt.default.compare('officer123', user.password_hash);
    console.log('   Password valid:', isValidPassword);
    
    console.log('\n4️⃣ Testing all users...');
    const allUsers = db.prepare('SELECT email, name, role FROM users').all();
    allUsers.forEach((u, index) => {
      console.log(`   ${index + 1}. ${u.name} (${u.email}) - Role: "${u.role}"`);
    });

  } catch (error) {
    console.error('❌ Debug failed:', error.message);
    console.error('   Stack:', error.stack);
  }
}

debugAuthFinal();

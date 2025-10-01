import bcrypt from 'bcryptjs';
import { getDatabase } from './database/init-simple.js';
import { initializeDatabase } from './database/init-simple.js';

async function testRajeshLogin() {
  console.log('🧪 Testing Rajesh Login...\n');

  try {
    // Initialize database
    await initializeDatabase();
    console.log('✅ Database initialized\n');

    const db = getDatabase();
    
    // Test 1: Check if user exists
    console.log('1️⃣ Checking if Rajesh exists...');
    const user = db.prepare(`
      SELECT id, email, password_hash, name, role, department, employee_id, 
             digi_locker_verified, created_at
      FROM users 
      WHERE email = ?
    `).get('officer.rajesh@police.gov.in');

    if (!user) {
      console.log('❌ User not found');
      return;
    }

    console.log('✅ User found:');
    console.log('   ID:', user.id);
    console.log('   Email:', user.email);
    console.log('   Name:', user.name);
    console.log('   Role:', user.role);
    console.log('   Department:', user.department);
    console.log('   Employee ID:', user.employee_id);
    console.log('');

    // Test 2: Verify password
    console.log('2️⃣ Testing password verification...');
    const testPassword = 'officer123';
    const isValidPassword = await bcrypt.compare(testPassword, user.password_hash);
    
    console.log('✅ Password verification result:', isValidPassword);
    console.log('   Test password:', testPassword);
    console.log('   Hash in DB:', user.password_hash.substring(0, 20) + '...');
    console.log('');

    // Test 3: Test login data
    console.log('3️⃣ Testing login data...');
    const loginData = {
      email: 'officer.rajesh@police.gov.in',
      password: 'officer123',
      role: 'evidence-officer',
      otp: '123456'
    };
    
    console.log('✅ Login data:');
    console.log('   Email:', loginData.email);
    console.log('   Password:', loginData.password);
    console.log('   Role:', loginData.role);
    console.log('   OTP:', loginData.otp);
    console.log('');

    if (isValidPassword) {
      console.log('🎉 Rajesh login should work!');
      console.log('✅ Use these credentials in the frontend:');
      console.log('   Email: officer.rajesh@police.gov.in');
      console.log('   Password: officer123');
      console.log('   Role: evidence-officer');
      console.log('   OTP: 123456');
    } else {
      console.log('❌ Password verification failed');
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('   Stack:', error.stack);
  }
}

testRajeshLogin();

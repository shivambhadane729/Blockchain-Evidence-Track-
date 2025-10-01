const axios = require('axios');

async function testLogin() {
  console.log('🧪 Testing Login System...\n');
  
  try {
    // Test health endpoint
    console.log('1️⃣ Testing server health...');
    const healthResponse = await axios.get('http://localhost:3001/health');
    console.log('   ✅ Server is running');
    console.log('   Status:', healthResponse.data.status);
    
    // Test login
    console.log('\n2️⃣ Testing login with Rajesh...');
    const loginResponse = await axios.post('http://localhost:3001/api/auth/login', {
      email: 'officer.rajesh@police.gov.in',
      password: 'officer123',
      role: 'evidence-officer',
      otp: '123456'
    });
    
    console.log('   ✅ Login successful!');
    console.log('   Message:', loginResponse.data.message);
    console.log('   User:', loginResponse.data.user.name);
    console.log('   Role:', loginResponse.data.user.role);
    console.log('   Email:', loginResponse.data.user.email);
    
    console.log('\n🎉 LOGIN SYSTEM IS WORKING PERFECTLY!');
    console.log('\n📋 You can now use these credentials in the frontend:');
    console.log('   Role: Field/Investigating Officer (IO)');
    console.log('   Email: officer.rajesh@police.gov.in');
    console.log('   Password: officer123');
    console.log('   OTP: 123456');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response) {
      console.error('   Status:', error.response.status);
      console.error('   Error:', error.response.data);
    }
  }
}

// Wait a moment for server to start, then test
setTimeout(testLogin, 3000);

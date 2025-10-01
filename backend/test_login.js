import fetch from 'node-fetch';

async function testLogin() {
  try {
    console.log('🧪 Testing login API...');
    
    const response = await fetch('http://localhost:3001/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'admin@ndep.gov.in',
        password: 'admin123',
        role: 'system-admin',
        otp: '123456'
      }),
    });

    console.log('📡 Response status:', response.status);
    
    if (response.ok) {
      const result = await response.json();
      console.log('✅ Login successful!');
      console.log('📋 User data:', {
        email: result.user.email,
        role: result.user.role,
        name: result.user.name
      });
      console.log('🔑 Token received:', result.token ? 'Yes' : 'No');
    } else {
      const error = await response.json();
      console.log('❌ Login failed:');
      console.log('   Error:', error.error);
      console.log('   Code:', error.code);
      console.log('   Details:', error.details);
    }
  } catch (error) {
    console.log('❌ Connection error:', error.message);
    console.log('💡 Make sure the backend server is running on port 3001');
  }
}

testLogin();

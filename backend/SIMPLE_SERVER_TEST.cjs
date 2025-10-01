// Simple Server Test
const axios = require('axios');

async function testServer() {
    console.log('🔧 Testing server connection...');
    
    try {
        // Test health endpoint
        const response = await axios.get('http://localhost:3001/health', {
            timeout: 5000
        });
        console.log('✅ Server is responding');
        console.log('Status:', response.status);
        console.log('Data:', response.data);
    } catch (error) {
        console.log('❌ Server error:', error.message);
        if (error.response) {
            console.log('Status:', error.response.status);
            console.log('Data:', error.response.data);
        }
    }
}

testServer();

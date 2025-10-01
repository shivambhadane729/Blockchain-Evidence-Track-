// End-to-End Test for NDEP with IPFS Integration
// This test validates the complete system workflow

const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

class EndToEndTest {
    constructor() {
        this.baseURL = 'http://localhost:3001';
        this.results = [];
        this.passed = 0;
        this.failed = 0;
        this.authToken = null;
    }

    async runAllTests() {
        console.log('🧪 NDEP End-to-End Test Suite\n');
        console.log('='.repeat(60));

        try {
            // Test 1: Check if backend is running
            await this.testBackendRunning();
            
            // Test 2: Test authentication
            await this.testAuthentication();
            
            // Test 3: Test evidence upload with IPFS
            await this.testEvidenceUpload();
            
            // Test 4: Test evidence retrieval
            await this.testEvidenceRetrieval();
            
            // Test 5: Test blockchain status
            await this.testBlockchainStatus();
            
            // Generate report
            this.generateReport();
            
        } catch (error) {
            console.error('❌ End-to-end test failed:', error.message);
            this.failed++;
        }
    }

    async testBackendRunning() {
        console.log('🔧 Testing backend server...');
        
        try {
            const response = await axios.get(`${this.baseURL}/api/health`, {
                timeout: 5000
            });
            
            if (response.status === 200) {
                this.pass('✅ Backend server is running');
            } else {
                this.fail('❌ Backend server is not responding correctly');
            }
        } catch (error) {
            this.fail(`❌ Backend server error: ${error.message}`);
        }
        
        console.log();
    }

    async testAuthentication() {
        console.log('🔐 Testing authentication...');
        
        try {
            // Try to login with admin credentials
            const response = await axios.post(`${this.baseURL}/api/auth/login`, {
                email: 'admin@ndep.gov.in',
                password: 'admin123',
                role: 'system-admin',
                otp: '123456'
            });

            if (response.data && response.data.token) {
                this.authToken = response.data.token;
                this.pass('✅ Authentication successful');
            } else {
                this.fail('❌ Authentication failed - no token received');
            }
        } catch (error) {
            this.fail(`❌ Authentication error: ${error.message}`);
        }
        
        console.log();
    }

    async testEvidenceUpload() {
        console.log('📤 Testing evidence upload with IPFS...');
        
        if (!this.authToken) {
            this.fail('❌ No auth token available for upload test');
            console.log();
            return;
        }

        try {
            // Create test file
            const testContent = 'This is test evidence for NDEP end-to-end testing.';
            const testBuffer = Buffer.from(testContent, 'utf8');
            
            // Create form data
            const formData = new FormData();
            formData.append('evidenceFile', testBuffer, 'test-evidence.txt');
            formData.append('evidenceId', 'E2E-TEST-001');
            formData.append('caseId', 'E2E-CASE-001');
            formData.append('description', 'End-to-end test evidence');
            formData.append('location', 'Test Location');
            formData.append('collectedBy', 'Test Officer');

            // Upload evidence
            const response = await axios.post(`${this.baseURL}/api/blockchain/evidence/upload`, formData, {
                headers: {
                    'Authorization': `Bearer ${this.authToken}`,
                    ...formData.getHeaders()
                }
            });

            if (response.data && response.data.success) {
                this.pass('✅ Evidence uploaded successfully with IPFS');
                this.testData = response.data.data;
            } else {
                this.fail('❌ Evidence upload failed');
            }
        } catch (error) {
            this.fail(`❌ Evidence upload error: ${error.message}`);
        }
        
        console.log();
    }

    async testEvidenceRetrieval() {
        console.log('📥 Testing evidence retrieval...');
        
        if (!this.testData || !this.testData.evidenceId) {
            this.fail('❌ No evidence ID available for retrieval test');
            console.log();
            return;
        }

        try {
            const response = await axios.get(`${this.baseURL}/api/blockchain/evidence/${this.testData.evidenceId}`, {
                headers: {
                    'Authorization': `Bearer ${this.authToken}`
                }
            });

            if (response.data && response.data.success) {
                this.pass('✅ Evidence retrieved successfully');
            } else {
                this.fail('❌ Evidence retrieval failed');
            }
        } catch (error) {
            this.fail(`❌ Evidence retrieval error: ${error.message}`);
        }
        
        console.log();
    }

    async testBlockchainStatus() {
        console.log('⛓️ Testing blockchain status...');
        
        try {
            const response = await axios.get(`${this.baseURL}/api/blockchain/status`, {
                headers: {
                    'Authorization': `Bearer ${this.authToken}`
                }
            });

            if (response.data && response.data.success) {
                this.pass('✅ Blockchain status check successful');
            } else {
                this.fail('❌ Blockchain status check failed');
            }
        } catch (error) {
            this.fail(`❌ Blockchain status error: ${error.message}`);
        }
        
        console.log();
    }

    pass(message) {
        this.passed++;
        this.results.push({ status: 'PASS', message });
        console.log(message);
    }

    fail(message) {
        this.failed++;
        this.results.push({ status: 'FAIL', message });
        console.log(message);
    }

    generateReport() {
        console.log('='.repeat(60));
        console.log('📊 End-to-End Test Results:');
        console.log(`✅ Passed: ${this.passed}`);
        console.log(`❌ Failed: ${this.failed}`);
        console.log(`📈 Total: ${this.passed + this.failed}`);
        
        const successRate = ((this.passed / (this.passed + this.failed)) * 100).toFixed(1);
        console.log(`🎯 Success Rate: ${successRate}%`);
        
        if (this.failed === 0) {
            console.log('\n🎉 All tests passed! NDEP system is fully functional!');
            console.log('\n🚀 Your system is ready for production use!');
            console.log('\n📋 Available features:');
            console.log('✅ IPFS file storage via Pinata');
            console.log('✅ Blockchain metadata storage');
            console.log('✅ Evidence upload and retrieval');
            console.log('✅ Authentication and authorization');
            console.log('✅ Complete evidence management workflow');
        } else {
            console.log('\n⚠️ Some tests failed. Please check the issues above.');
        }
        
        console.log('='.repeat(60));
    }
}

// Run the test
const test = new EndToEndTest();
test.runAllTests().catch(console.error);

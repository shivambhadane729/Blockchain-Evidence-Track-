// Simple IPFS Test for NDEP - Tests Pinata Integration
// This test focuses on IPFS functionality without Fabric dependencies

const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

class SimpleIPFSTest {
    constructor() {
        this.results = [];
        this.passed = 0;
        this.failed = 0;
        this.config = {
            apiKey: process.env.PINATA_API_KEY || 'c1d706a99a4d20ff191a',
            secretKey: process.env.PINATA_SECRET_KEY || '94f7785058028065a168ee705278f6f3a9596714e389e17fe1d4167a4105c660',
            gateway: 'https://gateway.pinata.cloud'
        };
    }

    async runAllTests() {
        console.log('🧪 Simple IPFS Test Suite for NDEP\n');
        console.log('='.repeat(50));

        try {
            // Test 1: Check configuration
            await this.testConfiguration();
            
            // Test 2: Test Pinata connection
            await this.testPinataConnection();
            
            // Test 3: Test file upload
            await this.testFileUpload();
            
            // Test 4: Test file retrieval
            await this.testFileRetrieval();
            
            // Generate report
            this.generateReport();
            
        } catch (error) {
            console.error('❌ Test suite failed:', error.message);
            this.failed++;
        }
    }

    async testConfiguration() {
        console.log('⚙️ Testing configuration...');
        
        if (this.config.apiKey && this.config.apiKey !== 'your_pinata_api_key_here') {
            this.pass('✅ Pinata API key is configured');
        } else {
            this.fail('❌ Pinata API key is not configured');
        }

        if (this.config.secretKey && this.config.secretKey !== 'your_pinata_secret_key_here') {
            this.pass('✅ Pinata Secret key is configured');
        } else {
            this.fail('❌ Pinata Secret key is not configured');
        }

        console.log();
    }

    async testPinataConnection() {
        console.log('🔗 Testing Pinata connection...');
        
        try {
            const response = await axios.get('https://api.pinata.cloud/data/testAuthentication', {
                headers: {
                    'pinata_api_key': this.config.apiKey,
                    'pinata_secret_api_key': this.config.secretKey
                }
            });
            
            if (response.status === 200) {
                this.pass('✅ Pinata connection successful');
            } else {
                this.fail('❌ Pinata connection failed');
            }
        } catch (error) {
            this.fail(`❌ Pinata connection error: ${error.message}`);
        }
        
        console.log();
    }

    async testFileUpload() {
        console.log('📤 Testing file upload to Pinata...');
        
        try {
            // Create test file content
            const testContent = 'This is test evidence content for NDEP IPFS integration.';
            const testBuffer = Buffer.from(testContent, 'utf8');
            
            // Create form data
            const formData = new FormData();
            formData.append('file', testBuffer, 'test-evidence.txt');

            // Create metadata
            const pinataMetadata = {
                name: 'ndep-test-evidence',
                keyvalues: {
                    evidenceId: 'TEST-EVD-001',
                    caseId: 'TEST-CASE-001',
                    description: 'Test evidence for IPFS integration',
                    uploadedAt: new Date().toISOString(),
                    sha256Hash: crypto.createHash('sha256').update(testBuffer).digest('hex')
                }
            };

            formData.append('pinataMetadata', JSON.stringify(pinataMetadata));

            // Upload to Pinata
            const response = await axios.post('https://api.pinata.cloud/pinning/pinFileToIPFS', formData, {
                headers: {
                    'pinata_api_key': this.config.apiKey,
                    'pinata_secret_api_key': this.config.secretKey,
                    ...formData.getHeaders()
                }
            });

            if (response.data && response.data.IpfsHash) {
                this.pass(`✅ File uploaded successfully - IPFS Hash: ${response.data.IpfsHash}`);
                this.testData = {
                    ipfsHash: response.data.IpfsHash,
                    fileName: 'test-evidence.txt',
                    fileSize: testBuffer.length,
                    sha256Hash: crypto.createHash('sha256').update(testBuffer).digest('hex')
                };
            } else {
                this.fail('❌ File upload failed - no IPFS hash returned');
            }
        } catch (error) {
            this.fail(`❌ File upload error: ${error.message}`);
        }
        
        console.log();
    }

    async testFileRetrieval() {
        console.log('📥 Testing file retrieval from Pinata...');
        
        if (!this.testData || !this.testData.ipfsHash) {
            this.fail('❌ No IPFS hash available for retrieval test');
            console.log();
            return;
        }

        try {
            // Retrieve file from IPFS via Pinata gateway
            const response = await axios.get(`${this.config.gateway}/ipfs/${this.testData.ipfsHash}`, {
                timeout: 10000
            });

            if (response.status === 200 && response.data) {
                const retrievedContent = response.data.toString();
                const expectedContent = 'This is test evidence content for NDEP IPFS integration.';
                
                if (retrievedContent === expectedContent) {
                    this.pass('✅ File retrieved successfully and content matches');
                } else {
                    this.fail('❌ File retrieved but content does not match');
                }
            } else {
                this.fail('❌ File retrieval failed');
            }
        } catch (error) {
            this.fail(`❌ File retrieval error: ${error.message}`);
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
        console.log('='.repeat(50));
        console.log('📊 Simple IPFS Test Results:');
        console.log(`✅ Passed: ${this.passed}`);
        console.log(`❌ Failed: ${this.failed}`);
        console.log(`📈 Total: ${this.passed + this.failed}`);
        
        const successRate = ((this.passed / (this.passed + this.failed)) * 100).toFixed(1);
        console.log(`🎯 Success Rate: ${successRate}%`);
        
        if (this.failed === 0) {
            console.log('\n🎉 All tests passed! IPFS integration is working!');
            console.log('\n📋 Next steps:');
            console.log('1. Start the backend: cd ../backend && npm run dev');
            console.log('2. Test the complete system with evidence upload');
            console.log('3. Verify blockchain integration');
        } else {
            console.log('\n⚠️ Some tests failed. Please check the issues above.');
        }
        
        console.log('='.repeat(50));
    }
}

// Run the test
const test = new SimpleIPFSTest();
test.runAllTests().catch(console.error);

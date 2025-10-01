// Comprehensive Test Suite for IPFS Integration with NDEP
// This test suite validates the complete IPFS + Fabric integration

const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const ipfsService = require('./IPFS_INTEGRATION');
const fabricIPFSService = require('./BACKEND_IPFS_INTEGRATION');

class IPFSTestSuite {
    constructor() {
        this.testResults = [];
        this.passedTests = 0;
        this.failedTests = 0;
        this.testData = {
            evidenceId: 'TEST-EVD-001',
            caseId: 'TEST-CASE-001',
            fileName: 'test-evidence.pdf',
            description: 'Test evidence for IPFS integration',
            location: 'Test Location',
            collectedBy: 'Test Officer'
        };
    }

    /**
     * Run all tests
     */
    async runAllTests() {
        console.log('🧪 Starting IPFS Integration Test Suite...\n');

        try {
            // Initialize services
            await this.testServiceInitialization();
            
            // Test IPFS operations
            await this.testIPFSUpload();
            await this.testIPFSRetrieval();
            await this.testIPFSMetadata();
            await this.testIPFSIntegrityVerification();
            await this.testIPFSFileListing();
            
            // Test Fabric + IPFS integration
            await this.testFabricIPFSCreation();
            await this.testFabricIPFSRetrieval();
            await this.testFabricIPFSCustodyTransfer();
            await this.testFabricIPFSIntegrityVerification();
            
            // Test error handling
            await this.testErrorHandling();
            
            // Generate test report
            this.generateTestReport();
            
        } catch (error) {
            console.error('❌ Test suite failed:', error.message);
            this.failedTests++;
        }
    }

    /**
     * Test service initialization
     */
    async testServiceInitialization() {
        console.log('🔧 Testing service initialization...');
        
        try {
            // Test IPFS service initialization
            const ipfsInitialized = await ipfsService.initialize();
            this.assert(ipfsInitialized, 'IPFS service should initialize successfully');
            
            // Test IPFS status
            const ipfsStatus = await ipfsService.getStatus();
            this.assert(ipfsStatus.status === 'connected', 'IPFS service should be connected');
            
            // Test Fabric + IPFS service initialization
            const fabricInitialized = await fabricIPFSService.initialize();
            this.assert(fabricInitialized, 'Fabric + IPFS service should initialize successfully');
            
            console.log('✅ Service initialization tests passed\n');
            
        } catch (error) {
            this.handleTestError('Service initialization', error);
        }
    }

    /**
     * Test IPFS file upload
     */
    async testIPFSUpload() {
        console.log('📤 Testing IPFS file upload...');
        
        try {
            // Create test file
            const testContent = 'This is test evidence content for IPFS upload.';
            const testBuffer = Buffer.from(testContent, 'utf8');
            
            // Upload to IPFS
            const result = await ipfsService.uploadFile(
                testBuffer,
                this.testData.fileName,
                this.testData.evidenceId,
                {
                    caseId: this.testData.caseId,
                    mimeType: 'application/pdf',
                    description: this.testData.description,
                    location: this.testData.location,
                    collectedBy: this.testData.collectedBy
                }
            );
            
            // Validate upload result
            this.assert(result.success, 'Upload should be successful');
            this.assert(result.ipfsHash, 'IPFS hash should be generated');
            this.assert(result.fileName === this.testData.fileName, 'File name should match');
            this.assert(result.fileSize === testBuffer.length, 'File size should match');
            this.assert(result.sha256Hash, 'SHA-256 hash should be generated');
            
            // Store for later tests
            this.testData.ipfsHash = result.ipfsHash;
            this.testData.sha256Hash = result.sha256Hash;
            
            console.log(`✅ IPFS upload test passed - Hash: ${result.ipfsHash}\n`);
            
        } catch (error) {
            this.handleTestError('IPFS upload', error);
        }
    }

    /**
     * Test IPFS file retrieval
     */
    async testIPFSRetrieval() {
        console.log('📥 Testing IPFS file retrieval...');
        
        try {
            if (!this.testData.ipfsHash) {
                throw new Error('No IPFS hash available for retrieval test');
            }
            
            // Retrieve file from IPFS
            const result = await ipfsService.retrieveFile(
                this.testData.ipfsHash,
                this.testData.fileName
            );
            
            // Validate retrieval result
            this.assert(result.success, 'Retrieval should be successful');
            this.assert(result.fileContent, 'File content should be retrieved');
            this.assert(result.fileName.endsWith(this.testData.fileName), 'File name should match');
            this.assert(result.metadata, 'Metadata should be retrieved');
            this.assert(result.metadata.evidenceId === this.testData.evidenceId, 'Evidence ID should match');
            
            console.log('✅ IPFS retrieval test passed\n');
            
        } catch (error) {
            this.handleTestError('IPFS retrieval', error);
        }
    }

    /**
     * Test IPFS metadata retrieval
     */
    async testIPFSMetadata() {
        console.log('📋 Testing IPFS metadata retrieval...');
        
        try {
            if (!this.testData.ipfsHash) {
                throw new Error('No IPFS hash available for metadata test');
            }
            
            // Get metadata from IPFS
            const result = await ipfsService.getFileMetadata(this.testData.ipfsHash);
            
            // Validate metadata result
            this.assert(result.success, 'Metadata retrieval should be successful');
            this.assert(result.metadata, 'Metadata should be retrieved');
            this.assert(result.metadata.evidenceId === this.testData.evidenceId, 'Evidence ID should match');
            this.assert(result.metadata.caseId === this.testData.caseId, 'Case ID should match');
            this.assert(result.metadata.description === this.testData.description, 'Description should match');
            
            console.log('✅ IPFS metadata test passed\n');
            
        } catch (error) {
            this.handleTestError('IPFS metadata', error);
        }
    }

    /**
     * Test IPFS integrity verification
     */
    async testIPFSIntegrityVerification() {
        console.log('🔍 Testing IPFS integrity verification...');
        
        try {
            if (!this.testData.ipfsHash || !this.testData.sha256Hash) {
                throw new Error('No IPFS hash or SHA-256 hash available for integrity test');
            }
            
            // Verify integrity
            const result = await ipfsService.verifyFileIntegrity(
                this.testData.ipfsHash,
                this.testData.sha256Hash
            );
            
            // Validate integrity result
            this.assert(result.success, 'Integrity verification should be successful');
            this.assert(result.isIntegrityValid, 'Integrity should be valid');
            this.assert(result.providedHash === this.testData.sha256Hash, 'Provided hash should match');
            this.assert(result.storedHash === this.testData.sha256Hash, 'Stored hash should match');
            
            console.log('✅ IPFS integrity verification test passed\n');
            
        } catch (error) {
            this.handleTestError('IPFS integrity verification', error);
        }
    }

    /**
     * Test IPFS file listing
     */
    async testIPFSFileListing() {
        console.log('📁 Testing IPFS file listing...');
        
        try {
            if (!this.testData.ipfsHash) {
                throw new Error('No IPFS hash available for file listing test');
            }
            
            // List files in IPFS directory
            const result = await ipfsService.listFiles(this.testData.ipfsHash);
            
            // Validate listing result
            this.assert(result.success, 'File listing should be successful');
            this.assert(result.files, 'Files should be listed');
            this.assert(result.files.length > 0, 'Should have at least one file');
            this.assert(result.count > 0, 'File count should be greater than 0');
            
            console.log(`✅ IPFS file listing test passed - Found ${result.count} files\n`);
            
        } catch (error) {
            this.handleTestError('IPFS file listing', error);
        }
    }

    /**
     * Test Fabric + IPFS evidence creation
     */
    async testFabricIPFSCreation() {
        console.log('🔗 Testing Fabric + IPFS evidence creation...');
        
        try {
            // Create test file
            const testContent = 'This is test evidence for Fabric + IPFS integration.';
            const testBuffer = Buffer.from(testContent, 'utf8');
            
            // Create evidence with IPFS
            const result = await fabricIPFSService.createEvidenceWithIPFS(
                {
                    evidenceId: 'FABRIC-TEST-EVD-001',
                    caseId: 'FABRIC-TEST-CASE-001',
                    fileName: 'fabric-test-evidence.pdf',
                    fileSize: testBuffer.length,
                    mimeType: 'application/pdf',
                    description: 'Test evidence for Fabric + IPFS',
                    location: 'Test Location',
                    collectedBy: 'Test Officer'
                },
                testBuffer
            );
            
            // Validate creation result
            this.assert(result.success, 'Evidence creation should be successful');
            this.assert(result.evidenceId, 'Evidence ID should be generated');
            this.assert(result.ipfsHash, 'IPFS hash should be generated');
            this.assert(result.fileHash, 'File hash should be generated');
            this.assert(result.url, 'IPFS URL should be generated');
            
            // Store for later tests
            this.testData.fabricEvidenceId = result.evidenceId;
            this.testData.fabricIpfsHash = result.ipfsHash;
            
            console.log(`✅ Fabric + IPFS creation test passed - Evidence ID: ${result.evidenceId}\n`);
            
        } catch (error) {
            this.handleTestError('Fabric + IPFS creation', error);
        }
    }

    /**
     * Test Fabric + IPFS evidence retrieval
     */
    async testFabricIPFSRetrieval() {
        console.log('📥 Testing Fabric + IPFS evidence retrieval...');
        
        try {
            if (!this.testData.fabricEvidenceId) {
                throw new Error('No Fabric evidence ID available for retrieval test');
            }
            
            // Retrieve evidence with IPFS
            const result = await fabricIPFSService.getEvidenceWithIPFS(this.testData.fabricEvidenceId);
            
            // Validate retrieval result
            this.assert(result.success, 'Evidence retrieval should be successful');
            this.assert(result.evidence, 'Evidence should be retrieved');
            this.assert(result.fileContent, 'File content should be retrieved');
            this.assert(result.evidence.evidenceId === this.testData.fabricEvidenceId, 'Evidence ID should match');
            this.assert(result.evidence.ipfsHash, 'IPFS hash should be present');
            
            console.log('✅ Fabric + IPFS retrieval test passed\n');
            
        } catch (error) {
            this.handleTestError('Fabric + IPFS retrieval', error);
        }
    }

    /**
     * Test Fabric + IPFS custody transfer
     */
    async testFabricIPFSCustodyTransfer() {
        console.log('🔄 Testing Fabric + IPFS custody transfer...');
        
        try {
            if (!this.testData.fabricEvidenceId) {
                throw new Error('No Fabric evidence ID available for custody transfer test');
            }
            
            // Transfer custody
            const result = await fabricIPFSService.transferCustodyWithIPFS(
                this.testData.fabricEvidenceId,
                'test.recipient',
                'Test custody transfer',
                null // No new file
            );
            
            // Validate transfer result
            this.assert(result.success, 'Custody transfer should be successful');
            this.assert(result.transferResult, 'Transfer result should be present');
            this.assert(result.transferResult.to === 'test.recipient', 'Recipient should match');
            
            console.log('✅ Fabric + IPFS custody transfer test passed\n');
            
        } catch (error) {
            this.handleTestError('Fabric + IPFS custody transfer', error);
        }
    }

    /**
     * Test Fabric + IPFS integrity verification
     */
    async testFabricIPFSIntegrityVerification() {
        console.log('🔍 Testing Fabric + IPFS integrity verification...');
        
        try {
            if (!this.testData.fabricEvidenceId || !this.testData.fabricIpfsHash) {
                throw new Error('No Fabric evidence ID or IPFS hash available for integrity test');
            }
            
            // Get evidence to get the file hash
            const evidence = await fabricIPFSService.getEvidenceFromBlockchain(this.testData.fabricEvidenceId);
            
            // Verify integrity
            const result = await fabricIPFSService.verifyIntegrityWithIPFS(
                this.testData.fabricEvidenceId,
                evidence.fileHash
            );
            
            // Validate integrity result
            this.assert(result.success, 'Integrity verification should be successful');
            this.assert(result.result, 'Verification result should be present');
            this.assert(result.result.isIntegrityValid, 'Integrity should be valid');
            this.assert(result.result.ipfsHash === this.testData.fabricIpfsHash, 'IPFS hash should match');
            
            console.log('✅ Fabric + IPFS integrity verification test passed\n');
            
        } catch (error) {
            this.handleTestError('Fabric + IPFS integrity verification', error);
        }
    }

    /**
     * Test error handling
     */
    async testErrorHandling() {
        console.log('🚨 Testing error handling...');
        
        try {
            // Test invalid IPFS hash
            try {
                await ipfsService.retrieveFile('invalid-hash', 'test.txt');
                this.assert(false, 'Should throw error for invalid IPFS hash');
            } catch (error) {
                this.assert(error.message.includes('Failed to retrieve'), 'Should throw appropriate error');
            }
            
            // Test invalid evidence ID
            try {
                await fabricIPFSService.getEvidenceFromBlockchain('INVALID-EVD-001');
                this.assert(false, 'Should throw error for invalid evidence ID');
            } catch (error) {
                this.assert(error.message.includes('does not exist'), 'Should throw appropriate error');
            }
            
            console.log('✅ Error handling tests passed\n');
            
        } catch (error) {
            this.handleTestError('Error handling', error);
        }
    }

    /**
     * Assert helper function
     */
    assert(condition, message) {
        if (condition) {
            this.passedTests++;
            this.testResults.push({ status: 'PASS', message });
        } else {
            this.failedTests++;
            this.testResults.push({ status: 'FAIL', message });
            console.error(`❌ Assertion failed: ${message}`);
        }
    }

    /**
     * Handle test error
     */
    handleTestError(testName, error) {
        this.failedTests++;
        this.testResults.push({ status: 'FAIL', message: `${testName}: ${error.message}` });
        console.error(`❌ ${testName} test failed:`, error.message);
    }

    /**
     * Generate test report
     */
    generateTestReport() {
        console.log('📊 Test Suite Results:');
        console.log('='.repeat(50));
        console.log(`✅ Passed: ${this.passedTests}`);
        console.log(`❌ Failed: ${this.failedTests}`);
        console.log(`📈 Total: ${this.passedTests + this.failedTests}`);
        console.log(`🎯 Success Rate: ${((this.passedTests / (this.passedTests + this.failedTests)) * 100).toFixed(1)}%`);
        console.log('='.repeat(50));
        
        if (this.failedTests > 0) {
            console.log('\n❌ Failed Tests:');
            this.testResults
                .filter(result => result.status === 'FAIL')
                .forEach(result => console.log(`  - ${result.message}`));
        }
        
        console.log('\n🎉 Test suite completed!');
        
        // Save detailed report
        const report = {
            timestamp: new Date().toISOString(),
            summary: {
                passed: this.passedTests,
                failed: this.failedTests,
                total: this.passedTests + this.failedTests,
                successRate: (this.passedTests / (this.passedTests + this.failedTests)) * 100
            },
            results: this.testResults,
            testData: this.testData
        };
        
        fs.writeFileSync('ipfs-test-report.json', JSON.stringify(report, null, 2));
        console.log('📄 Detailed report saved to: ipfs-test-report.json');
    }
}

// Run tests if this file is executed directly
if (require.main === module) {
    const testSuite = new IPFSTestSuite();
    testSuite.runAllTests().catch(console.error);
}

module.exports = IPFSTestSuite;

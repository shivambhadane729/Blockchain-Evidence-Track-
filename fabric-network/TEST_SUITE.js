// Comprehensive Test Suite for NDEP Blockchain Integration
// This file contains automated tests for end-to-end validation

const axios = require('axios');
const crypto = require('crypto');

class NDEPBlockchainTestSuite {
    constructor() {
        this.baseURL = 'http://localhost:3001';
        this.authToken = null;
        this.testResults = [];
    }

    // Utility function to log test results
    logTest(testName, passed, message = '') {
        const result = {
            test: testName,
            passed,
            message,
            timestamp: new Date().toISOString()
        };
        this.testResults.push(result);
        console.log(`${passed ? '✅' : '❌'} ${testName}: ${message}`);
    }

    // Generate test authentication token
    async authenticate() {
        try {
            const response = await axios.post(`${this.baseURL}/api/auth/login`, {
                email: 'admin@ndep.gov.in',
                password: 'admin123',
                role: 'system-admin',
                otp: '123456'
            });
            
            this.authToken = response.data.token;
            this.logTest('Authentication', true, 'Successfully authenticated');
            return true;
        } catch (error) {
            this.logTest('Authentication', false, `Failed to authenticate: ${error.message}`);
            return false;
        }
    }

    // Test 1: Network Health Check
    async testNetworkHealth() {
        try {
            const response = await axios.get(`${this.baseURL}/api/blockchain/status`, {
                headers: { 'Authorization': `Bearer ${this.authToken}` }
            });

            const { fabric, initialized } = response.data.data;
            const isHealthy = fabric.status === 'connected' && initialized === true;
            
            this.logTest('Network Health Check', isHealthy, 
                `Fabric: ${fabric.status}, Initialized: ${initialized}`);
            return isHealthy;
        } catch (error) {
            this.logTest('Network Health Check', false, `Network health check failed: ${error.message}`);
            return false;
        }
    }

    // Test 2: Evidence Creation
    async testEvidenceCreation() {
        try {
            const evidenceData = {
                evidenceId: `EVD-TEST-${Date.now()}`,
                caseId: 'CASE-TEST-001',
                fileName: 'test_evidence.pdf',
                fileHash: 'sha256:test_hash_12345',
                fileSize: 1024000,
                mimeType: 'application/pdf',
                description: 'Test evidence for automated testing',
                location: 'Test Crime Scene',
                collectedBy: 'Test Officer'
            };

            const response = await axios.post(`${this.baseURL}/api/blockchain/evidence`, evidenceData, {
                headers: { 
                    'Authorization': `Bearer ${this.authToken}`,
                    'Content-Type': 'application/json'
                }
            });

            const success = response.data.success && response.data.data.evidenceId === evidenceData.evidenceId;
            this.logTest('Evidence Creation', success, 
                `Created evidence: ${evidenceData.evidenceId}`);
            
            return { success, evidenceId: evidenceData.evidenceId };
        } catch (error) {
            this.logTest('Evidence Creation', false, `Evidence creation failed: ${error.message}`);
            return { success: false, evidenceId: null };
        }
    }

    // Test 3: Evidence Retrieval
    async testEvidenceRetrieval(evidenceId) {
        try {
            const response = await axios.get(`${this.baseURL}/api/blockchain/evidence/${evidenceId}`, {
                headers: { 'Authorization': `Bearer ${this.authToken}` }
            });

            const success = response.data.success && response.data.data.evidenceId === evidenceId;
            this.logTest('Evidence Retrieval', success, 
                `Retrieved evidence: ${evidenceId}`);
            
            return { success, evidence: response.data.data };
        } catch (error) {
            this.logTest('Evidence Retrieval', false, `Evidence retrieval failed: ${error.message}`);
            return { success: false, evidence: null };
        }
    }

    // Test 4: Custody Transfer
    async testCustodyTransfer(evidenceId) {
        try {
            const transferData = {
                toUser: 'forensic.analyst1',
                reason: 'Automated test custody transfer'
            };

            const response = await axios.post(
                `${this.baseURL}/api/blockchain/evidence/${evidenceId}/transfer`, 
                transferData,
                {
                    headers: { 
                        'Authorization': `Bearer ${this.authToken}`,
                        'Content-Type': 'application/json'
                    }
                }
            );

            const success = response.data.success && response.data.data.to === transferData.toUser;
            this.logTest('Custody Transfer', success, 
                `Transferred custody to: ${transferData.toUser}`);
            
            return { success, transfer: response.data.data };
        } catch (error) {
            this.logTest('Custody Transfer', false, `Custody transfer failed: ${error.message}`);
            return { success: false, transfer: null };
        }
    }

    // Test 5: Integrity Verification
    async testIntegrityVerification(evidenceId, correctHash = 'sha256:test_hash_12345') {
        try {
            const response = await axios.post(
                `${this.baseURL}/api/blockchain/evidence/${evidenceId}/verify`,
                { providedHash: correctHash },
                {
                    headers: { 
                        'Authorization': `Bearer ${this.authToken}`,
                        'Content-Type': 'application/json'
                    }
                }
            );

            const success = response.data.success && response.data.data.isIntegrityValid === true;
            this.logTest('Integrity Verification (Valid)', success, 
                `Integrity check passed: ${response.data.data.isIntegrityValid}`);
            
            return { success, result: response.data.data };
        } catch (error) {
            this.logTest('Integrity Verification (Valid)', false, `Integrity verification failed: ${error.message}`);
            return { success: false, result: null };
        }
    }

    // Test 6: Integrity Verification with Tampered Hash
    async testIntegrityVerificationTampered(evidenceId) {
        try {
            const tamperedHash = 'sha256:tampered_hash_12345';
            const response = await axios.post(
                `${this.baseURL}/api/blockchain/evidence/${evidenceId}/verify`,
                { providedHash: tamperedHash },
                {
                    headers: { 
                        'Authorization': `Bearer ${this.authToken}`,
                        'Content-Type': 'application/json'
                    }
                }
            );

            const success = response.data.success && response.data.data.isIntegrityValid === false;
            this.logTest('Integrity Verification (Tampered)', success, 
                `Tampered hash correctly detected: ${response.data.data.isIntegrityValid}`);
            
            return { success, result: response.data.data };
        } catch (error) {
            this.logTest('Integrity Verification (Tampered)', false, `Tampered hash test failed: ${error.message}`);
            return { success: false, result: null };
        }
    }

    // Test 7: Custody Chain Retrieval
    async testCustodyChainRetrieval(evidenceId) {
        try {
            const response = await axios.get(
                `${this.baseURL}/api/blockchain/evidence/${evidenceId}/custody`,
                {
                    headers: { 'Authorization': `Bearer ${this.authToken}` }
                }
            );

            const success = response.data.success && Array.isArray(response.data.data);
            this.logTest('Custody Chain Retrieval', success, 
                `Retrieved ${response.data.data.length} custody transfers`);
            
            return { success, custodyChain: response.data.data };
        } catch (error) {
            this.logTest('Custody Chain Retrieval', false, `Custody chain retrieval failed: ${error.message}`);
            return { success: false, custodyChain: null };
        }
    }

    // Test 8: Evidence by Case
    async testEvidenceByCase(caseId) {
        try {
            const response = await axios.get(
                `${this.baseURL}/api/blockchain/case/${caseId}/evidence`,
                {
                    headers: { 'Authorization': `Bearer ${this.authToken}` }
                }
            );

            const success = response.data.success && Array.isArray(response.data.data);
            this.logTest('Evidence by Case', success, 
                `Retrieved ${response.data.data.length} evidence items for case ${caseId}`);
            
            return { success, evidence: response.data.data };
        } catch (error) {
            this.logTest('Evidence by Case', false, `Evidence by case retrieval failed: ${error.message}`);
            return { success: false, evidence: null };
        }
    }

    // Test 9: Blockchain Explorer
    async testBlockchainExplorer() {
        try {
            const response = await axios.get(`${this.baseURL}/api/blockchain/explorer`, {
                headers: { 'Authorization': `Bearer ${this.authToken}` }
            });

            const success = response.data.success && response.data.data.statistics;
            this.logTest('Blockchain Explorer', success, 
                `Explorer data retrieved: ${response.data.data.statistics.totalEvidence} total evidence`);
            
            return { success, explorerData: response.data.data };
        } catch (error) {
            this.logTest('Blockchain Explorer', false, `Blockchain explorer failed: ${error.message}`);
            return { success: false, explorerData: null };
        }
    }

    // Test 10: Security - Unauthorized Access
    async testUnauthorizedAccess() {
        try {
            await axios.get(`${this.baseURL}/api/blockchain/evidence`, {
                headers: { 'Authorization': 'Bearer invalid-token' }
            });
            
            this.logTest('Security - Unauthorized Access', false, 'Should have been rejected');
            return false;
        } catch (error) {
            const success = error.response && error.response.status === 401;
            this.logTest('Security - Unauthorized Access', success, 
                `Correctly rejected unauthorized access: ${error.response?.status}`);
            return success;
        }
    }

    // Test 11: Performance - Multiple Evidence Creation
    async testPerformanceMultipleEvidence() {
        try {
            const startTime = Date.now();
            const promises = [];
            
            // Create 5 evidence items concurrently
            for (let i = 0; i < 5; i++) {
                const evidenceData = {
                    evidenceId: `EVD-PERF-${Date.now()}-${i}`,
                    caseId: 'CASE-PERF-001',
                    fileName: `performance_test_${i}.pdf`,
                    fileHash: `sha256:perf_hash_${i}`,
                    fileSize: 1024000,
                    mimeType: 'application/pdf',
                    description: `Performance test evidence ${i}`,
                    location: 'Performance Test Scene',
                    collectedBy: 'Performance Test Officer'
                };

                promises.push(
                    axios.post(`${this.baseURL}/api/blockchain/evidence`, evidenceData, {
                        headers: { 
                            'Authorization': `Bearer ${this.authToken}`,
                            'Content-Type': 'application/json'
                        }
                    })
                );
            }

            await Promise.all(promises);
            const endTime = Date.now();
            const duration = endTime - startTime;
            
            const success = duration < 10000; // Should complete within 10 seconds
            this.logTest('Performance - Multiple Evidence', success, 
                `Created 5 evidence items in ${duration}ms`);
            
            return { success, duration };
        } catch (error) {
            this.logTest('Performance - Multiple Evidence', false, `Performance test failed: ${error.message}`);
            return { success: false, duration: null };
        }
    }

    // Run all tests
    async runAllTests() {
        console.log('🚀 Starting NDEP Blockchain Test Suite...\n');
        
        // Authenticate first
        const authSuccess = await this.authenticate();
        if (!authSuccess) {
            console.log('❌ Authentication failed. Cannot proceed with tests.');
            return this.generateReport();
        }

        // Test 1: Network Health
        const networkHealthy = await this.testNetworkHealth();
        if (!networkHealthy) {
            console.log('❌ Network not healthy. Some tests may fail.');
        }

        // Test 2: Evidence Creation
        const evidenceResult = await this.testEvidenceCreation();
        const evidenceId = evidenceResult.evidenceId;

        if (evidenceId) {
            // Test 3: Evidence Retrieval
            await this.testEvidenceRetrieval(evidenceId);

            // Test 4: Custody Transfer
            await this.testCustodyTransfer(evidenceId);

            // Test 5: Integrity Verification
            await this.testIntegrityVerification(evidenceId);

            // Test 6: Integrity Verification with Tampered Hash
            await this.testIntegrityVerificationTampered(evidenceId);

            // Test 7: Custody Chain Retrieval
            await this.testCustodyChainRetrieval(evidenceId);
        }

        // Test 8: Evidence by Case
        await this.testEvidenceByCase('CASE-TEST-001');

        // Test 9: Blockchain Explorer
        await this.testBlockchainExplorer();

        // Test 10: Security
        await this.testUnauthorizedAccess();

        // Test 11: Performance
        await this.testPerformanceMultipleEvidence();

        return this.generateReport();
    }

    // Generate test report
    generateReport() {
        const totalTests = this.testResults.length;
        const passedTests = this.testResults.filter(r => r.passed).length;
        const failedTests = totalTests - passedTests;
        const successRate = ((passedTests / totalTests) * 100).toFixed(2);

        console.log('\n📊 Test Report Summary:');
        console.log('========================');
        console.log(`Total Tests: ${totalTests}`);
        console.log(`Passed: ${passedTests} ✅`);
        console.log(`Failed: ${failedTests} ❌`);
        console.log(`Success Rate: ${successRate}%`);

        if (failedTests > 0) {
            console.log('\n❌ Failed Tests:');
            this.testResults.filter(r => !r.passed).forEach(test => {
                console.log(`  - ${test.test}: ${test.message}`);
            });
        }

        console.log('\n🎯 Production Readiness:');
        if (successRate >= 90) {
            console.log('✅ EXCELLENT - System is production ready!');
        } else if (successRate >= 80) {
            console.log('⚠️ GOOD - Minor issues to address before production');
        } else if (successRate >= 70) {
            console.log('⚠️ FAIR - Several issues need to be resolved');
        } else {
            console.log('❌ POOR - Major issues prevent production deployment');
        }

        return {
            totalTests,
            passedTests,
            failedTests,
            successRate: parseFloat(successRate),
            results: this.testResults,
            productionReady: successRate >= 90
        };
    }
}

// Export for use in other files
module.exports = NDEPBlockchainTestSuite;

// Run tests if this file is executed directly
if (require.main === module) {
    const testSuite = new NDEPBlockchainTestSuite();
    testSuite.runAllTests().then(report => {
        process.exit(report.productionReady ? 0 : 1);
    }).catch(error => {
        console.error('Test suite failed:', error);
        process.exit(1);
    });
}

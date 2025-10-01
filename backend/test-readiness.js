// NDEP IPFS Integration Readiness Test
// This script checks if all components are ready for testing

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class ReadinessTest {
    constructor() {
        this.results = [];
        this.passed = 0;
        this.failed = 0;
    }

    async runAllTests() {
        console.log('🧪 NDEP IPFS Integration Readiness Test\n');
        console.log('='.repeat(50));

        // Test 1: Check if all required files exist
        await this.testRequiredFiles();

        // Test 2: Check if dependencies are installed
        await this.testDependencies();

        // Test 3: Check if configuration is set up
        await this.testConfiguration();

        // Test 4: Check if Fabric network files exist
        await this.testFabricNetwork();

        // Test 5: Check if IPFS integration files exist
        await this.testIPFSIntegration();

        // Generate report
        this.generateReport();
    }

    async testRequiredFiles() {
        console.log('📁 Testing required files...');
        
        const requiredFiles = [
            'server.js',
            'package.json',
            'config.env',
            'database/init-simple.js',
            'middleware/auth.js',
            'routes/auth.js'
        ];

        for (const file of requiredFiles) {
            const filePath = path.join(__dirname, file);
            if (fs.existsSync(filePath)) {
                this.pass(`✅ ${file} exists`);
            } else {
                this.fail(`❌ ${file} missing`);
            }
        }
        console.log();
    }

    async testDependencies() {
        console.log('📦 Testing dependencies...');
        
        try {
            const packageJson = JSON.parse(fs.readFileSync(path.join(__dirname, 'package.json'), 'utf8'));
            const requiredDeps = [
                'express',
                'cors',
                'helmet',
                'morgan',
                'dotenv',
                'bcryptjs',
                'jsonwebtoken',
                'multer',
                'sqlite3',
                'axios',
                'form-data',
                'fabric-network',
                'fabric-ca-client'
            ];

            for (const dep of requiredDeps) {
                if (packageJson.dependencies[dep]) {
                    this.pass(`✅ ${dep} is installed`);
                } else {
                    this.fail(`❌ ${dep} is missing`);
                }
            }

            // Check if node_modules exists
            if (fs.existsSync(path.join(__dirname, 'node_modules'))) {
                this.pass('✅ node_modules directory exists');
            } else {
                this.fail('❌ node_modules directory missing - run npm install');
            }

        } catch (error) {
            this.fail(`❌ Error reading package.json: ${error.message}`);
        }
        console.log();
    }

    async testConfiguration() {
        console.log('⚙️ Testing configuration...');
        
        try {
            const configPath = path.join(__dirname, 'config.env');
            if (fs.existsSync(configPath)) {
                this.pass('✅ config.env exists');
                
                const config = fs.readFileSync(configPath, 'utf8');
                
                // Check for required config variables
                const requiredConfigs = [
                    'PORT=',
                    'JWT_SECRET=',
                    'PINATA_API_KEY=',
                    'PINATA_SECRET_KEY=',
                    'FABRIC_NETWORK_CONFIG_PATH='
                ];

                for (const configVar of requiredConfigs) {
                    if (config.includes(configVar)) {
                        this.pass(`✅ ${configVar} is configured`);
                    } else {
                        this.fail(`❌ ${configVar} is missing`);
                    }
                }

                // Check if Pinata API keys are set (not placeholder)
                if (config.includes('PINATA_API_KEY=your_pinata_api_key_here')) {
                    this.fail('❌ PINATA_API_KEY is not set - please get API key from https://pinata.cloud/');
                } else if (config.includes('PINATA_API_KEY=')) {
                    this.pass('✅ PINATA_API_KEY is configured');
                }

                if (config.includes('PINATA_SECRET_KEY=your_pinata_secret_key_here')) {
                    this.fail('❌ PINATA_SECRET_KEY is not set - please get secret key from https://pinata.cloud/');
                } else if (config.includes('PINATA_SECRET_KEY=')) {
                    this.pass('✅ PINATA_SECRET_KEY is configured');
                }

            } else {
                this.fail('❌ config.env missing');
            }
        } catch (error) {
            this.fail(`❌ Error reading config: ${error.message}`);
        }
        console.log();
    }

    async testFabricNetwork() {
        console.log('⛓️ Testing Fabric network files...');
        
        const fabricFiles = [
            '../fabric-network/connection-profile.json',
            '../fabric-network/docker-compose.yml',
            '../fabric-network/chaincode/evidence-management/index.js',
            '../fabric-network/scripts/generate-certs.sh'
        ];

        for (const file of fabricFiles) {
            const filePath = path.join(__dirname, file);
            if (fs.existsSync(filePath)) {
                this.pass(`✅ ${file} exists`);
            } else {
                this.fail(`❌ ${file} missing`);
            }
        }
        console.log();
    }

    async testIPFSIntegration() {
        console.log('🌐 Testing IPFS integration files...');
        
        const ipfsFiles = [
            '../fabric-network/IPFS_INTEGRATION.js',
            '../fabric-network/BACKEND_IPFS_INTEGRATION.js',
            '../fabric-network/BACKEND_IPFS_ROUTES.js',
            '../fabric-network/FRONTEND_IPFS_COMPONENTS.tsx',
            '../fabric-network/IPFS_TEST_SUITE.js',
            '../fabric-network/IPFS_SETUP_GUIDE.md'
        ];

        for (const file of ipfsFiles) {
            const filePath = path.join(__dirname, file);
            if (fs.existsSync(filePath)) {
                this.pass(`✅ ${file} exists`);
            } else {
                this.fail(`❌ ${file} missing`);
            }
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
        console.log('📊 Readiness Test Results:');
        console.log(`✅ Passed: ${this.passed}`);
        console.log(`❌ Failed: ${this.failed}`);
        console.log(`📈 Total: ${this.passed + this.failed}`);
        
        const successRate = ((this.passed / (this.passed + this.failed)) * 100).toFixed(1);
        console.log(`🎯 Success Rate: ${successRate}%`);
        
        if (this.failed === 0) {
            console.log('\n🎉 All tests passed! You are ready for testing!');
            console.log('\n📋 Next steps:');
            console.log('1. Get Web3.Storage token from https://web3.storage/');
            console.log('2. Update WEB3_STORAGE_TOKEN in config.env');
            console.log('3. Start the backend: npm run dev');
            console.log('4. Run IPFS test suite: node ../fabric-network/IPFS_TEST_SUITE.js');
        } else {
            console.log('\n⚠️ Some tests failed. Please fix the issues above before testing.');
            console.log('\n🔧 Common fixes:');
            console.log('- Run: npm install');
            console.log('- Get Web3.Storage token and update config.env');
            console.log('- Ensure all files are in the correct locations');
        }
        
        console.log('='.repeat(50));
    }
}

// Run the test
const test = new ReadinessTest();
test.runAllTests().catch(console.error);

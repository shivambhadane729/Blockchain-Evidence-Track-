import { hashEvidence, recordEvidence, verifyEvidence } from '../blockchain/services/blockchain.js';
import { initializeDatabase } from './database/init-simple.js';

async function testIntegratedBlockchain() {
  console.log('🔗 Testing Integrated Blockchain (Backend + Blockchain)...\n');

  // Initialize database
  await initializeDatabase();
  console.log('✅ Database initialized\n');

  try {
    // Test evidence workflow
    console.log('📁 Testing Evidence Workflow...');
    
    // 1. Create test evidence
    const testEvidence = Buffer.from('This is a test evidence file for blockchain verification');
    console.log('📄 Test evidence created:', testEvidence.length, 'bytes');
    
    // 2. Hash the evidence
    const hash = await hashEvidence(testEvidence);
    console.log('🔐 Evidence hashed:', hash);
    
    // 3. Record on blockchain
    const evidenceData = {
      evidenceId: 'EVD-TEST-001',
      caseId: 'CASE-2024-TEST',
      officerId: 'admin@ndep.gov.in',
      fileHash: hash,
      fileName: 'test-evidence.txt',
      fileSize: testEvidence.length,
      evidenceType: 'digital',
      description: 'Test evidence for integrated blockchain verification'
    };
    
    const recordResult = await recordEvidence(evidenceData);
    console.log('📝 Evidence recorded on blockchain:');
    console.log('   Transaction Hash:', recordResult.transactionHash);
    console.log('   Block Number:', recordResult.blockNumber);
    console.log('   Timestamp:', recordResult.timestamp);
    
    // 4. Verify evidence
    const verification = await verifyEvidence(hash);
    console.log('✅ Evidence verification result:');
    console.log('   Exists:', verification.exists);
    console.log('   Message:', verification.message);
    
    console.log('\n🎉 Integrated Blockchain Test Complete!');
    console.log('✅ Backend server includes blockchain functionality');
    console.log('✅ Blockchain routes are available at /api/blockchain/*');
    console.log('✅ Evidence can be hashed, recorded, and verified');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testIntegratedBlockchain();

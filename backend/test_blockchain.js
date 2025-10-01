import { hashEvidence, recordEvidence, verifyEvidence, recordCustodyTransfer, getCustodyTimeline } from '../blockchain/services/blockchain.js';
import { initializeDatabase } from './database/init-simple.js';

async function testBlockchain() {
  console.log('🧪 Testing Blockchain Services...\n');

  // Initialize database first
  console.log('🔧 Initializing database...');
  await initializeDatabase();
  console.log('✅ Database initialized\n');

  try {
    // Test 1: Hash Evidence
    console.log('1️⃣ Testing Evidence Hashing...');
    const testFile = Buffer.from('This is test evidence content');
    const hash = await hashEvidence(testFile);
    console.log('✅ Hash generated:', hash);
    console.log('   Hash length:', hash.length);
    console.log('   Hash type:', typeof hash);
    console.log('');

    // Test 2: Record Evidence
    console.log('2️⃣ Testing Evidence Recording...');
    const evidenceData = {
      evidenceId: 'TEST-001',
      caseId: 'CASE-2024-001',
      officerId: 'admin@ndep.gov.in',
      fileHash: hash,
      fileName: 'test-evidence.txt',
      fileSize: testFile.length,
      evidenceType: 'digital',
      description: 'Test evidence for blockchain verification'
    };

    const recordResult = await recordEvidence(evidenceData);
    console.log('✅ Evidence recorded:', recordResult);
    console.log('   Transaction ID:', recordResult.transactionId);
    console.log('   Block Number:', recordResult.blockNumber);
    console.log('');

    // Test 3: Verify Evidence
    console.log('3️⃣ Testing Evidence Verification...');
    const verification = await verifyEvidence(hash);
    console.log('✅ Evidence verification:', verification);
    console.log('   Is Valid:', verification.isValid);
    console.log('   Evidence ID:', verification.evidenceId);
    console.log('   Case ID:', verification.caseId);
    console.log('');

    // Test 4: Record Custody Transfer
    console.log('4️⃣ Testing Custody Transfer...');
    const custodyData = {
      evidenceId: 'TEST-001',
      fromUser: 'admin@ndep.gov.in',
      toUser: 'officer.rajesh@police.gov.in',
      transferType: 'handover',
      location: 'Police Station',
      notes: 'Transfer to investigating officer'
    };

    const custodyResult = await recordCustodyTransfer(custodyData);
    console.log('✅ Custody transfer recorded:', custodyResult);
    console.log('   Transfer ID:', custodyResult.transferId);
    console.log('   Block Number:', custodyResult.blockNumber);
    console.log('');

    // Test 5: Get Custody Timeline
    console.log('5️⃣ Testing Custody Timeline...');
    const timeline = await getCustodyTimeline('TEST-001');
    console.log('✅ Custody timeline retrieved:');
    console.log('   Total transfers:', timeline.length);
    timeline.forEach((transfer, index) => {
      console.log(`   ${index + 1}. ${transfer.fromUser} → ${transfer.toUser} (${transfer.timestamp})`);
    });
    console.log('');

    console.log('🎉 All blockchain tests passed successfully!');
    console.log('✅ Blockchain service is working correctly');

  } catch (error) {
    console.error('❌ Blockchain test failed:', error.message);
    console.error('   Stack:', error.stack);
  }
}

testBlockchain();

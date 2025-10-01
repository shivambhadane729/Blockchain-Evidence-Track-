import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { getDatabase } from '../../backend/database/init-simple.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Blockchain Service Module for NDEP
 * 
 * This module simulates Hyperledger Fabric blockchain operations for evidence management.
 * In production, these functions would be replaced with actual Hyperledger Fabric SDK calls.
 * 
 * Key Functions:
 * - hashEvidence: Generate SHA-256 hash for evidence files
 * - recordEvidence: Record evidence metadata on blockchain
 * - verifyEvidence: Verify evidence integrity against blockchain
 * - recordCustodyTransfer: Log custody transfers on blockchain
 * - getCustodyTimeline: Retrieve complete custody chain for evidence
 */

// Local blockchain simulation storage
const BLOCKCHAIN_DATA_PATH = path.join(__dirname, '..', '..', 'blockchain-data');
const EVIDENCE_LEDGER_FILE = path.join(BLOCKCHAIN_DATA_PATH, 'evidence-ledger.json');
const CUSTODY_LEDGER_FILE = path.join(BLOCKCHAIN_DATA_PATH, 'custody-ledger.json');

// Initialize blockchain data directory
function initializeBlockchainStorage() {
  if (!fs.existsSync(BLOCKCHAIN_DATA_PATH)) {
    fs.mkdirSync(BLOCKCHAIN_DATA_PATH, { recursive: true });
  }
  
  // Initialize ledger files if they don't exist
  if (!fs.existsSync(EVIDENCE_LEDGER_FILE)) {
    fs.writeFileSync(EVIDENCE_LEDGER_FILE, JSON.stringify({
      blocks: [],
      lastBlockNumber: 0,
      chainId: 'ndep-evidence-chain'
    }, null, 2));
  }
  
  if (!fs.existsSync(CUSTODY_LEDGER_FILE)) {
    fs.writeFileSync(CUSTODY_LEDGER_FILE, JSON.stringify({
      blocks: [],
      lastBlockNumber: 0,
      chainId: 'ndep-custody-chain'
    }, null, 2));
  }
}

/**
 * Generate SHA-256 hash for evidence file
 * @param {Buffer|string} evidenceFile - File buffer or file path
 * @returns {string} SHA-256 hash in hexadecimal format
 */
export function hashEvidence(evidenceFile) {
  try {
    let data;
    
    if (Buffer.isBuffer(evidenceFile)) {
      data = evidenceFile;
    } else if (typeof evidenceFile === 'string') {
      // If it's a file path, read the file
      if (fs.existsSync(evidenceFile)) {
        data = fs.readFileSync(evidenceFile);
      } else {
        throw new Error(`File not found: ${evidenceFile}`);
      }
    } else {
      throw new Error('Invalid evidence file format');
    }
    
    const hash = crypto.createHash('sha256');
    hash.update(data);
    return hash.digest('hex');
  } catch (error) {
    console.error('Error hashing evidence:', error);
    throw new Error(`Failed to hash evidence: ${error.message}`);
  }
}

/**
 * Record evidence metadata on blockchain
 * @param {string} hash - Evidence file hash
 * @param {string} caseId - Case identifier
 * @param {number} officerId - Officer who collected the evidence
 * @param {string} timestamp - Collection timestamp
 * @param {Object} metadata - Additional evidence metadata
 * @returns {Object} Transaction result with block number and transaction hash
 */
export function recordEvidence(hash, caseId, officerId, timestamp, metadata = {}) {
  try {
    initializeBlockchainStorage();
    
    const db = getDatabase();
    const transactionHash = crypto.createHash('sha256')
      .update(`${hash}-${caseId}-${officerId}-${timestamp}`)
      .digest('hex');
    
    // Read current ledger
    const ledgerData = JSON.parse(fs.readFileSync(EVIDENCE_LEDGER_FILE, 'utf8'));
    
    // Create new block
    const newBlock = {
      blockNumber: ledgerData.lastBlockNumber + 1,
      timestamp: new Date().toISOString(),
      transactionHash,
      transactionType: 'EVIDENCE_RECORD',
      data: {
        evidenceHash: hash,
        caseId,
        officerId,
        collectionTimestamp: timestamp,
        metadata: {
          fileSize: metadata.fileSize || null,
          mimeType: metadata.mimeType || null,
          description: metadata.description || null,
          evidenceType: metadata.evidenceType || null,
          ...metadata
        }
      },
      previousHash: ledgerData.blocks.length > 0 ? 
        ledgerData.blocks[ledgerData.blocks.length - 1].transactionHash : null
    };
    
    // Add block to ledger
    ledgerData.blocks.push(newBlock);
    ledgerData.lastBlockNumber = newBlock.blockNumber;
    
    // Write back to file
    fs.writeFileSync(EVIDENCE_LEDGER_FILE, JSON.stringify(ledgerData, null, 2));
    
    // Record in database for quick access
    const insertTransaction = `
      INSERT INTO blockchain_transactions 
      (transaction_hash, block_number, evidence_id, case_id, transaction_type, data_hash, timestamp, is_verified)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;
    
    db.run(insertTransaction, [
      transactionHash,
      newBlock.blockNumber,
      metadata.evidenceId || null,
      caseId,
      'EVIDENCE_RECORD',
      hash,
      timestamp,
      true
    ]);
    
    console.log(`✅ Evidence recorded on blockchain: ${transactionHash}`);
    
    return {
      success: true,
      transactionHash,
      blockNumber: newBlock.blockNumber,
      timestamp: newBlock.timestamp
    };
    
  } catch (error) {
    console.error('Error recording evidence on blockchain:', error);
    throw new Error(`Failed to record evidence: ${error.message}`);
  }
}

/**
 * Verify evidence integrity against blockchain
 * @param {string} hash - Evidence file hash to verify
 * @returns {Object} Verification result with custody timeline
 */
export function verifyEvidence(hash) {
  try {
    initializeBlockchainStorage();
    
    const db = getDatabase();
    
    // Check if evidence exists in blockchain
    const ledgerData = JSON.parse(fs.readFileSync(EVIDENCE_LEDGER_FILE, 'utf8'));
    const evidenceBlock = ledgerData.blocks.find(block => 
      block.data.evidenceHash === hash
    );
    
    if (!evidenceBlock) {
      return {
        exists: false,
        message: 'Evidence not found in blockchain',
        custodyTimeline: []
      };
    }
    
    // Get custody timeline from database
    const custodyTimeline = getCustodyTimeline(evidenceBlock.data.evidenceId || hash);
    
    // Verify blockchain integrity
    const isIntegrityValid = verifyBlockchainIntegrity(ledgerData);
    
    return {
      exists: true,
      verified: isIntegrityValid,
      transactionHash: evidenceBlock.transactionHash,
      blockNumber: evidenceBlock.blockNumber,
      recordedAt: evidenceBlock.timestamp,
      custodyTimeline,
      message: isIntegrityValid ? 'Evidence verified successfully' : 'Blockchain integrity compromised'
    };
    
  } catch (error) {
    console.error('Error verifying evidence:', error);
    throw new Error(`Failed to verify evidence: ${error.message}`);
  }
}

/**
 * Record custody transfer on blockchain
 * @param {string} evidenceId - Evidence identifier
 * @param {number} fromUserId - User transferring custody
 * @param {number} toUserId - User receiving custody
 * @param {string} timestamp - Transfer timestamp
 * @param {Object} transferData - Additional transfer metadata
 * @returns {Object} Transaction result
 */
export function recordCustodyTransfer(evidenceId, fromUserId, toUserId, timestamp, transferData = {}) {
  try {
    initializeBlockchainStorage();
    
    const db = getDatabase();
    const transactionHash = crypto.createHash('sha256')
      .update(`${evidenceId}-${fromUserId}-${toUserId}-${timestamp}`)
      .digest('hex');
    
    // Read current custody ledger
    const ledgerData = JSON.parse(fs.readFileSync(CUSTODY_LEDGER_FILE, 'utf8'));
    
    // Create new block
    const newBlock = {
      blockNumber: ledgerData.lastBlockNumber + 1,
      timestamp: new Date().toISOString(),
      transactionHash,
      transactionType: 'CUSTODY_TRANSFER',
      data: {
        evidenceId,
        fromUserId,
        toUserId,
        transferTimestamp: timestamp,
        transferType: transferData.transferType || 'HANDOVER',
        transferReason: transferData.transferReason || null,
        transferNotes: transferData.transferNotes || null,
        fromLocation: transferData.fromLocation || null,
        toLocation: transferData.toLocation || null
      },
      previousHash: ledgerData.blocks.length > 0 ? 
        ledgerData.blocks[ledgerData.blocks.length - 1].transactionHash : null
    };
    
    // Add block to ledger
    ledgerData.blocks.push(newBlock);
    ledgerData.lastBlockNumber = newBlock.blockNumber;
    
    // Write back to file
    fs.writeFileSync(CUSTODY_LEDGER_FILE, JSON.stringify(ledgerData, null, 2));
    
    // Record in database
    const insertTransaction = `
      INSERT INTO blockchain_transactions 
      (transaction_hash, block_number, evidence_id, transaction_type, from_address, to_address, data_hash, timestamp, is_verified)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    
    const dataHash = crypto.createHash('sha256')
      .update(JSON.stringify(newBlock.data))
      .digest('hex');
    
    db.run(insertTransaction, [
      transactionHash,
      newBlock.blockNumber,
      evidenceId,
      'CUSTODY_TRANSFER',
      fromUserId.toString(),
      toUserId.toString(),
      dataHash,
      timestamp,
      true
    ]);
    
    console.log(`✅ Custody transfer recorded on blockchain: ${transactionHash}`);
    
    return {
      success: true,
      transactionHash,
      blockNumber: newBlock.blockNumber,
      timestamp: newBlock.timestamp
    };
    
  } catch (error) {
    console.error('Error recording custody transfer:', error);
    throw new Error(`Failed to record custody transfer: ${error.message}`);
  }
}

/**
 * Get complete custody timeline for evidence
 * @param {string} evidenceId - Evidence identifier
 * @returns {Array} Array of custody events
 */
export function getCustodyTimeline(evidenceId) {
  try {
    const db = getDatabase();
    
    return new Promise((resolve, reject) => {
      const query = `
        SELECT 
          cc.*,
          u1.name as from_user_name,
          u1.role as from_user_role,
          u2.name as to_user_name,
          u2.role as to_user_role,
          bt.transaction_hash,
          bt.block_number
        FROM custody_chain cc
        LEFT JOIN users u1 ON cc.from_user_id = u1.id
        LEFT JOIN users u2 ON cc.to_user_id = u2.id
        LEFT JOIN blockchain_transactions bt ON cc.blockchain_hash = bt.transaction_hash
        WHERE cc.evidence_id = ?
        ORDER BY cc.transferred_at ASC
      `;
      
      db.all(query, [evidenceId], (err, rows) => {
        if (err) {
          reject(err);
          return;
        }
        
        const timeline = rows.map(row => ({
          id: row.id,
          evidenceId: row.evidence_id,
          fromUser: {
            id: row.from_user_id,
            name: row.from_user_name,
            role: row.from_user_role
          },
          toUser: {
            id: row.to_user_id,
            name: row.to_user_name,
            role: row.to_user_role
          },
          fromLocation: row.from_location,
          toLocation: row.to_location,
          transferType: row.transfer_type,
          transferReason: row.transfer_reason,
          transferNotes: row.transfer_notes,
          blockchainHash: row.blockchain_hash,
          isVerified: row.is_verified,
          transferredAt: row.transferred_at,
          verifiedAt: row.verified_at,
          blockNumber: row.block_number,
          transactionHash: row.transaction_hash
        }));
        
        resolve(timeline);
      });
    });
    
  } catch (error) {
    console.error('Error getting custody timeline:', error);
    throw new Error(`Failed to get custody timeline: ${error.message}`);
  }
}

/**
 * Verify blockchain integrity by checking hash chain
 * @param {Object} ledgerData - Ledger data object
 * @returns {boolean} True if blockchain is valid
 */
function verifyBlockchainIntegrity(ledgerData) {
  try {
    for (let i = 1; i < ledgerData.blocks.length; i++) {
      const currentBlock = ledgerData.blocks[i];
      const previousBlock = ledgerData.blocks[i - 1];
      
      if (currentBlock.previousHash !== previousBlock.transactionHash) {
        console.error(`Blockchain integrity compromised at block ${currentBlock.blockNumber}`);
        return false;
      }
    }
    return true;
  } catch (error) {
    console.error('Error verifying blockchain integrity:', error);
    return false;
  }
}

/**
 * Get blockchain status and health metrics
 * @returns {Object} Blockchain status information
 */
export function getBlockchainStatus() {
  try {
    initializeBlockchainStorage();
    
    const evidenceLedger = JSON.parse(fs.readFileSync(EVIDENCE_LEDGER_FILE, 'utf8'));
    const custodyLedger = JSON.parse(fs.readFileSync(CUSTODY_LEDGER_FILE, 'utf8'));
    
    return {
      status: 'operational',
      evidenceChain: {
        chainId: evidenceLedger.chainId,
        blockCount: evidenceLedger.blocks.length,
        lastBlockNumber: evidenceLedger.lastBlockNumber,
        integrity: verifyBlockchainIntegrity(evidenceLedger)
      },
      custodyChain: {
        chainId: custodyLedger.chainId,
        blockCount: custodyLedger.blocks.length,
        lastBlockNumber: custodyLedger.lastBlockNumber,
        integrity: verifyBlockchainIntegrity(custodyLedger)
      },
      timestamp: new Date().toISOString()
    };
    
  } catch (error) {
    console.error('Error getting blockchain status:', error);
    return {
      status: 'error',
      message: error.message,
      timestamp: new Date().toISOString()
    };
  }
}

/**
 * Force mine a new block (for testing purposes)
 * @param {string} chainType - 'evidence' or 'custody'
 * @returns {Object} Mining result
 */
export function forceMineBlock(chainType = 'evidence') {
  try {
    initializeBlockchainStorage();
    
    const ledgerFile = chainType === 'evidence' ? EVIDENCE_LEDGER_FILE : CUSTODY_LEDGER_FILE;
    const ledgerData = JSON.parse(fs.readFileSync(ledgerFile, 'utf8'));
    
    // Create a dummy block for testing
    const dummyBlock = {
      blockNumber: ledgerData.lastBlockNumber + 1,
      timestamp: new Date().toISOString(),
      transactionHash: crypto.randomBytes(32).toString('hex'),
      transactionType: 'TEST_BLOCK',
      data: {
        test: true,
        message: 'Test block mined for blockchain health check'
      },
      previousHash: ledgerData.blocks.length > 0 ? 
        ledgerData.blocks[ledgerData.blocks.length - 1].transactionHash : null
    };
    
    ledgerData.blocks.push(dummyBlock);
    ledgerData.lastBlockNumber = dummyBlock.blockNumber;
    
    fs.writeFileSync(ledgerFile, JSON.stringify(ledgerData, null, 2));
    
    return {
      success: true,
      blockNumber: dummyBlock.blockNumber,
      transactionHash: dummyBlock.transactionHash,
      chainType,
      timestamp: dummyBlock.timestamp
    };
    
  } catch (error) {
    console.error('Error mining block:', error);
    throw new Error(`Failed to mine block: ${error.message}`);
  }
}

// Initialize blockchain storage on module load
initializeBlockchainStorage();

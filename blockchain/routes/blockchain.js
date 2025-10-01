import express from 'express';
import { body, validationResult, query } from 'express-validator';
import { getDatabase } from '../../backend/database/init-simple.js';
import { requirePermission, logAudit } from '../../backend/middleware/auth.js';
import { asyncHandler } from '../../backend/middleware/errorHandler.js';
import { 
  hashEvidence, 
  recordEvidence, 
  verifyEvidence, 
  recordCustodyTransfer, 
  getCustodyTimeline,
  getBlockchainStatus,
  forceMineBlock
} from '../services/blockchain.js';
import { detectCustodyAnomalies, getStoredAnomalies } from '../services/anomalyDetection.js';
import crypto from 'crypto';

const router = express.Router();

// Simulated blockchain network
class BlockchainSimulator {
  constructor() {
    this.chain = [];
    this.pendingTransactions = [];
    this.difficulty = 2;
    this.miningReward = 1;
    this.networkId = process.env.BLOCKCHAIN_NETWORK_ID || 'ndep-mainnet-2024';
    
    // Create genesis block
    this.createGenesisBlock();
  }

  createGenesisBlock() {
    const genesisBlock = {
      index: 0,
      timestamp: new Date().toISOString(),
      transactions: [],
      previousHash: '0',
      hash: this.calculateHash({
        index: 0,
        timestamp: new Date().toISOString(),
        transactions: [],
        previousHash: '0'
      }),
      nonce: 0
    };
    
    this.chain.push(genesisBlock);
  }

  calculateHash(block) {
    return crypto.createHash('sha256')
      .update(JSON.stringify(block))
      .digest('hex');
  }

  mineBlock(block) {
    const target = '0'.repeat(this.difficulty);
    
    while (block.hash.substring(0, this.difficulty) !== target) {
      block.nonce++;
      block.hash = this.calculateHash(block);
    }
    
    return block;
  }

  createTransaction(from, to, data, type) {
    const transaction = {
      id: crypto.randomUUID(),
      from,
      to,
      data,
      type,
      timestamp: new Date().toISOString(),
      hash: ''
    };
    
    transaction.hash = crypto.createHash('sha256')
      .update(JSON.stringify(transaction))
      .digest('hex');
    
    return transaction;
  }

  addTransaction(transaction) {
    this.pendingTransactions.push(transaction);
  }

  createBlock() {
    const block = {
      index: this.chain.length,
      timestamp: new Date().toISOString(),
      transactions: [...this.pendingTransactions],
      previousHash: this.chain[this.chain.length - 1].hash,
      hash: '',
      nonce: 0
    };
    
    const minedBlock = this.mineBlock(block);
    this.chain.push(minedBlock);
    this.pendingTransactions = [];
    
    return minedBlock;
  }

  getChain() {
    return this.chain;
  }

  getLatestBlock() {
    return this.chain[this.chain.length - 1];
  }

  verifyChain() {
    for (let i = 1; i < this.chain.length; i++) {
      const currentBlock = this.chain[i];
      const previousBlock = this.chain[i - 1];
      
      if (currentBlock.previousHash !== previousBlock.hash) {
        return false;
      }
      
      if (currentBlock.hash !== this.calculateHash(currentBlock)) {
        return false;
      }
    }
    
    return true;
  }

  getTransaction(transactionHash) {
    for (const block of this.chain) {
      const transaction = block.transactions.find(tx => tx.hash === transactionHash);
      if (transaction) {
        return { transaction, block };
      }
    }
    return null;
  }
}

// Initialize blockchain simulator
const blockchain = new BlockchainSimulator();

// Get blockchain status (enhanced with new service)
router.get('/status', requirePermission('blockchain_monitoring'), asyncHandler(async (req, res) => {
  const blockchainStatus = getBlockchainStatus();
  const latestBlock = blockchain.getLatestBlock();
  const isChainValid = blockchain.verifyChain();
  
  res.json({
    ...blockchainStatus,
    legacy: {
      networkId: blockchain.networkId,
      blockHeight: blockchain.chain.length,
      latestBlock: {
        index: latestBlock.index,
        hash: latestBlock.hash,
        timestamp: latestBlock.timestamp,
        transactionCount: latestBlock.transactions.length
      },
      chainValid: isChainValid,
      difficulty: blockchain.difficulty,
      pendingTransactions: blockchain.pendingTransactions.length,
      totalTransactions: blockchain.chain.reduce((sum, block) => sum + block.transactions.length, 0)
    }
  });
}));

// Get blockchain explorer data
router.get('/explorer', requirePermission('blockchain_monitoring'), [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100')
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Validation failed',
      code: 'VALIDATION_ERROR',
      details: errors.array()
    });
  }

  const { page = 1, limit = 20 } = req.query;
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + parseInt(limit);

  const blocks = blockchain.chain.slice(-endIndex).slice(-limit).reverse();
  
  // Get transaction details for each block
  const blocksWithTransactions = blocks.map(block => ({
    ...block,
    transactions: block.transactions.map(tx => ({
      id: tx.id,
      hash: tx.hash,
      type: tx.type,
      timestamp: tx.timestamp,
      from: tx.from,
      to: tx.to,
      dataHash: tx.data ? crypto.createHash('sha256').update(JSON.stringify(tx.data)).digest('hex') : null
    }))
  }));

  res.json({
    blocks: blocksWithTransactions,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total: blockchain.chain.length,
      pages: Math.ceil(blockchain.chain.length / limit)
    }
  });
}));

// Get specific block
router.get('/block/:blockHash', requirePermission('blockchain_monitoring'), asyncHandler(async (req, res) => {
  const { blockHash } = req.params;
  
  const block = blockchain.chain.find(b => b.hash === blockHash);
  if (!block) {
    return res.status(404).json({
      error: 'Block not found',
      code: 'BLOCK_NOT_FOUND'
    });
  }

  res.json({
    block: {
      ...block,
      transactions: block.transactions.map(tx => ({
        id: tx.id,
        hash: tx.hash,
        type: tx.type,
        timestamp: tx.timestamp,
        from: tx.from,
        to: tx.to,
        data: tx.data
      }))
    }
  });
}));

// Get specific transaction
router.get('/transaction/:transactionHash', requirePermission('blockchain_monitoring'), asyncHandler(async (req, res) => {
  const { transactionHash } = req.params;
  
  const result = blockchain.getTransaction(transactionHash);
  if (!result) {
    return res.status(404).json({
      error: 'Transaction not found',
      code: 'TRANSACTION_NOT_FOUND'
    });
  }

  res.json({
    transaction: result.transaction,
    block: {
      index: result.block.index,
      hash: result.block.hash,
      timestamp: result.block.timestamp
    }
  });
}));

// Create evidence hash transaction
router.post('/hash-evidence', requirePermission('hash_evidence'), [
  body('evidenceId').notEmpty().withMessage('Evidence ID is required'),
  body('fileHash').notEmpty().withMessage('File hash is required'),
  body('metadata').isObject().withMessage('Metadata is required')
], logAudit('CREATE_EVIDENCE_HASH', 'BLOCKCHAIN'), asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Validation failed',
      code: 'VALIDATION_ERROR',
      details: errors.array()
    });
  }

  const { evidenceId, fileHash, metadata } = req.body;
  const db = getDatabase();

  // Verify evidence exists
  const evidence = db.prepare(`
    SELECT * FROM evidence WHERE evidence_id = ?
  `).get(evidenceId);

  if (!evidence) {
    return res.status(404).json({
      error: 'Evidence not found',
      code: 'EVIDENCE_NOT_FOUND'
    });
  }

  // Create blockchain transaction
  const transaction = blockchain.createTransaction(
    req.user.id.toString(),
    '0', // System address
    {
      evidenceId,
      fileHash,
      metadata,
      evidenceType: evidence.evidence_type,
      caseId: evidence.case_id
    },
    'evidence_hash'
  );

  blockchain.addTransaction(transaction);

  // Create block if we have enough transactions
  if (blockchain.pendingTransactions.length >= 5) {
    blockchain.createBlock();
  }

  // Store transaction in database
  const storeTransaction = db.prepare(`
    INSERT INTO blockchain_transactions (
      transaction_hash, block_number, evidence_id, case_id, 
      transaction_type, from_address, to_address, data_hash, timestamp
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  storeTransaction.run(
    transaction.hash,
    blockchain.chain.length,
    evidenceId,
    evidence.case_id,
    'evidence_hash',
    req.user.id.toString(),
    '0',
    fileHash,
    transaction.timestamp
  );

  res.status(201).json({
    message: 'Evidence hash recorded on blockchain',
    transaction: {
      hash: transaction.hash,
      evidenceId,
      fileHash,
      timestamp: transaction.timestamp
    }
  });
}));

// Create custody transfer transaction
router.post('/custody-transfer', requirePermission('manage_transfers'), [
  body('evidenceId').notEmpty().withMessage('Evidence ID is required'),
  body('fromUserId').isInt({ min: 1 }).withMessage('From user ID is required'),
  body('toUserId').isInt({ min: 1 }).withMessage('To user ID is required'),
  body('transferData').isObject().withMessage('Transfer data is required')
], logAudit('CREATE_CUSTODY_TRANSFER', 'BLOCKCHAIN'), asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Validation failed',
      code: 'VALIDATION_ERROR',
      details: errors.array()
    });
  }

  const { evidenceId, fromUserId, toUserId, transferData } = req.body;
  const db = getDatabase();

  // Verify evidence exists
  const evidence = db.prepare(`
    SELECT * FROM evidence WHERE evidence_id = ?
  `).get(evidenceId);

  if (!evidence) {
    return res.status(404).json({
      error: 'Evidence not found',
      code: 'EVIDENCE_NOT_FOUND'
    });
  }

  // Create blockchain transaction
  const transaction = blockchain.createTransaction(
    fromUserId.toString(),
    toUserId.toString(),
    {
      evidenceId,
      transferData,
      evidenceType: evidence.evidence_type,
      caseId: evidence.case_id
    },
    'custody_transfer'
  );

  blockchain.addTransaction(transaction);

  // Create block if we have enough transactions
  if (blockchain.pendingTransactions.length >= 5) {
    blockchain.createBlock();
  }

  // Store transaction in database
  const storeTransaction = db.prepare(`
    INSERT INTO blockchain_transactions (
      transaction_hash, block_number, evidence_id, case_id, 
      transaction_type, from_address, to_address, data_hash, timestamp
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const dataHash = crypto.createHash('sha256')
    .update(JSON.stringify(transferData))
    .digest('hex');

  storeTransaction.run(
    transaction.hash,
    blockchain.chain.length,
    evidenceId,
    evidence.case_id,
    'custody_transfer',
    fromUserId.toString(),
    toUserId.toString(),
    dataHash,
    transaction.timestamp
  );

  res.status(201).json({
    message: 'Custody transfer recorded on blockchain',
    transaction: {
      hash: transaction.hash,
      evidenceId,
      fromUserId,
      toUserId,
      timestamp: transaction.timestamp
    }
  });
}));

// Verify evidence integrity
router.post('/verify-integrity', requirePermission('verify_evidence_integrity'), [
  body('evidenceId').notEmpty().withMessage('Evidence ID is required'),
  body('providedHash').notEmpty().withMessage('Provided hash is required')
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Validation failed',
      code: 'VALIDATION_ERROR',
      details: errors.array()
    });
  }

  const { evidenceId, providedHash } = req.body;
  const db = getDatabase();

  // Get evidence from database
  const evidence = db.prepare(`
    SELECT * FROM evidence WHERE evidence_id = ?
  `).get(evidenceId);

  if (!evidence) {
    return res.status(404).json({
      error: 'Evidence not found',
      code: 'EVIDENCE_NOT_FOUND'
    });
  }

  // Get blockchain transaction for this evidence
  const blockchainTx = db.prepare(`
    SELECT * FROM blockchain_transactions 
    WHERE evidence_id = ? AND transaction_type = 'evidence_hash'
    ORDER BY timestamp DESC
    LIMIT 1
  `).get(evidenceId);

  if (!blockchainTx) {
    return res.status(404).json({
      error: 'No blockchain record found for this evidence',
      code: 'NO_BLOCKCHAIN_RECORD'
    });
  }

  // Verify hash matches
  const isMatch = evidence.file_hash === providedHash;
  const blockchainMatch = blockchainTx.data_hash === providedHash;

  // Update verification count
  db.prepare(`
    UPDATE blockchain_transactions 
    SET verification_count = verification_count + 1,
        is_verified = ?
    WHERE transaction_hash = ?
  `).run(isMatch && blockchainMatch, blockchainTx.transaction_hash);

  res.json({
    evidenceId,
    providedHash,
    storedHash: evidence.file_hash,
    blockchainHash: blockchainTx.data_hash,
    isMatch,
    blockchainMatch,
    overallMatch: isMatch && blockchainMatch,
    verificationCount: blockchainTx.verification_count + 1,
    verifiedAt: new Date().toISOString()
  });
}));

// Get blockchain health metrics
router.get('/health', requirePermission('blockchain_monitoring'), asyncHandler(async (req, res) => {
  const db = getDatabase();
  
  // Get blockchain statistics
  const stats = db.prepare(`
    SELECT 
      COUNT(*) as total_transactions,
      SUM(CASE WHEN is_verified = 1 THEN 1 ELSE 0 END) as verified_transactions,
      AVG(verification_count) as avg_verification_count,
      COUNT(DISTINCT evidence_id) as unique_evidence_count
    FROM blockchain_transactions
  `).get();

  // Get recent activity
  const recentActivity = db.prepare(`
    SELECT transaction_type, COUNT(*) as count
    FROM blockchain_transactions
    WHERE timestamp > datetime('now', '-24 hours')
    GROUP BY transaction_type
  `).all();

  // Calculate health score
  const verificationRate = stats.total_transactions > 0 ? 
    (stats.verified_transactions / stats.total_transactions) * 100 : 0;
  
  const healthScore = Math.min(100, Math.max(0, 
    (verificationRate * 0.6) + 
    (Math.min(stats.avg_verification_count || 0, 10) * 4) +
    (blockchain.verifyChain() ? 20 : 0)
  ));

  res.json({
    healthScore: Math.round(healthScore),
    verificationRate: Math.round(verificationRate * 100) / 100,
    totalTransactions: stats.total_transactions,
    verifiedTransactions: stats.verified_transactions,
    uniqueEvidenceCount: stats.unique_evidence_count,
    avgVerificationCount: Math.round((stats.avg_verification_count || 0) * 100) / 100,
    recentActivity,
    chainValid: blockchain.verifyChain(),
    blockHeight: blockchain.chain.length,
    pendingTransactions: blockchain.pendingTransactions.length
  });
}));

// Force mine a block (for testing)
router.post('/mine', requirePermission('blockchain_monitoring'), asyncHandler(async (req, res) => {
  if (blockchain.pendingTransactions.length === 0) {
    return res.status(400).json({
      error: 'No pending transactions to mine',
      code: 'NO_PENDING_TRANSACTIONS'
    });
  }

  const newBlock = blockchain.createBlock();
  
  res.json({
    message: 'Block mined successfully',
    block: {
      index: newBlock.index,
      hash: newBlock.hash,
      timestamp: newBlock.timestamp,
      transactionCount: newBlock.transactions.length,
      nonce: newBlock.nonce
    }
  });
}));

// NEW ENHANCED BLOCKCHAIN ENDPOINTS

// Hash evidence file
router.post('/hash-evidence-file', requirePermission('hash_evidence'), [
  body('evidenceId').notEmpty().withMessage('Evidence ID is required'),
  body('filePath').notEmpty().withMessage('File path is required')
], logAudit('HASH_EVIDENCE_FILE', 'BLOCKCHAIN'), asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Validation failed',
      code: 'VALIDATION_ERROR',
      details: errors.array()
    });
  }

  const { evidenceId, filePath } = req.body;
  const db = getDatabase();

  // Verify evidence exists
  const evidence = db.prepare(`
    SELECT * FROM evidence WHERE evidence_id = ?
  `).get(evidenceId);

  if (!evidence) {
    return res.status(404).json({
      error: 'Evidence not found',
      code: 'EVIDENCE_NOT_FOUND'
    });
  }

  try {
    // Hash the evidence file
    const fileHash = hashEvidence(filePath);
    
    // Record on blockchain
    const result = recordEvidence(
      fileHash,
      evidence.case_id,
      req.user.id,
      new Date().toISOString(),
      {
        evidenceId,
        fileSize: evidence.file_size,
        mimeType: evidence.mime_type,
        description: evidence.description,
        evidenceType: evidence.evidence_type
      }
    );

    // Update evidence record with blockchain hash
    db.prepare(`
      UPDATE evidence 
      SET file_hash = ?, updated_at = CURRENT_TIMESTAMP
      WHERE evidence_id = ?
    `).run(fileHash, evidenceId);

    res.status(201).json({
      message: 'Evidence hashed and recorded on blockchain',
      evidenceId,
      fileHash,
      blockchainResult: result
    });

  } catch (error) {
    res.status(500).json({
      error: 'Failed to hash evidence',
      code: 'HASH_ERROR',
      message: error.message
    });
  }
}));

// Verify evidence integrity
router.post('/verify-evidence', requirePermission('verify_evidence_integrity'), [
  body('evidenceId').notEmpty().withMessage('Evidence ID is required')
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Validation failed',
      code: 'VALIDATION_ERROR',
      details: errors.array()
    });
  }

  const { evidenceId } = req.body;
  const db = getDatabase();

  // Get evidence from database
  const evidence = db.prepare(`
    SELECT * FROM evidence WHERE evidence_id = ?
  `).get(evidenceId);

  if (!evidence) {
    return res.status(404).json({
      error: 'Evidence not found',
      code: 'EVIDENCE_NOT_FOUND'
    });
  }

  try {
    // Verify evidence against blockchain
    const verificationResult = verifyEvidence(evidence.file_hash);
    
    res.json({
      evidenceId,
      verificationResult,
      verifiedAt: new Date().toISOString()
    });

  } catch (error) {
    res.status(500).json({
      error: 'Failed to verify evidence',
      code: 'VERIFICATION_ERROR',
      message: error.message
    });
  }
}));

// Get custody timeline for evidence
router.get('/evidence/:evidenceId/custody', requirePermission('view_custody_chain'), asyncHandler(async (req, res) => {
  const { evidenceId } = req.params;
  
  try {
    const custodyTimeline = await getCustodyTimeline(evidenceId);
    
    res.json({
      evidenceId,
      custodyTimeline,
      totalTransfers: custodyTimeline.length,
      retrievedAt: new Date().toISOString()
    });

  } catch (error) {
    res.status(500).json({
      error: 'Failed to get custody timeline',
      code: 'CUSTODY_TIMELINE_ERROR',
      message: error.message
    });
  }
}));

// Detect custody anomalies
router.post('/evidence/:evidenceId/anomalies', requirePermission('detect_anomalies'), [
  body('options').optional().isObject().withMessage('Options must be an object')
], asyncHandler(async (req, res) => {
  const { evidenceId } = req.params;
  const { options = {} } = req.body;
  
  try {
    const anomalyResults = await detectCustodyAnomalies(evidenceId, options);
    
    res.json({
      evidenceId,
      anomalyResults,
      analyzedAt: new Date().toISOString()
    });

  } catch (error) {
    res.status(500).json({
      error: 'Failed to detect anomalies',
      code: 'ANOMALY_DETECTION_ERROR',
      message: error.message
    });
  }
}));

// Get stored anomalies for evidence
router.get('/evidence/:evidenceId/anomalies', requirePermission('view_anomalies'), asyncHandler(async (req, res) => {
  const { evidenceId } = req.params;
  
  try {
    const anomalies = await getStoredAnomalies(evidenceId);
    
    res.json({
      evidenceId,
      anomalies,
      totalAnomalies: anomalies.length,
      unresolvedAnomalies: anomalies.filter(a => !a.resolved).length,
      retrievedAt: new Date().toISOString()
    });

  } catch (error) {
    res.status(500).json({
      error: 'Failed to get anomalies',
      code: 'GET_ANOMALIES_ERROR',
      message: error.message
    });
  }
}));

// Force mine block (enhanced)
router.post('/mine-block', requirePermission('blockchain_monitoring'), [
  body('chainType').optional().isIn(['evidence', 'custody']).withMessage('Chain type must be evidence or custody')
], asyncHandler(async (req, res) => {
  const { chainType = 'evidence' } = req.body;
  
  try {
    const result = forceMineBlock(chainType);
    
    res.json({
      message: 'Block mined successfully',
      result
    });

  } catch (error) {
    res.status(500).json({
      error: 'Failed to mine block',
      code: 'MINING_ERROR',
      message: error.message
    });
  }
}));

export default router;

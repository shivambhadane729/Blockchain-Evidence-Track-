import { getDatabase } from '../../backend/database/init-simple.js';

/**
 * AI-Powered Anomaly Detection Service for NDEP
 * 
 * This service implements both rule-based and ML-based anomaly detection for custody chains.
 * Currently uses rule-based detection with placeholders for future ML integration.
 * 
 * Key Functions:
 * - detectCustodyAnomalies: Main anomaly detection function
 * - checkRapidTransfers: Detect suspiciously fast custody changes
 * - checkHashMismatches: Detect evidence integrity issues
 * - checkUnusualPatterns: Detect patterns that deviate from normal operations
 * - mlAnomalyDetection: Placeholder for future ML-based detection
 */

/**
 * Main anomaly detection function
 * @param {string} evidenceId - Evidence identifier to analyze
 * @param {Object} options - Detection options
 * @returns {Object} Anomaly detection results
 */
export async function detectCustodyAnomalies(evidenceId, options = {}) {
  try {
    const db = getDatabase();
    
    // Get custody chain for the evidence
    const custodyChain = await getCustodyChain(evidenceId);
    
    if (custodyChain.length === 0) {
      return {
        evidenceId,
        anomalies: [],
        riskScore: 0,
        status: 'no_data',
        message: 'No custody data available for analysis'
      };
    }
    
    const anomalies = [];
    let riskScore = 0;
    
    // Rule-based anomaly detection
    const rapidTransferAnomalies = await checkRapidTransfers(custodyChain, options);
    anomalies.push(...rapidTransferAnomalies);
    
    const hashMismatchAnomalies = await checkHashMismatches(evidenceId, options);
    anomalies.push(...hashMismatchAnomalies);
    
    const unusualPatternAnomalies = await checkUnusualPatterns(custodyChain, options);
    anomalies.push(...unusualPatternAnomalies);
    
    const timeGapAnomalies = await checkTimeGaps(custodyChain, options);
    anomalies.push(...timeGapAnomalies);
    
    const locationAnomalies = await checkLocationAnomalies(custodyChain, options);
    anomalies.push(...locationAnomalies);
    
    // Calculate overall risk score
    riskScore = calculateRiskScore(anomalies);
    
    // ML-based anomaly detection (placeholder for future implementation)
    if (options.enableML && anomalies.length === 0) {
      const mlAnomalies = await mlAnomalyDetection(custodyChain, options);
      anomalies.push(...mlAnomalies);
    }
    
    // Store anomalies in database
    await storeAnomalies(evidenceId, anomalies);
    
    return {
      evidenceId,
      anomalies,
      riskScore,
      status: anomalies.length > 0 ? 'anomalies_detected' : 'clean',
      totalAnomalies: anomalies.length,
      highRiskAnomalies: anomalies.filter(a => a.severity === 'high').length,
      mediumRiskAnomalies: anomalies.filter(a => a.severity === 'medium').length,
      lowRiskAnomalies: anomalies.filter(a => a.severity === 'low').length,
      detectedAt: new Date().toISOString(),
      analysisOptions: options
    };
    
  } catch (error) {
    console.error('Error in anomaly detection:', error);
    throw new Error(`Anomaly detection failed: ${error.message}`);
  }
}

/**
 * Detect rapid custody transfers (suspicious timing)
 * @param {Array} custodyChain - Array of custody events
 * @param {Object} options - Detection options
 * @returns {Array} Array of rapid transfer anomalies
 */
async function checkRapidTransfers(custodyChain, options = {}) {
  const anomalies = [];
  const minTransferInterval = options.minTransferInterval || 60000; // 1 minute in milliseconds
  
  for (let i = 1; i < custodyChain.length; i++) {
    const current = custodyChain[i];
    const previous = custodyChain[i - 1];
    
    const timeDiff = new Date(current.transferred_at) - new Date(previous.transferred_at);
    
    if (timeDiff < minTransferInterval) {
      anomalies.push({
        type: 'rapid_transfer',
        severity: timeDiff < 30000 ? 'high' : 'medium', // Less than 30 seconds is high risk
        title: 'Rapid Custody Transfer Detected',
        description: `Custody transferred from ${previous.to_user_name} to ${current.to_user_name} in ${Math.round(timeDiff / 1000)} seconds`,
        details: {
          fromUser: previous.to_user_name,
          toUser: current.to_user_name,
          timeDifference: timeDiff,
          previousTransfer: previous.transferred_at,
          currentTransfer: current.transferred_at,
          threshold: minTransferInterval
        },
        evidence: {
          transferId: current.id,
          evidenceId: current.evidence_id,
          blockchainHash: current.blockchain_hash
        },
        detectedAt: new Date().toISOString(),
        confidence: 0.95
      });
    }
  }
  
  return anomalies;
}

/**
 * Check for evidence hash mismatches
 * @param {string} evidenceId - Evidence identifier
 * @param {Object} options - Detection options
 * @returns {Array} Array of hash mismatch anomalies
 */
async function checkHashMismatches(evidenceId, options = {}) {
  const anomalies = [];
  const db = getDatabase();
  
  return new Promise((resolve, reject) => {
    // Get evidence file hash from database
    const evidenceQuery = `
      SELECT file_hash, file_path, description 
      FROM evidence 
      WHERE evidence_id = ?
    `;
    
    db.get(evidenceQuery, [evidenceId], (err, evidence) => {
      if (err) {
        reject(err);
        return;
      }
      
      if (!evidence) {
        resolve(anomalies);
        return;
      }
      
      // Check if file still exists and hash matches
      if (evidence.file_path) {
        const fs = require('fs');
        const crypto = require('crypto');
        
        try {
          if (fs.existsSync(evidence.file_path)) {
            const fileBuffer = fs.readFileSync(evidence.file_path);
            const currentHash = crypto.createHash('sha256').update(fileBuffer).digest('hex');
            
            if (currentHash !== evidence.file_hash) {
              anomalies.push({
                type: 'hash_mismatch',
                severity: 'high',
                title: 'Evidence File Hash Mismatch',
                description: `Evidence file hash has changed, indicating potential tampering`,
                details: {
                  originalHash: evidence.file_hash,
                  currentHash: currentHash,
                  filePath: evidence.file_path,
                  evidenceDescription: evidence.description
                },
                evidence: {
                  evidenceId: evidenceId,
                  filePath: evidence.file_path
                },
                detectedAt: new Date().toISOString(),
                confidence: 1.0
              });
            }
          } else {
            anomalies.push({
              type: 'file_missing',
              severity: 'high',
              title: 'Evidence File Missing',
              description: `Evidence file not found at expected location`,
              details: {
                expectedPath: evidence.file_path,
                evidenceDescription: evidence.description
              },
              evidence: {
                evidenceId: evidenceId,
                filePath: evidence.file_path
              },
              detectedAt: new Date().toISOString(),
              confidence: 1.0
            });
          }
        } catch (fileError) {
          anomalies.push({
            type: 'file_access_error',
            severity: 'medium',
            title: 'Evidence File Access Error',
            description: `Unable to access evidence file for verification`,
            details: {
              error: fileError.message,
              filePath: evidence.file_path
            },
            evidence: {
              evidenceId: evidenceId,
              filePath: evidence.file_path
            },
            detectedAt: new Date().toISOString(),
            confidence: 0.8
          });
        }
      }
      
      resolve(anomalies);
    });
  });
}

/**
 * Check for unusual patterns in custody chain
 * @param {Array} custodyChain - Array of custody events
 * @param {Object} options - Detection options
 * @returns {Array} Array of unusual pattern anomalies
 */
async function checkUnusualPatterns(custodyChain, options = {}) {
  const anomalies = [];
  
  // Check for circular transfers (A -> B -> A)
  for (let i = 2; i < custodyChain.length; i++) {
    const current = custodyChain[i];
    const previous = custodyChain[i - 1];
    const beforePrevious = custodyChain[i - 2];
    
    if (current.to_user_id === beforePrevious.to_user_id && 
        current.to_user_id !== previous.to_user_id) {
      anomalies.push({
        type: 'circular_transfer',
        severity: 'medium',
        title: 'Circular Custody Transfer Detected',
        description: `Evidence returned to ${current.to_user_name} after being transferred away`,
        details: {
          originalUser: beforePrevious.to_user_name,
          intermediateUser: previous.to_user_name,
          finalUser: current.to_user_name,
          timeSpan: new Date(current.transferred_at) - new Date(beforePrevious.transferred_at)
        },
        evidence: {
          transferId: current.id,
          evidenceId: current.evidence_id
        },
        detectedAt: new Date().toISOString(),
        confidence: 0.85
      });
    }
  }
  
  // Check for excessive transfers (more than 10 transfers)
  if (custodyChain.length > 10) {
    anomalies.push({
      type: 'excessive_transfers',
      severity: 'medium',
      title: 'Excessive Custody Transfers',
      description: `Evidence has been transferred ${custodyChain.length} times, which is unusually high`,
      details: {
        transferCount: custodyChain.length,
        timeSpan: new Date(custodyChain[custodyChain.length - 1].transferred_at) - 
                  new Date(custodyChain[0].transferred_at),
        averageTransferInterval: calculateAverageTransferInterval(custodyChain)
      },
      evidence: {
        evidenceId: custodyChain[0].evidence_id
      },
      detectedAt: new Date().toISOString(),
      confidence: 0.75
    });
  }
  
  return anomalies;
}

/**
 * Check for unusual time gaps in custody chain
 * @param {Array} custodyChain - Array of custody events
 * @param {Object} options - Detection options
 * @returns {Array} Array of time gap anomalies
 */
async function checkTimeGaps(custodyChain, options = {}) {
  const anomalies = [];
  const maxGapHours = options.maxGapHours || 24; // 24 hours default
  
  for (let i = 1; i < custodyChain.length; i++) {
    const current = custodyChain[i];
    const previous = custodyChain[i - 1];
    
    const timeDiff = new Date(current.transferred_at) - new Date(previous.transferred_at);
    const hoursDiff = timeDiff / (1000 * 60 * 60);
    
    if (hoursDiff > maxGapHours) {
      anomalies.push({
        type: 'time_gap',
        severity: hoursDiff > 72 ? 'high' : 'medium', // More than 3 days is high risk
        title: 'Unusual Time Gap in Custody Chain',
        description: `Gap of ${Math.round(hoursDiff)} hours between custody transfers`,
        details: {
          timeGapHours: hoursDiff,
          previousTransfer: previous.transferred_at,
          currentTransfer: current.transferred_at,
          fromUser: previous.to_user_name,
          toUser: current.to_user_name
        },
        evidence: {
          transferId: current.id,
          evidenceId: current.evidence_id
        },
        detectedAt: new Date().toISOString(),
        confidence: 0.9
      });
    }
  }
  
  return anomalies;
}

/**
 * Check for location anomalies
 * @param {Array} custodyChain - Array of custody events
 * @param {Object} options - Detection options
 * @returns {Array} Array of location anomalies
 */
async function checkLocationAnomalies(custodyChain, options = {}) {
  const anomalies = [];
  
  // Check for impossible location transitions (e.g., instant travel between distant locations)
  for (let i = 1; i < custodyChain.length; i++) {
    const current = custodyChain[i];
    const previous = custodyChain[i - 1];
    
    if (current.from_location && previous.to_location) {
      const timeDiff = new Date(current.transferred_at) - new Date(previous.transferred_at);
      const minutesDiff = timeDiff / (1000 * 60);
      
      // If transfer happens in less than 5 minutes and locations are different
      if (minutesDiff < 5 && current.from_location !== previous.to_location) {
        anomalies.push({
          type: 'location_mismatch',
          severity: 'medium',
          title: 'Location Mismatch in Custody Transfer',
          description: `Evidence location changed from ${previous.to_location} to ${current.from_location} in ${Math.round(minutesDiff)} minutes`,
          details: {
            previousLocation: previous.to_location,
            currentLocation: current.from_location,
            timeDifference: minutesDiff,
            fromUser: previous.to_user_name,
            toUser: current.to_user_name
          },
          evidence: {
            transferId: current.id,
            evidenceId: current.evidence_id
          },
          detectedAt: new Date().toISOString(),
          confidence: 0.8
        });
      }
    }
  }
  
  return anomalies;
}

/**
 * Placeholder for ML-based anomaly detection
 * @param {Array} custodyChain - Array of custody events
 * @param {Object} options - Detection options
 * @returns {Array} Array of ML-detected anomalies
 */
async function mlAnomalyDetection(custodyChain, options = {}) {
  // TODO: Implement ML-based anomaly detection
  // This would use time-series analysis, pattern recognition, etc.
  
  console.log('ML-based anomaly detection not yet implemented');
  
  return [
    {
      type: 'ml_placeholder',
      severity: 'low',
      title: 'ML Detection Placeholder',
      description: 'ML-based anomaly detection is not yet implemented',
      details: {
        message: 'This is a placeholder for future ML implementation',
        custodyChainLength: custodyChain.length
      },
      evidence: {
        evidenceId: custodyChain[0]?.evidence_id
      },
      detectedAt: new Date().toISOString(),
      confidence: 0.0
    }
  ];
}

/**
 * Get custody chain for evidence
 * @param {string} evidenceId - Evidence identifier
 * @returns {Promise<Array>} Array of custody events
 */
function getCustodyChain(evidenceId) {
  const db = getDatabase();
  
  return new Promise((resolve, reject) => {
    const query = `
      SELECT 
        cc.*,
        u1.name as from_user_name,
        u2.name as to_user_name
      FROM custody_chain cc
      LEFT JOIN users u1 ON cc.from_user_id = u1.id
      LEFT JOIN users u2 ON cc.to_user_id = u2.id
      WHERE cc.evidence_id = ?
      ORDER BY cc.transferred_at ASC
    `;
    
    db.all(query, [evidenceId], (err, rows) => {
      if (err) {
        reject(err);
        return;
      }
      resolve(rows || []);
    });
  });
}

/**
 * Calculate risk score based on anomalies
 * @param {Array} anomalies - Array of detected anomalies
 * @returns {number} Risk score (0-100)
 */
function calculateRiskScore(anomalies) {
  let score = 0;
  
  anomalies.forEach(anomaly => {
    switch (anomaly.severity) {
      case 'high':
        score += 30;
        break;
      case 'medium':
        score += 15;
        break;
      case 'low':
        score += 5;
        break;
    }
  });
  
  return Math.min(score, 100);
}

/**
 * Calculate average transfer interval
 * @param {Array} custodyChain - Array of custody events
 * @returns {number} Average interval in milliseconds
 */
function calculateAverageTransferInterval(custodyChain) {
  if (custodyChain.length < 2) return 0;
  
  const totalTime = new Date(custodyChain[custodyChain.length - 1].transferred_at) - 
                   new Date(custodyChain[0].transferred_at);
  
  return totalTime / (custodyChain.length - 1);
}

/**
 * Store detected anomalies in database
 * @param {string} evidenceId - Evidence identifier
 * @param {Array} anomalies - Array of anomalies to store
 */
async function storeAnomalies(evidenceId, anomalies) {
  const db = getDatabase();
  
  return new Promise((resolve, reject) => {
    // Clear existing anomalies for this evidence
    const deleteQuery = `DELETE FROM custody_anomalies WHERE evidence_id = ?`;
    
    db.run(deleteQuery, [evidenceId], (err) => {
      if (err) {
        reject(err);
        return;
      }
      
      if (anomalies.length === 0) {
        resolve();
        return;
      }
      
      // Insert new anomalies
      const insertQuery = `
        INSERT INTO custody_anomalies 
        (evidence_id, anomaly_type, severity, title, description, details, confidence, detected_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `;
      
      let completed = 0;
      const total = anomalies.length;
      
      anomalies.forEach(anomaly => {
        db.run(insertQuery, [
          evidenceId,
          anomaly.type,
          anomaly.severity,
          anomaly.title,
          anomaly.description,
          JSON.stringify(anomaly.details),
          anomaly.confidence,
          anomaly.detectedAt
        ], (err) => {
          if (err) {
            console.error('Error storing anomaly:', err);
          }
          
          completed++;
          if (completed === total) {
            resolve();
          }
        });
      });
    });
  });
}

/**
 * Get stored anomalies for evidence
 * @param {string} evidenceId - Evidence identifier
 * @returns {Promise<Array>} Array of stored anomalies
 */
export async function getStoredAnomalies(evidenceId) {
  const db = getDatabase();
  
  return new Promise((resolve, reject) => {
    const query = `
      SELECT * FROM custody_anomalies 
      WHERE evidence_id = ? 
      ORDER BY detected_at DESC
    `;
    
    db.all(query, [evidenceId], (err, rows) => {
      if (err) {
        reject(err);
        return;
      }
      
      const anomalies = rows.map(row => ({
        id: row.id,
        evidenceId: row.evidence_id,
        type: row.anomaly_type,
        severity: row.severity,
        title: row.title,
        description: row.description,
        details: JSON.parse(row.details || '{}'),
        confidence: row.confidence,
        detectedAt: row.detected_at,
        resolved: row.resolved || false,
        resolvedAt: row.resolved_at,
        resolvedBy: row.resolved_by
      }));
      
      resolve(anomalies);
    });
  });
}

/**
 * Resolve an anomaly
 * @param {number} anomalyId - Anomaly identifier
 * @param {number} resolvedBy - User ID who resolved the anomaly
 * @param {string} resolution - Resolution notes
 * @returns {Promise<boolean>} Success status
 */
export async function resolveAnomaly(anomalyId, resolvedBy, resolution = '') {
  const db = getDatabase();
  
  return new Promise((resolve, reject) => {
    const query = `
      UPDATE custody_anomalies 
      SET resolved = 1, resolved_at = CURRENT_TIMESTAMP, resolved_by = ?, resolution = ?
      WHERE id = ?
    `;
    
    db.run(query, [resolvedBy, resolution, anomalyId], function(err) {
      if (err) {
        reject(err);
        return;
      }
      
      resolve(this.changes > 0);
    });
  });
}

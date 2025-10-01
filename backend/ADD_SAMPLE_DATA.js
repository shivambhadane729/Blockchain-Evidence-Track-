// Add Sample Data to NDEP Database
// This script adds realistic evidence data for testing

import sqlite3 from 'sqlite3';
import bcrypt from 'bcryptjs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class SampleDataAdder {
    constructor() {
        this.db = new sqlite3.Database(path.join(__dirname, 'database', 'ndep.db'));
    }

    async addSampleData() {
        console.log('📊 Adding sample data to NDEP database...\n');

        try {
            // Add sample users
            await this.addSampleUsers();
            
            // Add sample cases
            await this.addSampleCases();
            
            // Add sample evidence
            await this.addSampleEvidence();
            
            // Add sample custody records
            await this.addSampleCustody();
            
            console.log('✅ Sample data added successfully!');
            
        } catch (error) {
            console.error('❌ Error adding sample data:', error);
        } finally {
            this.db.close();
        }
    }

    async addSampleUsers() {
        console.log('👥 Adding sample users...');
        
        const users = [
            {
                email: 'officer.rajesh@police.gov.in',
                password: 'officer123',
                name: 'Rajesh Kumar',
                role: 'evidence-officer',
                department: 'Cyber Crime Unit',
                employee_id: 'PC-001',
                digi_locker_verified: 1
            },
            {
                email: 'forensic.dr.singh@lab.gov.in',
                password: 'forensic123',
                name: 'Dr. Priya Singh',
                role: 'forensic-lab-manager',
                department: 'Forensic Science Laboratory',
                employee_id: 'FSL-001',
                digi_locker_verified: 1
            },
            {
                email: 'prosecutor.sharma@court.gov.in',
                password: 'prosecutor123',
                name: 'Advocate Vikram Sharma',
                role: 'prosecutor',
                department: 'Public Prosecutor Office',
                employee_id: 'PP-001',
                digi_locker_verified: 1
            },
            {
                email: 'judge.kapoor@court.gov.in',
                password: 'judge123',
                name: 'Hon. Justice Ravi Kapoor',
                role: 'judge',
                department: 'District Court',
                employee_id: 'DC-001',
                digi_locker_verified: 1
            }
        ];

        for (const user of users) {
            const hashedPassword = await bcrypt.hash(user.password, 12);
            
            await new Promise((resolve, reject) => {
                this.db.run(`
                    INSERT OR REPLACE INTO users (email, password_hash, name, role, department, employee_id, digi_locker_verified, created_at)
                    VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))
                `, [user.email, hashedPassword, user.name, user.role, user.department, user.employee_id, user.digi_locker_verified], (err) => {
                    if (err) reject(err);
                    else resolve();
                });
            });
            
            console.log(`✅ Added user: ${user.name} (${user.role})`);
        }
    }

    async addSampleCases() {
        console.log('\n📋 Adding sample cases...');
        
        const cases = [
            {
                case_id: 'CASE-2024-001',
                case_number: 'FIR-123/2024',
                case_title: 'Cyber Fraud Investigation',
                case_description: 'Online banking fraud case involving multiple victims',
                case_type: 'cyber-crime',
                status: 'under-investigation',
                priority: 'high',
                assigned_officer: 'officer.rajesh@police.gov.in',
                complainant_name: 'Amit Patel',
                complainant_contact: '+91-9876543210',
                incident_date: '2024-09-20',
                incident_location: 'Mumbai, Maharashtra',
                created_by: 'officer.rajesh@police.gov.in'
            },
            {
                case_id: 'CASE-2024-002',
                case_number: 'FIR-124/2024',
                case_title: 'Digital Evidence Tampering',
                case_description: 'Suspected tampering of digital evidence in drug case',
                case_type: 'drug-offense',
                status: 'evidence-analysis',
                priority: 'medium',
                assigned_officer: 'forensic.dr.singh@lab.gov.in',
                complainant_name: 'Narcotics Control Bureau',
                complainant_contact: '+91-9876543211',
                incident_date: '2024-09-18',
                incident_location: 'Delhi, NCR',
                created_by: 'forensic.dr.singh@lab.gov.in'
            },
            {
                case_id: 'CASE-2024-003',
                case_number: 'FIR-125/2024',
                case_title: 'Mobile Phone Evidence Recovery',
                case_description: 'Recovery of deleted messages from suspect mobile',
                case_type: 'mobile-forensics',
                status: 'evidence-collection',
                priority: 'high',
                assigned_officer: 'officer.rajesh@police.gov.in',
                complainant_name: 'Cyber Crime Cell',
                complainant_contact: '+91-9876543212',
                incident_date: '2024-09-15',
                incident_location: 'Bangalore, Karnataka',
                created_by: 'officer.rajesh@police.gov.in'
            }
        ];

        for (const caseData of cases) {
            await new Promise((resolve, reject) => {
                this.db.run(`
                    INSERT OR REPLACE INTO cases (case_id, case_number, case_title, case_description, case_type, status, priority, assigned_officer, complainant_name, complainant_contact, incident_date, incident_location, created_by, created_at)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
                `, [
                    caseData.case_id, caseData.case_number, caseData.case_title, 
                    caseData.case_description, caseData.case_type, caseData.status, 
                    caseData.priority, caseData.assigned_officer, caseData.complainant_name, 
                    caseData.complainant_contact, caseData.incident_date, caseData.incident_location, 
                    caseData.created_by
                ], (err) => {
                    if (err) reject(err);
                    else resolve();
                });
            });
            
            console.log(`✅ Added case: ${caseData.case_title} (${caseData.case_id})`);
        }
    }

    async addSampleEvidence() {
        console.log('\n📁 Adding sample evidence...');
        
        const evidence = [
            {
                evidence_id: 'EVD-2024-001',
                case_id: 'CASE-2024-001',
                evidence_type: 'digital',
                evidence_category: 'mobile-phone',
                description: 'Samsung Galaxy S21 mobile phone recovered from suspect',
                location_found: 'Suspect residence, Andheri West, Mumbai',
                collected_by: 'officer.rajesh@police.gov.in',
                collected_at: '2024-09-20 14:30:00',
                file_name: 'mobile_evidence_001.zip',
                file_size: 2048576,
                file_hash: 'sha256:a1b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef123456',
                ipfs_hash: 'QmTestHash1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
                status: 'active',
                chain_of_custody: JSON.stringify([
                    {
                        from: 'SYSTEM',
                        to: 'officer.rajesh@police.gov.in',
                        timestamp: '2024-09-20T14:30:00Z',
                        reason: 'Initial collection',
                        location: 'Crime scene'
                    }
                ])
            },
            {
                evidence_id: 'EVD-2024-002',
                case_id: 'CASE-2024-001',
                evidence_type: 'digital',
                evidence_category: 'computer',
                description: 'Dell Laptop with banking transaction records',
                location_found: 'Suspect office, Bandra Kurla Complex, Mumbai',
                collected_by: 'officer.rajesh@police.gov.in',
                collected_at: '2024-09-20 16:45:00',
                file_name: 'laptop_evidence_002.zip',
                file_size: 5242880,
                file_hash: 'sha256:b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef1234567890',
                ipfs_hash: 'QmTestHash2345678901bcdef1234567890abcdef1234567890abcdef1234567890ab',
                status: 'active',
                chain_of_custody: JSON.stringify([
                    {
                        from: 'SYSTEM',
                        to: 'officer.rajesh@police.gov.in',
                        timestamp: '2024-09-20T16:45:00Z',
                        reason: 'Initial collection',
                        location: 'Suspect office'
                    }
                ])
            },
            {
                evidence_id: 'EVD-2024-003',
                case_id: 'CASE-2024-002',
                evidence_type: 'digital',
                evidence_category: 'document',
                description: 'Suspicious email communications',
                location_found: 'Forensic lab analysis',
                collected_by: 'forensic.dr.singh@lab.gov.in',
                collected_at: '2024-09-18 10:15:00',
                file_name: 'email_evidence_003.pdf',
                file_size: 1024000,
                file_hash: 'sha256:c3d4e5f6789012345678901234567890abcdef1234567890abcdef1234567890ab',
                ipfs_hash: 'QmTestHash3456789012cdef1234567890abcdef1234567890abcdef1234567890abc',
                status: 'under-analysis',
                chain_of_custody: JSON.stringify([
                    {
                        from: 'SYSTEM',
                        to: 'forensic.dr.singh@lab.gov.in',
                        timestamp: '2024-09-18T10:15:00Z',
                        reason: 'Initial collection',
                        location: 'Forensic lab'
                    }
                ])
            }
        ];

        for (const evidenceData of evidence) {
            await new Promise((resolve, reject) => {
                this.db.run(`
                    INSERT OR REPLACE INTO evidence (evidence_id, case_id, evidence_type, evidence_category, description, location_found, collected_by, collected_at, file_name, file_size, file_hash, ipfs_hash, status, chain_of_custody, created_at)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
                `, [
                    evidenceData.evidence_id, evidenceData.case_id, evidenceData.evidence_type,
                    evidenceData.evidence_category, evidenceData.description, evidenceData.location_found,
                    evidenceData.collected_by, evidenceData.collected_at, evidenceData.file_name,
                    evidenceData.file_size, evidenceData.file_hash, evidenceData.ipfs_hash,
                    evidenceData.status, evidenceData.chain_of_custody
                ], (err) => {
                    if (err) reject(err);
                    else resolve();
                });
            });
            
            console.log(`✅ Added evidence: ${evidenceData.description} (${evidenceData.evidence_id})`);
        }
    }

    async addSampleCustody() {
        console.log('\n🔄 Adding sample custody records...');
        
        const custodyRecords = [
            {
                evidence_id: 'EVD-2024-001',
                from_user: 'officer.rajesh@police.gov.in',
                to_user: 'forensic.dr.singh@lab.gov.in',
                transfer_reason: 'Forensic analysis required',
                transfer_date: '2024-09-21 09:00:00',
                status: 'completed',
                notes: 'Mobile phone sent for data extraction and analysis'
            },
            {
                evidence_id: 'EVD-2024-002',
                from_user: 'officer.rajesh@police.gov.in',
                to_user: 'forensic.dr.singh@lab.gov.in',
                transfer_reason: 'Computer forensics analysis',
                transfer_date: '2024-09-21 11:30:00',
                status: 'completed',
                notes: 'Laptop sent for hard drive imaging and analysis'
            },
            {
                evidence_id: 'EVD-2024-003',
                from_user: 'forensic.dr.singh@lab.gov.in',
                to_user: 'prosecutor.sharma@court.gov.in',
                transfer_reason: 'Court proceedings',
                transfer_date: '2024-09-22 14:00:00',
                status: 'in-transit',
                notes: 'Email evidence prepared for court submission'
            }
        ];

        for (const custodyData of custodyRecords) {
            await new Promise((resolve, reject) => {
                this.db.run(`
                    INSERT OR REPLACE INTO custody_transfers (evidence_id, from_user, to_user, transfer_reason, transfer_date, status, notes, created_at)
                    VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))
                `, [
                    custodyData.evidence_id, custodyData.from_user, custodyData.to_user,
                    custodyData.transfer_reason, custodyData.transfer_date, custodyData.status,
                    custodyData.notes
                ], (err) => {
                    if (err) reject(err);
                    else resolve();
                });
            });
            
            console.log(`✅ Added custody record: ${custodyData.evidence_id} transfer`);
        }
    }
}

// Run the script
const adder = new SampleDataAdder();
adder.addSampleData().catch(console.error);

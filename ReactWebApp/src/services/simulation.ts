// NDEP Simulation Service
// This provides a complete simulation of the NDEP system with mock data

export interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  department: string;
  employeeId: string;
  digiLockerVerified: boolean;
}

export interface Case {
  id: string;
  caseId: string;
  title: string;
  description: string;
  category: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'open' | 'under-investigation' | 'evidence-collection' | 'forensic-analysis' | 'court-proceedings' | 'closed';
  assignedOfficer: string;
  createdBy: string;
  incidentDate: string;
  incidentLocation: string;
  jurisdiction: string;
  createdAt: string;
  updatedAt: string;
  evidenceCount: number;
  blockchainHash?: string;
  blockchainTransactionId?: string;
  blockchainBlockNumber?: number;
}

export interface Evidence {
  id: string;
  evidenceId: string;
  caseId: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  evidenceType: string;
  description: string;
  uploadedBy: string;
  uploadedAt: string;
  chainOfCustody: string[];
  blockchainHash?: string;
  blockchainTransactionId?: string;
  blockchainBlockNumber?: number;
}

export interface BlockchainTransaction {
  id: string;
  type: 'case' | 'evidence';
  caseId?: string;
  evidenceId?: string;
  hash: string;
  timestamp: string;
  blockNumber: number;
  transactionId: string;
  metadata: any;
}

class NDEPSimulation {
  private users: User[] = [];
  private cases: Case[] = [];
  private evidence: Evidence[] = [];
  private blockchain: BlockchainTransaction[] = [];
  private currentUser: User | null = null;

  constructor() {
    this.initializeMockData();
  }

  private initializeMockData() {
    // Initialize users
    this.users = [
      {
        id: '1',
        email: 'officer.rajesh@police.gov.in',
        name: 'Rajesh Kumar',
        role: 'evidence-officer',
        department: 'Cyber Crime Unit',
        employeeId: 'PC-001',
        digiLockerVerified: true
      },
      {
        id: '2',
        email: 'sho.vikram@police.gov.in',
        name: 'Vikram Singh',
        role: 'station-house-officer',
        department: 'Central Police Station',
        employeeId: 'SHO-001',
        digiLockerVerified: true
      },
      {
        id: '3',
        email: 'custodian.priya@police.gov.in',
        name: 'Priya Sharma',
        role: 'evidence-custodian',
        department: 'Evidence Management Unit',
        employeeId: 'EM-001',
        digiLockerVerified: true
      },
      {
        id: '4',
        email: 'manager.dr.singh@lab.gov.in',
        name: 'Dr. Rajesh Singh',
        role: 'forensic-lab-manager',
        department: 'Forensic Science Laboratory',
        employeeId: 'FLM-001',
        digiLockerVerified: true
      },
      {
        id: '5',
        email: 'tech.sneha@lab.gov.in',
        name: 'Sneha Patel',
        role: 'forensic-lab-technician',
        department: 'Forensic Science Laboratory',
        employeeId: 'FLT-001',
        digiLockerVerified: true
      },
      {
        id: '6',
        email: 'clerk.anita@court.gov.in',
        name: 'Anita Desai',
        role: 'court-clerk',
        department: 'District Court',
        employeeId: 'CC-001',
        digiLockerVerified: true
      },
      {
        id: '7',
        email: 'judge.hon.singh@court.gov.in',
        name: 'Hon. Justice Singh',
        role: 'judge-magistrate',
        department: 'District Court',
        employeeId: 'JM-001',
        digiLockerVerified: true
      },
      {
        id: '8',
        email: 'admin.system@ndep.gov.in',
        name: 'System Administrator',
        role: 'system-admin',
        department: 'IT Department',
        employeeId: 'SA-001',
        digiLockerVerified: true
      }
    ];

    // Initialize mock cases
    this.cases = [
      {
        id: '1',
        caseId: 'CASE-2025-001',
        title: 'Cyber Fraud Investigation',
        description: 'Investigation of online banking fraud involving multiple victims',
        category: 'Cyber Crime',
        priority: 'high',
        status: 'under-investigation',
        assignedOfficer: 'Rajesh Kumar',
        createdBy: 'Rajesh Kumar',
        incidentDate: '2024-01-15T10:30:00',
        incidentLocation: 'Mumbai, Maharashtra',
        jurisdiction: 'Cyber Crime Unit',
        createdAt: '2024-01-15T11:00:00',
        updatedAt: '2024-01-20T14:30:00',
        evidenceCount: 3,
        blockchainHash: '0x1a2b3c4d5e6f7890abcdef1234567890abcdef12',
        blockchainTransactionId: '0x1234567890abcdef1234567890abcdef12345678',
        blockchainBlockNumber: 12345
      },
      {
        id: '2',
        caseId: 'CASE-2025-002',
        title: 'Digital Evidence Recovery',
        description: 'Recovery of deleted files from suspect\'s mobile device',
        category: 'Digital Forensics',
        priority: 'medium',
        status: 'evidence-collection',
        assignedOfficer: 'Rajesh Kumar',
        createdBy: 'Vikram Singh',
        incidentDate: '2024-01-18T09:15:00',
        incidentLocation: 'Delhi, NCR',
        jurisdiction: 'Central Police Station',
        createdAt: '2024-01-18T10:00:00',
        updatedAt: '2024-01-22T16:45:00',
        evidenceCount: 1,
        blockchainHash: '0x2b3c4d5e6f7890abcdef1234567890abcdef123456',
        blockchainTransactionId: '0x2345678901bcdef1234567890abcdef123456789',
        blockchainBlockNumber: 12346
      },
      {
        id: '3',
        caseId: 'CASE-2025-003',
        title: 'Social Media Harassment',
        description: 'Investigation of cyberbullying and online harassment case',
        category: 'Cyber Crime',
        priority: 'medium',
        status: 'open',
        assignedOfficer: 'Rajesh Kumar',
        createdBy: 'Rajesh Kumar',
        incidentDate: '2024-01-20T14:20:00',
        incidentLocation: 'Bangalore, Karnataka',
        jurisdiction: 'Cyber Crime Unit',
        createdAt: '2024-01-20T15:00:00',
        updatedAt: '2024-01-20T15:00:00',
        evidenceCount: 0,
        blockchainHash: '0x3c4d5e6f7890abcdef1234567890abcdef12345678',
        blockchainTransactionId: '0x3456789012cdef1234567890abcdef1234567890',
        blockchainBlockNumber: 12347
      }
    ];

    // Initialize mock evidence
    this.evidence = [
      {
        id: '1',
        evidenceId: 'EVID-2025-001',
        caseId: 'CASE-2025-001',
        fileName: 'banking_transaction_logs.xlsx',
        fileType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        fileSize: 2048576,
        evidenceType: 'Digital Document',
        description: 'Banking transaction logs showing fraudulent transfers',
        uploadedBy: 'Rajesh Kumar',
        uploadedAt: '2024-01-15T12:30:00',
        chainOfCustody: ['Rajesh Kumar', 'Priya Sharma'],
        blockchainHash: '0x4d5e6f7890abcdef1234567890abcdef1234567890',
        blockchainTransactionId: '0x4567890123def1234567890abcdef12345678901',
        blockchainBlockNumber: 12348
      },
      {
        id: '2',
        evidenceId: 'EVID-2025-002',
        caseId: 'CASE-2025-001',
        fileName: 'suspect_phone_backup.zip',
        fileType: 'application/zip',
        fileSize: 52428800,
        evidenceType: 'Mobile Device Backup',
        description: 'Complete backup of suspect\'s mobile device',
        uploadedBy: 'Rajesh Kumar',
        uploadedAt: '2024-01-16T09:15:00',
        chainOfCustody: ['Rajesh Kumar', 'Priya Sharma'],
        blockchainHash: '0x5e6f7890abcdef1234567890abcdef12345678901',
        blockchainTransactionId: '0x5678901234ef1234567890abcdef123456789012',
        blockchainBlockNumber: 12349
      }
    ];

    // Initialize blockchain transactions
    this.blockchain = [
      {
        id: '1',
        type: 'case',
        caseId: 'CASE-2025-001',
        hash: '0x1a2b3c4d5e6f7890abcdef1234567890abcdef12',
        timestamp: '2024-01-15T11:00:00',
        blockNumber: 12345,
        transactionId: '0x1234567890abcdef1234567890abcdef12345678',
        metadata: {
          title: 'Cyber Fraud Investigation',
          category: 'Cyber Crime',
          priority: 'high'
        }
      },
      {
        id: '2',
        type: 'evidence',
        caseId: 'CASE-2025-001',
        evidenceId: 'EVID-2025-001',
        hash: '0x4d5e6f7890abcdef1234567890abcdef1234567890',
        timestamp: '2024-01-15T12:30:00',
        blockNumber: 12348,
        transactionId: '0x4567890123def1234567890abcdef12345678901',
        metadata: {
          fileName: 'banking_transaction_logs.xlsx',
          evidenceType: 'Digital Document'
        }
      }
    ];
  }

  // Authentication methods
  async login(email: string, password: string, role: string, otp: string = '123456'): Promise<{ success: boolean; user?: User; message: string }> {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    const user = this.users.find(u => u.email === email && u.role === role);
    
    if (!user) {
      return { success: false, message: 'Invalid credentials' };
    }

    // Simulate password validation (accept any password for simulation)
    if (password.length < 6) {
      return { success: false, message: 'Password must be at least 6 characters' };
    }

    // Simulate OTP validation
    if (otp !== '123456') {
      return { success: false, message: 'Invalid OTP' };
    }

    this.currentUser = user;
    return { success: true, user, message: 'Login successful' };
  }

  logout(): void {
    this.currentUser = null;
  }

  getCurrentUser(): User | null {
    return this.currentUser;
  }

  // Case management methods
  async getCases(): Promise<Case[]> {
    await new Promise(resolve => setTimeout(resolve, 500));
    return [...this.cases];
  }

  async createCase(caseData: Partial<Case>): Promise<Case> {
    await new Promise(resolve => setTimeout(resolve, 1000));

    const newCase: Case = {
      id: (this.cases.length + 1).toString(),
      caseId: `CASE-2025-${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}`,
      title: caseData.title || 'New Case',
      description: caseData.description || '',
      category: caseData.category || 'General',
      priority: caseData.priority || 'medium',
      status: 'open',
      assignedOfficer: this.currentUser?.name || 'Unknown Officer',
      createdBy: this.currentUser?.name || 'Unknown Officer',
      incidentDate: caseData.incidentDate || new Date().toISOString(),
      incidentLocation: caseData.incidentLocation || '',
      jurisdiction: caseData.jurisdiction || '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      evidenceCount: 0,
      blockchainHash: this.generateBlockchainHash(),
      blockchainTransactionId: this.generateTransactionId(),
      blockchainBlockNumber: this.getNextBlockNumber()
    };

    this.cases.unshift(newCase);

    // Add to blockchain
    this.blockchain.push({
      id: (this.blockchain.length + 1).toString(),
      type: 'case',
      caseId: newCase.caseId,
      hash: newCase.blockchainHash!,
      timestamp: newCase.createdAt,
      blockNumber: newCase.blockchainBlockNumber!,
      transactionId: newCase.blockchainTransactionId!,
      metadata: {
        title: newCase.title,
        category: newCase.category,
        priority: newCase.priority
      }
    });

    return newCase;
  }

  async getCaseById(caseId: string): Promise<Case | null> {
    await new Promise(resolve => setTimeout(resolve, 300));
    return this.cases.find(c => c.caseId === caseId) || null;
  }

  // Evidence management methods
  async getEvidenceByCaseId(caseId: string): Promise<Evidence[]> {
    await new Promise(resolve => setTimeout(resolve, 500));
    return this.evidence.filter(e => e.caseId === caseId);
  }

  async uploadEvidence(evidenceData: FormData): Promise<Evidence> {
    await new Promise(resolve => setTimeout(resolve, 2000));

    const fileName = evidenceData.get('file')?.name || 'unknown_file';
    const fileType = evidenceData.get('file')?.type || 'application/octet-stream';
    const fileSize = evidenceData.get('file')?.size || 0;
    const caseId = evidenceData.get('caseId') as string;
    const evidenceType = evidenceData.get('evidenceType') as string || 'Digital Evidence';
    const description = evidenceData.get('description') as string || '';

    const newEvidence: Evidence = {
      id: (this.evidence.length + 1).toString(),
      evidenceId: `EVID-2025-${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}`,
      caseId,
      fileName,
      fileType,
      fileSize: Number(fileSize),
      evidenceType,
      description,
      uploadedBy: this.currentUser?.name || 'Unknown User',
      uploadedAt: new Date().toISOString(),
      chainOfCustody: [this.currentUser?.name || 'Unknown User'],
      blockchainHash: this.generateBlockchainHash(),
      blockchainTransactionId: this.generateTransactionId(),
      blockchainBlockNumber: this.getNextBlockNumber()
    };

    this.evidence.push(newEvidence);

    // Update case evidence count
    const caseIndex = this.cases.findIndex(c => c.caseId === caseId);
    if (caseIndex !== -1) {
      this.cases[caseIndex].evidenceCount++;
      this.cases[caseIndex].updatedAt = new Date().toISOString();
    }

    // Add to blockchain
    this.blockchain.push({
      id: (this.blockchain.length + 1).toString(),
      type: 'evidence',
      caseId,
      evidenceId: newEvidence.evidenceId,
      hash: newEvidence.blockchainHash!,
      timestamp: newEvidence.uploadedAt,
      blockNumber: newEvidence.blockchainBlockNumber!,
      transactionId: newEvidence.blockchainTransactionId!,
      metadata: {
        fileName: newEvidence.fileName,
        evidenceType: newEvidence.evidenceType,
        fileSize: newEvidence.fileSize
      }
    });

    return newEvidence;
  }

  // Blockchain methods
  async getBlockchainTransactions(): Promise<BlockchainTransaction[]> {
    await new Promise(resolve => setTimeout(resolve, 500));
    return [...this.blockchain];
  }

  async getBlockchainStats(): Promise<{
    totalTransactions: number;
    totalBlocks: number;
    lastBlockNumber: number;
    totalCases: number;
    totalEvidence: number;
  }> {
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const totalCases = this.blockchain.filter(t => t.type === 'case').length;
    const totalEvidence = this.blockchain.filter(t => t.type === 'evidence').length;
    const lastBlockNumber = Math.max(...this.blockchain.map(t => t.blockNumber), 0);

    return {
      totalTransactions: this.blockchain.length,
      totalBlocks: lastBlockNumber,
      lastBlockNumber,
      totalCases,
      totalEvidence
    };
  }

  // Utility methods
  private generateBlockchainHash(): string {
    return '0x' + Math.random().toString(16).substr(2, 40);
  }

  private generateTransactionId(): string {
    return '0x' + Math.random().toString(16).substr(2, 40);
  }

  private getNextBlockNumber(): number {
    const lastBlock = Math.max(...this.blockchain.map(t => t.blockNumber), 12340);
    return lastBlock + 1;
  }

  // Dashboard statistics
  async getDashboardStats(): Promise<{
    totalCases: number;
    activeCases: number;
    closedCases: number;
    totalEvidence: number;
    pendingEvidence: number;
    blockchainTransactions: number;
  }> {
    await new Promise(resolve => setTimeout(resolve, 300));

    const totalCases = this.cases.length;
    const activeCases = this.cases.filter(c => c.status !== 'closed').length;
    const closedCases = this.cases.filter(c => c.status === 'closed').length;
    const totalEvidence = this.evidence.length;
    const pendingEvidence = this.evidence.filter(e => e.chainOfCustody.length === 1).length;

    return {
      totalCases,
      activeCases,
      closedCases,
      totalEvidence,
      pendingEvidence,
      blockchainTransactions: this.blockchain.length
    };
  }
}

// Export singleton instance
export const ndepSimulation = new NDEPSimulation();
export default ndepSimulation;

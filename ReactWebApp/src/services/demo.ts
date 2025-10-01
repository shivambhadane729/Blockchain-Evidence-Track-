// EMERGENCY DEMO SYSTEM - 100% WORKING
// This is a bulletproof demo system for hackathon presentation

export interface DemoUser {
  id: string;
  email: string;
  name: string;
  role: string;
  department: string;
}

export interface DemoCase {
  id: string;
  caseId: string;
  title: string;
  description: string;
  category: string;
  priority: string;
  status: string;
  createdAt: string;
  evidenceCount: number;
  blockchainHash: string;
}

export interface DemoEvidence {
  id: string;
  evidenceId: string;
  caseId: string;
  fileName: string;
  fileSize: number;
  uploadedAt: string;
  blockchainHash: string;
}

export interface DemoUser {
  id: number;
  name: string;
  email: string;
  role: string;
  department?: string;
  employee_id?: string;
  digi_locker_verified: boolean;
  created_at: string;
}

class DemoSystem {
  private currentUser: DemoUser | null = null;
  private cases: DemoCase[] = [];
  private evidence: DemoEvidence[] = [];
  private users: DemoUser[] = [];
  private nextCaseId = 1;
  private nextEvidenceId = 1;

  constructor() {
    this.initializeDemoData();
  }

  private initializeDemoData() {
    // Pre-loaded demo users
    this.users = [
      {
        id: 1,
        name: 'Rajesh Kumar',
        email: 'officer.rajesh@police.gov.in',
        role: 'evidence-officer',
        department: 'Cyber Crime Unit',
        employee_id: 'PC-001',
        digi_locker_verified: true,
        created_at: '2024-01-01T00:00:00'
      },
      {
        id: 2,
        name: 'Vikram Singh',
        email: 'sho.vikram@police.gov.in',
        role: 'station-house-officer',
        department: 'Central Police Station',
        employee_id: 'SHO-001',
        digi_locker_verified: true,
        created_at: '2024-01-01T00:00:00'
      },
      {
        id: 3,
        name: 'Priya Sharma',
        email: 'custodian.priya@police.gov.in',
        role: 'evidence-custodian',
        department: 'Evidence Management Unit',
        employee_id: 'EM-001',
        digi_locker_verified: true,
        created_at: '2024-01-01T00:00:00'
      },
      {
        id: 4,
        name: 'Dr. Rajesh Singh',
        email: 'manager.dr.singh@lab.gov.in',
        role: 'forensic-lab-manager',
        department: 'Forensic Science Laboratory',
        employee_id: 'FLM-001',
        digi_locker_verified: true,
        created_at: '2024-01-01T00:00:00'
      },
      {
        id: 5,
        name: 'Sneha Patel',
        email: 'tech.sneha@lab.gov.in',
        role: 'forensic-lab-technician',
        department: 'Forensic Science Laboratory',
        employee_id: 'FLT-001',
        digi_locker_verified: true,
        created_at: '2024-01-01T00:00:00'
      },
      {
        id: 6,
        name: 'Anita Desai',
        email: 'clerk.anita@court.gov.in',
        role: 'court-clerk',
        department: 'District Court',
        employee_id: 'CC-001',
        digi_locker_verified: true,
        created_at: '2024-01-01T00:00:00'
      },
      {
        id: 7,
        name: 'Hon. Justice Singh',
        email: 'judge.hon.singh@court.gov.in',
        role: 'judge-magistrate',
        department: 'District Court',
        employee_id: 'JM-001',
        digi_locker_verified: true,
        created_at: '2024-01-01T00:00:00'
      },
      {
        id: 8,
        name: 'System Administrator',
        email: 'admin.system@ndep.gov.in',
        role: 'system-admin',
        department: 'IT Department',
        employee_id: 'SA-001',
        digi_locker_verified: true,
        created_at: '2024-01-01T00:00:00'
      }
    ];

    // Pre-loaded demo cases - Enhanced for 2025 showcase
    this.cases = [
      {
        id: '1',
        caseId: 'CASE-2025-001',
        title: 'Multi-Million Dollar Cryptocurrency Ponzi Scheme',
        description: 'Investigation of a sophisticated cryptocurrency investment fraud involving 500+ victims across 15 states. The scheme promised 300% returns through fake mining operations and involved complex blockchain transactions worth over $50 million.',
        category: 'Financial Crime',
        priority: 'critical',
        status: 'in-court',
        createdAt: '2025-01-10T08:30:00Z',
        evidenceCount: 47,
        blockchainHash: '0x1a2b3c4d5e6f7890abcdef1234567890abcdef12'
      },
      {
        id: '2',
        caseId: 'CASE-2025-002',
        title: 'International Drug Trafficking Network',
        description: 'Complex investigation involving a transnational drug cartel operating across 8 countries. The case involves encrypted communications, cryptocurrency payments, and sophisticated money laundering through shell companies and offshore accounts.',
        category: 'Drug Trafficking',
        priority: 'critical',
        status: 'under-investigation',
        createdAt: '2025-01-05T14:20:00Z',
        evidenceCount: 89,
        blockchainHash: '0x2b3c4d5e6f7890abcdef1234567890abcdef123456'
      },
      {
        id: '3',
        caseId: 'CASE-2025-003',
        title: 'Corporate Espionage & Trade Secret Theft',
        description: 'High-profile case involving theft of proprietary AI algorithms and customer databases from a Fortune 500 technology company. The breach involved insider threats, sophisticated hacking techniques, and attempts to sell stolen data on dark web markets.',
        category: 'Cyber Crime',
        priority: 'high',
        status: 'pending',
        createdAt: '2025-01-08T11:45:00Z',
        evidenceCount: 23,
        blockchainHash: '0x3c4d5e6f7890abcdef1234567890abcdef123456'
      },
      {
        id: '4',
        caseId: 'CASE-2025-004',
        title: 'Human Trafficking & Modern Slavery Ring',
        description: 'Investigation of a human trafficking network that exploited 200+ victims through forced labor in multiple industries. The case involves complex financial transactions, fake documentation, and coordination across state lines.',
        category: 'Human Trafficking',
        priority: 'critical',
        status: 'in-court',
        createdAt: '2025-01-03T16:30:00Z',
        evidenceCount: 156,
        blockchainHash: '0x4d5e6f7890abcdef1234567890abcdef12345678'
      },
      {
        id: '5',
        caseId: 'CASE-2025-005',
        title: 'Terrorism Financing & Money Laundering',
        description: 'Investigation of a complex network funneling money to terrorist organizations through cryptocurrency exchanges, shell companies, and charitable organizations. The case involves international cooperation and sophisticated financial forensics.',
        category: 'Terrorism',
        priority: 'critical',
        status: 'under-investigation',
        createdAt: '2025-01-07T09:15:00Z',
        evidenceCount: 78,
        blockchainHash: '0x5e6f7890abcdef1234567890abcdef1234567890'
      },
      {
        id: '6',
        caseId: 'CASE-2025-006',
        title: 'Healthcare Fraud & Medicare Scam',
        description: 'Large-scale healthcare fraud involving fake medical practices, phantom patients, and fraudulent billing to Medicare and private insurers. The scheme generated over $25 million in false claims over 3 years.',
        category: 'Healthcare Fraud',
        priority: 'high',
        status: 'decided',
        createdAt: '2024-12-28T13:20:00Z',
        evidenceCount: 34,
        blockchainHash: '0x6f7890abcdef1234567890abcdef1234567890ab'
      },
      {
        id: '7',
        caseId: 'CASE-2025-007',
        title: 'Environmental Crime & Illegal Waste Dumping',
        description: 'Investigation of a corporation illegally dumping toxic waste in protected areas, falsifying environmental reports, and bribing government officials. The case involves environmental forensics and corporate accountability.',
        category: 'Environmental Crime',
        priority: 'medium',
        status: 'adjourned',
        createdAt: '2025-01-11T10:30:00Z',
        evidenceCount: 19,
        blockchainHash: '0x7890abcdef1234567890abcdef1234567890abcd'
      },
      {
        id: '8',
        caseId: 'CASE-2025-008',
        title: 'Intellectual Property Theft & Counterfeiting',
        description: 'Investigation of a massive counterfeiting operation producing fake luxury goods, pharmaceuticals, and electronics. The operation spanned multiple countries and involved sophisticated manufacturing and distribution networks.',
        category: 'Intellectual Property',
        priority: 'high',
        status: 'pending',
        createdAt: '2025-01-09T15:45:00Z',
        evidenceCount: 42,
        blockchainHash: '0x890abcdef1234567890abcdef1234567890abcde'
      },
      {
        id: '9',
        caseId: 'CASE-2025-009',
        title: 'Securities Fraud & Market Manipulation',
        description: 'Complex securities fraud involving pump-and-dump schemes, insider trading, and manipulation of cryptocurrency markets. The case involves sophisticated financial analysis and coordination with multiple regulatory agencies.',
        category: 'Securities Fraud',
        priority: 'high',
        status: 'in-court',
        createdAt: '2025-01-06T12:00:00Z',
        evidenceCount: 67,
        blockchainHash: '0x90abcdef1234567890abcdef1234567890abcdef'
      },
      {
        id: '10',
        caseId: 'CASE-2025-010',
        title: 'Child Exploitation & Online Predator Network',
        description: 'Investigation of a dark web network involved in child exploitation, including production and distribution of illegal content. The case involves international cooperation, digital forensics, and victim protection protocols.',
        category: 'Child Exploitation',
        priority: 'critical',
        status: 'under-investigation',
        createdAt: '2025-01-04T17:30:00Z',
        evidenceCount: 124,
        blockchainHash: '0xa0bcdef1234567890abcdef1234567890abcdef1'
      }
    ];

    // Pre-loaded demo evidence - Enhanced for 2025 showcase
    this.evidence = [
      // Case 1 - Cryptocurrency Ponzi Scheme
      {
        id: '1',
        evidenceId: 'EVID-2025-001',
        caseId: 'CASE-2025-001',
        fileName: 'blockchain_transaction_analysis.pdf',
        fileSize: 15728640,
        uploadedAt: '2025-01-10T10:30:00Z',
        blockchainHash: '0x4d5e6f7890abcdef1234567890abcdef1234567890'
      },
      {
        id: '2',
        evidenceId: 'EVID-2025-002',
        caseId: 'CASE-2025-001',
        fileName: 'victim_testimonies_compilation.pdf',
        fileSize: 8388608,
        uploadedAt: '2025-01-11T14:20:00Z',
        blockchainHash: '0x5e6f7890abcdef1234567890abcdef12345678901'
      },
      {
        id: '3',
        evidenceId: 'EVID-2025-003',
        caseId: 'CASE-2025-001',
        fileName: 'financial_forensics_report.xlsx',
        fileSize: 5242880,
        uploadedAt: '2025-01-12T09:15:00Z',
        blockchainHash: '0x6f7890abcdef1234567890abcdef123456789012'
      },
      
      // Case 2 - Drug Trafficking Network
      {
        id: '4',
        evidenceId: 'EVID-2025-004',
        caseId: 'CASE-2025-002',
        fileName: 'encrypted_communications_decrypted.txt',
        fileSize: 2097152,
        uploadedAt: '2025-01-05T16:45:00Z',
        blockchainHash: '0x7890abcdef1234567890abcdef1234567890123'
      },
      {
        id: '5',
        evidenceId: 'EVID-2025-005',
        caseId: 'CASE-2025-002',
        fileName: 'cryptocurrency_wallet_analysis.pdf',
        fileSize: 10485760,
        uploadedAt: '2025-01-06T11:30:00Z',
        blockchainHash: '0x890abcdef1234567890abcdef12345678901234'
      },
      {
        id: '6',
        evidenceId: 'EVID-2025-006',
        caseId: 'CASE-2025-002',
        fileName: 'shell_company_documentation.zip',
        fileSize: 31457280,
        uploadedAt: '2025-01-07T13:20:00Z',
        blockchainHash: '0x90abcdef1234567890abcdef123456789012345'
      },
      
      // Case 3 - Corporate Espionage
      {
        id: '7',
        evidenceId: 'EVID-2025-007',
        caseId: 'CASE-2025-003',
        fileName: 'ai_algorithm_source_code.zip',
        fileSize: 52428800,
        uploadedAt: '2025-01-08T15:30:00Z',
        blockchainHash: '0xa0bcdef1234567890abcdef1234567890123456'
      },
      {
        id: '8',
        evidenceId: 'EVID-2025-008',
        caseId: 'CASE-2025-003',
        fileName: 'database_access_logs.csv',
        fileSize: 4194304,
        uploadedAt: '2025-01-09T08:45:00Z',
        blockchainHash: '0xb0cdef1234567890abcdef12345678901234567'
      },
      
      // Case 4 - Human Trafficking
      {
        id: '9',
        evidenceId: 'EVID-2025-009',
        caseId: 'CASE-2025-004',
        fileName: 'victim_interviews_compilation.pdf',
        fileSize: 20971520,
        uploadedAt: '2025-01-03T18:00:00Z',
        blockchainHash: '0xc0def1234567890abcdef123456789012345678'
      },
      {
        id: '10',
        evidenceId: 'EVID-2025-010',
        caseId: 'CASE-2025-004',
        fileName: 'financial_transaction_records.xlsx',
        fileSize: 8388608,
        uploadedAt: '2025-01-04T10:15:00Z',
        blockchainHash: '0xd0ef1234567890abcdef1234567890123456789'
      },
      
      // Case 5 - Terrorism Financing
      {
        id: '11',
        evidenceId: 'EVID-2025-011',
        caseId: 'CASE-2025-005',
        fileName: 'charity_organization_analysis.pdf',
        fileSize: 12582912,
        uploadedAt: '2025-01-07T12:30:00Z',
        blockchainHash: '0xe0f1234567890abcdef12345678901234567890'
      },
      {
        id: '12',
        evidenceId: 'EVID-2025-012',
        caseId: 'CASE-2025-005',
        fileName: 'cryptocurrency_exchange_records.csv',
        fileSize: 6291456,
        uploadedAt: '2025-01-08T14:45:00Z',
        blockchainHash: '0xf01234567890abcdef123456789012345678901'
      },
      
      // Case 6 - Healthcare Fraud
      {
        id: '13',
        evidenceId: 'EVID-2025-013',
        caseId: 'CASE-2025-006',
        fileName: 'medicare_billing_records.xlsx',
        fileSize: 16777216,
        uploadedAt: '2024-12-28T15:20:00Z',
        blockchainHash: '0x01234567890abcdef1234567890123456789012'
      },
      {
        id: '14',
        evidenceId: 'EVID-2025-014',
        caseId: 'CASE-2025-006',
        fileName: 'phantom_patient_analysis.pdf',
        fileSize: 10485760,
        uploadedAt: '2024-12-29T09:30:00Z',
        blockchainHash: '0x1234567890abcdef12345678901234567890123'
      },
      
      // Case 7 - Environmental Crime
      {
        id: '15',
        evidenceId: 'EVID-2025-015',
        caseId: 'CASE-2025-007',
        fileName: 'environmental_testing_reports.pdf',
        fileSize: 25165824,
        uploadedAt: '2025-01-11T12:00:00Z',
        blockchainHash: '0x234567890abcdef123456789012345678901234'
      },
      {
        id: '16',
        evidenceId: 'EVID-2025-016',
        caseId: 'CASE-2025-007',
        fileName: 'corporate_emails_evidence.zip',
        fileSize: 41943040,
        uploadedAt: '2025-01-12T16:30:00Z',
        blockchainHash: '0x34567890abcdef1234567890123456789012345'
      },
      
      // Case 8 - Intellectual Property Theft
      {
        id: '17',
        evidenceId: 'EVID-2025-017',
        caseId: 'CASE-2025-008',
        fileName: 'counterfeit_goods_analysis.pdf',
        fileSize: 18874368,
        uploadedAt: '2025-01-09T17:45:00Z',
        blockchainHash: '0x4567890abcdef12345678901234567890123456'
      },
      {
        id: '18',
        evidenceId: 'EVID-2025-018',
        caseId: 'CASE-2025-008',
        fileName: 'manufacturing_facility_photos.zip',
        fileSize: 67108864,
        uploadedAt: '2025-01-10T11:20:00Z',
        blockchainHash: '0x567890abcdef123456789012345678901234567'
      },
      
      // Case 9 - Securities Fraud
      {
        id: '19',
        evidenceId: 'EVID-2025-019',
        caseId: 'CASE-2025-009',
        fileName: 'market_manipulation_analysis.pdf',
        fileSize: 14680064,
        uploadedAt: '2025-01-06T14:15:00Z',
        blockchainHash: '0x67890abcdef1234567890123456789012345678'
      },
      {
        id: '20',
        evidenceId: 'EVID-2025-020',
        caseId: 'CASE-2025-009',
        fileName: 'insider_trading_records.xlsx',
        fileSize: 8388608,
        uploadedAt: '2025-01-07T10:30:00Z',
        blockchainHash: '0x7890abcdef12345678901234567890123456789'
      },
      
      // Case 10 - Child Exploitation
      {
        id: '21',
        evidenceId: 'EVID-2025-021',
        caseId: 'CASE-2025-010',
        fileName: 'dark_web_investigation_report.pdf',
        fileSize: 20971520,
        uploadedAt: '2025-01-04T19:30:00Z',
        blockchainHash: '0x890abcdef123456789012345678901234567890'
      },
      {
        id: '22',
        evidenceId: 'EVID-2025-022',
        caseId: 'CASE-2025-010',
        fileName: 'digital_forensics_analysis.zip',
        fileSize: 52428800,
        uploadedAt: '2025-01-05T13:45:00Z',
        blockchainHash: '0x90abcdef1234567890123456789012345678901'
      }
    ];
  }

  // SIMPLE LOGIN - NO COMPLEX VALIDATION
  login(email: string, password: string, role: string, otp: string): { success: boolean; user?: DemoUser; message: string } {
    // Accept ANY login for demo
    if (email && password && role) {
      // Map the role to the correct frontend role
      const roleMapping: { [key: string]: string } = {
        'Field/Investigating Officer': 'field-investigating-officer',
        'Station House Officer': 'station-house-officer',
        'Evidence Custodian': 'evidence-custodian',
        'Forensic Lab Manager': 'forensic-lab-manager',
        'Forensic Lab Technician': 'forensic-lab-technician',
        'Court Clerk': 'court-clerk',
        'Judge/Magistrate': 'judge-magistrate',
        'System Administrator': 'system-admin'
      };
      
      const mappedRole = roleMapping[role] || role;
      
      this.currentUser = {
        id: '1',
        email: email,
        name: 'Demo User',
        role: mappedRole,
        department: 'Demo Department'
      };
      return { success: true, user: this.currentUser, message: 'Login successful' };
    }
    return { success: false, message: 'Login failed' };
  }

  logout(): void {
    this.currentUser = null;
  }

  getCurrentUser(): DemoUser | null {
    return this.currentUser;
  }

  // GET ALL CASES
  getCases(): DemoCase[] {
    return [...this.cases];
  }

  // CREATE NEW CASE
  createCase(caseData: any): DemoCase {
    const newCase: DemoCase = {
      id: this.nextCaseId.toString(),
      caseId: `CASE-2025-${String(this.nextCaseId).padStart(3, '0')}`,
      title: caseData.title || 'New Case',
      description: caseData.description || 'Case description',
      category: caseData.category || 'General',
      priority: caseData.priority || 'medium',
      status: 'open',
      createdAt: new Date().toISOString(),
      evidenceCount: 0,
      blockchainHash: this.generateHash()
    };

    this.cases.unshift(newCase);
    this.nextCaseId++;
    return newCase;
  }

  // GET CASE BY ID
  getCaseById(caseId: string): DemoCase | null {
    return this.cases.find(c => c.caseId === caseId) || null;
  }

  // GET EVIDENCE BY CASE ID
  getEvidenceByCaseId(caseId: string): DemoEvidence[] {
    return this.evidence.filter(e => e.caseId === caseId);
  }

  // UPLOAD EVIDENCE
  uploadEvidence(file: File, caseId: string, description: string): DemoEvidence {
    const newEvidence: DemoEvidence = {
      id: this.nextEvidenceId.toString(),
      evidenceId: `EVID-2025-${String(this.nextEvidenceId).padStart(3, '0')}`,
      caseId: caseId,
      fileName: file.name,
      fileSize: file.size,
      uploadedAt: new Date().toISOString(),
      blockchainHash: this.generateHash()
    };

    this.evidence.push(newEvidence);

    // Update case evidence count
    const caseIndex = this.cases.findIndex(c => c.caseId === caseId);
    if (caseIndex !== -1) {
      this.cases[caseIndex].evidenceCount++;
    }

    this.nextEvidenceId++;
    return newEvidence;
  }

  // GET ALL USERS
  getUsers(): DemoUser[] {
    return [...this.users];
  }

  // GET DASHBOARD STATS
  getDashboardStats(): any {
    return {
      totalCases: this.cases.length,
      activeCases: this.cases.filter(c => c.status !== 'closed').length,
      closedCases: this.cases.filter(c => c.status === 'closed').length,
      totalEvidence: this.evidence.length,
      blockchainTransactions: this.cases.length + this.evidence.length
    };
  }

  // VERIFY EVIDENCE
  verifyEvidence(evidenceId: string): { verified: boolean; message: string } {
    // Simulate blockchain verification
    const evidence = this.evidence.find(e => e.evidenceId === evidenceId);
    if (evidence) {
      // In a real system, this would verify the blockchain hash
      return {
        verified: true,
        message: `Evidence ${evidenceId} verified successfully. Blockchain hash: ${evidence.blockchainHash}`
      };
    }
    return {
      verified: false,
      message: `Evidence ${evidenceId} not found`
    };
  }

  private generateHash(): string {
    return '0x' + Math.random().toString(16).substr(2, 40);
  }
}

// Export singleton
export const demoSystem = new DemoSystem();
export default demoSystem;

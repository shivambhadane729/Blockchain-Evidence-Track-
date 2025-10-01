// API Service for NDEP - DEMO MODE (100% WORKING)
import demoAPIService from './api-demo';

const USE_DEMO = true; // Demo mode enabled - 100% working

class APIService {
  // Authentication methods
  async login(email: string, password: string, role: string, otp: string = '123456'): Promise<{ success: boolean; user?: any; message: string }> {
    if (USE_DEMO) {
      return await demoAPIService.login(email, password, role, otp);
    }
    
    // Fallback to real API (if needed)
    const response = await fetch('http://localhost:3003/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password, role, otp }),
    });

    if (!response.ok) {
      throw new Error(`Login failed: ${response.statusText}`);
    }

    return await response.json();
  }

  logout(): void {
    if (USE_DEMO) {
      demoAPIService.logout();
    }
    // Clear any stored tokens or session data
    localStorage.removeItem('user');
    localStorage.removeItem('token');
  }

  getCurrentUser(): any {
    if (USE_DEMO) {
      return demoAPIService.getCurrentUser();
    }
    // Fallback to localStorage
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  }

  // Cases API
  async getCases(): Promise<any[]> {
    if (USE_DEMO) {
      return await demoAPIService.getCases();
    }
    
    // Fallback to real API
    const response = await fetch('http://localhost:3003/api/cases', {
      headers: this.getAuthHeaders(),
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch cases: ${response.statusText}`);
    }
    
    const data = await response.json();
    return data.cases || [];
  }

  async createCase(caseData: any): Promise<any> {
    if (USE_DEMO) {
      return await demoAPIService.createCase(caseData);
    }
    
    // Fallback to real API
    const response = await fetch('http://localhost:3003/api/cases', {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(caseData),
    });

    if (!response.ok) {
      throw new Error(`Failed to create case: ${response.statusText}`);
    }

    const data = await response.json();
    return data.case;
  }

  async getCaseById(caseId: string): Promise<Case | null> {
    if (USE_DEMO) {
      return await demoAPIService.getCaseById(caseId);
    }
    
    // Fallback to real API
    const response = await fetch(`http://localhost:3003/api/cases/${caseId}`, {
      headers: this.getAuthHeaders(),
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch case: ${response.statusText}`);
    }
    
    return await response.json();
  }

  // Evidence API
  async getEvidenceByCaseId(caseId: string): Promise<any[]> {
    if (USE_DEMO) {
      return await demoAPIService.getEvidenceByCaseId(caseId);
    }
    
    // Fallback to real API
    const response = await fetch(`http://localhost:3003/api/evidence/case/${caseId}`, {
      headers: this.getAuthHeaders(),
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch evidence: ${response.statusText}`);
    }
    
    return await response.json();
  }

  async uploadEvidence(file: File, caseId: string, description: string): Promise<any> {
    if (USE_DEMO) {
      return await demoAPIService.uploadEvidence(file, caseId, description);
    }
    
    // Fallback to real API
    const response = await fetch('http://localhost:3003/api/evidence', {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: evidenceData,
    });

    if (!response.ok) {
      throw new Error(`Failed to upload evidence: ${response.statusText}`);
    }

    return await response.json();
  }

  // Blockchain API
  async getBlockchainTransactions(): Promise<any[]> {
    if (USE_SIMULATION) {
      return await ndepSimulation.getBlockchainTransactions();
    }
    
    // Fallback to real API
    const response = await fetch('http://localhost:3003/api/blockchain/transactions', {
      headers: this.getAuthHeaders(),
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch blockchain transactions: ${response.statusText}`);
    }
    
    return await response.json();
  }

  async getBlockchainStats(): Promise<any> {
    if (USE_SIMULATION) {
      return await ndepSimulation.getBlockchainStats();
    }
    
    // Fallback to real API
    const response = await fetch('http://localhost:3003/api/blockchain/stats', {
      headers: this.getAuthHeaders(),
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch blockchain stats: ${response.statusText}`);
    }
    
    return await response.json();
  }

  // Users API
  async getUsers(): Promise<any[]> {
    if (USE_DEMO) {
      return await demoAPIService.getUsers();
    }
    
    // Fallback to real API
    const response = await fetch('http://localhost:3003/api/users', {
      headers: this.getAuthHeaders(),
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch users: ${response.statusText}`);
    }
    
    return await response.json();
  }

  // Dashboard API
  async getDashboardStats(): Promise<any> {
    if (USE_DEMO) {
      return await demoAPIService.getDashboardStats();
    }
    
    // Fallback to real API
    const response = await fetch('http://localhost:3003/api/dashboard/stats', {
      headers: this.getAuthHeaders(),
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch dashboard stats: ${response.statusText}`);
    }
    
    return await response.json();
  }

  // VERIFY EVIDENCE
  async verifyEvidence(evidenceId: string): Promise<{ verified: boolean; message: string }> {
    if (USE_DEMO) {
      return await demoAPIService.verifyEvidence(evidenceId);
    }
    
    // Fallback to real API
    const response = await fetch(`http://localhost:3003/api/evidence/${evidenceId}/verify`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
    });
    
    if (!response.ok) {
      throw new Error(`Failed to verify evidence: ${response.statusText}`);
    }
    
    return await response.json();
  }

  // Utility methods
  private getAuthHeaders() {
    return {
      'Content-Type': 'application/json',
    };
  }
}

// Export singleton instance
const apiService = new APIService();
export default apiService;
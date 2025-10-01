// BULLETPROOF API SERVICE FOR DEMO
import demoSystem, { DemoUser, DemoCase, DemoEvidence } from './demo';

class DemoAPIService {
  // LOGIN - ALWAYS WORKS
  async login(email: string, password: string, role: string, otp: string = '123456'): Promise<{ success: boolean; user?: DemoUser; message: string }> {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 500));
    return demoSystem.login(email, password, role, otp);
  }

  logout(): void {
    demoSystem.logout();
  }

  getCurrentUser(): DemoUser | null {
    return demoSystem.getCurrentUser();
  }

  // GET CASES - ALWAYS WORKS
  async getCases(): Promise<DemoCase[]> {
    await new Promise(resolve => setTimeout(resolve, 300));
    return demoSystem.getCases();
  }

  // CREATE CASE - ALWAYS WORKS
  async createCase(caseData: any): Promise<DemoCase> {
    await new Promise(resolve => setTimeout(resolve, 800));
    return demoSystem.createCase(caseData);
  }

  // GET CASE BY ID - ALWAYS WORKS
  async getCaseById(caseId: string): Promise<DemoCase | null> {
    await new Promise(resolve => setTimeout(resolve, 300));
    return demoSystem.getCaseById(caseId);
  }

  // GET EVIDENCE - ALWAYS WORKS
  async getEvidenceByCaseId(caseId: string): Promise<DemoEvidence[]> {
    await new Promise(resolve => setTimeout(resolve, 300));
    return demoSystem.getEvidenceByCaseId(caseId);
  }

  // UPLOAD EVIDENCE - ALWAYS WORKS
  async uploadEvidence(file: File, caseId: string, description: string): Promise<DemoEvidence> {
    await new Promise(resolve => setTimeout(resolve, 1500));
    return demoSystem.uploadEvidence(file, caseId, description);
  }

  // GET USERS - ALWAYS WORKS
  async getUsers(): Promise<any[]> {
    await new Promise(resolve => setTimeout(resolve, 300));
    return demoSystem.getUsers();
  }

  // GET DASHBOARD STATS - ALWAYS WORKS
  async getDashboardStats(): Promise<any> {
    await new Promise(resolve => setTimeout(resolve, 200));
    return demoSystem.getDashboardStats();
  }

  // VERIFY EVIDENCE - ALWAYS WORKS
  async verifyEvidence(evidenceId: string): Promise<{ verified: boolean; message: string }> {
    await new Promise(resolve => setTimeout(resolve, 500));
    return demoSystem.verifyEvidence(evidenceId);
  }
}

// Export singleton
const apiService = new DemoAPIService();
export default apiService;

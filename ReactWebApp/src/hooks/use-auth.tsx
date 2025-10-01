import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import APIService from "../services/api";

export interface User {
  role: string;
  email: string;
  name?: string;
  lastLogin?: string;
  permissions: string[];
  digiLockerVerified?: boolean;
  digiLockerVerificationDate?: string;
  department?: string;
  employeeId?: string;
}

export interface LoginAttempt {
  timestamp: string;
  email: string;
  role: string;
  success: boolean;
  ip?: string;
  userAgent?: string;
}

export type AuthContextType = {
  isAuthenticated: boolean;
  user: User | null;
  login: (data: { role: string; email: string; password: string; otp: string }) => Promise<boolean>;
  logout: () => void;
  loginAttempts: LoginAttempt[];
  sessionTimeout: number;
  resetSessionTimeout: () => void;
  linkDigiLocker: () => Promise<boolean>;
  completeDigiLockerVerification: (verificationData: { name: string; department: string; employeeId: string }) => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Role-based permissions
const ROLE_PERMISSIONS: Record<string, string[]> = {
  // Core Roles (Essential for Prototype)
  "field-investigating-officer": [
    "upload_evidence", "view_evidence", "initiate_case", "hash_evidence", 
    "request_analysis", "transfer_evidence", "update_case_status"
  ],
  "station-house-officer": [
    "approve_evidence_submissions", "authorize_transfers", "view_all_cases", 
    "supervise_investigations", "approve_analysis_requests", "manage_team"
  ],
  "evidence-custodian": [
    "store_physical_evidence", "track_evidence_location", "manage_transfers", 
    "update_custody_records", "verify_chain_integrity", "inventory_management"
  ],
  "forensic-lab-technician": [
    "analyze_evidence", "upload_analysis_reports", "update_analysis_status", 
    "attach_artifacts", "verify_evidence_integrity", "request_additional_samples"
  ],
  "forensic-lab-manager": [
    "review_analysis_reports", "approve_lab_reports", "validate_chain_integrity", 
    "manage_lab_operations", "quality_control", "lab_approvals"
  ],
  "public-prosecutor": [
    "view_evidence_readonly", "prepare_case_files", "request_evidence_review", 
    "court_submission_prep", "legal_analysis", "case_strategy"
  ],
  "court-clerk": [
    "upload_case_records", "manage_court_filings", "digital_case_management", 
    "bridge_prosecutor_judge", "maintain_case_files", "court_documentation"
  ],
  "judge-magistrate": [
    "verify_chain_of_custody", "admit_evidence_court", "final_evidence_verification", 
    "court_verification", "trial_evidence_management", "judicial_oversight"
  ],
  "system-admin": [
    "all_permissions", "manage_user_accounts", "system_configuration", 
    "audit_logs", "blockchain_monitoring", "security_management", "backup_restore"
  ],
  
  // Optional Roles (Advanced / Future Phases)
  "courier-transport": [
    "track_evidence_transport", "update_transport_status", "verify_handover", 
    "transport_documentation", "chain_of_custody_transport"
  ],
  "external-lab": [
    "analyze_outsourced_evidence", "upload_external_reports", "quality_assurance", 
    "specialized_testing", "external_verification"
  ],
  "ngo-verifier": [
    "verify_special_cases", "wildlife_crime_verification", "human_rights_cases", 
    "independent_verification", "ngo_documentation"
  ],
  "law-enforcement-hq": [
    "oversight_dashboards", "analytics_reporting", "command_oversight", 
    "strategic_analysis", "hq_management", "policy_implementation"
  ],
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [user, setUser] = useState<User | null>(null);
  const [loginAttempts, setLoginAttempts] = useState<LoginAttempt[]>([]);
  const [sessionTimeout, setSessionTimeout] = useState(600); // 10 minutes
  const navigate = useNavigate();

  useEffect(() => {
    const saved = localStorage.getItem("ndep:auth");
    const attempts = localStorage.getItem("ndep:loginAttempts");
    
    if (saved) {
      try {
        const authData = JSON.parse(saved);
        setIsAuthenticated(true);
        setUser(authData.user);
      } catch (error) {
        localStorage.removeItem("ndep:auth");
      }
    }

    if (attempts) {
      try {
        setLoginAttempts(JSON.parse(attempts));
      } catch (error) {
        localStorage.removeItem("ndep:loginAttempts");
      }
    }
  }, []);

  // Session timeout management
  useEffect(() => {
    if (!isAuthenticated) return;

    const timer = setInterval(() => {
      setSessionTimeout(prev => {
        if (prev <= 1) {
          logout();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isAuthenticated]);

  const logLoginAttempt = useCallback((attempt: LoginAttempt) => {
    const newAttempts = [...loginAttempts, attempt].slice(-50); // Keep last 50 attempts
    setLoginAttempts(newAttempts);
    localStorage.setItem("ndep:loginAttempts", JSON.stringify(newAttempts));
    
    // In real app, send to blockchain for audit
    console.log("Login attempt logged:", attempt);
  }, [loginAttempts]);

  const login = useCallback(async (data: { role: string; email: string; password: string; otp: string }): Promise<boolean> => {
    const attempt: LoginAttempt = {
      timestamp: new Date().toISOString(),
      email: data.email,
      role: data.role,
      success: false,
      ip: "127.0.0.1", // In real app, get from request
      userAgent: navigator.userAgent,
    };

    try {
      // Use simulation API service
      const result = await APIService.login(data.email, data.password, data.role, data.otp);

      if (result.success && result.user) {
        const userData: User = {
          role: result.user.role,
          email: result.user.email,
          name: result.user.name,
          lastLogin: new Date().toISOString(),
          permissions: ROLE_PERMISSIONS[result.user.role] || [],
          digiLockerVerified: result.user.digiLockerVerified,
          department: result.user.department,
          employeeId: result.user.employeeId,
        };

        setIsAuthenticated(true);
        setUser(userData);
        setSessionTimeout(600); // Reset session timeout
        
        const authData = { user: userData, timestamp: Date.now() };
        localStorage.setItem("ndep:auth", JSON.stringify(authData));
        
        attempt.success = true;
        attempt.role = result.user.role;
        logLoginAttempt(attempt);
        
        return true;
      } else {
        console.error('Login failed:', result.message);
        attempt.success = false;
        logLoginAttempt(attempt);
        return false;
      }
    } catch (error) {
      console.error('Login error:', error);
      attempt.success = false;
      logLoginAttempt(attempt);
      return false;
    }
  }, [logLoginAttempt]);

  const logout = useCallback(() => {
    setIsAuthenticated(false);
    setUser(null);
    setSessionTimeout(600);
    localStorage.removeItem("ndep:auth");
    
    // Log logout
    console.log("User logged out:", user?.email);
    
    // Redirect to home page after logout
    navigate("/", { replace: true });
  }, [user, navigate]);

  const resetSessionTimeout = useCallback(() => {
    setSessionTimeout(600);
  }, []);

  const linkDigiLocker = useCallback(async (): Promise<boolean> => {
    try {
      // In real app, redirect to DigiLocker OAuth
      // For demo, simulate the redirect
      console.log("Redirecting to DigiLocker OAuth...");
      
      // Simulate OAuth flow
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      return true;
    } catch (error) {
      console.error("DigiLocker linking failed:", error);
      return false;
    }
  }, []);

  const completeDigiLockerVerification = useCallback((verificationData: { name: string; department: string; employeeId: string }) => {
    if (user) {
      const updatedUser: User = {
        ...user,
        name: verificationData.name,
        department: verificationData.department,
        employeeId: verificationData.employeeId,
        digiLockerVerified: true,
        digiLockerVerificationDate: new Date().toISOString(),
      };
      
      setUser(updatedUser);
      
      // Update localStorage
      const authData = { user: updatedUser, timestamp: Date.now() };
      localStorage.setItem("ndep:auth", JSON.stringify(authData));
    }
  }, [user]);

  const value = useMemo(() => ({ 
    isAuthenticated, 
    user, 
    login, 
    logout, 
    loginAttempts,
    sessionTimeout,
    resetSessionTimeout,
    linkDigiLocker,
    completeDigiLockerVerification
  }), [isAuthenticated, user, login, logout, loginAttempts, sessionTimeout, resetSessionTimeout, linkDigiLocker, completeDigiLockerVerification]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

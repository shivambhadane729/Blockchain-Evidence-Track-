import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/use-auth";

interface RoleGuardProps {
  children: JSX.Element;
  allowedRoles: string[];
  fallbackPath?: string;
}

export default function RoleGuard({ 
  children, 
  allowedRoles, 
  fallbackPath = "/dashboard" 
}: RoleGuardProps) {
  const { user, isAuthenticated } = useAuth();

  // If not authenticated, redirect to login
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // If no user data, show loading
  if (!user) {
    return <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-muted-foreground">Loading user data...</p>
      </div>
    </div>;
  }

  // Check if user's role is in allowed roles
  if (!allowedRoles.includes(user.role)) {
    return <Navigate to={fallbackPath} replace />;
  }

  return children;
}

// Role mapping utility
export const ROLE_MAPPING = {
  // Backend roles -> Frontend roles
  'evidence-officer': 'field-investigating-officer',
  'forensic-lab-manager': 'forensic-lab-manager',
  'forensic-lab-technician': 'forensic-lab-technician',
  'prosecutor': 'public-prosecutor',
  'system-admin': 'system-admin',
  'station-house-officer': 'station-house-officer',
  'evidence-custodian': 'evidence-custodian',
  'judge-magistrate': 'judge-magistrate',
  'court-clerk': 'court-clerk'
} as const;

// Role permissions
export const ROLE_PERMISSIONS = {
  'evidence-officer': ['field-investigating-officer'],
  'field-investigating-officer': ['field-investigating-officer'],
  'station-house-officer': ['station-house-officer'],
  'evidence-custodian': ['evidence-custodian'],
  'forensic-lab-technician': ['forensic-lab-technician'],
  'forensic-lab-manager': ['forensic-lab-manager'],
  'prosecutor': ['public-prosecutor'],
  'public-prosecutor': ['public-prosecutor'],
  'judge-magistrate': ['judge-magistrate'],
  'court-clerk': ['court-clerk'],
  'system-admin': ['system-admin']
} as const;

// Get normalized role from backend role
export function normalizeRole(backendRole: string): string {
  return ROLE_MAPPING[backendRole as keyof typeof ROLE_MAPPING] || backendRole;
}

// Check if user has permission for a role
export function hasRolePermission(userRole: string, requiredRole: string): boolean {
  const normalizedUserRole = normalizeRole(userRole);
  const permissions = ROLE_PERMISSIONS[normalizedUserRole as keyof typeof ROLE_PERMISSIONS] || [];
  return permissions.includes(requiredRole);
}

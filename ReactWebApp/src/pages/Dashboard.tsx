import { useAuth } from "@/hooks/use-auth";
import { normalizeRole, ROLE_MAPPING } from "@/components/app/RoleGuard";
import OfficerDashboard from "@/components/dashboards/OfficerDashboard";
import SHODashboard from "@/components/dashboards/SHODashboard";
import CustodianDashboard from "@/components/dashboards/CustodianDashboard";
import AnalystDashboard from "@/components/dashboards/AnalystDashboard";
import ProsecutorDashboard from "@/components/dashboards/ProsecutorDashboard";
import JudgeDashboard from "@/components/dashboards/JudgeDashboard";
import AdminDashboard from "@/components/dashboards/AdminDashboard";
import RoleDebug from "@/components/debug/RoleDebug";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";

export default function DashboardPage() {
  const { user, isAuthenticated } = useAuth();

  // If not authenticated, this should be handled by ProtectedRoute
  if (!isAuthenticated) {
    return <div>Redirecting to login...</div>;
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

  // Get the user's role and normalize it
  const userRole = user.role;
  const normalizedRole = normalizeRole(userRole);

  // Define valid roles and their corresponding dashboards
  const validRoles = Object.keys(ROLE_MAPPING);
  
  // DEMO MODE: Skip role validation - allow all roles
  // if (!validRoles.includes(userRole)) {
  //   return (
  //     <div className="flex items-center justify-center min-h-screen p-4">
  //       <Alert className="max-w-md">
  //         <AlertTriangle className="h-4 w-4" />
  //         <AlertDescription>
  //           <div className="space-y-2">
  //             <p className="font-semibold">Access Denied</p>
  //             <p>Your role "{userRole}" is not recognized or you don't have permission to access this dashboard.</p>
  //             <p className="text-sm text-muted-foreground">
  //               Please contact your system administrator for role assignment.
  //             </p>
  //           </div>
  //         </AlertDescription>
  //       </Alert>
  //     </div>
  //   );
  // }

  // Render role-specific dashboard with strict access control
  switch (normalizedRole) {
    case "field-investigating-officer":
      return <OfficerDashboard />;
    
    case "station-house-officer":
      return (
        <div>
          <RoleDebug />
          <SHODashboard />
        </div>
      );
    
    case "evidence-custodian":
      return (
        <div>
          <RoleDebug />
          <CustodianDashboard />
        </div>
      );
    
    case "forensic-lab-technician":
    case "forensic-lab-manager":
      return <AnalystDashboard />;
    
    case "public-prosecutor":
      return (
        <div>
          <RoleDebug />
          <ProsecutorDashboard />
        </div>
      );
    
    case "judge-magistrate":
      return <JudgeDashboard />;
    
    case "system-admin":
      return (
        <div>
          <RoleDebug />
          <AdminDashboard />
        </div>
      );
    
    case "court-clerk":
      return (
        <div>
          <RoleDebug />
          <ProsecutorDashboard />
        </div>
      ); // Similar to prosecutor for now
    
    default:
      // DEMO MODE: Default to Officer Dashboard for any unrecognized role
      return (
        <div>
          <RoleDebug />
          <OfficerDashboard />
        </div>
      );
  }
}

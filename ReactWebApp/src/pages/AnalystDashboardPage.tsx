import RoleGuard from "@/components/app/RoleGuard";
import AnalystDashboard from "@/components/dashboards/AnalystDashboard";

export default function AnalystDashboardPage() {
  return (
    <RoleGuard allowedRoles={['forensic-lab-technician', 'forensic-lab-manager']}>
      <AnalystDashboard />
    </RoleGuard>
  );
}

import RoleGuard from "@/components/app/RoleGuard";
import SHODashboard from "@/components/dashboards/SHODashboard";

export default function SHODashboardPage() {
  return (
    <RoleGuard allowedRoles={['station-house-officer']}>
      <SHODashboard />
    </RoleGuard>
  );
}

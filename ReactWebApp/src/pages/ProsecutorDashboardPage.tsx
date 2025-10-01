import RoleGuard from "@/components/app/RoleGuard";
import ProsecutorDashboard from "@/components/dashboards/ProsecutorDashboard";

export default function ProsecutorDashboardPage() {
  return (
    <RoleGuard allowedRoles={['public-prosecutor', 'prosecutor', 'court-clerk']}>
      <ProsecutorDashboard />
    </RoleGuard>
  );
}

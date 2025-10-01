import RoleGuard from "@/components/app/RoleGuard";
import OfficerDashboard from "@/components/dashboards/OfficerDashboard";

export default function OfficerDashboardPage() {
  return (
    <RoleGuard allowedRoles={['field-investigating-officer', 'evidence-officer']}>
      <OfficerDashboard />
    </RoleGuard>
  );
}

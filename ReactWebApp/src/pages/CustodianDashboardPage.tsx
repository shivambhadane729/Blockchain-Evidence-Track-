import RoleGuard from "@/components/app/RoleGuard";
import CustodianDashboard from "@/components/dashboards/CustodianDashboard";

export default function CustodianDashboardPage() {
  return (
    <RoleGuard allowedRoles={['evidence-custodian']}>
      <CustodianDashboard />
    </RoleGuard>
  );
}

import { useAuth } from "@/hooks/use-auth";
import { normalizeRole, ROLE_MAPPING } from "@/components/app/RoleGuard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function RoleDebug() {
  const { user, isAuthenticated } = useAuth();

  if (!isAuthenticated || !user) {
    return null;
  }

  const normalizedRole = normalizeRole(user.role);
  const validRoles = Object.keys(ROLE_MAPPING);

  return (
    <Card className="mb-4 border-yellow-200 bg-yellow-50">
      <CardHeader>
        <CardTitle className="text-sm text-yellow-800">🔍 Role Debug Info</CardTitle>
      </CardHeader>
      <CardContent className="text-sm text-yellow-700">
        <div className="space-y-1">
          <p><strong>User Role (Backend):</strong> {user.role}</p>
          <p><strong>Normalized Role (Frontend):</strong> {normalizedRole}</p>
          <p><strong>Is Valid Role:</strong> {validRoles.includes(user.role) ? '✅ Yes' : '❌ No'}</p>
          <p><strong>Valid Roles:</strong> {validRoles.join(', ')}</p>
        </div>
      </CardContent>
    </Card>
  );
}

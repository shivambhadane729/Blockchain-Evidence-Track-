import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

interface RoleInfo {
  value: string;
  label: string;
  category: "core" | "optional";
  description: string;
  keyResponsibilities: string[];
  permissions: string[];
  realWorldFunction: string;
}

const ROLE_INFO: RoleInfo[] = [
  // Core Roles (Essential for Prototype)
  {
    value: "field-investigating-officer",
    label: "Field/Investigating Officer (IO)",
    category: "core",
    description: "First responder who collects evidence at crime scenes and initiates cases",
    keyResponsibilities: [
      "Collect evidence at crime scenes",
      "Initiate case documentation",
      "Hash evidence for blockchain storage",
      "Upload initial evidence files",
      "Request forensic analysis"
    ],
    permissions: [
      "upload_evidence", "view_evidence", "initiate_case", "hash_evidence", 
      "request_analysis", "transfer_evidence", "update_case_status"
    ],
    realWorldFunction: "First custodian, critical to hash evidence and upload"
  },
  {
    value: "station-house-officer",
    label: "Station House Officer (SHO)",
    category: "core",
    description: "Local supervisor who approves evidence submissions and transfers",
    keyResponsibilities: [
      "Approve evidence submissions",
      "Authorize evidence transfers",
      "Supervise investigations",
      "Manage team operations",
      "Oversee case progression"
    ],
    permissions: [
      "approve_evidence_submissions", "authorize_transfers", "view_all_cases", 
      "supervise_investigations", "approve_analysis_requests", "manage_team"
    ],
    realWorldFunction: "Adds oversight and authorization layer"
  },
  {
    value: "evidence-custodian",
    label: "Evidence Custodian (Malkhana In-Charge)",
    category: "core",
    description: "Manages physical evidence storage and maintains custody records",
    keyResponsibilities: [
      "Store physical evidence securely",
      "Track evidence location",
      "Manage evidence transfers",
      "Update custody records",
      "Maintain inventory"
    ],
    permissions: [
      "store_physical_evidence", "track_evidence_location", "manage_transfers", 
      "update_custody_records", "verify_chain_integrity", "inventory_management"
    ],
    realWorldFunction: "Ensures traceable storage and transfers"
  },
  {
    value: "forensic-lab-technician",
    label: "Forensic Lab Technician/Analyst",
    category: "core",
    description: "Performs detailed evidence analysis and produces technical reports",
    keyResponsibilities: [
      "Analyze evidence samples",
      "Upload analysis reports",
      "Update analysis status",
      "Attach technical artifacts",
      "Verify evidence integrity"
    ],
    permissions: [
      "analyze_evidence", "upload_analysis_reports", "update_analysis_status", 
      "attach_artifacts", "verify_evidence_integrity", "request_additional_samples"
    ],
    realWorldFunction: "Performs verification and uploads reports"
  },
  {
    value: "forensic-lab-manager",
    label: "Forensic Lab Manager",
    category: "core",
    description: "Reviews and approves lab reports, ensures quality control",
    keyResponsibilities: [
      "Review analysis reports",
      "Approve lab reports",
      "Validate chain integrity",
      "Manage lab operations",
      "Quality control oversight"
    ],
    permissions: [
      "review_analysis_reports", "approve_lab_reports", "validate_chain_integrity", 
      "manage_lab_operations", "quality_control", "lab_approvals"
    ],
    realWorldFunction: "Confirms lab-level approvals"
  },
  {
    value: "public-prosecutor",
    label: "Public Prosecutor",
    category: "core",
    description: "Handles legal arguments and prepares evidence for court proceedings",
    keyResponsibilities: [
      "Prepare case files",
      "Review evidence for court",
      "Legal analysis",
      "Court submission preparation",
      "Case strategy development"
    ],
    permissions: [
      "view_evidence_readonly", "prepare_case_files", "request_evidence_review", 
      "court_submission_prep", "legal_analysis", "case_strategy"
    ],
    realWorldFunction: "Needs read-only or limited access for case preparation"
  },
  {
    value: "court-clerk",
    label: "Court Clerk/Registrar",
    category: "core",
    description: "Manages court records and bridges communication between prosecutor and judge",
    keyResponsibilities: [
      "Upload case records",
      "Manage court filings",
      "Digital case management",
      "Bridge prosecutor-judge communication",
      "Maintain case files"
    ],
    permissions: [
      "upload_case_records", "manage_court_filings", "digital_case_management", 
      "bridge_prosecutor_judge", "maintain_case_files", "court_documentation"
    ],
    realWorldFunction: "Bridges prosecutor and judge, keeps digital case files"
  },
  {
    value: "judge-magistrate",
    label: "Judge/Magistrate",
    category: "core",
    description: "Final verifier who admits evidence in court and ensures integrity",
    keyResponsibilities: [
      "Verify chain of custody",
      "Admit evidence in court",
      "Final evidence verification",
      "Court verification process",
      "Judicial oversight"
    ],
    permissions: [
      "verify_chain_of_custody", "admit_evidence_court", "final_evidence_verification", 
      "court_verification", "trial_evidence_management", "judicial_oversight"
    ],
    realWorldFunction: "Final verifier, ensures evidence integrity before trial"
  },
  {
    value: "system-admin",
    label: "System Admin/Auditor",
    category: "core",
    description: "Manages system accounts, permissions, and audits blockchain logs",
    keyResponsibilities: [
      "Manage user accounts",
      "System configuration",
      "Audit blockchain logs",
      "Security management",
      "Backup and restore"
    ],
    permissions: [
      "all_permissions", "manage_user_accounts", "system_configuration", 
      "audit_logs", "blockchain_monitoring", "security_management", "backup_restore"
    ],
    realWorldFunction: "Maintains the system, ensures no unauthorized access"
  },
  
  // Optional Roles (Advanced / Future Phases)
  {
    value: "courier-transport",
    label: "Courier/Transport Staff",
    category: "optional",
    description: "Handles physical evidence transport between locations",
    keyResponsibilities: [
      "Track evidence transport",
      "Update transport status",
      "Verify handover procedures",
      "Transport documentation",
      "Chain of custody during transport"
    ],
    permissions: [
      "track_evidence_transport", "update_transport_status", "verify_handover", 
      "transport_documentation", "chain_of_custody_transport"
    ],
    realWorldFunction: "If evidence is physically transferred between cities or agencies"
  },
  {
    value: "external-lab",
    label: "External/Private Labs",
    category: "optional",
    description: "Specialized external laboratories for outsourced testing",
    keyResponsibilities: [
      "Analyze outsourced evidence",
      "Upload external reports",
      "Quality assurance",
      "Specialized testing",
      "External verification"
    ],
    permissions: [
      "analyze_outsourced_evidence", "upload_external_reports", "quality_assurance", 
      "specialized_testing", "external_verification"
    ],
    realWorldFunction: "When government labs outsource specialized testing"
  },
  {
    value: "ngo-verifier",
    label: "NGO/Verifier",
    category: "optional",
    description: "Independent verification for special cases like wildlife crime",
    keyResponsibilities: [
      "Verify special cases",
      "Wildlife crime verification",
      "Human rights cases",
      "Independent verification",
      "NGO documentation"
    ],
    permissions: [
      "verify_special_cases", "wildlife_crime_verification", "human_rights_cases", 
      "independent_verification", "ngo_documentation"
    ],
    realWorldFunction: "For special cases like wildlife crime or human rights investigations"
  },
  {
    value: "law-enforcement-hq",
    label: "Law Enforcement HQ/Command",
    category: "optional",
    description: "High-level oversight and analytics for command centers",
    keyResponsibilities: [
      "Oversight dashboards",
      "Analytics reporting",
      "Command oversight",
      "Strategic analysis",
      "Policy implementation"
    ],
    permissions: [
      "oversight_dashboards", "analytics_reporting", "command_oversight", 
      "strategic_analysis", "hq_management", "policy_implementation"
    ],
    realWorldFunction: "For oversight dashboards or analytics"
  },
];

export default function RoleInfo() {
  const coreRoles = ROLE_INFO.filter(role => role.category === "core");
  const optionalRoles = ROLE_INFO.filter(role => role.category === "optional");

  return (
    <div className="space-y-8">
      {/* Core Roles Section */}
      <div>
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-primary mb-2">Core Roles</h2>
          <p className="text-muted-foreground">Essential roles for the prototype system</p>
        </div>
        
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {coreRoles.map((role) => (
            <Card key={role.value} className="h-full">
              <CardHeader>
                <CardTitle className="text-lg">{role.label}</CardTitle>
                <CardDescription>{role.description}</CardDescription>
                <Badge variant="secondary" className="w-fit">
                  {role.category}
                </Badge>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-semibold text-sm mb-2">Key Responsibilities:</h4>
                  <ul className="text-sm space-y-1">
                    {role.keyResponsibilities.map((responsibility, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <span className="text-muted-foreground">•</span>
                        <span>{responsibility}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                
                <Separator />
                
                <div>
                  <h4 className="font-semibold text-sm mb-2">System Permissions:</h4>
                  <div className="flex flex-wrap gap-1">
                    {role.permissions.slice(0, 3).map((permission) => (
                      <Badge key={permission} variant="outline" className="text-xs">
                        {permission.replace(/_/g, ' ')}
                      </Badge>
                    ))}
                    {role.permissions.length > 3 && (
                      <Badge variant="outline" className="text-xs">
                        +{role.permissions.length - 3} more
                      </Badge>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Optional Roles Section */}
      <div>
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-primary mb-2">Optional Roles</h2>
          <p className="text-muted-foreground">Advanced roles for future phases</p>
        </div>
        
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {optionalRoles.map((role) => (
            <Card key={role.value} className="h-full border-dashed">
              <CardHeader>
                <CardTitle className="text-lg">{role.label}</CardTitle>
                <CardDescription>{role.description}</CardDescription>
                <Badge variant="outline" className="w-fit">
                  {role.category}
                </Badge>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-semibold text-sm mb-2">Key Responsibilities:</h4>
                  <ul className="text-sm space-y-1">
                    {role.keyResponsibilities.map((responsibility, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <span className="text-muted-foreground">•</span>
                        <span>{responsibility}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                
                <Separator />
                
                <div>
                  <h4 className="font-semibold text-sm mb-2">System Permissions:</h4>
                  <div className="flex flex-wrap gap-1">
                    {role.permissions.slice(0, 3).map((permission) => (
                      <Badge key={permission} variant="outline" className="text-xs">
                        {permission.replace(/_/g, ' ')}
                      </Badge>
                    ))}
                    {role.permissions.length > 3 && (
                      <Badge variant="outline" className="text-xs">
                        +{role.permissions.length - 3} more
                      </Badge>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}

export { ROLE_INFO };

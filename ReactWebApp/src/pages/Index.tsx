import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { LockKeyhole, Activity } from "lucide-react";
import ShieldCamIcon from "@/components/app/icons/ShieldCamIcon";
import { TrustBadge } from "@/components/app/TrustBadge";
import EvidenceAnimation from "@/components/app/EvidenceAnimation";
import LoginPanel from "@/components/app/LoginPanel";
import { useAuth } from "@/hooks/use-auth";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";

export default function Index() {
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate("/dashboard", { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const handleSignIn = async (formData: { role: string; email: string; password: string; otp: string }) => {
    const success = await login(formData);
    
    if (success) {
      navigate("/dashboard", { replace: true });
    }
    
    return success;
  };

  return (
    <div className="space-y-16">
      <section className="relative overflow-hidden rounded-2xl border bg-gradient-to-br from-primary/5 via-background to-accent/5 p-8 md:p-12">
        <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-primary/20 blur-3xl" />
        <div className="absolute -left-24 -bottom-24 h-72 w-72 rounded-full bg-accent/20 blur-3xl" />
        <div className="relative grid items-start gap-10 md:grid-cols-5">
          <div className="md:col-span-3 space-y-6">
            <div className="flex items-center gap-3">
              <TrustBadge label="Blockchain Verified Integrity" />
            </div>
            <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight text-primary">
              Government Blockchain Evidence Security System
            </h1>
            <p className="text-lg text-muted-foreground max-w-prose">
              Clean, official portal for secure evidence upload, blockchain hash IDs, and immutable chain-of-custody with role-based access.
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <Badge variant="secondary" className="gap-2"><Activity className="h-3.5 w-3.5" /> Audit trail reports</Badge>
            </div>
            <div className="hidden md:block">
              <div className="grid gap-4 sm:grid-cols-2">
                <Card className="bg-card/60">
                  <CardContent className="p-5">
                    <div className="flex items-center gap-3"><span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary shadow-glow"><ShieldCamIcon className="h-5 w-5" /></span><p className="font-semibold">AES-256 Encryption</p></div>
                    <p className="mt-2 text-sm text-muted-foreground">Client-side encryption and hashing with SHA-256 to ensure integrity.</p>
                  </CardContent>
                </Card>
                <Card className="bg-card/60">
                  <CardContent className="p-5">
                    <div className="flex items-center gap-3"><span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-accent/10 text-accent shadow-glow"><ShieldCamIcon className="h-5 w-5" /></span><p className="font-semibold">On-chain Custody</p></div>
                    <p className="mt-2 text-sm text-muted-foreground">Immutable ledger of every access, transfer, and approval.</p>
                  </CardContent>
                </Card>
                <Card className="bg-card/60">
                  <CardContent className="p-5">
                    <div className="flex items-center gap-3"><span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary shadow-glow"><ShieldCamIcon className="h-5 w-5" /></span><p className="font-semibold">Role-based Access</p></div>
                    <p className="mt-2 text-sm text-muted-foreground">Smart-contract approvals for investigators, labs, and courts.</p>
                  </CardContent>
                </Card>
                <Card className="bg-card/60">
                  <CardContent className="p-5">
                    <div className="flex items-center gap-3"><span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-accent/10 text-accent shadow-glow"><ShieldCamIcon className="h-5 w-5" /></span><p className="font-semibold">Searchable Directory</p></div>
                    <p className="mt-2 text-sm text-muted-foreground">Fast global search across evidence with status and roles.</p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
          <div className="md:col-span-2">
            <LoginPanel onSignIn={handleSignIn} />
          </div>
        </div>
      </section>
    </div>
  );
}

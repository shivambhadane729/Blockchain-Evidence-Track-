import { Lock, LogOut, User, Clock, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link, NavLink } from "react-router-dom";
import { useAuth } from "@/hooks/use-auth";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useEffect, useState } from "react";
import DigiLockerBadge from "./DigiLockerBadge";

import AshokaEmblem from "./AshokaEmblem";

function HeaderContent() {
  const { isAuthenticated, logout, user, sessionTimeout, resetSessionTimeout } = useAuth();
  const [timeRemaining, setTimeRemaining] = useState(sessionTimeout);

  useEffect(() => {
    setTimeRemaining(sessionTimeout);
  }, [sessionTimeout]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getRoleDisplayName = (role: string) => {
    const roleMap: Record<string, string> = {
      // Core Roles
      "field-investigating-officer": "Field/Investigating Officer",
      "station-house-officer": "Station House Officer",
      "evidence-custodian": "Evidence Custodian",
      "forensic-lab-technician": "Forensic Lab Technician",
      "forensic-lab-manager": "Forensic Lab Manager",
      "public-prosecutor": "Public Prosecutor",
      "court-clerk": "Court Clerk",
      "judge-magistrate": "Judge/Magistrate",
      "system-admin": "System Administrator",
      
      // Optional Roles
      "courier-transport": "Courier/Transport",
      "external-lab": "External Lab",
      "ngo-verifier": "NGO Verifier",
      "law-enforcement-hq": "Law Enforcement HQ",
    };
    return roleMap[role] || role;
  };

  return (
    <TooltipProvider>
      <div className="flex items-center gap-3">
            {isAuthenticated && user ? (
              /* Authenticated User Info */
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">
                    {getRoleDisplayName(user.role)}
                  </Badge>
                  {user.digiLockerVerified && (
                    <DigiLockerBadge verificationDate={user.digiLockerVerificationDate} />
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">
                    Session: {formatTime(timeRemaining)}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={logout}
                    className="gap-1"
                  >
                    <LogOut className="h-4 w-4" />
                    Logout
                  </Button>
                </div>
              </div>
            ) : (
              /* No login button - login is now on the main page */
              null
            )}
      </div>
    </TooltipProvider>
  );
}

export default function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white/90 backdrop-blur supports-[backdrop-filter]:bg-white/80">
      <div className="container flex h-16 items-center justify-between">
        <Link to="/" className="flex items-center gap-3">
          <AshokaEmblem className="h-8 w-auto" />
          <span className="font-extrabold tracking-tight text-lg text-primary">National Digital Evidence Portal</span>
        </Link>
        <HeaderContent />
      </div>
    </header>
  );
}

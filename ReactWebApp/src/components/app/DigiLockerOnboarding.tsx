import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Shield, ExternalLink } from "lucide-react";

export default function DigiLockerOnboarding({ onLinkDigiLocker }: { onLinkDigiLocker: () => void }) {
  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        {/* DigiLocker Logo Placeholder */}
        <div className="mx-auto mb-4 w-16 h-16 bg-gradient-to-br from-blue-800 to-blue-600 rounded-lg flex items-center justify-center">
          <Shield className="h-8 w-8 text-white" />
        </div>
        
        <CardTitle className="text-xl">Verify Your Identity via DigiLocker</CardTitle>
        <CardDescription className="text-sm">
          EvidenceChain uses DigiLocker, the Government of India's secure document platform, to confirm your identity.
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        <div className="text-center space-y-4">
          <p className="text-sm text-muted-foreground">
            Link your DigiLocker account to proceed.
          </p>
          
          <Button 
            onClick={onLinkDigiLocker}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white gap-2"
          >
            <ExternalLink className="h-4 w-4" />
            Link DigiLocker
          </Button>
          
          <p className="text-xs text-muted-foreground">
            You will be redirected to DigiLocker's secure portal to grant access.
          </p>
        </div>
        
        {/* Security Notice */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <div className="flex items-start gap-2">
            <Shield className="h-4 w-4 text-blue-600 mt-0.5" />
            <div className="text-xs text-blue-800">
              <p className="font-semibold">Secure Verification</p>
              <p>Your data is protected by DigiLocker's government-grade security standards.</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

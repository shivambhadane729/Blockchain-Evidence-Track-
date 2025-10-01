import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { 
  Shield, 
  CheckCircle, 
  AlertTriangle, 
  RefreshCw,
  FileText,
  Hash,
  Clock,
  User
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';

interface VerificationResult {
  evidenceId: string;
  verificationResult: {
    exists: boolean;
    verified: boolean;
    transactionHash?: string;
    blockNumber?: number;
    recordedAt?: string;
    custodyTimeline: Array<{
      id: number;
      fromUser: { name: string; role: string };
      toUser: { name: string; role: string };
      transferredAt: string;
      isVerified: boolean;
    }>;
    message: string;
  };
  verifiedAt: string;
}

interface VerifyEvidenceProps {
  evidenceId: string;
  evidenceDescription?: string;
  onVerificationComplete?: (result: VerificationResult) => void;
  showDetails?: boolean;
}

export default function VerifyEvidence({ 
  evidenceId, 
  evidenceDescription,
  onVerificationComplete,
  showDetails = true 
}: VerifyEvidenceProps) {
  const [verifying, setVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState<VerificationResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const { user } = useAuth();

  const handleVerifyEvidence = async () => {
    try {
      setVerifying(true);
      setError(null);

      const response = await fetch('/api/blockchain/verify-evidence', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          evidenceId
        })
      });

      if (!response.ok) {
        throw new Error(`Verification failed: ${response.statusText}`);
      }

      const result = await response.json();
      setVerificationResult(result);
      
      toast({
        title: "Verification Complete",
        description: result.verificationResult.verified 
          ? "Evidence integrity verified successfully"
          : "Evidence verification failed",
        variant: result.verificationResult.verified ? "default" : "destructive"
      });

      onVerificationComplete?.(result);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to verify evidence';
      setError(errorMessage);
      toast({
        title: "Verification Error",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setVerifying(false);
    }
  };

  const getVerificationStatus = () => {
    if (!verificationResult) return null;
    
    const { verificationResult: result } = verificationResult;
    
    if (!result.exists) {
      return (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Evidence not found in blockchain
          </AlertDescription>
        </Alert>
      );
    }
    
    if (result.verified) {
      return (
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-600">
            Evidence integrity verified successfully
          </AlertDescription>
        </Alert>
      );
    }
    
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          Blockchain integrity compromised
        </AlertDescription>
      </Alert>
    );
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return {
      date: date.toLocaleDateString(),
      time: date.toLocaleTimeString()
    };
  };

  const getRoleDisplayName = (role: string) => {
    const roleMap: Record<string, string> = {
      'field-investigating-officer': 'Field Officer',
      'station-house-officer': 'SHO',
      'evidence-custodian': 'Custodian',
      'forensic-lab-technician': 'Lab Tech',
      'forensic-lab-manager': 'Lab Manager',
      'public-prosecutor': 'Prosecutor',
      'court-clerk': 'Court Clerk',
      'judge-magistrate': 'Judge',
      'system-admin': 'Admin'
    };
    return roleMap[role] || role;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Verify Evidence Integrity
        </CardTitle>
        <CardDescription>
          Verify evidence against blockchain records
          {evidenceDescription && ` - ${evidenceDescription}`}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-medium">Evidence ID: {evidenceId}</div>
            {verificationResult && (
              <div className="text-xs text-muted-foreground">
                Last verified: {formatDateTime(verificationResult.verifiedAt).date} at {formatDateTime(verificationResult.verifiedAt).time}
              </div>
            )}
          </div>
          <Button 
            onClick={handleVerifyEvidence}
            disabled={verifying}
            className="min-w-[120px]"
          >
            {verifying ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Verifying...
              </>
            ) : (
              <>
                <Shield className="h-4 w-4 mr-2" />
                Verify Evidence
              </>
            )}
          </Button>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              {error}
            </AlertDescription>
          </Alert>
        )}

        {verificationResult && (
          <>
            {getVerificationStatus()}
            
            {showDetails && verificationResult.verificationResult.exists && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Hash className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">Blockchain Details</span>
                    </div>
                    <div className="text-xs space-y-1 pl-6">
                      <div>Transaction Hash: {verificationResult.verificationResult.transactionHash?.substring(0, 16)}...</div>
                      <div>Block Number: {verificationResult.verificationResult.blockNumber}</div>
                      <div>Recorded: {verificationResult.verificationResult.recordedAt ? 
                        formatDateTime(verificationResult.verificationResult.recordedAt).date : 'N/A'}</div>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">Custody Chain</span>
                    </div>
                    <div className="text-xs space-y-1 pl-6">
                      <div>Total Transfers: {verificationResult.verificationResult.custodyTimeline.length}</div>
                      <div>Verified Transfers: {verificationResult.verificationResult.custodyTimeline.filter(t => t.isVerified).length}</div>
                      <div>Pending Transfers: {verificationResult.verificationResult.custodyTimeline.filter(t => !t.isVerified).length}</div>
                    </div>
                  </div>
                </div>

                {verificationResult.verificationResult.custodyTimeline.length > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">Recent Custody Activity</span>
                    </div>
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {verificationResult.verificationResult.custodyTimeline.slice(-3).map((transfer, index) => (
                        <div key={index} className="flex items-center justify-between p-2 bg-muted/50 rounded text-xs">
                          <div className="flex items-center gap-2">
                            <Badge variant={transfer.isVerified ? "default" : "secondary"} className="text-xs">
                              {transfer.isVerified ? (
                                <CheckCircle className="h-3 w-3 mr-1" />
                              ) : (
                                <Clock className="h-3 w-3 mr-1" />
                              )}
                              {transfer.isVerified ? 'Verified' : 'Pending'}
                            </Badge>
                            <span>
                              {transfer.fromUser.name} ({getRoleDisplayName(transfer.fromUser.role)}) → 
                              {transfer.toUser.name} ({getRoleDisplayName(transfer.toUser.role)})
                            </span>
                          </div>
                          <span className="text-muted-foreground">
                            {formatDateTime(transfer.transferredAt).date}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </>
        )}

        {!verificationResult && !error && (
          <Alert>
            <Shield className="h-4 w-4" />
            <AlertDescription>
              Click "Verify Evidence" to check the integrity of this evidence against the blockchain.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Shield, 
  AlertTriangle, 
  Activity, 
  Database,
  RefreshCw,
  TrendingUp,
  CheckCircle,
  Clock,
  FileText,
  Users
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import CustodyTimeline from './CustodyTimeline';
import AlertsPanel from './AlertsPanel';
import VerifyEvidence from './VerifyEvidence';

interface BlockchainStatus {
  status: string;
  evidenceChain: {
    chainId: string;
    blockCount: number;
    lastBlockNumber: number;
    integrity: boolean;
  };
  custodyChain: {
    chainId: string;
    blockCount: number;
    lastBlockNumber: number;
    integrity: boolean;
  };
  timestamp: string;
}

interface BlockchainHealth {
  healthScore: number;
  verificationRate: number;
  totalTransactions: number;
  verifiedTransactions: number;
  uniqueEvidenceCount: number;
  avgVerificationCount: number;
  recentActivity: Array<{
    transaction_type: string;
    count: number;
  }>;
  chainValid: boolean;
  blockHeight: number;
  pendingTransactions: number;
}

interface BlockchainDashboardProps {
  evidenceId?: string;
  caseId?: string;
  showEvidenceSpecific?: boolean;
}

export default function BlockchainDashboard({ 
  evidenceId, 
  caseId,
  showEvidenceSpecific = false 
}: BlockchainDashboardProps) {
  const [blockchainStatus, setBlockchainStatus] = useState<BlockchainStatus | null>(null);
  const [blockchainHealth, setBlockchainHealth] = useState<BlockchainHealth | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const { user } = useAuth();

  const fetchBlockchainData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch blockchain status
      const statusResponse = await fetch('/api/blockchain/status', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (!statusResponse.ok) {
        throw new Error('Failed to fetch blockchain status');
      }

      const statusData = await statusResponse.json();
      setBlockchainStatus(statusData);

      // Fetch blockchain health
      const healthResponse = await fetch('/api/blockchain/health', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (!healthResponse.ok) {
        throw new Error('Failed to fetch blockchain health');
      }

      const healthData = await healthResponse.json();
      setBlockchainHealth(healthData);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch blockchain data');
      toast({
        title: "Error",
        description: "Failed to load blockchain data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchBlockchainData();
    setRefreshing(false);
  };

  useEffect(() => {
    fetchBlockchainData();
  }, []);

  const getHealthScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getHealthScoreBadge = (score: number) => {
    if (score >= 80) return 'bg-green-100 text-green-800 border-green-200';
    if (score >= 60) return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    return 'bg-red-100 text-red-800 border-red-200';
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <div className="h-4 bg-muted animate-pulse rounded"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-muted animate-pulse rounded mb-2"></div>
                <div className="h-3 bg-muted animate-pulse rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Blockchain Dashboard
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              {error}
            </AlertDescription>
          </Alert>
          <Button 
            onClick={handleRefresh} 
            variant="outline" 
            className="mt-4"
            disabled={refreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Shield className="h-6 w-6" />
            Blockchain Dashboard
          </h2>
          <p className="text-muted-foreground">
            {showEvidenceSpecific 
              ? `Blockchain status for evidence ${evidenceId}`
              : 'Real-time blockchain monitoring and evidence integrity'
            }
          </p>
        </div>
        <Button 
          onClick={handleRefresh} 
          variant="outline"
          disabled={refreshing}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">System Health</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {blockchainHealth?.healthScore || 0}%
            </div>
            <Badge className={getHealthScoreBadge(blockchainHealth?.healthScore || 0)}>
              {blockchainHealth?.healthScore >= 80 ? 'Excellent' : 
               blockchainHealth?.healthScore >= 60 ? 'Good' : 'Needs Attention'}
            </Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Evidence</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {blockchainHealth?.uniqueEvidenceCount || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              {blockchainHealth?.totalTransactions || 0} total transactions
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Verification Rate</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Math.round((blockchainHealth?.verificationRate || 0) * 100)}%
            </div>
            <p className="text-xs text-muted-foreground">
              {blockchainHealth?.verifiedTransactions || 0} of {blockchainHealth?.totalTransactions || 0} verified
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Blockchain Status */}
      {blockchainStatus && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Evidence Chain
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm">Chain ID:</span>
                <Badge variant="outline">{blockchainStatus.evidenceChain.chainId}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Blocks:</span>
                <span className="font-medium">{blockchainStatus.evidenceChain.blockCount}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Integrity:</span>
                <Badge className={blockchainStatus.evidenceChain.integrity ? 
                  'bg-green-100 text-green-800 border-green-200' : 
                  'bg-red-100 text-red-800 border-red-200'}>
                  {blockchainStatus.evidenceChain.integrity ? 'Valid' : 'Compromised'}
                </Badge>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Custody Chain
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm">Chain ID:</span>
                <Badge variant="outline">{blockchainStatus.custodyChain.chainId}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Blocks:</span>
                <span className="font-medium">{blockchainStatus.custodyChain.blockCount}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Integrity:</span>
                <Badge className={blockchainStatus.custodyChain.integrity ? 
                  'bg-green-100 text-green-800 border-green-200' : 
                  'bg-red-100 text-red-800 border-red-200'}>
                  {blockchainStatus.custodyChain.integrity ? 'Valid' : 'Compromised'}
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Evidence-Specific Features */}
      {showEvidenceSpecific && evidenceId && (
        <Tabs defaultValue="timeline" className="space-y-4">
          <TabsList>
            <TabsTrigger value="timeline">Custody Timeline</TabsTrigger>
            <TabsTrigger value="verify">Verify Evidence</TabsTrigger>
            <TabsTrigger value="anomalies">Anomalies</TabsTrigger>
          </TabsList>
          
          <TabsContent value="timeline">
            <CustodyTimeline 
              evidenceId={evidenceId} 
              onRefresh={handleRefresh}
            />
          </TabsContent>
          
          <TabsContent value="verify">
            <VerifyEvidence 
              evidenceId={evidenceId}
              onVerificationComplete={() => {
                toast({
                  title: "Verification Complete",
                  description: "Evidence verification completed successfully"
                });
              }}
            />
          </TabsContent>
          
          <TabsContent value="anomalies">
            <AlertsPanel 
              evidenceId={evidenceId}
              onRefresh={handleRefresh}
            />
          </TabsContent>
        </Tabs>
      )}

      {/* Recent Activity */}
      {blockchainHealth?.recentActivity && blockchainHealth.recentActivity.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Recent Activity (24h)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {blockchainHealth.recentActivity.map((activity, index) => (
                <div key={index} className="flex items-center justify-between p-2 bg-muted/50 rounded">
                  <span className="text-sm font-medium">
                    {activity.transaction_type.replace('_', ' ').toUpperCase()}
                  </span>
                  <Badge variant="secondary">
                    {activity.count} transactions
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

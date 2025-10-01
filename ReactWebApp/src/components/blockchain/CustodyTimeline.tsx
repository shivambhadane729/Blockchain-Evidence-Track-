import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Timeline, 
  TimelineItem, 
  TimelineSeparator, 
  TimelineConnector, 
  TimelineContent, 
  TimelineDot,
  TimelineOppositeContent
} from '@/components/ui/timeline';
import { 
  Shield, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  User, 
  MapPin, 
  FileText,
  RefreshCw,
  Download
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';

interface CustodyEvent {
  id: number;
  evidenceId: string;
  fromUser: {
    id: number;
    name: string;
    role: string;
  };
  toUser: {
    id: number;
    name: string;
    role: string;
  };
  fromLocation: string;
  toLocation: string;
  transferType: string;
  transferReason: string;
  transferNotes: string;
  blockchainHash: string;
  isVerified: boolean;
  transferredAt: string;
  verifiedAt: string;
  blockNumber: number;
  transactionHash: string;
}

interface CustodyTimelineProps {
  evidenceId: string;
  onRefresh?: () => void;
  showActions?: boolean;
}

export default function CustodyTimeline({ 
  evidenceId, 
  onRefresh, 
  showActions = true 
}: CustodyTimelineProps) {
  const [custodyTimeline, setCustodyTimeline] = useState<CustodyEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  const fetchCustodyTimeline = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/blockchain/evidence/${evidenceId}/custody`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch custody timeline: ${response.statusText}`);
      }

      const data = await response.json();
      setCustodyTimeline(data.custodyTimeline || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch custody timeline');
      toast({
        title: "Error",
        description: "Failed to load custody timeline",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchCustodyTimeline();
    setRefreshing(false);
    onRefresh?.();
  };

  useEffect(() => {
    if (evidenceId) {
      fetchCustodyTimeline();
    }
  }, [evidenceId]);

  const getTransferTypeIcon = (transferType: string) => {
    switch (transferType.toLowerCase()) {
      case 'handover':
        return <User className="h-4 w-4" />;
      case 'collection':
        return <Shield className="h-4 w-4" />;
      case 'analysis':
        return <FileText className="h-4 w-4" />;
      case 'storage':
        return <MapPin className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const getTransferTypeColor = (transferType: string) => {
    switch (transferType.toLowerCase()) {
      case 'handover':
        return 'bg-blue-500';
      case 'collection':
        return 'bg-green-500';
      case 'analysis':
        return 'bg-purple-500';
      case 'storage':
        return 'bg-orange-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getVerificationStatus = (isVerified: boolean, verifiedAt: string) => {
    if (isVerified) {
      return (
        <Badge variant="default" className="bg-green-100 text-green-800 border-green-200">
          <CheckCircle className="h-3 w-3 mr-1" />
          Verified
        </Badge>
      );
    }
    return (
      <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 border-yellow-200">
        <Clock className="h-3 w-3 mr-1" />
        Pending
      </Badge>
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

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Custody Timeline
          </CardTitle>
          <CardDescription>
            Loading custody chain for evidence {evidenceId}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center space-x-4">
                <Skeleton className="h-4 w-4 rounded-full" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-4 w-[250px]" />
                  <Skeleton className="h-4 w-[200px]" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Custody Timeline
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
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Custody Timeline
            </CardTitle>
            <CardDescription>
              Complete chain of custody for evidence {evidenceId}
            </CardDescription>
          </div>
          {showActions && (
            <div className="flex gap-2">
              <Button 
                onClick={handleRefresh} 
                variant="outline" 
                size="sm"
                disabled={refreshing}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {custodyTimeline.length === 0 ? (
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              No custody transfers found for this evidence.
            </AlertDescription>
          </Alert>
        ) : (
          <Timeline>
            {custodyTimeline.map((event, index) => {
              const { date, time } = formatDateTime(event.transferredAt);
              const isLast = index === custodyTimeline.length - 1;
              
              return (
                <TimelineItem key={event.id}>
                  <TimelineOppositeContent className="text-xs text-muted-foreground">
                    <div className="text-right">
                      <div>{date}</div>
                      <div>{time}</div>
                    </div>
                  </TimelineOppositeContent>
                  <TimelineSeparator>
                    <TimelineDot className={getTransferTypeColor(event.transferType)}>
                      {getTransferTypeIcon(event.transferType)}
                    </TimelineDot>
                    {!isLast && <TimelineConnector />}
                  </TimelineSeparator>
                  <TimelineContent>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">
                            {event.transferType}
                          </Badge>
                          {getVerificationStatus(event.isVerified, event.verifiedAt)}
                        </div>
                        {event.blockNumber && (
                          <Badge variant="secondary" className="text-xs">
                            Block #{event.blockNumber}
                          </Badge>
                        )}
                      </div>
                      
                      <div className="space-y-1">
                        <div className="text-sm font-medium">
                          {event.fromUser ? (
                            <span>
                              {event.fromUser.name} ({getRoleDisplayName(event.fromUser.role)})
                            </span>
                          ) : (
                            <span className="text-muted-foreground">Initial Collection</span>
                          )}
                          <span className="mx-2 text-muted-foreground">→</span>
                          <span>
                            {event.toUser.name} ({getRoleDisplayName(event.toUser.role)})
                          </span>
                        </div>
                        
                        {event.fromLocation && event.toLocation && (
                          <div className="text-xs text-muted-foreground flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {event.fromLocation} → {event.toLocation}
                          </div>
                        )}
                        
                        {event.transferReason && (
                          <div className="text-xs text-muted-foreground">
                            <strong>Reason:</strong> {event.transferReason}
                          </div>
                        )}
                        
                        {event.transferNotes && (
                          <div className="text-xs text-muted-foreground">
                            <strong>Notes:</strong> {event.transferNotes}
                          </div>
                        )}
                        
                        {event.transactionHash && (
                          <div className="text-xs text-muted-foreground font-mono">
                            <strong>Tx Hash:</strong> {event.transactionHash.substring(0, 16)}...
                          </div>
                        )}
                      </div>
                    </div>
                  </TimelineContent>
                </TimelineItem>
              );
            })}
          </Timeline>
        )}
        
        {custodyTimeline.length > 0 && (
          <div className="mt-6 p-4 bg-muted/50 rounded-lg">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <div className="font-medium text-muted-foreground">Total Transfers</div>
                <div className="text-lg font-semibold">{custodyTimeline.length}</div>
              </div>
              <div>
                <div className="font-medium text-muted-foreground">Verified</div>
                <div className="text-lg font-semibold text-green-600">
                  {custodyTimeline.filter(e => e.isVerified).length}
                </div>
              </div>
              <div>
                <div className="font-medium text-muted-foreground">Pending</div>
                <div className="text-lg font-semibold text-yellow-600">
                  {custodyTimeline.filter(e => !e.isVerified).length}
                </div>
              </div>
              <div>
                <div className="font-medium text-muted-foreground">Chain Length</div>
                <div className="text-lg font-semibold">
                  {custodyTimeline.length > 0 ? 
                    Math.round((new Date(custodyTimeline[custodyTimeline.length - 1].transferredAt).getTime() - 
                               new Date(custodyTimeline[0].transferredAt).getTime()) / (1000 * 60 * 60 * 24)) : 0} days
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

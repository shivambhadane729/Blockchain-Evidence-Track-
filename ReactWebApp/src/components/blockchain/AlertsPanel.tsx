import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  AlertTriangle, 
  Shield, 
  CheckCircle, 
  Clock, 
  RefreshCw,
  Eye,
  X,
  Filter,
  Download
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface Anomaly {
  id: number;
  evidenceId: string;
  type: string;
  severity: 'low' | 'medium' | 'high';
  title: string;
  description: string;
  details: Record<string, any>;
  confidence: number;
  detectedAt: string;
  resolved: boolean;
  resolvedAt?: string;
  resolvedBy?: number;
  resolution?: string;
}

interface AlertsPanelProps {
  evidenceId?: string;
  showAll?: boolean;
  onAnomalyResolve?: (anomalyId: number) => void;
  onRefresh?: () => void;
}

export default function AlertsPanel({ 
  evidenceId, 
  showAll = false, 
  onAnomalyResolve,
  onRefresh 
}: AlertsPanelProps) {
  const [anomalies, setAnomalies] = useState<Anomaly[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [severityFilter, setSeverityFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const { toast } = useToast();
  const { user } = useAuth();

  const fetchAnomalies = async () => {
    try {
      setLoading(true);
      setError(null);

      const url = evidenceId 
        ? `/api/blockchain/evidence/${evidenceId}/anomalies`
        : '/api/admin/anomalies';
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch anomalies: ${response.statusText}`);
      }

      const data = await response.json();
      setAnomalies(data.anomalies || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch anomalies');
      toast({
        title: "Error",
        description: "Failed to load custody anomalies",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchAnomalies();
    setRefreshing(false);
    onRefresh?.();
  };

  const handleResolveAnomaly = async (anomalyId: number) => {
    try {
      const response = await fetch(`/api/admin/anomalies/${anomalyId}/resolve`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          resolvedBy: user?.id,
          resolution: 'Resolved by user action'
        })
      });

      if (!response.ok) {
        throw new Error('Failed to resolve anomaly');
      }

      toast({
        title: "Success",
        description: "Anomaly resolved successfully"
      });

      await fetchAnomalies();
      onAnomalyResolve?.(anomalyId);
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to resolve anomaly",
        variant: "destructive"
      });
    }
  };

  useEffect(() => {
    fetchAnomalies();
  }, [evidenceId]);

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'high':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'medium':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'low':
        return <AlertTriangle className="h-4 w-4 text-blue-500" />;
      default:
        return <AlertTriangle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getAnomalyTypeIcon = (type: string) => {
    switch (type) {
      case 'rapid_transfer':
        return <Clock className="h-4 w-4" />;
      case 'hash_mismatch':
        return <Shield className="h-4 w-4" />;
      case 'circular_transfer':
        return <RefreshCw className="h-4 w-4" />;
      case 'excessive_transfers':
        return <AlertTriangle className="h-4 w-4" />;
      case 'time_gap':
        return <Clock className="h-4 w-4" />;
      case 'location_mismatch':
        return <AlertTriangle className="h-4 w-4" />;
      default:
        return <AlertTriangle className="h-4 w-4" />;
    }
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return {
      date: date.toLocaleDateString(),
      time: date.toLocaleTimeString()
    };
  };

  const canResolveAnomalies = () => {
    if (!user) return false;
    const allowedRoles = ['forensic-lab-manager', 'system-admin', 'judge-magistrate'];
    return allowedRoles.includes(user.role);
  };

  const filteredAnomalies = anomalies.filter(anomaly => {
    const severityMatch = severityFilter === 'all' || anomaly.severity === severityFilter;
    const statusMatch = statusFilter === 'all' || 
      (statusFilter === 'resolved' && anomaly.resolved) ||
      (statusFilter === 'unresolved' && !anomaly.resolved);
    
    return severityMatch && statusMatch;
  });

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Custody Anomalies
          </CardTitle>
          <CardDescription>
            Loading anomaly detection results...
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-start space-x-4 p-4 border rounded-lg">
                <Skeleton className="h-4 w-4 rounded-full mt-1" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-4 w-[200px]" />
                  <Skeleton className="h-4 w-[300px]" />
                  <Skeleton className="h-4 w-[150px]" />
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
            <AlertTriangle className="h-5 w-5" />
            Custody Anomalies
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
              <AlertTriangle className="h-5 w-5" />
              Custody Anomalies
            </CardTitle>
            <CardDescription>
              AI-powered anomaly detection results
              {evidenceId && ` for evidence ${evidenceId}`}
            </CardDescription>
          </div>
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
        </div>
        
        <div className="flex gap-4 mt-4">
          <Select value={severityFilter} onValueChange={setSeverityFilter}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Severity" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Severities</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="low">Low</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="unresolved">Unresolved</SelectItem>
              <SelectItem value="resolved">Resolved</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        {filteredAnomalies.length === 0 ? (
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              {anomalies.length === 0 
                ? "No anomalies detected. Custody chain appears clean."
                : "No anomalies match the current filters."
              }
            </AlertDescription>
          </Alert>
        ) : (
          <div className="space-y-4">
            {filteredAnomalies.map((anomaly) => {
              const { date, time } = formatDateTime(anomaly.detectedAt);
              
              return (
                <div 
                  key={anomaly.id} 
                  className={`p-4 border rounded-lg ${
                    anomaly.resolved 
                      ? 'bg-green-50 border-green-200' 
                      : severityFilter === 'high' && anomaly.severity === 'high'
                      ? 'bg-red-50 border-red-200'
                      : 'bg-white border-gray-200'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3 flex-1">
                      <div className="mt-1">
                        {getAnomalyTypeIcon(anomaly.type)}
                      </div>
                      
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium">{anomaly.title}</h4>
                          <Badge className={getSeverityColor(anomaly.severity)}>
                            {anomaly.severity.toUpperCase()}
                          </Badge>
                          {anomaly.resolved && (
                            <Badge variant="default" className="bg-green-100 text-green-800 border-green-200">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Resolved
                            </Badge>
                          )}
                        </div>
                        
                        <p className="text-sm text-muted-foreground">
                          {anomaly.description}
                        </p>
                        
                        <div className="text-xs text-muted-foreground">
                          <div>Evidence ID: {anomaly.evidenceId}</div>
                          <div>Detected: {date} at {time}</div>
                          <div>Confidence: {Math.round(anomaly.confidence * 100)}%</div>
                          {anomaly.resolved && anomaly.resolvedAt && (
                            <div>Resolved: {formatDateTime(anomaly.resolvedAt).date}</div>
                          )}
                        </div>
                        
                        {anomaly.details && Object.keys(anomaly.details).length > 0 && (
                          <details className="text-xs">
                            <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                              View Details
                            </summary>
                            <div className="mt-2 p-2 bg-muted/50 rounded text-xs font-mono">
                              <pre>{JSON.stringify(anomaly.details, null, 2)}</pre>
                            </div>
                          </details>
                        )}
                      </div>
                    </div>
                    
                    {!anomaly.resolved && canResolveAnomalies() && (
                      <Button
                        onClick={() => handleResolveAnomaly(anomaly.id)}
                        variant="outline"
                        size="sm"
                        className="ml-4"
                      >
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Resolve
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
        
        {anomalies.length > 0 && (
          <div className="mt-6 p-4 bg-muted/50 rounded-lg">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <div className="font-medium text-muted-foreground">Total Anomalies</div>
                <div className="text-lg font-semibold">{anomalies.length}</div>
              </div>
              <div>
                <div className="font-medium text-muted-foreground">High Risk</div>
                <div className="text-lg font-semibold text-red-600">
                  {anomalies.filter(a => a.severity === 'high').length}
                </div>
              </div>
              <div>
                <div className="font-medium text-muted-foreground">Unresolved</div>
                <div className="text-lg font-semibold text-yellow-600">
                  {anomalies.filter(a => !a.resolved).length}
                </div>
              </div>
              <div>
                <div className="font-medium text-muted-foreground">Resolved</div>
                <div className="text-lg font-semibold text-green-600">
                  {anomalies.filter(a => a.resolved).length}
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Updated Frontend Components for NDEP Blockchain Integration
// These components integrate with the real Hyperledger Fabric network

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

// Types for blockchain data
interface BlockchainEvidence {
    evidenceId: string;
    caseId: string;
    fileName: string;
    fileHash: string;
    fileSize: number;
    mimeType: string;
    uploadedBy: string;
    uploadedAt: string;
    status: 'ACTIVE' | 'ARCHIVED' | 'DESTROYED';
    custodyChain: CustodyTransfer[];
    metadata: {
        description: string;
        location: string;
        collectedBy: string;
        collectedAt: string;
    };
    lastModified: string;
    version: number;
}

interface CustodyTransfer {
    from: string;
    to: string;
    transferredAt: string;
    reason: string;
    hash: string;
    transactionId: string;
}

interface IntegrityResult {
    evidenceId: string;
    providedHash: string;
    storedHash: string;
    isIntegrityValid: boolean;
    verifiedAt: string;
    verifiedBy: string;
    transactionId: string;
}

// Blockchain Dashboard Component
export const BlockchainDashboard: React.FC = () => {
    const [evidence, setEvidence] = useState<BlockchainEvidence[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [networkStatus, setNetworkStatus] = useState<any>(null);

    useEffect(() => {
        fetchNetworkStatus();
        fetchBlockchainEvidence();
    }, []);

    const fetchNetworkStatus = async () => {
        try {
            const response = await fetch('/api/blockchain/status', {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            const data = await response.json();
            setNetworkStatus(data.data);
        } catch (error) {
            console.error('Error fetching network status:', error);
        }
    };

    const fetchBlockchainEvidence = async () => {
        try {
            const response = await fetch('/api/blockchain/evidence', {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            const data = await response.json();
            setEvidence(data.data);
        } catch (error) {
            console.error('Error fetching blockchain evidence:', error);
            setError('Failed to fetch blockchain evidence');
        } finally {
            setLoading(false);
        }
    };

    const verifyIntegrity = async (evidenceId: string, fileHash: string) => {
        try {
            const response = await fetch(`/api/blockchain/evidence/${evidenceId}/verify`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({ providedHash: fileHash })
            });
            const result = await response.json();
            
            if (result.success) {
                alert(`Integrity verification: ${result.data.isIntegrityValid ? 'PASSED ✅' : 'FAILED ❌'}`);
            } else {
                alert('Integrity verification failed');
            }
        } catch (error) {
            console.error('Error verifying integrity:', error);
            alert('Error verifying integrity');
        }
    };

    const transferCustody = async (evidenceId: string, toUser: string, reason: string) => {
        try {
            const response = await fetch(`/api/blockchain/evidence/${evidenceId}/transfer`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({ toUser, reason })
            });
            const result = await response.json();
            
            if (result.success) {
                alert('Custody transferred successfully');
                fetchBlockchainEvidence(); // Refresh data
            } else {
                alert('Custody transfer failed');
            }
        } catch (error) {
            console.error('Error transferring custody:', error);
            alert('Error transferring custody');
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-2 text-gray-600">Loading blockchain data...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Network Status */}
            <Card>
                <CardHeader>
                    <CardTitle>Blockchain Network Status</CardTitle>
                </CardHeader>
                <CardContent>
                    {networkStatus && (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="text-center">
                                <Badge variant={networkStatus.fabric?.status === 'connected' ? 'default' : 'destructive'}>
                                    {networkStatus.fabric?.status || 'Unknown'}
                                </Badge>
                                <p className="text-sm text-gray-600 mt-1">Network Status</p>
                            </div>
                            <div className="text-center">
                                <Badge variant={networkStatus.initialized ? 'default' : 'destructive'}>
                                    {networkStatus.initialized ? 'Ready' : 'Not Ready'}
                                </Badge>
                                <p className="text-sm text-gray-600 mt-1">Service Status</p>
                            </div>
                            <div className="text-center">
                                <p className="text-sm text-gray-600">
                                    {new Date(networkStatus.timestamp).toLocaleString()}
                                </p>
                                <p className="text-sm text-gray-600 mt-1">Last Updated</p>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Evidence List */}
            <Card>
                <CardHeader>
                    <CardTitle>Blockchain Evidence ({evidence.length})</CardTitle>
                </CardHeader>
                <CardContent>
                    {error && (
                        <Alert className="mb-4">
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    )}
                    
                    <div className="grid gap-4">
                        {evidence.map((item) => (
                            <EvidenceCard
                                key={item.evidenceId}
                                evidence={item}
                                onVerifyIntegrity={verifyIntegrity}
                                onTransferCustody={transferCustody}
                            />
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

// Individual Evidence Card Component
const EvidenceCard: React.FC<{
    evidence: BlockchainEvidence;
    onVerifyIntegrity: (evidenceId: string, fileHash: string) => void;
    onTransferCustody: (evidenceId: string, toUser: string, reason: string) => void;
}> = ({ evidence, onVerifyIntegrity, onTransferCustody }) => {
    const [showTransferForm, setShowTransferForm] = useState(false);
    const [transferData, setTransferData] = useState({ toUser: '', reason: '' });

    const handleTransfer = () => {
        if (transferData.toUser && transferData.reason) {
            onTransferCustody(evidence.evidenceId, transferData.toUser, transferData.reason);
            setTransferData({ toUser: '', reason: '' });
            setShowTransferForm(false);
        }
    };

    return (
        <div className="border rounded-lg p-4 space-y-4">
            <div className="flex justify-between items-start">
                <div className="flex-1">
                    <h3 className="font-semibold text-lg">{evidence.fileName}</h3>
                    <p className="text-sm text-gray-600">Case: {evidence.caseId}</p>
                    <p className="text-xs text-gray-500 font-mono">Hash: {evidence.fileHash}</p>
                    <p className="text-xs text-gray-500">
                        Size: {(evidence.fileSize / 1024).toFixed(2)} KB | 
                        Type: {evidence.mimeType} | 
                        Version: {evidence.version}
                    </p>
                </div>
                <Badge variant={evidence.status === 'ACTIVE' ? 'default' : 'secondary'}>
                    {evidence.status}
                </Badge>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <h4 className="text-sm font-medium mb-2">Metadata</h4>
                    <div className="text-xs text-gray-600 space-y-1">
                        <p><strong>Description:</strong> {evidence.metadata.description}</p>
                        <p><strong>Location:</strong> {evidence.metadata.location}</p>
                        <p><strong>Collected by:</strong> {evidence.metadata.collectedBy}</p>
                        <p><strong>Uploaded by:</strong> {evidence.uploadedBy}</p>
                        <p><strong>Uploaded at:</strong> {new Date(evidence.uploadedAt).toLocaleString()}</p>
                    </div>
                </div>

                <div>
                    <h4 className="text-sm font-medium mb-2">Custody Chain ({evidence.custodyChain.length} transfers)</h4>
                    <div className="max-h-32 overflow-y-auto space-y-1">
                        {evidence.custodyChain.map((transfer, index) => (
                            <div key={index} className="text-xs text-gray-600 border-l-2 border-blue-200 pl-2">
                                <p><strong>{transfer.from}</strong> → <strong>{transfer.to}</strong></p>
                                <p className="text-gray-500">{transfer.reason}</p>
                                <p className="text-gray-400">{new Date(transfer.transferredAt).toLocaleString()}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <div className="flex gap-2 flex-wrap">
                <Button
                    size="sm"
                    onClick={() => onVerifyIntegrity(evidence.evidenceId, evidence.fileHash)}
                >
                    Verify Integrity
                </Button>
                <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setShowTransferForm(!showTransferForm)}
                >
                    Transfer Custody
                </Button>
            </div>

            {showTransferForm && (
                <div className="border-t pt-4 space-y-3">
                    <div>
                        <Label htmlFor="toUser">Transfer to:</Label>
                        <Input
                            id="toUser"
                            value={transferData.toUser}
                            onChange={(e) => setTransferData({ ...transferData, toUser: e.target.value })}
                            placeholder="e.g., forensic.analyst1"
                        />
                    </div>
                    <div>
                        <Label htmlFor="reason">Reason:</Label>
                        <Textarea
                            id="reason"
                            value={transferData.reason}
                            onChange={(e) => setTransferData({ ...transferData, reason: e.target.value })}
                            placeholder="Reason for custody transfer"
                        />
                    </div>
                    <div className="flex gap-2">
                        <Button size="sm" onClick={handleTransfer}>
                            Confirm Transfer
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => setShowTransferForm(false)}>
                            Cancel
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
};

// Blockchain Explorer Component
export const BlockchainExplorer: React.FC = () => {
    const [explorerData, setExplorerData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchExplorerData();
    }, []);

    const fetchExplorerData = async () => {
        try {
            const response = await fetch('/api/blockchain/explorer', {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            const data = await response.json();
            setExplorerData(data.data);
        } catch (error) {
            console.error('Error fetching explorer data:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return <div>Loading blockchain explorer...</div>;
    }

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Blockchain Statistics</CardTitle>
                </CardHeader>
                <CardContent>
                    {explorerData?.statistics && (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="text-center">
                                <div className="text-2xl font-bold text-blue-600">
                                    {explorerData.statistics.totalEvidence}
                                </div>
                                <p className="text-sm text-gray-600">Total Evidence</p>
                            </div>
                            <div className="text-center">
                                <div className="text-2xl font-bold text-green-600">
                                    {explorerData.statistics.activeEvidence}
                                </div>
                                <p className="text-sm text-gray-600">Active</p>
                            </div>
                            <div className="text-center">
                                <div className="text-2xl font-bold text-yellow-600">
                                    {explorerData.statistics.archivedEvidence}
                                </div>
                                <p className="text-sm text-gray-600">Archived</p>
                            </div>
                            <div className="text-center">
                                <div className="text-2xl font-bold text-red-600">
                                    {explorerData.statistics.destroyedEvidence}
                                </div>
                                <p className="text-sm text-gray-600">Destroyed</p>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Organizations</CardTitle>
                </CardHeader>
                <CardContent>
                    {explorerData?.statistics?.organizations && (
                        <div className="flex flex-wrap gap-2">
                            {explorerData.statistics.organizations.map((org: string) => (
                                <Badge key={org} variant="outline">{org}</Badge>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
};

// Evidence Upload Component
export const EvidenceUpload: React.FC = () => {
    const [formData, setFormData] = useState({
        evidenceId: '',
        caseId: '',
        fileName: '',
        fileHash: '',
        fileSize: '',
        mimeType: '',
        description: '',
        location: '',
        collectedBy: ''
    });
    const [uploading, setUploading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setUploading(true);

        try {
            const response = await fetch('/api/blockchain/evidence/upload', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify(formData)
            });

            const result = await response.json();
            
            if (result.success) {
                alert('Evidence uploaded and registered on blockchain successfully!');
                setFormData({
                    evidenceId: '',
                    caseId: '',
                    fileName: '',
                    fileHash: '',
                    fileSize: '',
                    mimeType: '',
                    description: '',
                    location: '',
                    collectedBy: ''
                });
            } else {
                alert('Upload failed: ' + result.message);
            }
        } catch (error) {
            console.error('Upload error:', error);
            alert('Upload failed');
        } finally {
            setUploading(false);
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Upload Evidence to Blockchain</CardTitle>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <Label htmlFor="evidenceId">Evidence ID</Label>
                            <Input
                                id="evidenceId"
                                value={formData.evidenceId}
                                onChange={(e) => setFormData({ ...formData, evidenceId: e.target.value })}
                                required
                            />
                        </div>
                        <div>
                            <Label htmlFor="caseId">Case ID</Label>
                            <Input
                                id="caseId"
                                value={formData.caseId}
                                onChange={(e) => setFormData({ ...formData, caseId: e.target.value })}
                                required
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <Label htmlFor="fileName">File Name</Label>
                            <Input
                                id="fileName"
                                value={formData.fileName}
                                onChange={(e) => setFormData({ ...formData, fileName: e.target.value })}
                                required
                            />
                        </div>
                        <div>
                            <Label htmlFor="fileHash">File Hash (SHA-256)</Label>
                            <Input
                                id="fileHash"
                                value={formData.fileHash}
                                onChange={(e) => setFormData({ ...formData, fileHash: e.target.value })}
                                required
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <Label htmlFor="fileSize">File Size (bytes)</Label>
                            <Input
                                id="fileSize"
                                type="number"
                                value={formData.fileSize}
                                onChange={(e) => setFormData({ ...formData, fileSize: e.target.value })}
                                required
                            />
                        </div>
                        <div>
                            <Label htmlFor="mimeType">MIME Type</Label>
                            <Select value={formData.mimeType} onValueChange={(value) => setFormData({ ...formData, mimeType: value })}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select MIME type" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="application/pdf">PDF Document</SelectItem>
                                    <SelectItem value="image/jpeg">JPEG Image</SelectItem>
                                    <SelectItem value="image/png">PNG Image</SelectItem>
                                    <SelectItem value="video/mp4">MP4 Video</SelectItem>
                                    <SelectItem value="audio/mp3">MP3 Audio</SelectItem>
                                    <SelectItem value="text/plain">Text File</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div>
                        <Label htmlFor="description">Description</Label>
                        <Textarea
                            id="description"
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            required
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <Label htmlFor="location">Location</Label>
                            <Input
                                id="location"
                                value={formData.location}
                                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                                required
                            />
                        </div>
                        <div>
                            <Label htmlFor="collectedBy">Collected By</Label>
                            <Input
                                id="collectedBy"
                                value={formData.collectedBy}
                                onChange={(e) => setFormData({ ...formData, collectedBy: e.target.value })}
                                required
                            />
                        </div>
                    </div>

                    <Button type="submit" disabled={uploading} className="w-full">
                        {uploading ? 'Uploading to Blockchain...' : 'Upload to Blockchain'}
                    </Button>
                </form>
            </CardContent>
        </Card>
    );
};

// Main Blockchain Tab Component
export const BlockchainTabs: React.FC = () => {
    return (
        <Tabs defaultValue="dashboard" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
                <TabsTrigger value="explorer">Explorer</TabsTrigger>
                <TabsTrigger value="upload">Upload</TabsTrigger>
                <TabsTrigger value="settings">Settings</TabsTrigger>
            </TabsList>
            
            <TabsContent value="dashboard">
                <BlockchainDashboard />
            </TabsContent>
            
            <TabsContent value="explorer">
                <BlockchainExplorer />
            </TabsContent>
            
            <TabsContent value="upload">
                <EvidenceUpload />
            </TabsContent>
            
            <TabsContent value="settings">
                <Card>
                    <CardHeader>
                        <CardTitle>Blockchain Settings</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-gray-600">Blockchain configuration and settings will be available here.</p>
                    </CardContent>
                </Card>
            </TabsContent>
        </Tabs>
    );
};

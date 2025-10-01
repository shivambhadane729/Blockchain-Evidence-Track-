// Updated Frontend Components with IPFS Integration for NDEP
// This file contains React components that work with IPFS storage

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Badge } from './ui/badge';
import { Alert, AlertDescription } from './ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { 
    Upload, 
    Download, 
    Shield, 
    Eye, 
    Link, 
    CheckCircle, 
    XCircle, 
    AlertTriangle,
    FileText,
    Image,
    Video,
    Archive
} from 'lucide-react';

// IPFS Evidence Upload Component
export const IPFSEvidenceUpload: React.FC = () => {
    const [file, setFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);
    const [uploadResult, setUploadResult] = useState<any>(null);
    const [formData, setFormData] = useState({
        evidenceId: '',
        caseId: '',
        description: '',
        location: '',
        collectedBy: ''
    });

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!file) return;

        setUploading(true);
        try {
            const formDataToSend = new FormData();
            formDataToSend.append('evidenceFile', file);
            formDataToSend.append('evidenceId', formData.evidenceId);
            formDataToSend.append('caseId', formData.caseId);
            formDataToSend.append('description', formData.description);
            formDataToSend.append('location', formData.location);
            formDataToSend.append('collectedBy', formData.collectedBy);

            const response = await fetch('/api/blockchain/evidence/upload', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: formDataToSend
            });

            const result = await response.json();
            if (result.success) {
                setUploadResult(result.data);
            } else {
                throw new Error(result.message);
            }
        } catch (error) {
            console.error('Upload error:', error);
            alert('Upload failed: ' + error.message);
        } finally {
            setUploading(false);
        }
    };

    const getFileIcon = (mimeType: string) => {
        if (mimeType.startsWith('image/')) return <Image className="h-4 w-4" />;
        if (mimeType.startsWith('video/')) return <Video className="h-4 w-4" />;
        if (mimeType.includes('pdf')) return <FileText className="h-4 w-4" />;
        if (mimeType.includes('zip') || mimeType.includes('rar')) return <Archive className="h-4 w-4" />;
        return <FileText className="h-4 w-4" />;
    };

    return (
        <Card className="w-full max-w-2xl mx-auto">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Upload className="h-5 w-5" />
                    Upload Evidence to IPFS
                </CardTitle>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label htmlFor="evidenceId">Evidence ID</Label>
                            <Input
                                id="evidenceId"
                                value={formData.evidenceId}
                                onChange={(e) => setFormData({...formData, evidenceId: e.target.value})}
                                placeholder="EVD-001"
                                required
                            />
                        </div>
                        <div>
                            <Label htmlFor="caseId">Case ID</Label>
                            <Input
                                id="caseId"
                                value={formData.caseId}
                                onChange={(e) => setFormData({...formData, caseId: e.target.value})}
                                placeholder="CASE-001"
                                required
                            />
                        </div>
                    </div>

                    <div>
                        <Label htmlFor="description">Description</Label>
                        <Textarea
                            id="description"
                            value={formData.description}
                            onChange={(e) => setFormData({...formData, description: e.target.value})}
                            placeholder="Describe the evidence..."
                            required
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label htmlFor="location">Location</Label>
                            <Input
                                id="location"
                                value={formData.location}
                                onChange={(e) => setFormData({...formData, location: e.target.value})}
                                placeholder="Crime Scene A"
                                required
                            />
                        </div>
                        <div>
                            <Label htmlFor="collectedBy">Collected By</Label>
                            <Input
                                id="collectedBy"
                                value={formData.collectedBy}
                                onChange={(e) => setFormData({...formData, collectedBy: e.target.value})}
                                placeholder="Officer John Doe"
                                required
                            />
                        </div>
                    </div>

                    <div>
                        <Label htmlFor="file">Evidence File</Label>
                        <Input
                            id="file"
                            type="file"
                            onChange={handleFileChange}
                            accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.mp4,.avi,.mov,.txt,.zip,.rar"
                            required
                        />
                        {file && (
                            <div className="mt-2 flex items-center gap-2 text-sm text-gray-600">
                                {getFileIcon(file.type)}
                                <span>{file.name}</span>
                                <span>({(file.size / 1024 / 1024).toFixed(2)} MB)</span>
                            </div>
                        )}
                    </div>

                    <Button type="submit" disabled={uploading} className="w-full">
                        {uploading ? 'Uploading to IPFS...' : 'Upload to IPFS & Blockchain'}
                    </Button>
                </form>

                {uploadResult && (
                    <Alert className="mt-4">
                        <CheckCircle className="h-4 w-4" />
                        <AlertDescription>
                            <div className="space-y-2">
                                <p><strong>Evidence ID:</strong> {uploadResult.evidenceId}</p>
                                <p><strong>IPFS Hash:</strong> <code className="text-xs">{uploadResult.ipfsHash}</code></p>
                                <p><strong>File Hash:</strong> <code className="text-xs">{uploadResult.fileHash}</code></p>
                                <p><strong>IPFS URL:</strong> 
                                    <a href={uploadResult.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline ml-1">
                                        View File
                                    </a>
                                </p>
                            </div>
                        </AlertDescription>
                    </Alert>
                )}
            </CardContent>
        </Card>
    );
};

// IPFS Evidence Viewer Component
export const IPFSEvidenceViewer: React.FC<{ evidenceId: string }> = ({ evidenceId }) => {
    const [evidence, setEvidence] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchEvidence();
    }, [evidenceId]);

    const fetchEvidence = async () => {
        try {
            const response = await fetch(`/api/blockchain/evidence/${evidenceId}`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            const result = await response.json();
            if (result.success) {
                setEvidence(result.data);
            } else {
                throw new Error(result.message);
            }
        } catch (error) {
            setError(error.message);
        } finally {
            setLoading(false);
        }
    };

    const downloadFile = async () => {
        try {
            const response = await fetch(`/api/blockchain/evidence/${evidenceId}/file`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            if (response.ok) {
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = evidence.evidence.fileName;
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
                document.body.removeChild(a);
            }
        } catch (error) {
            console.error('Download error:', error);
        }
    };

    if (loading) return <div>Loading evidence...</div>;
    if (error) return <div className="text-red-600">Error: {error}</div>;
    if (!evidence) return <div>Evidence not found</div>;

    return (
        <Card className="w-full">
            <CardHeader>
                <CardTitle className="flex items-center justify-between">
                    <span>Evidence Details</span>
                    <Badge variant="outline" className="flex items-center gap-1">
                        <Link className="h-3 w-3" />
                        IPFS Storage
                    </Badge>
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <Label>Evidence ID</Label>
                        <p className="font-mono text-sm">{evidence.evidence.evidenceId}</p>
                    </div>
                    <div>
                        <Label>Case ID</Label>
                        <p className="font-mono text-sm">{evidence.evidence.caseId}</p>
                    </div>
                </div>

                <div>
                    <Label>File Name</Label>
                    <p className="flex items-center gap-2">
                        {getFileIcon(evidence.evidence.mimeType)}
                        {evidence.evidence.fileName}
                    </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <Label>File Size</Label>
                        <p>{(evidence.fileSize / 1024 / 1024).toFixed(2)} MB</p>
                    </div>
                    <div>
                        <Label>MIME Type</Label>
                        <p>{evidence.evidence.mimeType}</p>
                    </div>
                </div>

                <div>
                    <Label>IPFS Hash</Label>
                    <p className="font-mono text-xs break-all">{evidence.evidence.ipfsHash}</p>
                </div>

                <div>
                    <Label>File Hash (SHA-256)</Label>
                    <p className="font-mono text-xs break-all">{evidence.evidence.fileHash}</p>
                </div>

                <div>
                    <Label>IPFS URL</Label>
                    <a 
                        href={evidence.evidence.metadata.ipfsUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline text-sm break-all"
                    >
                        {evidence.evidence.metadata.ipfsUrl}
                    </a>
                </div>

                <div className="flex gap-2">
                    <Button onClick={downloadFile} variant="outline" size="sm">
                        <Download className="h-4 w-4 mr-2" />
                        Download File
                    </Button>
                    <Button variant="outline" size="sm">
                        <Eye className="h-4 w-4 mr-2" />
                        View File
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
};

// IPFS Integrity Verification Component
export const IPFSIntegrityVerification: React.FC<{ evidenceId: string }> = ({ evidenceId }) => {
    const [verificationResult, setVerificationResult] = useState<any>(null);
    const [verifying, setVerifying] = useState(false);
    const [fileHash, setFileHash] = useState('');

    const verifyIntegrity = async () => {
        if (!fileHash) return;

        setVerifying(true);
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
                setVerificationResult(result.data);
            } else {
                throw new Error(result.message);
            }
        } catch (error) {
            console.error('Verification error:', error);
            alert('Verification failed: ' + error.message);
        } finally {
            setVerifying(false);
        }
    };

    return (
        <Card className="w-full">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    IPFS Integrity Verification
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div>
                    <Label htmlFor="fileHash">File Hash (SHA-256)</Label>
                    <Input
                        id="fileHash"
                        value={fileHash}
                        onChange={(e) => setFileHash(e.target.value)}
                        placeholder="Enter SHA-256 hash to verify..."
                        className="font-mono text-sm"
                    />
                </div>

                <Button 
                    onClick={verifyIntegrity} 
                    disabled={verifying || !fileHash}
                    className="w-full"
                >
                    {verifying ? 'Verifying...' : 'Verify Integrity'}
                </Button>

                {verificationResult && (
                    <Alert className={verificationResult.isIntegrityValid ? 'border-green-500' : 'border-red-500'}>
                        {verificationResult.isIntegrityValid ? (
                            <CheckCircle className="h-4 w-4 text-green-600" />
                        ) : (
                            <XCircle className="h-4 w-4 text-red-600" />
                        )}
                        <AlertDescription>
                            <div className="space-y-2">
                                <p className="font-semibold">
                                    {verificationResult.isIntegrityValid ? 'Integrity Verified' : 'Integrity Failed'}
                                </p>
                                <p><strong>Provided Hash:</strong> <code className="text-xs">{verificationResult.providedHash}</code></p>
                                <p><strong>Stored Hash:</strong> <code className="text-xs">{verificationResult.storedHash}</code></p>
                                <p><strong>IPFS Hash:</strong> <code className="text-xs">{verificationResult.ipfsHash}</code></p>
                                <p><strong>Verified At:</strong> {new Date(verificationResult.verifiedAt).toLocaleString()}</p>
                                <p><strong>Verified By:</strong> {verificationResult.verifiedBy}</p>
                            </div>
                        </AlertDescription>
                    </Alert>
                )}
            </CardContent>
        </Card>
    );
};

// IPFS Custody Timeline Component
export const IPFSCustodyTimeline: React.FC<{ evidenceId: string }> = ({ evidenceId }) => {
    const [custodyChain, setCustodyChain] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchCustodyChain();
    }, [evidenceId]);

    const fetchCustodyChain = async () => {
        try {
            const response = await fetch(`/api/blockchain/evidence/${evidenceId}/custody`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            const result = await response.json();
            if (result.success) {
                setCustodyChain(result.data.custodyChain);
            }
        } catch (error) {
            console.error('Error fetching custody chain:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div>Loading custody timeline...</div>;

    return (
        <Card className="w-full">
            <CardHeader>
                <CardTitle>IPFS Custody Timeline</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    {custodyChain.map((transfer, index) => (
                        <div key={index} className="flex items-start gap-4 p-4 border rounded-lg">
                            <div className="flex-shrink-0">
                                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                                    <span className="text-blue-600 font-semibold text-sm">{index + 1}</span>
                                </div>
                            </div>
                            <div className="flex-1 space-y-2">
                                <div className="flex items-center justify-between">
                                    <h4 className="font-semibold">
                                        {transfer.from} → {transfer.to}
                                    </h4>
                                    <Badge variant="outline">
                                        {transfer.status || 'COMPLETED'}
                                    </Badge>
                                </div>
                                <p className="text-sm text-gray-600">{transfer.reason}</p>
                                <div className="text-xs text-gray-500">
                                    <p>Transferred: {new Date(transfer.transferredAt).toLocaleString()}</p>
                                    {transfer.ipfsHash && (
                                        <p>IPFS Hash: <code className="text-xs">{transfer.ipfsHash}</code></p>
                                    )}
                                    {transfer.hash && (
                                        <p>File Hash: <code className="text-xs">{transfer.hash}</code></p>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
};

// IPFS Dashboard Component
export const IPFSDashboard: React.FC = () => {
    const [serviceStatus, setServiceStatus] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchServiceStatus();
    }, []);

    const fetchServiceStatus = async () => {
        try {
            const response = await fetch('/api/blockchain/status', {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            const result = await response.json();
            if (result.success) {
                setServiceStatus(result.data);
            }
        } catch (error) {
            console.error('Error fetching service status:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div>Loading service status...</div>;

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>IPFS + Blockchain Service Status</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label>Fabric Status</Label>
                            <div className="flex items-center gap-2">
                                {serviceStatus?.fabric?.status === 'connected' ? (
                                    <CheckCircle className="h-4 w-4 text-green-600" />
                                ) : (
                                    <XCircle className="h-4 w-4 text-red-600" />
                                )}
                                <span>{serviceStatus?.fabric?.status || 'Unknown'}</span>
                            </div>
                        </div>
                        <div>
                            <Label>IPFS Status</Label>
                            <div className="flex items-center gap-2">
                                {serviceStatus?.ipfs?.status === 'connected' ? (
                                    <CheckCircle className="h-4 w-4 text-green-600" />
                                ) : (
                                    <XCircle className="h-4 w-4 text-red-600" />
                                )}
                                <span>{serviceStatus?.ipfs?.status || 'Unknown'}</span>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Tabs defaultValue="upload" className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="upload">Upload</TabsTrigger>
                    <TabsTrigger value="view">View</TabsTrigger>
                    <TabsTrigger value="verify">Verify</TabsTrigger>
                    <TabsTrigger value="timeline">Timeline</TabsTrigger>
                </TabsList>
                
                <TabsContent value="upload">
                    <IPFSEvidenceUpload />
                </TabsContent>
                
                <TabsContent value="view">
                    <div className="space-y-4">
                        <div>
                            <Label htmlFor="evidenceId">Evidence ID</Label>
                            <Input id="evidenceId" placeholder="EVD-001" />
                        </div>
                        <Button>Load Evidence</Button>
                    </div>
                </TabsContent>
                
                <TabsContent value="verify">
                    <div className="space-y-4">
                        <div>
                            <Label htmlFor="verifyEvidenceId">Evidence ID</Label>
                            <Input id="verifyEvidenceId" placeholder="EVD-001" />
                        </div>
                        <Button>Load for Verification</Button>
                    </div>
                </TabsContent>
                
                <TabsContent value="timeline">
                    <div className="space-y-4">
                        <div>
                            <Label htmlFor="timelineEvidenceId">Evidence ID</Label>
                            <Input id="timelineEvidenceId" placeholder="EVD-001" />
                        </div>
                        <Button>Load Custody Timeline</Button>
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
};

// Helper function to get file icon
const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) return <Image className="h-4 w-4" />;
    if (mimeType.startsWith('video/')) return <Video className="h-4 w-4" />;
    if (mimeType.includes('pdf')) return <FileText className="h-4 w-4" />;
    if (mimeType.includes('zip') || mimeType.includes('rar')) return <Archive className="h-4 w-4" />;
    return <FileText className="h-4 w-4" />;
};

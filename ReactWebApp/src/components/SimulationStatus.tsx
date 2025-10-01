import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Database, Shield, Zap, CheckCircle } from 'lucide-react';

const SimulationStatus: React.FC = () => {
  return (
    <Card className="mb-6 border-green-200 bg-green-50">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-green-800">
          <Zap className="h-5 w-5" />
          NDEP Simulation Mode Active
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <span className="text-sm text-green-700">Mock Data Enabled</span>
          </div>
          <div className="flex items-center gap-2">
            <Database className="h-4 w-4 text-green-600" />
            <span className="text-sm text-green-700">Blockchain Simulation</span>
          </div>
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-green-600" />
            <span className="text-sm text-green-700">All Features Working</span>
          </div>
        </div>
        <div className="mt-3 p-3 bg-green-100 rounded-lg">
          <p className="text-sm text-green-800">
            <strong>Demo Features:</strong> Case registration, evidence upload, blockchain recording, 
            user authentication, admin panel, and all dashboard features are fully functional with realistic mock data.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default SimulationStatus;

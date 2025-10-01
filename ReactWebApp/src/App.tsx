import React from "react";
import "./index.css";

import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import AppLayout from "@/components/app/AppLayout";
import ProtectedRoute from "@/components/app/ProtectedRoute";
import { AuthProvider } from "@/hooks/use-auth";
import Dashboard from "./pages/Dashboard";
import CaseDetails from "./components/cases/CaseDetails";
import CaseInvestigation from "./pages/CaseInvestigation";
import OfficerDashboardPage from "./pages/OfficerDashboardPage";
import SHODashboardPage from "./pages/SHODashboardPage";
import AdminDashboardPage from "./pages/AdminDashboardPage";
import ProsecutorDashboardPage from "./pages/ProsecutorDashboardPage";
import AnalystDashboardPage from "./pages/AnalystDashboardPage";
import JudgeDashboardPage from "./pages/JudgeDashboardPage";
import CustodianDashboardPage from "./pages/CustodianDashboardPage";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter
        future={{
          v7_startTransition: true,
          v7_relativeSplatPath: true
        }}
      >
        <AuthProvider>
          <AppLayout>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
              <Route path="/case/:caseId" element={<ProtectedRoute><CaseDetails /></ProtectedRoute>} />
              <Route path="/investigate/:caseId" element={<ProtectedRoute><CaseInvestigation /></ProtectedRoute>} />
              
              {/* Role-specific dashboard routes with additional security */}
              <Route path="/officer-dashboard" element={<ProtectedRoute><OfficerDashboardPage /></ProtectedRoute>} />
              <Route path="/sho-dashboard" element={<ProtectedRoute><SHODashboardPage /></ProtectedRoute>} />
              <Route path="/admin-dashboard" element={<ProtectedRoute><AdminDashboardPage /></ProtectedRoute>} />
              <Route path="/prosecutor-dashboard" element={<ProtectedRoute><ProsecutorDashboardPage /></ProtectedRoute>} />
              <Route path="/analyst-dashboard" element={<ProtectedRoute><AnalystDashboardPage /></ProtectedRoute>} />
              <Route path="/judge-dashboard" element={<ProtectedRoute><JudgeDashboardPage /></ProtectedRoute>} />
              <Route path="/custodian-dashboard" element={<ProtectedRoute><CustodianDashboardPage /></ProtectedRoute>} />
              
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </AppLayout>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

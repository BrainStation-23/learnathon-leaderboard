
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/context/AuthContext";
import { ConfigProvider } from "@/context/ConfigContext";

import Leaderboard from "./pages/Leaderboard";
import HallOfFame from "./pages/HallOfFame";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Repositories from "./pages/Repositories";
import RepositoryDetails from "./pages/RepositoryDetails";
import Settings from "./pages/Settings";
import DashboardConfig from "./pages/settings/DashboardConfig";
import LeaderboardConfig from "./pages/settings/LeaderboardConfig";
import TechStacksConfig from "./pages/settings/TechStacksConfig";
import RepoFilterConfig from "./pages/settings/RepoFilterConfig";
import RepoPermissionsConfig from "./pages/settings/RepoPermissionsConfig";
import NotFound from "./pages/NotFound";
import Index from "./pages/Index";
import IndividualContributors from "./pages/IndividualContributors";
import AuditLogs from "./pages/AuditLogs";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: 1,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <TooltipProvider>
          <AuthProvider>
            <Toaster />
            <Sonner />
            <ConfigProvider>
              <Routes>
                <Route path="/" element={<Leaderboard />} />
                <Route path="/hall-of-fame" element={<HallOfFame />} />
                <Route path="/individualContributors" element={<IndividualContributors />} />
                <Route path="/login" element={<Login />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/repositories" element={<Repositories />} />
                <Route path="/repositories/:repoId" element={<RepositoryDetails />} />
                <Route path="/settings" element={<Settings />} />
                <Route path="/settings/dashboard" element={<DashboardConfig />} />
                <Route path="/settings/leaderboard" element={<LeaderboardConfig />} />
                <Route path="/settings/tech-stacks" element={<TechStacksConfig />} />
                <Route path="/settings/repo-filter" element={<RepoFilterConfig />} />
                <Route path="/settings/repo-permissions" element={<RepoPermissionsConfig />} />
                <Route path="/audit-logs" element={<AuditLogs />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </ConfigProvider>
          </AuthProvider>
        </TooltipProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;

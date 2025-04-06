
import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useConfig } from "@/context/ConfigContext";
import { useToast } from "@/hooks/use-toast";
import { fetchDashboardData } from "@/services/supabaseService";
import { TeamDashboardData } from "@/types";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

// Import custom hooks
import useOverviewStats from "@/hooks/dashboard/useOverviewStats";

// Import components
import StatsCards from "./overview/StatsCards";
import CommitActivityChart from "./overview/CommitActivityChart";
import IssueDistributionChart from "./overview/IssueDistributionChart";
import DashboardHeader from "./overview/DashboardHeader";
import LoadingState from "./overview/LoadingState";
import AuthRequiredCard from "./overview/AuthRequiredCard";

export default function DashboardOverview() {
  const { config, isConfigured } = useConfig();
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState<TeamDashboardData[]>([]);
  
  // Use custom hook to calculate stats and chart data
  const { stats, chartData } = useOverviewStats(dashboardData);
  
  // Fetch data from Supabase
  const loadData = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const data = await fetchDashboardData();
      setDashboardData(data);
    } catch (error) {
      console.error("Error loading dashboard data:", error);
      toast({
        title: "Error loading data",
        description: "Failed to retrieve dashboard data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Initial data load
  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);
  
  if (!user) {
    return (
      <AuthRequiredCard
        title="Authentication Required"
        description="Please log in to view dashboard data."
      />
    );
  }

  if (!isConfigured) {
    return (
      <AuthRequiredCard
        title="Dashboard Not Configured"
        description="Please configure your GitHub and SonarCloud settings to view the dashboard."
        buttonText="Configure Dashboard"
        buttonLink="/settings"
      />
    );
  }

  if (loading) {
    return <LoadingState />;
  }

  return (
    <div className="space-y-6">
      <DashboardHeader onRefreshClick={loadData} />
      
      <StatsCards stats={stats} />
      
      <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
        <CommitActivityChart commitActivityData={chartData.commitActivityData} />
        <IssueDistributionChart issueDistribution={chartData.issueDistribution} />
      </div>
    </div>
  );
}

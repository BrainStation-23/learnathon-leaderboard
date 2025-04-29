
import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { fetchDashboardOverview, fetchDashboardData } from "@/services/dashboard/optimizedDashboardService";
import { TeamDashboardData } from "@/types";
import { MonthlyContributorData } from "@/services/dashboard/contributorMonthlyService";

export interface DashboardStats {
  repositoryStats: {
    totalRepos: number;
    totalContributors: number;
  };
  contributorDistribution: {
    reposWithOneActiveContributor: number;
    reposWithTwoActiveContributors: number;
    reposWithThreeActiveContributors: number;
    reposWithNoRecentActivity: number;
  };
  activityData: {
    reposWithRecentActivity: number;
    reposWithNoRecentActivity: number;
  };
  filterStats: {
    total: number;
    droppedOut: number;
    noContact: number;
    gotJob: number;
    other: number;
  };
  stackDistribution: Record<string, number>;
  droppedOutByStack: Record<string, number>;
  inactiveByStack: Record<string, number>;
  monthlyContributorData: MonthlyContributorData[];
}

export default function useOptimizedDashboardData() {
  const { user } = useAuth();
  const { toast } = useToast();
  
  // Loading states for each section
  const [isLoading, setIsLoading] = useState(true);
  const [isStatsLoading, setIsStatsLoading] = useState(true);
  const [isContributorStatsLoading, setIsContributorStatsLoading] = useState(true);
  const [isStackDistributionLoading, setIsStackDistributionLoading] = useState(true);
  const [isFilterStatsLoading, setIsFilterStatsLoading] = useState(true);
  const [isMonthlyContributorLoading, setIsMonthlyContributorLoading] = useState(true);
  
  // Data states
  const [dashboardData, setDashboardData] = useState<TeamDashboardData[]>([]);
  const [dashboardStats, setDashboardStats] = useState<DashboardStats>({
    repositoryStats: {
      totalRepos: 0,
      totalContributors: 0
    },
    contributorDistribution: {
      reposWithOneActiveContributor: 0,
      reposWithTwoActiveContributors: 0,
      reposWithThreeActiveContributors: 0,
      reposWithNoRecentActivity: 0
    },
    activityData: {
      reposWithRecentActivity: 0,
      reposWithNoRecentActivity: 0
    },
    filterStats: {
      total: 0,
      droppedOut: 0,
      noContact: 0,
      gotJob: 0,
      other: 0
    },
    stackDistribution: {},
    droppedOutByStack: {},
    inactiveByStack: {},
    monthlyContributorData: []
  });

  // Fetch dashboard overview data
  const loadDashboardOverview = async () => {
    if (!user) return;
    
    try {
      // Set all loading states to true
      setIsStatsLoading(true);
      setIsContributorStatsLoading(true);
      setIsStackDistributionLoading(true);
      setIsFilterStatsLoading(true);
      setIsMonthlyContributorLoading(true);
      
      const overview = await fetchDashboardOverview();
      
      setDashboardStats(overview);
      
      // Update loading states as data comes in
      setIsStatsLoading(false);
      setIsContributorStatsLoading(false);
      setIsStackDistributionLoading(false);
      setIsFilterStatsLoading(false);
      setIsMonthlyContributorLoading(false);
    } catch (error) {
      console.error("Error loading dashboard overview:", error);
      toast({
        title: "Error loading dashboard data",
        description: "Failed to retrieve dashboard overview",
        variant: "destructive",
      });
      
      // Even on error, mark loading as complete
      setIsStatsLoading(false);
      setIsContributorStatsLoading(false);
      setIsStackDistributionLoading(false);
      setIsFilterStatsLoading(false);
      setIsMonthlyContributorLoading(false);
    }
  };
  
  // Load repository data (still needed for other parts)
  const loadDashboardData = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      const data = await fetchDashboardData();
      setDashboardData(data);
    } catch (error) {
      console.error("Error loading dashboard data:", error);
      toast({
        title: "Error loading data",
        description: "Failed to retrieve repository data",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Refresh all dashboard data
  const refreshDashboard = async () => {
    await Promise.all([
      loadDashboardOverview(),
      loadDashboardData()
    ]);
  };

  // Initial data load
  useEffect(() => {
    if (user) {
      loadDashboardOverview();
      loadDashboardData();
    }
  }, [user]);

  return { 
    // Data
    dashboardStats,
    dashboardData,
    
    // Loading states
    isLoading,
    isStatsLoading,
    isContributorStatsLoading,
    isStackDistributionLoading, 
    isFilterStatsLoading,
    isMonthlyContributorLoading,
    
    // Methods
    refreshDashboard,
    loadDashboardOverview,
    loadDashboardData
  };
}


import { useState, useEffect } from "react";
import { TeamDashboardData } from "@/types";
import { getContributorStats, ContributorStats } from "@/services/dashboard/contributorAnalysisService";

export interface Stats {
  totalRepos: number;
  totalContributors: number;
  reposWithOneActiveContributor: number;
  reposWithTwoActiveContributors: number;
  reposWithThreeActiveContributors: number;
  reposWithJobOffer: number;
  reposDroppedOut: number;
  reposWithNoRecentActivity: number;
  stackDistribution: Record<string, number>;
}

export default function useOverviewStats(dashboardData: TeamDashboardData[]) {
  const [stats, setStats] = useState<Stats>({
    totalRepos: 0,
    totalContributors: 0,
    reposWithOneActiveContributor: 0,
    reposWithTwoActiveContributors: 0,
    reposWithThreeActiveContributors: 0,
    reposWithJobOffer: 0,
    reposDroppedOut: 0,
    reposWithNoRecentActivity: 0,
    stackDistribution: {}
  });

  const [isStatsLoading, setIsStatsLoading] = useState(true);
  const [isStackDistributionLoading, setIsStackDistributionLoading] = useState(true);
  
  // Calculate stats when dashboardData changes
  useEffect(() => {
    if (dashboardData.length === 0) return;
    
    setIsStatsLoading(true);
    setIsStackDistributionLoading(true);
    
    // Calculate basic stats
    const totalRepos = dashboardData.length;
    
    // Fetch advanced contributor stats
    getContributorStats(dashboardData)
      .then((contributorStats: ContributorStats) => {
        const newStats = {
          totalRepos,
          totalContributors: contributorStats.activeContributorsCount || 0,
          // Add contributor stats
          reposWithOneActiveContributor: contributorStats.reposWithOneActiveContributor,
          reposWithTwoActiveContributors: contributorStats.reposWithTwoActiveContributors,
          reposWithThreeActiveContributors: contributorStats.reposWithThreeActiveContributors,
          reposWithJobOffer: contributorStats.reposWithJobOffer,
          reposDroppedOut: contributorStats.reposDroppedOut,
          reposWithNoRecentActivity: contributorStats.reposWithNoRecentActivity,
          stackDistribution: contributorStats.stackDistribution
        };
        
        setStats(newStats);
        setIsStatsLoading(false);
        setIsStackDistributionLoading(false);
      })
      .catch(err => {
        console.error("Error getting contributor stats:", err);
        setIsStatsLoading(false);
        setIsStackDistributionLoading(false);
      });
    
  }, [dashboardData]);

  return { 
    stats, 
    isStatsLoading, 
    isStackDistributionLoading 
  };
}


import { useConfig } from "@/context/ConfigContext";
import { useAuth } from "@/context/AuthContext";

// Import optimized hook
import useOptimizedDashboardData from "@/hooks/dashboard/useOptimizedDashboardData";

// Import components
import StatsCards from "./overview/StatsCards";
import DashboardHeader from "./overview/DashboardHeader";
import LoadingState from "./overview/LoadingState";
import AuthRequiredCard from "./overview/AuthRequiredCard";
import ContributorStatsCards from "./overview/ContributorStatsCards";
import StackDistributionTable from "./overview/StackDistributionTable";
import StackDistributionChart from "./overview/StackDistributionChart";
import FilterStatsCard from "./overview/FilterStatsCard";
import MonthlyContributorTable from "./overview/MonthlyContributorTable";
import MonthlyContributorChart from "./overview/MonthlyContributorChart";

// Import skeleton components
import StatsCardSkeleton from "./overview/StatsCardSkeleton";
import ContributorStatsCardSkeleton from "./overview/ContributorStatsCardSkeleton";
import StackDistributionSkeleton from "./overview/StackDistributionSkeleton";
import StackDistributionChartSkeleton from "./overview/StackDistributionChartSkeleton";
import MonthlyContributorSkeleton from "./overview/MonthlyContributorSkeleton";

export default function OptimizedDashboardOverview() {
  const { isConfigured } = useConfig();
  const { user } = useAuth();
  
  // Use our optimized dashboard data hook
  const { 
    dashboardStats,
    isStatsLoading,
    isContributorStatsLoading,
    isStackDistributionLoading,
    isMonthlyContributorLoading,
    refreshDashboard 
  } = useOptimizedDashboardData();
  
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

  // Show complete loading state when everything is loading
  if (
    isStatsLoading && 
    isContributorStatsLoading && 
    isStackDistributionLoading &&
    isMonthlyContributorLoading
  ) {
    return <LoadingState />;
  }

  return (
    <div className="space-y-6">
      <DashboardHeader onRefreshClick={refreshDashboard} />
      
      {/* Stats Cards */}
      {isStatsLoading ? (
        <div className="grid gap-6 grid-cols-1 md:grid-cols-2">
          <StatsCardSkeleton />
          <StatsCardSkeleton />
        </div>
      ) : (
        <StatsCards 
          stats={{
            totalRepos: dashboardStats.repositoryStats.totalRepos,
            totalContributors: dashboardStats.repositoryStats.totalContributors,
            stackDistribution: dashboardStats.stackDistribution,
            reposWithOneActiveContributor: dashboardStats.contributorDistribution.reposWithOneActiveContributor,
            reposWithTwoActiveContributors: dashboardStats.contributorDistribution.reposWithTwoActiveContributors,
            reposWithThreeActiveContributors: dashboardStats.contributorDistribution.reposWithThreeActiveContributors,
            reposWithJobOffer: dashboardStats.filterStats.gotJob,
            reposDroppedOut: dashboardStats.filterStats.droppedOut,
            reposWithNoRecentActivity: dashboardStats.activityData.reposWithNoRecentActivity
          }} 
        />
      )}
      
      {/* Contributor Stats Cards */}
      {isContributorStatsLoading ? (
        <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {Array(6).fill(0).map((_, i) => (
            <ContributorStatsCardSkeleton key={`contrib-skeleton-${i}`} />
          ))}
        </div>
      ) : (
        <ContributorStatsCards 
          reposWithOneActiveContributor={dashboardStats.contributorDistribution.reposWithOneActiveContributor}
          reposWithTwoActiveContributors={dashboardStats.contributorDistribution.reposWithTwoActiveContributors}
          reposWithThreeActiveContributors={dashboardStats.contributorDistribution.reposWithThreeActiveContributors}
          reposWithJobOffer={dashboardStats.filterStats.gotJob}
          reposDroppedOut={dashboardStats.filterStats.droppedOut}
          reposWithNoRecentActivity={dashboardStats.activityData.reposWithNoRecentActivity}
        />
      )}
      
      {/* Monthly Contributor Stats */}
      <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
        {/* Monthly Contributor Chart */}
        {isMonthlyContributorLoading ? (
          <MonthlyContributorSkeleton />
        ) : (
          <MonthlyContributorChart data={dashboardStats.monthlyContributorData || []} />
        )}
        
        {/* Monthly Contributor Table */}
        {isMonthlyContributorLoading ? (
          <MonthlyContributorSkeleton />
        ) : (
          <MonthlyContributorTable data={dashboardStats.monthlyContributorData || []} />
        )}
      </div>
      
      <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
        {/* Stack Distribution Chart */}
        {isStackDistributionLoading ? (
          <StackDistributionChartSkeleton />
        ) : (
          <StackDistributionChart 
            stackDistribution={dashboardStats.stackDistribution}
            droppedOutByStack={dashboardStats.droppedOutByStack}
            inactiveByStack={dashboardStats.inactiveByStack}
          />
        )}
        
        {/* Stack Distribution Table */}
        {isStackDistributionLoading ? (
          <StackDistributionSkeleton />
        ) : (
          <StackDistributionTable 
            distribution={dashboardStats.stackDistribution}
            droppedOutByStack={dashboardStats.droppedOutByStack}
            inactiveByStack={dashboardStats.inactiveByStack}
          />
        )}
      </div>
    </div>
  );
}

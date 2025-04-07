
import { useConfig } from "@/context/ConfigContext";
import { useAuth } from "@/context/AuthContext";

// Import custom hooks
import useOverviewStats from "@/hooks/dashboard/useOverviewStats";
import useDashboardData from "@/hooks/dashboard/useDashboardData";

// Import components
import StatsCards from "./overview/StatsCards";
import CommitActivityHeatMap from "./overview/CommitActivityHeatMap";
import DashboardHeader from "./overview/DashboardHeader";
import LoadingState from "./overview/LoadingState";
import AuthRequiredCard from "./overview/AuthRequiredCard";
import ContributorStatsCards from "./overview/ContributorStatsCards";
import StackDistributionTable from "./overview/StackDistributionTable";

// Import skeleton components
import StatsCardSkeleton from "./overview/StatsCardSkeleton";
import ContributorStatsCardSkeleton from "./overview/ContributorStatsCardSkeleton";
import HeatMapSkeleton from "./overview/HeatMapSkeleton";
import StackDistributionSkeleton from "./overview/StackDistributionSkeleton";

export default function DashboardOverview() {
  const { isConfigured } = useConfig();
  const { user } = useAuth();
  const { loading, dashboardData, loadData } = useDashboardData();
  
  // Use custom hook to calculate stats and chart data
  const { stats, chartData, isStatsLoading, isChartDataLoading } = useOverviewStats(dashboardData);
  
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

  // Show full page loading state only when initially loading data
  if (loading && dashboardData.length === 0) {
    return <LoadingState />;
  }

  return (
    <div className="space-y-6">
      <DashboardHeader onRefreshClick={loadData} />
      
      {isStatsLoading ? (
        <div className="grid gap-6 grid-cols-1 md:grid-cols-2">
          <StatsCardSkeleton />
          <StatsCardSkeleton />
        </div>
      ) : (
        <StatsCards stats={stats} />
      )}
      
      {isStatsLoading ? (
        <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {Array(6).fill(0).map((_, i) => (
            <ContributorStatsCardSkeleton key={`contrib-skeleton-${i}`} />
          ))}
        </div>
      ) : (
        <ContributorStatsCards 
          reposWithOneActiveContributor={stats.reposWithOneActiveContributor}
          reposWithTwoActiveContributors={stats.reposWithTwoActiveContributors}
          reposWithThreeActiveContributors={stats.reposWithThreeActiveContributors}
          reposWithJobOffer={stats.reposWithJobOffer}
          reposDroppedOut={stats.reposDroppedOut}
          reposWithNoRecentActivity={stats.reposWithNoRecentActivity}
        />
      )}
      
      <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
        {isChartDataLoading ? (
          <HeatMapSkeleton />
        ) : (
          <CommitActivityHeatMap monthlyCommitData={chartData.monthlyCommitData} />
        )}
        
        {isStatsLoading ? (
          <StackDistributionSkeleton />
        ) : (
          <StackDistributionTable distribution={stats.stackDistribution} />
        )}
      </div>
    </div>
  );
}

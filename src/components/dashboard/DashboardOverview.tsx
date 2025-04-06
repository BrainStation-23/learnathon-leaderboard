
import { useConfig } from "@/context/ConfigContext";
import { useAuth } from "@/context/AuthContext";

// Import custom hooks
import useOverviewStats from "@/hooks/dashboard/useOverviewStats";
import useDashboardData from "@/hooks/dashboard/useDashboardData";

// Import components
import StatsCards from "./overview/StatsCards";
import CommitActivityChart from "./overview/CommitActivityChart";
import CommitActivityHeatMap from "./overview/CommitActivityHeatMap";
import IssueDistributionChart from "./overview/IssueDistributionChart";
import DashboardHeader from "./overview/DashboardHeader";
import LoadingState from "./overview/LoadingState";
import AuthRequiredCard from "./overview/AuthRequiredCard";
import FilterStatsCard from "./overview/FilterStatsCard";
import ContributorStatsCards from "./overview/ContributorStatsCards";
import StackDistributionTable from "./overview/StackDistributionTable";

export default function DashboardOverview() {
  const { isConfigured } = useConfig();
  const { user } = useAuth();
  const { loading, dashboardData, loadData } = useDashboardData();
  
  // Use custom hook to calculate stats and chart data
  const { stats, chartData } = useOverviewStats(dashboardData);
  
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
      
      <ContributorStatsCards 
        reposWithOneActiveContributor={stats.reposWithOneActiveContributor}
        reposWithTwoActiveContributors={stats.reposWithTwoActiveContributors}
        reposWithThreeActiveContributors={stats.reposWithThreeActiveContributors}
        reposWithJobOffer={stats.reposWithJobOffer}
        reposDroppedOut={stats.reposDroppedOut}
        reposWithNoRecentActivity={stats.reposWithNoRecentActivity}
      />
      
      <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
        <CommitActivityHeatMap monthlyCommitData={chartData.monthlyCommitData} />
        <StackDistributionTable distribution={stats.stackDistribution} />
      </div>
      
      <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
        <IssueDistributionChart issueDistribution={chartData.issueDistribution} />
        <FilterStatsCard />
      </div>
    </div>
  );
}

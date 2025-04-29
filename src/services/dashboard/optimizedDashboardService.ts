
import { logger } from "../logService";
import { fetchRepositoryStats } from "./repositoryStatsService";
import { fetchContributorDistribution } from "./contributorDistributionService";
import { fetchRepositoryActivity } from "./repositoryActivityService";
import { fetchFilterStats } from "./filterStatsService";
import { fetchDetailedStackDistribution } from "./stackDistributionService";
import { fetchDashboardData } from "./repositoryDataService";
import { fetchMonthlyContributorCounts } from "./contributorMonthlyService";

/**
 * Fetches optimized dashboard overview data from database views
 */
export async function fetchDashboardOverview() {
  try {
    const [
      repositoryStats,
      contributorDistribution,
      activityData,
      filterStats,
      stackDistributionData,
      monthlyContributorData
    ] = await Promise.all([
      fetchRepositoryStats(),
      fetchContributorDistribution(),
      fetchRepositoryActivity(),
      fetchFilterStats(),
      fetchDetailedStackDistribution(),
      fetchMonthlyContributorCounts()
    ]);

    return {
      repositoryStats,
      contributorDistribution,
      activityData,
      filterStats,
      ...stackDistributionData,
      monthlyContributorData
    };
  } catch (error) {
    logger.error("Error fetching optimized dashboard data", { error });
    throw error;
  }
}

// Re-export necessary functions for backward compatibility
export { fetchDashboardData } from "./repositoryDataService";

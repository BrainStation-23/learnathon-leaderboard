
import { supabase } from "@/integrations/supabase/client";
import { TeamDashboardData, GitHubContributor } from "@/types";
import { logger } from "../logService";
import { fetchMonthlyContributorCounts, MonthlyContributorData } from "./contributorMonthlyService";

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

// Repository stats response type
interface RepositoryStatsResponse {
  totalrepos: number;
  totalcontributors: number;
}

// Basic repository stats (total repos, contributors)
async function fetchRepositoryStats() {
  try {
    const { data, error } = await supabase
      .rpc('get_repository_stats')
      .single();
    
    if (error) {
      logger.error("Error fetching repository stats", { error });
      return { totalRepos: 0, totalContributors: 0 };
    }
    
    const typedData = data as unknown as RepositoryStatsResponse;
    
    return {
      totalRepos: Number(typedData.totalrepos) || 0,
      totalContributors: Number(typedData.totalcontributors) || 0
    };
  } catch (error) {
    logger.error("Error in fetchRepositoryStats", { error });
    return { totalRepos: 0, totalContributors: 0 };
  }
}

// Contributor distribution response type
interface ContributorDistributionResponse {
  reposwithoneactivecontributor: number;
  reposwithtwoactivecontributors: number; 
  reposwiththreeactivecontributors: number;
  reposwithnorecentactivity: number;
}

// Contributor distribution across repositories - using updated database function
async function fetchContributorDistribution() {
  try {
    const { data, error } = await supabase
      .rpc('get_contributor_distribution')
      .single();
    
    if (error) {
      logger.error("Error fetching contributor distribution", { error });
      return {
        reposWithOneActiveContributor: 0,
        reposWithTwoActiveContributors: 0,
        reposWithThreeActiveContributors: 0,
        reposWithNoRecentActivity: 0
      };
    }
    
    const typedData = data as unknown as ContributorDistributionResponse;
    
    return {
      reposWithOneActiveContributor: Number(typedData.reposwithoneactivecontributor) || 0,
      reposWithTwoActiveContributors: Number(typedData.reposwithtwoactivecontributors) || 0,
      reposWithThreeActiveContributors: Number(typedData.reposwiththreeactivecontributors) || 0,
      reposWithNoRecentActivity: Number(typedData.reposwithnorecentactivity) || 0
    };
  } catch (error) {
    logger.error("Error in fetchContributorDistribution", { error });
    return {
      reposWithOneActiveContributor: 0,
      reposWithTwoActiveContributors: 0,
      reposWithThreeActiveContributors: 0,
      reposWithNoRecentActivity: 0
    };
  }
}

// Repository activity response type
interface RepositoryActivityResponse {
  reposwithrecentactivity: number;
  reposwithnorecentactivity: number;
}

// Repository activity (last commit dates)
async function fetchRepositoryActivity() {
  try {
    const { data, error } = await supabase
      .rpc('get_repository_activity')
      .single();
    
    if (error) {
      logger.error("Error fetching repository activity", { error });
      return { reposWithRecentActivity: 0, reposWithNoRecentActivity: 0 };
    }
    
    const typedData = data as unknown as RepositoryActivityResponse;
    
    return { 
      reposWithRecentActivity: Number(typedData.reposwithrecentactivity) || 0, 
      reposWithNoRecentActivity: Number(typedData.reposwithnorecentactivity) || 0 
    };
  } catch (error) {
    logger.error("Error in fetchRepositoryActivity", { error });
    return { reposWithRecentActivity: 0, reposWithNoRecentActivity: 0 };
  }
}

// Filter stats response type
interface FilterStatsResponse {
  total: number;
  droppedout: number;
  nocontact: number;
  gotjob: number;
  other: number;
}

// Filter stats (dropped out, job offers)
export async function fetchFilterStats() {
  try {
    const { data, error } = await supabase
      .rpc('get_filter_stats')
      .single();
    
    if (error) {
      logger.error("Error fetching filter stats", { error });
      return { 
        total: 0, 
        droppedOut: 0, 
        noContact: 0, 
        gotJob: 0, 
        other: 0 
      };
    }
    
    const typedData = data as unknown as FilterStatsResponse;
    
    return { 
      total: Number(typedData.total) || 0, 
      droppedOut: Number(typedData.droppedout) || 0, 
      noContact: Number(typedData.nocontact) || 0, 
      gotJob: Number(typedData.gotjob) || 0, 
      other: Number(typedData.other) || 0 
    };
  } catch (error) {
    logger.error("Error in fetchFilterStats", { error });
    return { 
      total: 0, 
      droppedOut: 0, 
      noContact: 0, 
      gotJob: 0, 
      other: 0 
    };
  }
}

// Stack distribution response type
interface DetailedStackDistributionItem {
  name: string;
  total_count: number;
  dropped_out_count: number;
  inactive_count: number;
}

// Tech stack distribution with detailed metrics
async function fetchDetailedStackDistribution() {
  try {
    // Fix: Use rpc instead of from for calling a database function
    const { data, error } = await supabase
      .rpc('get_detailed_stack_distribution');
    
    if (error) {
      logger.error("Error fetching detailed stack distribution", { error });
      return {
        stackDistribution: {},
        droppedOutByStack: {},
        inactiveByStack: {}
      };
    }
    
    // Format the data into the expected structure
    const stackDistribution: Record<string, number> = {};
    const droppedOutByStack: Record<string, number> = {};
    const inactiveByStack: Record<string, number> = {};
    
    if (data && Array.isArray(data)) {
      const typedData = data as unknown as DetailedStackDistributionItem[];
      typedData.forEach(item => {
        if (item.name) {
          stackDistribution[item.name] = Number(item.total_count) || 0;
          droppedOutByStack[item.name] = Number(item.dropped_out_count) || 0;
          inactiveByStack[item.name] = Number(item.inactive_count) || 0;
        }
      });
    }
    
    return {
      stackDistribution,
      droppedOutByStack,
      inactiveByStack
    };
  } catch (error) {
    logger.error("Error in fetchDetailedStackDistribution", { error });
    return {
      stackDistribution: {},
      droppedOutByStack: {},
      inactiveByStack: {}
    };
  }
}

// This function is still needed for other parts of the app
export async function fetchDashboardData(): Promise<TeamDashboardData[]> {
  try {
    // Fetch filtered repository IDs first
    const { data: filteredRepoIds, error: filteredRepoError } = await supabase
      .from('filtered_repositories')
      .select('repository_id');
    
    if (filteredRepoError) {
      logger.error("Error fetching filtered repositories:", { error: filteredRepoError });
    }
    
    // Create a set of filtered repository IDs for quick lookup
    const filteredRepositoryIds = new Set(
      filteredRepoIds?.map((item: any) => item.repository_id) || []
    );
    
    // Use our custom function to get repositories with metrics
    const { data: reposData, error: repoError } = await supabase
      .rpc('get_repositories_with_metrics');

    if (repoError) {
      logger.error("Error fetching dashboard data", { error: repoError });
      throw repoError;
    }

    // Filter out repositories that are in the filtered list
    const filteredReposData = reposData.filter(item => 
      !filteredRepositoryIds.has(item.id)
    );

    // Fetch contributors for each repository
    const repos = await Promise.all((filteredReposData || []).map(async (item) => {
      // Get top contributors for this repository
      const { data: contributorRows, error: contribError } = await supabase
        .from('contributors')
        .select('*')
        .eq('repository_id', item.id)
        .order('contributions', { ascending: false })
        .limit(5);
      
      if (contribError) {
        logger.error(`Error fetching contributors for repo ${item.name}`, { error: contribError });
      }

      // Transform contributors data to match the GitHubContributor type
      const contributors: GitHubContributor[] = (contributorRows || []).map(contributor => ({
        id: contributor.github_id,
        login: contributor.login,
        avatar_url: contributor.avatar_url || '',
        contributions: contributor.contributions
      }));
      
      // Transform the data to match our TeamDashboardData type
      return {
        repoData: {
          id: item.id,
          name: item.name,
          full_name: item.name, 
          html_url: item.html_url || "",
          description: item.description || "",
          updated_at: item.updated_at?.toString() || new Date().toISOString(),
          last_commit_date: item.last_commit_date?.toString() || null,
          contributors_count: item.contributors_count || 0,
          commits_count: item.commits_count || 0,
          contributors: contributors
        },
        sonarData: item.sonar_project_key ? {
          project_key: item.sonar_project_key,
          name: item.name,
          metrics: {
            lines_of_code: item.lines_of_code,
            coverage: item.coverage,
            bugs: item.bugs,
            vulnerabilities: item.vulnerabilities,
            code_smells: item.code_smells,
            technical_debt: item.technical_debt,
            complexity: item.complexity
          }
        } : undefined
      };
    }));
    
    return repos;
  } catch (error) {
    logger.error("Error in fetchDashboardData", { error });
    throw error;
  }
}

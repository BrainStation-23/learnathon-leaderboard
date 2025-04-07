
import { supabase } from "@/integrations/supabase/client";
import { TeamDashboardData, GitHubContributor } from "@/types";
import { logger } from "../logService";

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
      stackDistribution,
      monthlyActivity
    ] = await Promise.all([
      fetchRepositoryStats(),
      fetchContributorDistribution(),
      fetchRepositoryActivity(),
      fetchFilterStats(),
      fetchStackDistribution(),
      fetchMonthlyActivity()
    ]);

    return {
      repositoryStats,
      contributorDistribution,
      activityData,
      filterStats,
      stackDistribution,
      monthlyActivity
    };
  } catch (error) {
    logger.error("Error fetching optimized dashboard data", { error });
    throw error;
  }
}

// Basic repository stats (total repos, contributors)
async function fetchRepositoryStats() {
  try {
    const { data, error } = await supabase.rpc('get_repository_stats');
    
    if (error) {
      logger.error("Error fetching repository stats", { error });
      return { totalRepos: 0, totalContributors: 0 };
    }
    
    return data || { totalRepos: 0, totalContributors: 0 };
  } catch (error) {
    logger.error("Error in fetchRepositoryStats", { error });
    return { totalRepos: 0, totalContributors: 0 };
  }
}

// Contributor distribution across repositories
async function fetchContributorDistribution() {
  try {
    const { data, error } = await supabase.rpc('get_contributor_distribution');
    
    if (error) {
      logger.error("Error fetching contributor distribution", { error });
      return {
        reposWithOneActiveContributor: 0,
        reposWithTwoActiveContributors: 0,
        reposWithThreeActiveContributors: 0,
        reposWithNoRecentActivity: 0
      };
    }
    
    return data || {
      reposWithOneActiveContributor: 0,
      reposWithTwoActiveContributors: 0,
      reposWithThreeActiveContributors: 0,
      reposWithNoRecentActivity: 0
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

// Repository activity (last commit dates)
async function fetchRepositoryActivity() {
  try {
    const { data, error } = await supabase.rpc('get_repository_activity');
    
    if (error) {
      logger.error("Error fetching repository activity", { error });
      return { reposWithRecentActivity: 0, reposWithNoRecentActivity: 0 };
    }
    
    return data || { reposWithRecentActivity: 0, reposWithNoRecentActivity: 0 };
  } catch (error) {
    logger.error("Error in fetchRepositoryActivity", { error });
    return { reposWithRecentActivity: 0, reposWithNoRecentActivity: 0 };
  }
}

// Filter stats (dropped out, job offers)
export async function fetchFilterStats() {
  try {
    const { data, error } = await supabase.rpc('get_filter_stats');
    
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
    
    return data || { 
      total: 0, 
      droppedOut: 0, 
      noContact: 0, 
      gotJob: 0, 
      other: 0 
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

// Tech stack distribution
async function fetchStackDistribution() {
  try {
    const { data, error } = await supabase.rpc('get_stack_distribution');
    
    if (error) {
      logger.error("Error fetching stack distribution", { error });
      return {};
    }
    
    // Format the data into the expected structure
    const distribution: Record<string, number> = {};
    
    if (data && Array.isArray(data)) {
      data.forEach(item => {
        if (item.name && item.count) {
          distribution[item.name] = item.count;
        }
      });
    }
    
    return distribution;
  } catch (error) {
    logger.error("Error in fetchStackDistribution", { error });
    return {};
  }
}

// Monthly commit activity
async function fetchMonthlyActivity() {
  try {
    const { data, error } = await supabase.rpc('get_monthly_commit_activity');
    
    if (error) {
      logger.error("Error fetching monthly activity", { error });
      return [];
    }
    
    return (data || []).map(item => ({
      month: item.month,
      commits: item.commit_count
    }));
  } catch (error) {
    logger.error("Error in fetchMonthlyActivity", { error });
    return [];
  }
}

// This function is still needed for other parts of the app
export async function fetchDashboardData(): Promise<TeamDashboardData[]> {
  try {
    // Fetch filtered repository IDs first with type assertion
    const { data: filteredRepoIds, error: filteredRepoError } = await (supabase
      .from('filtered_repositories' as any)
      .select('repository_id'));
    
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
      // Use the any type to bypass TypeScript's type checking for now
      const { data: contributorRows, error: contribError } = await (supabase
        .from('contributors') as any)
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

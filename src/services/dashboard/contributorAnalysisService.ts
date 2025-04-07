
import { supabase } from "@/integrations/supabase/client";
import { TeamDashboardData } from "@/types";
import { logger } from "../logService";
import { subMonths, isAfter, parseISO, isBefore } from "date-fns";

export interface ContributorStats {
  reposWithOneActiveContributor: number;
  reposWithTwoActiveContributors: number;
  reposWithThreeActiveContributors: number;
  reposWithJobOffer: number;
  reposDroppedOut: number;
  reposWithNoRecentActivity: number;
  stackDistribution: Record<string, number>;
  activeContributorsCount: number;
}

export async function getContributorStats(repos: TeamDashboardData[]): Promise<ContributorStats> {
  try {
    // Get the filtered contributors list from configurations
    const { data: configData, error: configError } = await supabase
      .from('configurations')
      .select('filtered_contributors')
      .single();
    
    // Initialize stats
    const stats = {
      reposWithOneActiveContributor: 0,
      reposWithTwoActiveContributors: 0,
      reposWithThreeActiveContributors: 0,
      reposWithJobOffer: 0,
      reposDroppedOut: 0, 
      reposWithNoRecentActivity: 0,
      stackDistribution: {} as Record<string, number>,
      activeContributorsCount: 0
    };
    
    // Set of filtered contributor logins
    const filteredLogins = new Set(
      configError ? [] : configData?.filtered_contributors || []
    );
    
    // Get the current date and calculate one month ago
    const now = new Date();
    const oneMonthAgo = subMonths(now, 1);
    
    // Set of all active contributor logins - to count unique contributors
    const allActiveContributors = new Set<string>();
    
    // Process each repository
    for (const repo of repos) {
      // Filter out any contributors in the filtered list
      const activeContributors = (repo.repoData.contributors || [])
        .filter(contributor => !filteredLogins.has(contributor.login.toLowerCase()));
      
      // Count repositories by active contributor count
      const activeCount = activeContributors.length;
      
      if (activeCount === 1) {
        stats.reposWithOneActiveContributor++;
      } else if (activeCount === 2) {
        stats.reposWithTwoActiveContributors++;
      } else if (activeCount >= 3) {
        stats.reposWithThreeActiveContributors++;
      }
      
      // Add active contributors to the overall set
      activeContributors.forEach(contributor => {
        allActiveContributors.add(contributor.login);
      });
      
      // Check if this repository has no recent activity
      const lastCommitDate = repo.repoData.last_commit_date 
        ? parseISO(repo.repoData.last_commit_date)
        : null;
        
      if (!lastCommitDate || isBefore(lastCommitDate, oneMonthAgo)) {
        stats.reposWithNoRecentActivity++;
      }
      
      // Fetch tech stacks for this repository
      await fetchAndCountTechStacks(repo.repoData.id, stats);
    }
    
    // Set total active contributors count
    stats.activeContributorsCount = allActiveContributors.size;
    
    // Fetch repository filter information for job offers and dropped out stats
    const { jobOffers, droppedOut } = await fetchFilteredRepoStats();
    stats.reposWithJobOffer = jobOffers;
    stats.reposDroppedOut = droppedOut;
    
    return stats;
  } catch (error) {
    logger.error("Error in getContributorStats:", { error });
    // Return empty stats on error
    return {
      reposWithOneActiveContributor: 0,
      reposWithTwoActiveContributors: 0,
      reposWithThreeActiveContributors: 0,
      reposWithJobOffer: 0,
      reposDroppedOut: 0,
      reposWithNoRecentActivity: 0,
      stackDistribution: {},
      activeContributorsCount: 0
    };
  }
}

// Helper function to fetch tech stacks for a repository
async function fetchAndCountTechStacks(
  repoId: string | number,
  stats: ContributorStats
): Promise<void> {
  try {
    // Fetch tech stacks associated with this repository
    const { data: techStackData, error: techStackError } = await supabase
      .from('repository_tech_stacks')
      .select(`
        tech_stacks (
          name
        )
      `)
      .eq('repository_id', repoId);

    if (techStackError) {
      logger.error(`Error fetching tech stacks for repo ID ${repoId}`, { error: techStackError });
      return;
    }

    // Count tech stacks
    if (techStackData && techStackData.length > 0) {
      techStackData.forEach((item: any) => {
        if (item.tech_stacks && item.tech_stacks.name) {
          const stack = item.tech_stacks.name;
          stats.stackDistribution[stack] = (stats.stackDistribution[stack] || 0) + 1;
        }
      });
    }
  } catch (error) {
    logger.error(`Error in fetchAndCountTechStacks for repo ID ${repoId}`, { error });
  }
}

// Helper function to count repositories by filter label
async function fetchFilteredRepoStats(): Promise<{
  jobOffers: number;
  droppedOut: number;
}> {
  try {
    // Fetch filtered repositories with their labels
    const { data, error } = await (supabase
      .from('filtered_repositories' as any)
      .select('label'));
    
    if (error) {
      logger.error("Error fetching filtered repositories:", { error });
      return { jobOffers: 0, droppedOut: 0 };
    }
    
    // Count by label
    let jobOffers = 0;
    let droppedOut = 0;
    
    if (data) {
      data.forEach((repo: any) => {
        if (repo.label === 'got-job') jobOffers++;
        if (repo.label === 'dropped-out') droppedOut++;
      });
    }
    
    return { jobOffers, droppedOut };
  } catch (error) {
    logger.error("Error in fetchFilteredRepoStats", { error });
    return { jobOffers: 0, droppedOut: 0 };
  }
}


import { supabase } from "@/integrations/supabase/client";
import { TeamDashboardData } from "@/types";
import { logger } from "../logService";
import { parseISO } from "date-fns";

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
    // Initialize stats with zeros
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
    
    // Get the current date for activity tracking
    const now = new Date();
    
    // Set of all active contributor logins - to count unique contributors
    const allActiveContributors = new Set<string>();
    
    // Fetch the contributor distribution data from the updated database function
    const { data: distributionData, error: distributionError } = await supabase
      .rpc('get_contributor_distribution')
      .single();
    
    if (!distributionError && distributionData) {
      stats.reposWithOneActiveContributor = Number(distributionData.reposwithoneactivecontributor) || 0;
      stats.reposWithTwoActiveContributors = Number(distributionData.reposwithtwoactivecontributors) || 0;
      stats.reposWithThreeActiveContributors = Number(distributionData.reposwiththreeactivecontributors) || 0;
      stats.reposWithNoRecentActivity = Number(distributionData.reposwithnorecentactivity) || 0;
    } else {
      logger.error("Error fetching contributor distribution", { error: distributionError });
    }
    
    // Process repositories to count active contributors
    for (const repo of repos) {
      // Add active contributors to the overall set
      if (repo.repoData.last_commit_date) {
        const lastCommitDate = parseISO(repo.repoData.last_commit_date);
        const isRecentlyActive = lastCommitDate && (now.getTime() - lastCommitDate.getTime() < 30 * 24 * 60 * 60 * 1000);
        
        if (isRecentlyActive && repo.repoData.contributors) {
          repo.repoData.contributors.forEach(contributor => {
            allActiveContributors.add(contributor.login);
          });
        }
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
      .eq('repository_id', repoId.toString());

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
    const { data, error } = await supabase
      .from('filtered_repositories')
      .select('label');
    
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

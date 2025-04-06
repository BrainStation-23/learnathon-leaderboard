
import { supabase } from "@/integrations/supabase/client";
import { TeamDashboardData } from "@/types";
import { logger } from "../logService";

export interface ContributorStats {
  reposWithOneActiveContributor: number;
  reposWithTwoActiveContributors: number;
  reposWithThreeActiveContributors: number;
  reposWithJobOffer: number;
  reposDroppedOut: number;
  reposWithNoRecentActivity: number;
  stackDistribution: Record<string, number>;
}

export async function getContributorStats(
  dashboardData: TeamDashboardData[],
  filteredContributors: string[] = []
): Promise<ContributorStats> {
  try {
    // Initialize stats
    const stats: ContributorStats = {
      reposWithOneActiveContributor: 0,
      reposWithTwoActiveContributors: 0,
      reposWithThreeActiveContributors: 0,
      reposWithJobOffer: 0,
      reposWithNoRecentActivity: 0,
      reposDroppedOut: 0,
      stackDistribution: {}
    };
    
    // Get repository filter data
    const { data: filteredRepos, error: filterError } = await supabase
      .from('filtered_repositories')
      .select('repository_id, label');
      
    if (filterError) {
      logger.error("Error fetching filter data", { error: filterError });
      throw filterError;
    }
    
    // Create maps for easier lookups
    const filterMap = new Map();
    if (filteredRepos) {
      filteredRepos.forEach((repo: any) => {
        filterMap.set(repo.repository_id, repo.label);
      });
    }
    
    // Fetch tech stacks for each repository
    const { data: repoTechStacks, error: techStackError } = await supabase
      .from('repository_tech_stacks')
      .select(`
        repository_id,
        tech_stack:tech_stack_id (id, name)
      `);
    
    if (techStackError) {
      logger.error("Error fetching tech stacks:", { error: techStackError });
    }
    
    // Create tech stacks map
    const techStacksMap: Record<string, string[]> = {};
    if (repoTechStacks) {
      repoTechStacks.forEach((item: any) => {
        if (!techStacksMap[item.repository_id]) {
          techStacksMap[item.repository_id] = [];
        }
        techStacksMap[item.repository_id].push(item.tech_stack.name);
      });
    }

    // Process each repository
    for (const repo of dashboardData) {
      const repoId = repo.repoData.id;
      const contributors = repo.repoData.contributors || [];
      const lastMonth = new Date();
      lastMonth.setMonth(lastMonth.getMonth() - 1);
      
      // Count active contributors (not in filtered list)
      const activeContributors = contributors.filter(
        c => !filteredContributors.includes(c.login)
      );
      
      if (activeContributors.length === 1) {
        stats.reposWithOneActiveContributor++;
      } else if (activeContributors.length === 2) {
        stats.reposWithTwoActiveContributors++;
      } else if (activeContributors.length >= 3) {
        stats.reposWithThreeActiveContributors++;
      }
      
      // Check filter status
      if (filterMap.has(repoId)) {
        const label = filterMap.get(repoId);
        if (label === 'got-job') {
          stats.reposWithJobOffer++;
        } else if (label === 'dropped-out') {
          stats.reposDroppedOut++;
        }
      }
      
      // Check for recent activity
      const lastCommitDate = repo.repoData.updated_at 
        ? new Date(repo.repoData.updated_at) 
        : null;
        
      if (!lastCommitDate || lastCommitDate < lastMonth) {
        stats.reposWithNoRecentActivity++;
      }
      
      // Update stack distribution
      const stacks = techStacksMap[repoId] || [];
      stacks.forEach(stack => {
        if (!stats.stackDistribution[stack]) {
          stats.stackDistribution[stack] = 0;
        }
        stats.stackDistribution[stack]++;
      });
    }
    
    return stats;
  } catch (error) {
    logger.error("Error analyzing contributor stats", { error });
    throw error;
  }
}

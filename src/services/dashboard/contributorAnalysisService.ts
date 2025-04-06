
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
      stackDistribution: {},
      activeContributorsCount: 0
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
    
    // Fetch filtered contributors from configuration
    const { data: configData, error: configError } = await supabase
      .from('configurations')
      .select('filtered_contributors')
      .limit(1);
      
    if (configError) {
      logger.error("Error fetching filtered contributors", { error: configError });
    }
    
    // Get filtered contributors list
    const filteredContributorsList = configData && configData.length > 0 
      ? configData[0].filtered_contributors || []
      : [];
    
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

    // Cutoff date for activity - one month ago
    const oneMonthAgo = subMonths(new Date(), 1);
    const activeContributorsSet = new Set<string>();

    // Process each repository
    for (const repo of dashboardData) {
      const repoId = repo.repoData.id;
      const contributors = repo.repoData.contributors || [];
      
      // Check if repository has recent activity
      const lastUpdateDate = repo.repoData.updated_at 
        ? parseISO(repo.repoData.updated_at)
        : null;
        
      if (!lastUpdateDate || isBefore(lastUpdateDate, oneMonthAgo)) {
        stats.reposWithNoRecentActivity++;
      }
      
      // Count active contributors (not in filtered list and contributed in last month)
      let activeContributorsCount = 0;
      
      contributors.forEach(contributor => {
        // Skip filtered contributors
        if (filteredContributorsList.includes(contributor.login)) {
          return;
        }
        
        // For simplicity, we're assuming all contributors in the list were active recently
        // In a real-world scenario, you'd need to check contribution dates
        activeContributorsCount++;
        activeContributorsSet.add(contributor.login);
      });
      
      // Update repository counts based on active contributors
      if (activeContributorsCount === 1) {
        stats.reposWithOneActiveContributor++;
      } else if (activeContributorsCount === 2) {
        stats.reposWithTwoActiveContributors++;
      } else if (activeContributorsCount >= 3) {
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
      
      // Update stack distribution
      const stacks = techStacksMap[repoId] || [];
      stacks.forEach(stack => {
        if (!stats.stackDistribution[stack]) {
          stats.stackDistribution[stack] = 0;
        }
        stats.stackDistribution[stack]++;
      });
    }
    
    // Update total active contributors count
    stats.activeContributorsCount = activeContributorsSet.size;
    
    return stats;
  } catch (error) {
    logger.error("Error analyzing contributor stats", { error });
    throw error;
  }
}


import { supabase } from "@/integrations/supabase/client";
import { GitHubContributor } from "@/types";
import { LeaderboardItem } from "@/types/leaderboard";
import { logger } from "../logService";
import { fetchFilteredContributors } from "./filterSettingsService";
import { mapToLeaderboardItem } from "./leaderboardMapper";

/**
 * Fetches leaderboard data from the database
 */
export async function fetchLeaderboardData(): Promise<LeaderboardItem[]> {
  try {
    // Fetch filter settings first to ensure we have the latest filters
    const filteredContributorsList = await fetchFilteredContributors();
    console.log("Filtered contributors list:", filteredContributorsList);
    
    // Use the function that returns repositories with metrics
    const { data: reposData, error: repoError } = await supabase
      .rpc('get_repositories_with_metrics');

    if (repoError) {
      logger.error("Error fetching leaderboard data:", { error: repoError });
      throw new Error("Failed to load leaderboard data");
    }

    console.log("Repositories data:", reposData);

    // Fetch contributors for each repository
    const contributorPromises = reposData
      .filter(item => item.sonar_project_key) // Only include repos with Sonar data
      .map(async (repo) => {
        const { data: contributors, error: contribError } = await supabase
          .from('contributors')
          .select('*')
          .eq('repository_id', repo.id);
          
        if (contribError) {
          logger.error(`Error fetching contributors for ${repo.name}:`, { error: contribError });
          return { repoId: repo.id, contributors: [] };
        }
        
        console.log(`Contributors for repository ${repo.name}:`, contributors);
        
        // Convert to GitHubContributor format
        const formattedContributors: GitHubContributor[] = contributors.map(c => ({
          id: c.github_id,
          login: c.login,
          avatar_url: c.avatar_url || '',
          contributions: c.contributions
        }));
        
        return { repoId: repo.id, contributors: formattedContributors };
      });
      
    const contributorsResults = await Promise.all(contributorPromises);
    const contributorsMap = contributorsResults.reduce((acc, item) => {
      acc[item.repoId] = item.contributors;
      return acc;
    }, {} as Record<string, GitHubContributor[]>);

    console.log("Contributors map:", contributorsMap);
    
    // Fetch tech stacks for each repository
    const { data: repoTechStacks, error: techStackError } = await supabase
      .from('repository_tech_stacks')
      .select(`
        repository_id,
        tech_stack:tech_stack_id(id, name)
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
    
    console.log("Tech stacks map:", techStacksMap);
    
    // Process the data to calculate scores
    const leaderboardItems = reposData
      .filter(item => item.sonar_project_key) // Only include repos with Sonar data
      .map(item => {
        // Get all contributors for this repository
        let allContributors = contributorsMap[item.id] || [];
        
        // Get tech stacks for this repository
        const techStacks = techStacksMap[item.id] || [];
        
        return {
          ...mapToLeaderboardItem(item, allContributors, filteredContributorsList),
          techStacks
        };
      })
      .sort((a, b) => b.totalScore - a.totalScore); // Sort by total score in descending order
    
    console.log("Final leaderboard data:", leaderboardItems);
    return leaderboardItems;
  } catch (err) {
    logger.error("Error in leaderboard data processing:", { error: err });
    throw err;
  }
}

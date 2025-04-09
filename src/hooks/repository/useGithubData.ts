
import { useConfig } from "@/context/ConfigContext";
import { fetchRepositoriesForOrg, fetchRepoDetails } from "@/services/github";
import { saveRepositoryData } from "@/services/repository/repositoryService";
import { logger } from "@/services/logService";
import { ProgressCallback } from "./types";

export async function fetchAndSaveGithubData(
  config: { github_org: string; github_pat: string },
  userId: string,
  progressCallback: ProgressCallback,
  addError: (error: string) => void
) {
  try {
    // 1. Fetch GitHub repositories - 25% of overall progress
    progressCallback('github', 0, 'Fetching repositories from GitHub...');
    
    let repos;
    try {
      repos = await fetchRepositoriesForOrg(
        config.github_org,
        config.github_pat
      );
      progressCallback('github', 25, `Found ${repos.length} repositories`);
      logger.info("GitHub repositories fetched", { count: repos.length }, userId, 'sync');
    } catch (error) {
      logger.error("Failed to fetch repositories from GitHub", { error }, userId, 'sync');
      addError("Failed to fetch repositories from GitHub");
      // Continue with empty repos
      repos = [];
    }

    // 2. Fetch additional GitHub data (contributors, etc.) - 25% -> 50% of overall progress
    let detailedRepos;
    try {
      progressCallback('github', 30, 'Fetching repository details...');
      detailedRepos = await fetchRepoDetails(
        repos,
        config.github_org,
        config.github_pat
      );
      progressCallback('github', 50, `Retrieved details for ${detailedRepos.length} repositories`);
      logger.info("GitHub repository details fetched", { count: detailedRepos.length }, userId, 'sync');
    } catch (error) {
      logger.error("Failed to fetch repository details", { error }, userId, 'sync');
      addError("Failed to fetch repository details from GitHub");
      // Continue with the basic repos data
      detailedRepos = repos;
    }

    // 3. Save GitHub data to Supabase - 50% -> 60% of overall progress
    try {
      progressCallback('github', 55, 'Saving repository data to database...');
      await saveRepositoryData(detailedRepos, userId, (_, progress, message) => {
        // Map internal progress to our overall progress (50-60%)
        const mappedProgress = 50 + progress * 0.1; // 0-100% -> 50-60%
        progressCallback('github', mappedProgress, message);
      });
      progressCallback('github', 60, 'Repository data saved successfully');
    } catch (error) {
      logger.error("Failed to save repository data to database", { error }, userId, 'sync');
      addError("Failed to save repository data to database");
    }
    
    return detailedRepos;
  } catch (error) {
    logger.error("Error in GitHub data processing", { error }, userId, 'sync');
    throw error;
  }
}


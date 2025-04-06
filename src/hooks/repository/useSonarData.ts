
import { fetchSonarCloudData } from "@/services/sonarCloudService";
import { saveSonarData } from "@/services/supabaseService";
import { logger } from "@/services/logService";
import { GitHubRepoData } from "@/types";
import { ProgressCallback } from "./types";

export async function fetchAndSaveSonarData(
  sonarcloudOrg: string,
  detailedRepos: GitHubRepoData[],
  userId: string,
  progressCallback: ProgressCallback,
  addError: (error: string) => void
) {
  try {
    // 1. Fetch SonarCloud data - 60% -> 80% of overall progress
    let sonarDataMap;
    try {
      progressCallback('sonar', 60, 'Fetching SonarCloud data...');
      
      if (!sonarcloudOrg) {
        throw new Error("SonarCloud organization slug not provided");
      }
      
      sonarDataMap = await fetchSonarCloudData(
        sonarcloudOrg,
        detailedRepos
      );
      
      const foundCount = sonarDataMap.size;
      progressCallback('sonar', 80, `Retrieved SonarCloud data for ${foundCount} repositories (${foundCount} out of ${detailedRepos.length} found)`);
      
      if (foundCount === 0) {
        logger.warn("No SonarCloud data found for any repository", { 
          organization: sonarcloudOrg,
          repoCount: detailedRepos.length 
        }, userId, 'sync');
        addError(`No SonarCloud data found. Verify your SonarCloud organization slug (${sonarcloudOrg}) is correct and projects exist.`);
      } else {
        logger.info("SonarCloud data fetched", { count: foundCount }, userId, 'sync');
      }
    } catch (error) {
      logger.error("Failed to fetch SonarCloud data", { error }, userId, 'sync');
      addError(`Failed to fetch SonarCloud data: ${error instanceof Error ? error.message : 'Unknown error'}`);
      // Continue with empty sonar data
      sonarDataMap = new Map();
    }

    // 2. Save SonarCloud data to Supabase - 80% -> 90% of overall progress
    try {
      progressCallback('sonar', 80, 'Saving SonarCloud data to database...');
      await saveSonarData(sonarDataMap, userId, (_, progress, message) => {
        // Map internal progress to our overall progress (80-90%)
        const mappedProgress = 80 + progress * 0.1; // 0-100% -> 80-90%
        progressCallback('sonar', mappedProgress, message);
      });
      progressCallback('sonar', 90, 'SonarCloud data saved successfully');
    } catch (error) {
      logger.error("Failed to save SonarCloud data to database", { error }, userId, 'sync');
      addError(`Failed to save SonarCloud data to database: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
    
    return sonarDataMap;
  } catch (error) {
    logger.error("Error in SonarCloud data processing", { error }, userId, 'sync');
    throw error;
  }
}

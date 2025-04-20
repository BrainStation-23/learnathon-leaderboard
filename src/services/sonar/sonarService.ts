
import { supabase } from "@/integrations/supabase/client";
import { SonarCloudData } from "@/types";
import { logger } from "../logService";
import { ProgressCallback } from "../repository/types";

export async function saveSonarData(
  sonarData: Map<string, SonarCloudData>,
  userId: string,
  onProgress?: ProgressCallback
): Promise<void> {
  try {
    logger.info("Starting to save SonarCloud data", { 
      repoCount: sonarData.size,
      repoNames: Array.from(sonarData.keys())
    }, userId, 'sonar_metrics');

    // Get all repositories
    const { data: repositories, error } = await supabase
      .from("repositories")
      .select("id, name");

    if (error) {
      logger.error("Error fetching repositories for SonarCloud data", { error }, userId, 'repositories');
      throw error;
    }

    const total = repositories?.length || 0;
    let processed = 0;
    let savedCount = 0;
    let skippedCount = 0;

    // For each repository with sonar data
    for (const repo of repositories || []) {
      try {
        const sonarInfo = sonarData.get(repo.name);
        
        if (!sonarInfo || !sonarInfo.metrics || Object.keys(sonarInfo.metrics).length === 0) {
          logger.info(`No valid SonarCloud data for repository ${repo.name}, skipping`, {
            hasInfo: !!sonarInfo,
            hasMetrics: sonarInfo ? !!sonarInfo.metrics : false
          }, userId, 'sonar_metrics');
          skippedCount++;
          continue;
        }

        // Check if metrics already exist
        const { data: existingSonar, error: fetchError } = await supabase
          .from("sonar_metrics")
          .select("id")
          .eq("repository_id", repo.id)
          .single();
        
        if (fetchError && fetchError.code !== 'PGRST116') {
          logger.error(`Error checking existing SonarCloud data for ${repo.name}`, { error: fetchError }, userId, 'sonar_metrics');
        }

        const metricsData = {
          repository_id: repo.id,
          project_key: sonarInfo.project_key,
          lines_of_code: sonarInfo.metrics.lines_of_code,
          coverage: sonarInfo.metrics.coverage,
          bugs: sonarInfo.metrics.bugs,
          vulnerabilities: sonarInfo.metrics.vulnerabilities,
          code_smells: sonarInfo.metrics.code_smells,
          technical_debt: sonarInfo.metrics.technical_debt,
          complexity: sonarInfo.metrics.complexity,
          collected_at: new Date().toISOString()
        };

        let saveError;
        if (existingSonar) {
          // Update existing metrics
          logger.info(`Updating existing SonarCloud metrics for ${repo.name}`, {
            metrics: metricsData,
            id: existingSonar.id
          }, userId, 'sonar_metrics');

          const { error } = await supabase
            .from("sonar_metrics")
            .update(metricsData)
            .eq("id", existingSonar.id);
          
          saveError = error;
        } else {
          // Insert new metrics
          logger.info(`Creating new SonarCloud metrics for ${repo.name}`, {
            metrics: metricsData
          }, userId, 'sonar_metrics');

          const { error } = await supabase
            .from("sonar_metrics")
            .insert(metricsData);
          
          saveError = error;
        }

        if (saveError) {
          logger.error(`Error saving SonarCloud data for ${repo.name}`, { error: saveError }, userId, 'sonar_metrics');
        } else {
          logger.info(`Successfully saved SonarCloud data for ${repo.name}`, {
            metrics: metricsData
          }, userId, 'sonar_metrics', repo.id);
          savedCount++;
        }
      } catch (repoError) {
        logger.error(`Unexpected error processing SonarCloud data for ${repo.name}`, { error: repoError }, userId, 'sonar_metrics');
      }

      processed++;
      if (onProgress) {
        onProgress('sonar', (processed / total) * 100, `Processed SonarCloud data (${savedCount} saved, ${skippedCount} skipped)`);
      }
    }

    logger.info(`Completed SonarCloud data sync`, { 
      savedCount, 
      skippedCount, 
      total,
      processedRepos: processed
    }, userId, 'sonar_metrics');
  } catch (error) {
    logger.error("Error in saveSonarData", { error }, userId, 'sonar_metrics');
    throw error;
  }
}

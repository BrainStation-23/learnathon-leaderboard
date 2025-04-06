
import { supabase } from "@/integrations/supabase/client";
import { TeamDashboardData, GitHubRepoData, SonarCloudData } from "@/types";
import { Database } from "@/integrations/supabase/types";
import { logger } from "./logService";

export type ProgressCallback = (stage: string, progress: number, message: string) => void;

export async function saveRepositoryData(
  repos: GitHubRepoData[],
  userId: string,
  onProgress?: ProgressCallback
): Promise<void> {
  try {
    const total = repos.length;
    let processed = 0;
    
    // For each repository, upsert the data
    for (const repo of repos) {
      try {
        // First insert/update the repository
        const { data: repoData, error: repoError } = await supabase
          .from("repositories")
          .upsert(
            {
              name: repo.name,
              description: repo.description,
              github_repo_id: repo.id,
              github_full_name: repo.full_name,
              html_url: repo.html_url,
              updated_at: new Date().toISOString()
            },
            { onConflict: "github_repo_id", ignoreDuplicates: false }
          )
          .select("id");

        if (repoError) {
          logger.error(`Error upserting repository ${repo.name}`, { error: repoError }, userId, 'repositories');
          continue;
        }

        if (!repoData || repoData.length === 0) continue;
        
        const repositoryId = repoData[0].id;

        // Then insert/update the repository metrics
        // First check if metrics already exist for this repository
        const { data: existingMetrics, error: fetchError } = await supabase
          .from("repository_metrics")
          .select("id")
          .eq("repository_id", repositoryId)
          .single();

        let metricsError;
        
        if (fetchError && fetchError.code !== 'PGRST116') {
          logger.error(`Error checking metrics for ${repo.name}`, { error: fetchError }, userId, 'repository_metrics');
        } else if (existingMetrics) {
          // Update existing metrics
          const { error } = await supabase
            .from("repository_metrics")
            .update({
              contributors_count: repo.contributors_count || 0,
              commits_count: repo.commits_count || 0,
              last_commit_date: repo.updated_at,
              collected_at: new Date().toISOString()
            })
            .eq("id", existingMetrics.id);
          
          metricsError = error;
        } else {
          // Insert new metrics
          const { error } = await supabase
            .from("repository_metrics")
            .insert({
              repository_id: repositoryId,
              contributors_count: repo.contributors_count || 0,
              commits_count: repo.commits_count || 0,
              last_commit_date: repo.updated_at,
              collected_at: new Date().toISOString()
            });
          
          metricsError = error;
        }
        
        if (metricsError) {
          logger.error(`Error upserting metrics for ${repo.name}`, { error: metricsError }, userId, 'repository_metrics');
        } else {
          logger.info(`Successfully saved repository ${repo.name}`, { id: repositoryId }, userId, 'repositories', repositoryId);
        }
      } catch (repoError) {
        logger.error(`Unexpected error processing repo ${repo.name}`, { error: repoError }, userId, 'repositories');
      }

      processed++;
      if (onProgress) {
        onProgress('github', (processed / total) * 100, `Saved repository ${repo.name} (${processed}/${total})`);
      }
    }
  } catch (error) {
    logger.error("Error in saveRepositoryData", { error }, userId, 'repositories');
    throw error;
  }
}

export async function saveSonarData(
  sonarData: Map<string, SonarCloudData>,
  userId: string,
  onProgress?: ProgressCallback
): Promise<void> {
  try {
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

    // For each repository with sonar data, save it
    for (const repo of repositories || []) {
      try {
        const sonarInfo = sonarData.get(repo.name);
        
        if (!sonarInfo) {
          skippedCount++;
          continue;
        }

        // Check if sonar metrics already exist for this repository
        const { data: existingSonar, error: fetchError } = await supabase
          .from("sonar_metrics")
          .select("id")
          .eq("repository_id", repo.id)
          .single();
        
        let sonarError;
        
        if (fetchError && fetchError.code !== 'PGRST116') {
          logger.error(`Error checking SonarCloud data for ${repo.name}`, { error: fetchError }, userId, 'sonar_metrics');
        } else if (existingSonar) {
          // Update existing metrics
          const { error } = await supabase
            .from("sonar_metrics")
            .update({
              project_key: sonarInfo.project_key,
              lines_of_code: sonarInfo.metrics.lines_of_code,
              coverage: sonarInfo.metrics.coverage,
              bugs: sonarInfo.metrics.bugs,
              vulnerabilities: sonarInfo.metrics.vulnerabilities,
              code_smells: sonarInfo.metrics.code_smells,
              technical_debt: sonarInfo.metrics.technical_debt,
              complexity: sonarInfo.metrics.complexity,
              collected_at: new Date().toISOString()
            })
            .eq("id", existingSonar.id);
          
          sonarError = error;
        } else {
          // Insert new metrics
          const { error } = await supabase
            .from("sonar_metrics")
            .insert({
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
            });
          
          sonarError = error;
        }
        
        if (sonarError) {
          logger.error(`Error saving SonarCloud data for ${repo.name}`, { error: sonarError }, userId, 'sonar_metrics');
        } else {
          logger.info(`Successfully saved SonarCloud data for ${repo.name}`, {}, userId, 'sonar_metrics', repo.id);
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

    logger.info(`Completed SonarCloud data sync`, { savedCount, skippedCount, total }, userId, 'sonar_metrics');
  } catch (error) {
    logger.error("Error in saveSonarData", { error }, userId, 'sonar_metrics');
    throw error;
  }
}

export async function fetchDashboardData(): Promise<TeamDashboardData[]> {
  try {
    // Use our custom function to get repositories with metrics
    const { data, error } = await supabase
      .rpc('get_repositories_with_metrics');

    if (error) {
      logger.error("Error fetching dashboard data", { error });
      throw error;
    }

    // Transform the data to match our TeamDashboardData type
    return (data || []).map(item => ({
      repoData: {
        // Use a random ID as a fallback since github_repo_id is not available in the function result
        id: Math.floor(Math.random() * 10000),
        name: item.name,
        full_name: item.name, // Use name as full_name since it's not in the function result
        html_url: item.html_url || "",
        description: item.description || "",
        updated_at: item.updated_at?.toString() || new Date().toISOString(),
        contributors_count: item.contributors_count || 0,
        commits_count: item.commits_count || 0,
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
    }));
  } catch (error) {
    logger.error("Error in fetchDashboardData", { error });
    throw error;
  }
}


import { supabase } from "@/integrations/supabase/client";
import { TeamDashboardData, GitHubRepoData, SonarCloudData, GitHubContributor } from "@/types";
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
        
        // Save contributors data if available
        if (repo.contributors && repo.contributors.length > 0) {
          try {
            // Insert/update contributors for this repository
            const contributorsToUpsert = repo.contributors.map((contributor: GitHubContributor) => ({
              repository_id: repositoryId,
              github_id: contributor.id,
              login: contributor.login,
              avatar_url: contributor.avatar_url,
              contributions: contributor.contributions
            }));

            // Use the any type to bypass TypeScript's type checking for now
            // This is a workaround until the Supabase types are updated
            const { error: contributorsError } = await (supabase
              .from("contributors") as any)
              .upsert(contributorsToUpsert, {
                onConflict: "repository_id,github_id",
                ignoreDuplicates: false
              });

            if (contributorsError) {
              logger.error(`Error saving contributors for ${repo.name}`, { error: contributorsError }, userId, 'contributors');
            } else {
              logger.info(`Saved ${contributorsToUpsert.length} contributors for ${repo.name}`, {}, userId, 'contributors');
            }
          } catch (contribError) {
            logger.error(`Error processing contributors for ${repo.name}`, { error: contribError }, userId, 'contributors');
          }
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
    const { data: reposData, error: repoError } = await supabase
      .rpc('get_repositories_with_metrics');

    if (repoError) {
      logger.error("Error fetching dashboard data", { error: repoError });
      throw repoError;
    }

    // Fetch contributors for each repository
    const repos = await Promise.all((reposData || []).map(async (item) => {
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
          id: Math.floor(Math.random() * 10000),
          name: item.name,
          full_name: item.name, 
          html_url: item.html_url || "",
          description: item.description || "",
          updated_at: item.updated_at?.toString() || new Date().toISOString(),
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

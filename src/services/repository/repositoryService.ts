
import { supabase } from "@/integrations/supabase/client";
import { GitHubRepoData, GitHubSecurityIssue } from "@/types";
import { logger } from "../logService";
import { ProgressCallback } from "./types";

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
              // Ensure github_repo_id is a number - convert if it's a string
              github_repo_id: typeof repo.id === 'string' ? parseInt(repo.id, 10) || null : repo.id,
              github_full_name: repo.full_name,
              html_url: repo.html_url,
              license_name: repo.license?.name || null,
              license_url: repo.license?.url || null,
              license_spdx_id: repo.license?.spdx_id || null,
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
        await saveRepositoryMetrics(repositoryId, repo, userId);
        
        // Save contributors data if available
        if (repo.contributors && repo.contributors.length > 0) {
          await saveContributors(repositoryId, repo.contributors, userId);
        }
        
        // Save security issues if available
        if (repo.security_issues && repo.security_issues.length > 0) {
          await saveSecurityIssues(repositoryId, repo.security_issues, userId);
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

async function saveRepositoryMetrics(
  repositoryId: string,
  repo: GitHubRepoData,
  userId: string
): Promise<void> {
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
}

async function saveContributors(
  repositoryId: string, 
  contributors: any[], 
  userId: string
): Promise<void> {
  try {
    // Insert/update contributors for this repository
    const contributorsToUpsert = contributors.map((contributor) => ({
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
      logger.error(`Error saving contributors`, { error: contributorsError }, userId, 'contributors');
    } else {
      logger.info(`Saved ${contributorsToUpsert.length} contributors`, {}, userId, 'contributors');
    }
  } catch (contribError) {
    logger.error(`Error processing contributors`, { error: contribError }, userId, 'contributors');
  }
}

async function saveSecurityIssues(
  repositoryId: string,
  securityIssues: GitHubSecurityIssue[],
  userId: string
): Promise<void> {
  try {
    // First delete existing security issues for this repository
    // This ensures we don't have duplicates or stale data
    const { error: deleteError } = await supabase
      .from("security_issues")
      .delete()
      .eq("repository_id", repositoryId);
      
    if (deleteError) {
      logger.error(`Error deleting existing security issues for repository ${repositoryId}`, 
        { error: deleteError }, userId, 'security_issues');
    }
    
    // Only proceed with insertion if we have security issues to add
    if (securityIssues.length > 0) {
      // Create array of security issues to insert
      const issuesToInsert = securityIssues.map(issue => ({
        repository_id: repositoryId,
        title: issue.title,
        severity: issue.severity,
        published_at: issue.published_at,
        html_url: issue.html_url,
        state: issue.state,
        updated_at: new Date().toISOString()
      }));
      
      // Insert all security issues at once without using ON CONFLICT
      const { error: insertError } = await supabase
        .from("security_issues")
        .insert(issuesToInsert);
      
      if (insertError) {
        logger.error(`Error inserting security issues for repository ${repositoryId}`, 
          { error: insertError, issues: securityIssues.length }, userId, 'security_issues');
      } else {
        logger.info(`Saved ${securityIssues.length} security issues for repository ${repositoryId}`, 
          {}, userId, 'security_issues');
      }
    }
  } catch (error) {
    logger.error(`Error processing security issues for repository ${repositoryId}`, 
      { error }, userId, 'security_issues');
  }
}

export type { ProgressCallback };

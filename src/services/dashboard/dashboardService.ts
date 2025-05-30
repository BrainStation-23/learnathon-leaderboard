
import { supabase } from "@/integrations/supabase/client";
import { TeamDashboardData, GitHubContributor, GitHubSecurityIssue } from "@/types";
import { logger } from "../logService";

export async function fetchDashboardData(): Promise<TeamDashboardData[]> {
  try {
    // Fetch filtered repository IDs first with type assertion
    const { data: filteredRepoIds, error: filteredRepoError } = await (supabase
      .from('filtered_repositories' as any)
      .select('repository_id'));
    
    if (filteredRepoError) {
      logger.error("Error fetching filtered repositories:", { error: filteredRepoError });
    }
    
    // Create a set of filtered repository IDs for quick lookup
    const filteredRepositoryIds = new Set(
      filteredRepoIds?.map((item: any) => item.repository_id) || []
    );
    
    // Use our custom function to get repositories with metrics
    const { data: reposData, error: repoError } = await supabase
      .rpc('get_repositories_with_metrics');

    if (repoError) {
      logger.error("Error fetching dashboard data", { error: repoError });
      throw repoError;
    }

    // Filter out repositories that are in the filtered list
    const filteredReposData = reposData.filter(item => 
      !filteredRepositoryIds.has(item.id)
    );

    // Process each repository to fetch contributors and security issues
    const repos = await Promise.all((filteredReposData || []).map(async (item) => {
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

      // Get security issues for this repository
      const { data: securityIssueRows, error: securityError } = await (supabase
        .from('security_issues' as any)
        .select('*')
        .eq('repository_id', item.id)
        .order('published_at', { ascending: false }));
      
      if (securityError) {
        logger.error(`Error fetching security issues for repo ${item.name}`, { error: securityError });
      }

      // Transform contributors data to match the GitHubContributor type
      const contributors: GitHubContributor[] = (contributorRows || []).map((contributor: any) => ({
        id: contributor.github_id,
        login: contributor.login,
        avatar_url: contributor.avatar_url || '',
        contributions: contributor.contributions
      }));
      
      // Transform security issues data
      const securityIssues: GitHubSecurityIssue[] = (securityIssueRows || []).map((issue: any) => ({
        id: Number(issue.id.replace(/-/g, '')) || Math.random(),
        title: issue.title || '',
        state: issue.state || 'open',
        html_url: issue.html_url || '',
        published_at: issue.published_at || new Date().toISOString(),
        severity: issue.severity || 'low'
      }));
      
      // Transform the data to match our TeamDashboardData type
      return {
        repoData: {
          // Use the UUID from the database directly - now our type supports string IDs
          id: item.id,
          name: item.name,
          full_name: item.name, 
          html_url: item.html_url || "",
          description: item.description || "",
          updated_at: item.updated_at?.toString() || new Date().toISOString(),
          last_commit_date: item.last_commit_date?.toString() || null,
          contributors_count: item.contributors_count || 0,
          commits_count: item.commits_count || 0,
          contributors: contributors,
          license: item.license_name ? {
            name: item.license_name,
            url: item.license_url || '',
            spdx_id: item.license_spdx_id || ''
          } : undefined
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
        } : undefined,
        securityIssues: securityIssues.length > 0 ? securityIssues : undefined
      };
    }));
    
    return repos;
  } catch (error) {
    logger.error("Error in fetchDashboardData", { error });
    throw error;
  }
}

// A new function to get filter statistics for the dashboard
export async function fetchFilterStats(): Promise<{ 
  total: number, 
  droppedOut: number, 
  noContact: number, 
  gotJob: number, 
  other: number 
}> {
  try {
    // Fetch filtered repositories with their labels
    const { data: filteredRepos, error } = await (supabase
      .from('filtered_repositories' as any)
      .select('label'));
    
    if (error) {
      logger.error("Error fetching filter statistics:", { error });
      throw error;
    }
    
    // Count by label
    const stats = {
      total: filteredRepos?.length || 0,
      droppedOut: 0,
      noContact: 0,
      gotJob: 0,
      other: 0
    };
    
    if (filteredRepos) {
      filteredRepos.forEach((repo: any) => {
        if (repo.label === 'dropped-out') stats.droppedOut += 1;
        else if (repo.label === 'no-contact') stats.noContact += 1;
        else if (repo.label === 'got-job') stats.gotJob += 1;
        else if (repo.label === 'other') stats.other += 1;
      });
    }
    
    return stats;
  } catch (error) {
    logger.error("Error in fetchFilterStats", { error });
    return { total: 0, droppedOut: 0, noContact: 0, gotJob: 0, other: 0 };
  }
}


import { supabase } from "@/integrations/supabase/client";
import { TeamDashboardData, GitHubContributor } from "@/types";
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

    // Fetch contributors for each repository
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
          // Use the UUID from the database directly - now our type supports string IDs
          id: item.id,
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

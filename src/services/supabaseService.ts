
import { supabase } from "@/integrations/supabase/client";
import { TeamDashboardData, GitHubRepoData, SonarCloudData } from "@/types";

export async function saveRepositoryData(
  repos: GitHubRepoData[],
  userId: string
): Promise<void> {
  try {
    // For each repository, upsert the data
    for (const repo of repos) {
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
        console.error(`Error upserting repository ${repo.name}:`, repoError);
        continue;
      }

      if (!repoData || repoData.length === 0) continue;
      
      const repositoryId = repoData[0].id;

      // Then insert/update the repository metrics
      await supabase.from("repository_metrics").upsert({
        repository_id: repositoryId,
        contributors_count: repo.contributors_count || 0,
        commits_count: repo.commits_count || 0,
        last_commit_date: repo.updated_at,
        collected_at: new Date().toISOString()
      }, { onConflict: "repository_id", ignoreDuplicates: false });
    }
  } catch (error) {
    console.error("Error saving repository data:", error);
    throw error;
  }
}

export async function saveSonarData(
  sonarData: Map<string, SonarCloudData>,
  userId: string
): Promise<void> {
  try {
    // Get all repositories
    const { data: repositories, error } = await supabase
      .from("repositories")
      .select("id, name");

    if (error) {
      console.error("Error fetching repositories:", error);
      throw error;
    }

    // For each repository with sonar data, save it
    for (const repo of repositories || []) {
      const sonarInfo = sonarData.get(repo.name);
      if (!sonarInfo) continue;

      await supabase.from("sonar_metrics").upsert({
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
      }, { onConflict: "repository_id", ignoreDuplicates: false });
    }
  } catch (error) {
    console.error("Error saving sonar data:", error);
    throw error;
  }
}

export async function fetchDashboardData(): Promise<TeamDashboardData[]> {
  try {
    // Use our custom function to get repositories with metrics
    const { data, error } = await supabase
      .rpc('get_repositories_with_metrics');

    if (error) {
      console.error("Error fetching dashboard data:", error);
      throw error;
    }

    // Transform the data to match our TeamDashboardData type
    return (data || []).map(item => ({
      repoData: {
        id: Number(item.github_repo_id) || Math.floor(Math.random() * 10000), // Fallback to random ID if not available
        name: item.name,
        full_name: item.name,
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
    console.error("Error in fetchDashboardData:", error);
    throw error;
  }
}

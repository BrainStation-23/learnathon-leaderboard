
import { fetchGitHubApi, createGitHubApiOptions } from "./apiClient";
import { GitHubRepoBasicInfo } from "./types";
import { GitHubRepoData } from "@/types";
import { logger } from "../logService";

export async function fetchRepositoriesForOrg(
  org: string,
  token: string
): Promise<GitHubRepoData[]> {
  try {
    let allRepos: GitHubRepoData[] = [];
    let page = 1;
    let hasMorePages = true;
    
    while (hasMorePages) {
      const url = `https://api.github.com/orgs/${org}/repos?per_page=100&page=${page}`;
      const options = createGitHubApiOptions(token);
      
      const repos = await fetchGitHubApi<GitHubRepoBasicInfo[]>(url, options);
      
      // If we got fewer than 100 repos, we're on the last page
      if (repos.length < 100) {
        hasMorePages = false;
      }
      
      const parsedRepos = repos.map((repo) => ({
        id: repo.id,
        name: repo.name,
        full_name: repo.full_name,
        html_url: repo.html_url,
        description: repo.description || "",
        updated_at: repo.updated_at,
        license: repo.license,
      }));
      
      allRepos = [...allRepos, ...parsedRepos];
      page++;
    }
    
    return allRepos;
  } catch (error) {
    logger.error("Error fetching GitHub repositories:", { error });
    throw error;
  }
}


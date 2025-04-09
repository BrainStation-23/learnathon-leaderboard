
import { fetchGitHubApi, createGitHubApiOptions } from "./apiClient";
import { fetchSecurityIssues } from "./securityService";
import { GitHubRepoData, GitHubContributor } from "@/types";
import { logger } from "../logService";

export async function fetchRepoDetails(
  repoData: GitHubRepoData[], 
  org: string,
  token: string
): Promise<GitHubRepoData[]> {
  try {
    const enhancedRepos = await Promise.all(
      repoData.map(async (repo) => {
        try {
          // Fetch contributors
          const contributorsUrl = `https://api.github.com/repos/${org}/${repo.name}/contributors?per_page=100`;
          const options = createGitHubApiOptions(token);
          
          let contributors: GitHubContributor[] = [];
          let commits_count = 0;
          
          try {
            contributors = await fetchGitHubApi<GitHubContributor[]>(contributorsUrl, options);
          } catch (contributorsError) {
            logger.error(`Failed to fetch contributors for ${repo.name}`, { error: contributorsError });
          }

          // Fetch commit count
          const commitsUrl = `https://api.github.com/repos/${org}/${repo.name}/commits?per_page=1`;
          
          try {
            const commitsResponse = await fetch(commitsUrl, {
              headers: options.headers,
            });
            
            if (commitsResponse.ok) {
              // Get total count from header
              const linkHeader = commitsResponse.headers.get("link") || "";
              const match = linkHeader.match(/page=(\d+)>; rel="last"/);
              if (match) {
                commits_count = parseInt(match[1], 10);
              }
            }
          } catch (commitsError) {
            logger.error(`Failed to fetch commit count for ${repo.name}`, { error: commitsError });
          }
          
          // Fetch security vulnerabilities using Dependabot API
          const security_issues = await fetchSecurityIssues(org, repo.name, token);

          return {
            ...repo,
            contributors_count: contributors.length,
            commits_count,
            contributors,
            security_issues
          };
        } catch (error) {
          logger.error(`Error fetching details for ${repo.name}:`, { error });
          // Return the original repo if we failed to fetch details
          return repo;
        }
      })
    );

    return enhancedRepos;
  } catch (error) {
    logger.error("Error fetching repo details:", { error });
    throw error;
  }
}


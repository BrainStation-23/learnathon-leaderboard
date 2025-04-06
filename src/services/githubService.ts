
import { GitHubRepoData, GitHubContributor } from "@/types";

export async function fetchRepositoriesForOrg(
  org: string,
  token: string
): Promise<GitHubRepoData[]> {
  try {
    let allRepos: GitHubRepoData[] = [];
    let page = 1;
    let hasMorePages = true;
    
    while (hasMorePages) {
      const response = await fetch(`https://api.github.com/orgs/${org}/repos?per_page=100&page=${page}`, {
        headers: {
          Authorization: `token ${token}`,
          Accept: "application/vnd.github.v3+json",
        },
      });

      if (!response.ok) {
        throw new Error(`GitHub API error: ${response.status}`);
      }

      const repos = await response.json();
      
      // If we got fewer than 100 repos, we're on the last page
      if (repos.length < 100) {
        hasMorePages = false;
      }
      
      const parsedRepos = repos.map((repo: any) => ({
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
    console.error("Error fetching GitHub repositories:", error);
    throw error;
  }
}

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
          const contributorsResponse = await fetch(
            `https://api.github.com/repos/${org}/${repo.name}/contributors?per_page=100`,
            {
              headers: {
                Authorization: `token ${token}`,
                Accept: "application/vnd.github.v3+json",
              },
            }
          );

          // Fetch commit count
          const commitsResponse = await fetch(
            `https://api.github.com/repos/${org}/${repo.name}/commits?per_page=1`,
            {
              headers: {
                Authorization: `token ${token}`,
                Accept: "application/vnd.github.v3+json",
              },
            }
          );

          let contributors: GitHubContributor[] = [];
          let commits_count = 0;

          if (contributorsResponse.ok) {
            contributors = await contributorsResponse.json();
          }

          if (commitsResponse.ok) {
            // Get total count from header
            const linkHeader = commitsResponse.headers.get("link") || "";
            const match = linkHeader.match(/page=(\d+)>; rel="last"/);
            if (match) {
              commits_count = parseInt(match[1], 10);
            }
          }

          return {
            ...repo,
            contributors_count: contributors.length,
            commits_count,
            contributors,
          };
        } catch (error) {
          console.error(`Error fetching details for ${repo.name}:`, error);
          // Return the original repo if we failed to fetch details
          return repo;
        }
      })
    );

    return enhancedRepos;
  } catch (error) {
    console.error("Error fetching repo details:", error);
    throw error;
  }
}

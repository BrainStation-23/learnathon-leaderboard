
import { GitHubRepoData, GitHubContributor, GitHubSecurityIssue } from "@/types";

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
          
          // Fetch security vulnerabilities (requires special preview header)
          const securityResponse = await fetch(
            `https://api.github.com/repos/${org}/${repo.name}/vulnerability-alerts`,
            {
              headers: {
                Authorization: `token ${token}`,
                Accept: "application/vnd.github.dorian-preview+json",
              },
            }
          );

          let contributors: GitHubContributor[] = [];
          let commits_count = 0;
          let security_issues: GitHubSecurityIssue[] = [];

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
          
          // Only try to parse security issues if the response was successful
          if (securityResponse.ok && securityResponse.status !== 204) {
            const securityData = await securityResponse.json();
            if (Array.isArray(securityData)) {
              security_issues = securityData.map((issue: any) => ({
                id: issue.id || Math.random(), // Fallback if id is not present
                title: issue.alert?.security_advisory?.summary || "Security vulnerability",
                state: issue.alert?.state || "unknown",
                html_url: issue.html_url || repo.html_url,
                published_at: issue.alert?.published_at || new Date().toISOString(),
                severity: issue.alert?.security_advisory?.severity || "low"
              }));
            }
          }

          return {
            ...repo,
            contributors_count: contributors.length,
            commits_count,
            contributors,
            security_issues
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

export async function fetchSecurityIssues(
  org: string,
  repoName: string,
  token: string
): Promise<GitHubSecurityIssue[]> {
  try {
    // First try with the vulnerability alerts API
    const vulnResponse = await fetch(
      `https://api.github.com/repos/${org}/${repoName}/vulnerability-alerts`,
      {
        headers: {
          Authorization: `token ${token}`,
          Accept: "application/vnd.github.dorian-preview+json",
        },
      }
    );
    
    // If that fails, try with the CodeQL alerts API
    if (!vulnResponse.ok) {
      const codeQLResponse = await fetch(
        `https://api.github.com/repos/${org}/${repoName}/code-scanning/alerts`,
        {
          headers: {
            Authorization: `token ${token}`,
            Accept: "application/vnd.github.v3+json",
          },
        }
      );
      
      if (codeQLResponse.ok) {
        const alerts = await codeQLResponse.json();
        return alerts.map((alert: any) => ({
          id: alert.number,
          title: alert.rule?.description || "Security vulnerability",
          state: alert.state,
          html_url: alert.html_url,
          published_at: alert.created_at,
          severity: alert.rule?.security_severity_level || "warning"
        }));
      }
    } else if (vulnResponse.status !== 204) {  // 204 means no content
      const alerts = await vulnResponse.json();
      if (Array.isArray(alerts)) {
        return alerts.map((alert: any) => ({
          id: alert.id || Math.random(),
          title: alert.alert?.security_advisory?.summary || "Security vulnerability",
          state: alert.alert?.state || "open",
          html_url: alert.html_url || `https://github.com/${org}/${repoName}/security/dependabot`,
          published_at: alert.alert?.published_at || new Date().toISOString(),
          severity: alert.alert?.security_advisory?.severity || "low"
        }));
      }
    }
    
    return [];
  } catch (error) {
    console.error(`Error fetching security issues for ${repoName}:`, error);
    return [];
  }
}


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
          
          // Fetch security vulnerabilities using Dependabot API
          const securityResponse = await fetch(
            `https://api.github.com/repos/${org}/${repo.name}/dependabot/alerts`,
            {
              headers: {
                Authorization: `token ${token}`,
                Accept: "application/vnd.github.v4+json",
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
                id: issue.number || Math.random(),
                title: issue.security_advisory?.summary || issue.dependency?.package?.name || "Security vulnerability",
                state: issue.state || "open",
                html_url: issue.html_url || `${repo.html_url}/security/dependabot`,
                published_at: issue.created_at || new Date().toISOString(),
                severity: issue.security_advisory?.severity || "low"
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
    // First try with Dependabot alerts API
    const dependabotResponse = await fetch(
      `https://api.github.com/repos/${org}/${repoName}/dependabot/alerts`,
      {
        headers: {
          Authorization: `token ${token}`,
          Accept: "application/vnd.github.v4+json",
        },
      }
    );
    
    // If that fails, try with the CodeQL alerts API
    if (!dependabotResponse.ok) {
      console.log(`Dependabot API failed for ${repoName} with status ${dependabotResponse.status}. Trying CodeQL API.`);
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
      } else {
        console.log(`CodeQL API also failed for ${repoName} with status ${codeQLResponse.status}.`);
      }
    } else if (dependabotResponse.status !== 204) {  // 204 means no content
      const alerts = await dependabotResponse.json();
      if (Array.isArray(alerts)) {
        return alerts.map((alert: any) => ({
          id: alert.number || Math.random(),
          title: alert.security_advisory?.summary || alert.dependency?.package?.name || "Security vulnerability",
          state: alert.state || "open",
          html_url: alert.html_url || `https://github.com/${org}/${repoName}/security/dependabot`,
          published_at: alert.created_at || new Date().toISOString(),
          severity: alert.security_advisory?.severity || "low"
        }));
      }
    }
    
    return [];
  } catch (error) {
    console.error(`Error fetching security issues for ${repoName}:`, error);
    return [];
  }
}

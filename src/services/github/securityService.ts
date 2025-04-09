
import { fetchGitHubApi, createGitHubApiOptions } from "./apiClient";
import { GitHubDependabotAlert, GitHubCodeQLAlert } from "./types";
import { GitHubSecurityIssue } from "@/types";
import { logger } from "../logService";

export async function fetchSecurityIssues(
  org: string,
  repoName: string,
  token: string
): Promise<GitHubSecurityIssue[]> {
  try {
    // First try with Dependabot alerts API
    const dependabotUrl = `https://api.github.com/repos/${org}/${repoName}/dependabot/alerts`;
    const dependabotOptions = createGitHubApiOptions(token, "application/vnd.github.v4+json");
    
    try {
      const alerts = await fetchGitHubApi<GitHubDependabotAlert[]>(dependabotUrl, dependabotOptions);
      
      if (Array.isArray(alerts)) {
        return alerts.map((alert) => ({
          id: alert.number || Math.random(),
          title: alert.security_advisory?.summary || alert.dependency?.package?.name || "Security vulnerability",
          state: alert.state || "open",
          html_url: alert.html_url || `https://github.com/${org}/${repoName}/security/dependabot`,
          published_at: alert.created_at || new Date().toISOString(),
          severity: alert.security_advisory?.severity || "low"
        }));
      }
      return [];
    } catch (dependabotError) {
      // If Dependabot API fails, try with the CodeQL alerts API
      logger.error(`Dependabot API failed for ${repoName}`, { error: dependabotError });
      
      const codeQLUrl = `https://api.github.com/repos/${org}/${repoName}/code-scanning/alerts`;
      const codeQLOptions = createGitHubApiOptions(token, "application/vnd.github.v3+json");
      
      try {
        const alerts = await fetchGitHubApi<GitHubCodeQLAlert[]>(codeQLUrl, codeQLOptions);
        
        return alerts.map((alert) => ({
          id: alert.number,
          title: alert.rule?.description || "Security vulnerability",
          state: alert.state,
          html_url: alert.html_url,
          published_at: alert.created_at,
          severity: alert.rule?.security_severity_level || "warning"
        }));
      } catch (codeQLError) {
        logger.error(`CodeQL API also failed for ${repoName}`, { error: codeQLError });
        return [];
      }
    }
  } catch (error) {
    logger.error(`Error fetching security issues for ${repoName}:`, { error });
    return [];
  }
}


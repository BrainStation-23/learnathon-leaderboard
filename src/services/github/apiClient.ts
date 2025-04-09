
import { GitHubApiOptions } from "./types";
import { logger } from "../logService";

export async function fetchGitHubApi<T>(url: string, options: GitHubApiOptions): Promise<T> {
  const response = await fetch(url, options);
  
  if (!response.ok) {
    // Log the error with status code
    const error = new Error(`GitHub API error: ${response.status} - ${response.statusText}`);
    logger.error(`GitHub API request failed: ${url}`, { 
      status: response.status, 
      statusText: response.statusText 
    });
    throw error;
  }

  // Handle 204 No Content response
  if (response.status === 204) {
    return [] as unknown as T;
  }

  return response.json();
}

export function createGitHubApiOptions(token: string, acceptHeader: string = "application/vnd.github.v3+json"): GitHubApiOptions {
  return {
    headers: {
      Authorization: `token ${token}`,
      Accept: acceptHeader,
    },
  };
}


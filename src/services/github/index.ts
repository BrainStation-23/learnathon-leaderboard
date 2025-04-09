
// Export all GitHub service functionality from a single entry point
export { fetchRepositoriesForOrg } from "./repositoryService";
export { fetchRepoDetails } from "./detailsService";
export { fetchSecurityIssues } from "./securityService";

// Also export types if needed
export type { GitHubApiOptions, GitHubApiHeaders } from "./types";


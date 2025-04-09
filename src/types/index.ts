
// GitHub Types
export interface GitHubRepoData {
  id: string | number;
  name: string;
  full_name: string;
  html_url: string;
  description: string;
  updated_at: string;
  last_commit_date?: string;
  license?: {
    name: string;
    url: string;
    spdx_id?: string;
  };
  security_issues?: GitHubSecurityIssue[];
  contributors_count?: number;
  commits_count?: number;
  contributors?: GitHubContributor[];
  // Added for UI purpose
  isLoading?: boolean;
}

export interface GitHubSecurityIssue {
  id: number;
  title: string;
  state: string;
  html_url: string;
  published_at: string;
  severity: string;
}

export interface GitHubContributor {
  login: string;
  id: number;
  avatar_url: string;
  contributions: number;
}

// SonarCloud Types
export interface SonarCloudData {
  project_key: string;
  name: string;
  metrics: SonarMetrics;
  // Added for UI purpose
  isLoading?: boolean;
}

export interface SonarMetrics {
  lines_of_code?: number;
  coverage?: number;
  bugs?: number;
  vulnerabilities?: number;
  code_smells?: number;
  technical_debt?: string;
  complexity?: number;
}

// Project Configuration
export interface ProjectConfig {
  github_org: string;
  github_pat: string;
  sonarcloud_org: string;
  filtered_contributors?: string[];
}

// Dashboard combined data
export interface TeamDashboardData {
  repoData: GitHubRepoData;
  sonarData?: SonarCloudData;
  securityIssues?: GitHubSecurityIssue[];
}

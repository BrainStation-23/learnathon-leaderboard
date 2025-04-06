
// GitHub Types
export interface GitHubRepoData {
  id: number;
  name: string;
  full_name: string;
  html_url: string;
  description: string;
  updated_at: string;
  license?: {
    name: string;
    url: string;
  };
  contributors_count?: number;
  commits_count?: number;
  contributors?: GitHubContributor[];
  // Added for UI purpose
  isLoading?: boolean;
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
}

// Dashboard combined data
export interface TeamDashboardData {
  repoData: GitHubRepoData;
  sonarData?: SonarCloudData;
}

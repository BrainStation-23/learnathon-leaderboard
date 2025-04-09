
import { GitHubRepoData, GitHubContributor, GitHubSecurityIssue } from "@/types";

// Update this interface to include an index signature
export interface GitHubApiHeaders {
  Authorization: string;
  Accept: string;
  [key: string]: string; // Add index signature to make it compatible with HeadersInit
}

export interface GitHubApiOptions {
  headers: GitHubApiHeaders;
}

export interface GitHubRepoBasicInfo {
  id: number;
  name: string;
  full_name: string;
  html_url: string;
  description: string | null;
  updated_at: string;
  license: {
    name: string;
    url: string;
    spdx_id: string;
  } | null;
}

export interface GitHubDependabotAlert {
  number: number;
  security_advisory?: {
    summary: string;
    severity: string;
  };
  dependency?: {
    package?: {
      name: string;
    };
  };
  state: string;
  html_url: string;
  created_at: string;
}

export interface GitHubCodeQLAlert {
  number: number;
  rule?: {
    description: string;
    security_severity_level: string;
  };
  state: string;
  html_url: string;
  created_at: string;
}

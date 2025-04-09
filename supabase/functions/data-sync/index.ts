
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'

// Constants and types
const SUPABASE_URL = "https://gxfdqrussltcibptiltm.supabase.co"
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd4ZmRxcnVzc2x0Y2licHRpbHRtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM5NDE1NjUsImV4cCI6MjA1OTUxNzU2NX0.aJbVEWeoKnzIUiafuhHvTyGznae7B-YnFCznc6ZU3G0"

// CORS headers for browser requests
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface SonarMetrics {
  lines_of_code?: number;
  coverage?: number;
  bugs?: number;
  vulnerabilities?: number;
  code_smells?: number;
  technical_debt?: string;
  complexity?: number;
}

interface SonarCloudData {
  project_key: string;
  name: string;
  metrics: SonarMetrics;
}

interface GitHubSecurityIssue {
  title: string;
  severity: string;
  published_at: string;
  html_url: string;
  state: string;
}

interface GitHubContributor {
  id: number;
  login: string;
  avatar_url: string;
  contributions: number;
}

interface GitHubRepoData {
  id: number | string;
  name: string;
  full_name: string;
  html_url: string;
  description: string;
  updated_at: string;
  license?: {
    name: string;
    url: string;
    spdx_id: string;
  };
  contributors?: GitHubContributor[];
  contributors_count?: number;
  commits_count?: number;
  security_issues?: GitHubSecurityIssue[];
}

interface Configuration {
  github_org: string;
  github_pat: string;
  sonarcloud_org: string;
  filtered_contributors: string[];
}

interface ProgressData {
  stage: string;
  progress: number;
  message: string;
}

// Main function to handle requests
Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Parse the request body
    const requestData = await req.json();
    const { automated = false, source = 'manual' } = requestData;
    
    // Log the start of the operation
    console.log(`Starting data sync operation - Automated: ${automated}, Source: ${source}`);
    
    // Create Supabase client
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    
    // 1. Get admin configuration
    const { data: configData, error: configError } = await supabase
      .from('configurations')
      .select('*')
      .limit(1);
      
    if (configError || !configData || configData.length === 0) {
      console.error("Failed to retrieve configuration:", configError);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "Failed to retrieve configuration" 
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500 
        }
      );
    }
    
    const config = configData[0] as Configuration;
    
    // 2. Fetch GitHub data
    console.log(`Fetching data for GitHub organization: ${config.github_org}`);
    const repoData = await fetchGitHubData(config.github_org, config.github_pat);
    
    // 3. Save GitHub data
    console.log(`Saving ${repoData.length} repositories to database`);
    await saveRepositoryData(supabase, repoData);
    
    // 4. Fetch SonarCloud data
    console.log(`Fetching SonarCloud data for organization: ${config.sonarcloud_org}`);
    const sonarData = await fetchSonarCloudData(config.sonarcloud_org, repoData);
    
    // 5. Save SonarCloud data
    const sonarSaveCount = sonarData.size;
    console.log(`Saving ${sonarSaveCount} SonarCloud project data to database`);
    await saveSonarData(supabase, sonarData);
    
    // 6. Log completion and return success
    console.log(`Data sync completed successfully - Saved ${repoData.length} repositories and ${sonarSaveCount} SonarCloud projects`);
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Sync completed: ${repoData.length} repos, ${sonarSaveCount} SonarCloud projects`,
        timestamp: new Date().toISOString()
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );
  } catch (error) {
    // Log error and return error response
    console.error("Error during data sync operation:", error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || "Unknown error"
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});

// GitHub API Functions
async function fetchGitHubData(org: string, token: string): Promise<GitHubRepoData[]> {
  try {
    // 1. Fetch repositories
    const repos = await fetchRepositoriesForOrg(org, token);
    console.log(`Found ${repos.length} repositories for organization ${org}`);
    
    // 2. Fetch repository details
    const enhancedRepos = await fetchRepoDetails(repos, org, token);
    console.log(`Enhanced ${enhancedRepos.length} repositories with details`);
    
    return enhancedRepos;
  } catch (error) {
    console.error("Error fetching GitHub data:", error);
    throw new Error(`GitHub data fetch failed: ${error.message}`);
  }
}

async function fetchRepositoriesForOrg(org: string, token: string): Promise<GitHubRepoData[]> {
  let allRepos: GitHubRepoData[] = [];
  let page = 1;
  let hasMorePages = true;
  
  while (hasMorePages) {
    const url = `https://api.github.com/orgs/${org}/repos?per_page=100&page=${page}`;
    const options = createGitHubApiOptions(token);
    
    console.log(`Fetching GitHub repos page ${page}`);
    const response = await fetch(url, options);
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`GitHub API error: ${response.status} - ${errorText}`);
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
    
    // Add a small delay to avoid rate limiting
    if (hasMorePages) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }
  
  return allRepos;
}

async function fetchRepoDetails(
  repoData: GitHubRepoData[], 
  org: string,
  token: string
): Promise<GitHubRepoData[]> {
  const enhancedRepos = [];
  
  // Process repositories in batches to avoid rate limiting
  const batchSize = 5;
  for (let i = 0; i < repoData.length; i += batchSize) {
    const batch = repoData.slice(i, i + batchSize);
    
    const batchPromises = batch.map(async (repo) => {
      try {
        // Fetch contributors
        const contributorsUrl = `https://api.github.com/repos/${org}/${repo.name}/contributors?per_page=100`;
        const options = createGitHubApiOptions(token);
        
        let contributors: GitHubContributor[] = [];
        let commits_count = 0;
        
        try {
          const contributorsResponse = await fetch(contributorsUrl, options);
          if (contributorsResponse.ok) {
            contributors = await contributorsResponse.json();
          } else {
            console.warn(`Failed to fetch contributors for ${repo.name}: ${contributorsResponse.status}`);
          }
        } catch (contributorsError) {
          console.error(`Error fetching contributors for ${repo.name}:`, contributorsError);
        }

        // Fetch commit count
        const commitsUrl = `https://api.github.com/repos/${org}/${repo.name}/commits?per_page=1`;
        
        try {
          const commitsResponse = await fetch(commitsUrl, options);
          
          if (commitsResponse.ok) {
            // Get total count from header
            const linkHeader = commitsResponse.headers.get("link") || "";
            const match = linkHeader.match(/page=(\d+)>; rel="last"/);
            if (match) {
              commits_count = parseInt(match[1], 10);
            }
          } else {
            console.warn(`Failed to fetch commit count for ${repo.name}: ${commitsResponse.status}`);
          }
        } catch (commitsError) {
          console.error(`Error fetching commit count for ${repo.name}:`, commitsError);
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
        console.error(`Error fetching details for ${repo.name}:`, error);
        // Return the original repo if we failed to fetch details
        return repo;
      }
    });
    
    const batchResults = await Promise.all(batchPromises);
    enhancedRepos.push(...batchResults);
    
    // Add a small delay between batches to avoid rate limiting
    if (i + batchSize < repoData.length) {
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }

  return enhancedRepos;
}

async function fetchSecurityIssues(
  org: string, 
  repo: string, 
  token: string
): Promise<GitHubSecurityIssue[]> {
  try {
    const url = `https://api.github.com/repos/${org}/${repo}/dependabot/alerts?state=open`;
    const options = createGitHubApiOptions(
      token, 
      "application/vnd.github.dependabot-preview+json"
    );
    
    const response = await fetch(url, options);
    
    // If unauthorized or repo doesn't have vulnerability alerts enabled
    if (response.status === 403 || response.status === 404) {
      return [];
    }
    
    if (!response.ok) {
      console.warn(`Error fetching security issues for ${repo}: ${response.status}`);
      return [];
    }
    
    const alerts = await response.json();
    
    return alerts.map((alert: any) => ({
      title: alert.security_advisory?.summary || alert.security_vulnerability?.advisory?.summary || "Unknown vulnerability",
      severity: alert.security_advisory?.severity || alert.security_vulnerability?.severity || "unknown",
      published_at: alert.security_advisory?.published_at || alert.created_at,
      html_url: alert.html_url,
      state: alert.state
    }));
  } catch (error) {
    console.error(`Error fetching security issues for ${repo}:`, error);
    return [];
  }
}

function createGitHubApiOptions(token: string, acceptHeader: string = "application/vnd.github.v3+json") {
  return {
    headers: {
      Authorization: `token ${token}`,
      Accept: acceptHeader,
    },
  };
}

// SonarCloud Functions
async function fetchSonarCloudData(
  orgSlug: string,
  repos: GitHubRepoData[]
): Promise<Map<string, SonarCloudData>> {
  try {
    const sonarDataMap = new Map<string, SonarCloudData>();
    
    // Process repositories in batches to avoid rate limiting
    const batchSize = 10;
    for (let i = 0; i < repos.length; i += batchSize) {
      const batch = repos.slice(i, i + batchSize);
      
      const batchPromises = batch.map(async (repo) => {
        try {
          // Format repository name to handle special characters
          const formattedRepoName = repo.name.replace(/[^a-zA-Z0-9-_]/g, "-");
          
          // Try different project key formats with proper casing
          const pascalCaseOrg = orgSlug.split('-')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join('-');
            
          const pascalCaseRepo = formattedRepoName.split('-')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join('');
          
          const possibleProjectKeys = [
            // Original formats
            `${orgSlug}_${formattedRepoName}`,
            `${orgSlug}-${formattedRepoName}`,
            `${formattedRepoName}`,
            // New formats with proper casing
            `${pascalCaseOrg}_${formattedRepoName}`,
            `${pascalCaseOrg}-${formattedRepoName}_${formattedRepoName}`,
            `${pascalCaseOrg}_${pascalCaseRepo}`,
          ];
          
          let metricsData = null;
          let usedKey = '';
          
          // Try each project key format until we find one that works
          for (const projectKey of possibleProjectKeys) {
            try {
              // Fetch core metrics
              const apiUrl = `https://sonarcloud.io/api/measures/component?component=${projectKey}&metricKeys=ncloc,coverage,bugs,vulnerabilities,code_smells,sqale_index,cognitive_complexity`;
              
              const metricsResponse = await fetch(apiUrl, {
                headers: { Accept: "application/json" }
              });

              if (metricsResponse.ok) {
                metricsData = await metricsResponse.json();
                usedKey = projectKey;
                console.log(`Found SonarCloud project using key: ${projectKey} for repo ${repo.name}`);
                break; // Found a working key format
              }
            } catch (error) {
              // Continue to the next key format on error
            }
          }

          if (metricsData) {
            const metrics = extractMetrics(metricsData);
            
            sonarDataMap.set(repo.name, {
              project_key: usedKey,
              name: repo.name,
              metrics,
            });
          }
        } catch (error) {
          console.error(`Error fetching SonarCloud data for ${repo.name}:`, error);
        }
      });
      
      await Promise.all(batchPromises);
      
      // Add a small delay between batches
      if (i + batchSize < repos.length) {
        await new Promise(resolve => setTimeout(resolve, 300));
      }
    }

    return sonarDataMap;
  } catch (error) {
    console.error("Error fetching SonarCloud data:", error);
    throw error;
  }
}

function extractMetrics(metricsData: any): SonarMetrics {
  const measures = metricsData.component?.measures || [];
  const metrics: SonarMetrics = {};

  // Map the SonarCloud metrics to our data structure
  measures.forEach((measure: any) => {
    switch (measure.metric) {
      case "ncloc":
        metrics.lines_of_code = parseInt(measure.value, 10);
        break;
      case "coverage":
        metrics.coverage = parseFloat(measure.value);
        break;
      case "bugs":
        metrics.bugs = parseInt(measure.value, 10);
        break;
      case "vulnerabilities":
        metrics.vulnerabilities = parseInt(measure.value, 10);
        break;
      case "code_smells":
        metrics.code_smells = parseInt(measure.value, 10);
        break;
      case "sqale_index":
        // Convert minutes to a readable format (e.g. "2d 5h")
        const minutes = parseInt(measure.value, 10);
        metrics.technical_debt = formatTechnicalDebt(minutes);
        break;
      case "cognitive_complexity":
        metrics.complexity = parseInt(measure.value, 10);
        break;
    }
  });

  return metrics;
}

function formatTechnicalDebt(minutes: number): string {
  if (minutes < 60) {
    return `${minutes}m`;
  }
  
  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    const remainingMinutes = minutes % 60;
    return `${hours}h${remainingMinutes > 0 ? ` ${remainingMinutes}m` : ''}`;
  }
  
  const days = Math.floor(hours / 24);
  const remainingHours = hours % 24;
  return `${days}d${remainingHours > 0 ? ` ${remainingHours}h` : ''}`;
}

// Database Functions
async function saveRepositoryData(supabase: any, repos: GitHubRepoData[]): Promise<void> {
  for (const repo of repos) {
    try {
      // First insert/update the repository
      const { data: repoData, error: repoError } = await supabase
        .from("repositories")
        .upsert(
          {
            name: repo.name,
            description: repo.description,
            github_repo_id: typeof repo.id === 'string' ? parseInt(repo.id, 10) || null : repo.id,
            github_full_name: repo.full_name,
            html_url: repo.html_url,
            license_name: repo.license?.name || null,
            license_url: repo.license?.url || null,
            license_spdx_id: repo.license?.spdx_id || null,
            updated_at: new Date().toISOString()
          },
          { onConflict: "github_repo_id", ignoreDuplicates: false }
        )
        .select("id");

      if (repoError) {
        console.error(`Error upserting repository ${repo.name}:`, repoError);
        continue;
      }

      if (!repoData || repoData.length === 0) continue;
      
      const repositoryId = repoData[0].id;

      // Then insert/update the repository metrics
      await saveRepositoryMetrics(supabase, repositoryId, repo);
      
      // Save contributors data if available
      if (repo.contributors && repo.contributors.length > 0) {
        await saveContributors(supabase, repositoryId, repo.contributors);
      }
      
      // Save security issues if available
      if (repo.security_issues && repo.security_issues.length > 0) {
        await saveSecurityIssues(supabase, repositoryId, repo.security_issues);
      }
    } catch (repoError) {
      console.error(`Unexpected error processing repo ${repo.name}:`, repoError);
    }
  }
}

async function saveRepositoryMetrics(
  supabase: any,
  repositoryId: string,
  repo: GitHubRepoData
): Promise<void> {
  // First check if metrics already exist for this repository
  const { data: existingMetrics, error: fetchError } = await supabase
    .from("repository_metrics")
    .select("id")
    .eq("repository_id", repositoryId)
    .maybeSingle();

  let metricsError;
  
  if (fetchError) {
    console.error(`Error checking metrics for ${repo.name}:`, fetchError);
  } else if (existingMetrics) {
    // Update existing metrics
    const { error } = await supabase
      .from("repository_metrics")
      .update({
        contributors_count: repo.contributors_count || 0,
        commits_count: repo.commits_count || 0,
        last_commit_date: repo.updated_at,
        collected_at: new Date().toISOString()
      })
      .eq("id", existingMetrics.id);
    
    metricsError = error;
  } else {
    // Insert new metrics
    const { error } = await supabase
      .from("repository_metrics")
      .insert({
        repository_id: repositoryId,
        contributors_count: repo.contributors_count || 0,
        commits_count: repo.commits_count || 0,
        last_commit_date: repo.updated_at,
        collected_at: new Date().toISOString()
      });
    
    metricsError = error;
  }
  
  if (metricsError) {
    console.error(`Error upserting metrics for ${repo.name}:`, metricsError);
  } else {
    console.log(`Successfully saved repository ${repo.name}`);
  }
}

async function saveContributors(
  supabase: any, 
  repositoryId: string, 
  contributors: GitHubContributor[]
): Promise<void> {
  try {
    // Insert/update contributors for this repository
    const contributorsToUpsert = contributors.map((contributor) => ({
      repository_id: repositoryId,
      github_id: contributor.id,
      login: contributor.login,
      avatar_url: contributor.avatar_url,
      contributions: contributor.contributions
    }));

    // Handle in batches if there are many contributors
    const batchSize = 50;
    for (let i = 0; i < contributorsToUpsert.length; i += batchSize) {
      const batch = contributorsToUpsert.slice(i, i + batchSize);
      const { error: contributorsError } = await supabase
        .from("contributors")
        .upsert(batch, {
          onConflict: "repository_id,github_id",
          ignoreDuplicates: false
        });

      if (contributorsError) {
        console.error(`Error saving contributors batch:`, contributorsError);
      }
    }
  } catch (contribError) {
    console.error(`Error processing contributors:`, contribError);
  }
}

async function saveSecurityIssues(
  supabase: any,
  repositoryId: string,
  securityIssues: GitHubSecurityIssue[]
): Promise<void> {
  try {
    // First delete existing security issues for this repository
    const { error: deleteError } = await supabase
      .from("security_issues")
      .delete()
      .eq("repository_id", repositoryId);
      
    if (deleteError) {
      console.error(`Error deleting existing security issues for repository ${repositoryId}:`, deleteError);
    }
    
    // Only proceed with insertion if we have security issues to add
    if (securityIssues.length > 0) {
      // Create array of security issues to insert
      const issuesToInsert = securityIssues.map(issue => ({
        repository_id: repositoryId,
        title: issue.title,
        severity: issue.severity,
        published_at: issue.published_at,
        html_url: issue.html_url,
        state: issue.state,
        updated_at: new Date().toISOString()
      }));
      
      // Insert all security issues at once
      const { error: insertError } = await supabase
        .from("security_issues")
        .insert(issuesToInsert);
      
      if (insertError) {
        console.error(`Error inserting security issues for repository ${repositoryId}:`, insertError);
      }
    }
  } catch (error) {
    console.error(`Error processing security issues for repository ${repositoryId}:`, error);
  }
}

async function saveSonarData(
  supabase: any,
  sonarData: Map<string, SonarCloudData>
): Promise<void> {
  try {
    // Get all repositories
    const { data: repositories, error } = await supabase
      .from("repositories")
      .select("id, name");

    if (error) {
      console.error("Error fetching repositories for SonarCloud data:", error);
      throw error;
    }

    let savedCount = 0;
    let skippedCount = 0;

    // For each repository with sonar data, save it
    for (const repo of repositories || []) {
      try {
        const sonarInfo = sonarData.get(repo.name);
        
        if (!sonarInfo) {
          skippedCount++;
          continue;
        }

        // Check if sonar metrics already exist for this repository
        const { data: existingSonar, error: fetchError } = await supabase
          .from("sonar_metrics")
          .select("id")
          .eq("repository_id", repo.id)
          .maybeSingle();
        
        let sonarError;
        
        if (fetchError) {
          console.error(`Error checking SonarCloud data for ${repo.name}:`, fetchError);
        } else if (existingSonar) {
          // Update existing metrics
          const { error } = await supabase
            .from("sonar_metrics")
            .update({
              project_key: sonarInfo.project_key,
              lines_of_code: sonarInfo.metrics.lines_of_code,
              coverage: sonarInfo.metrics.coverage,
              bugs: sonarInfo.metrics.bugs,
              vulnerabilities: sonarInfo.metrics.vulnerabilities,
              code_smells: sonarInfo.metrics.code_smells,
              technical_debt: sonarInfo.metrics.technical_debt,
              complexity: sonarInfo.metrics.complexity,
              collected_at: new Date().toISOString()
            })
            .eq("id", existingSonar.id);
          
          sonarError = error;
        } else {
          // Insert new metrics
          const { error } = await supabase
            .from("sonar_metrics")
            .insert({
              repository_id: repo.id,
              project_key: sonarInfo.project_key,
              lines_of_code: sonarInfo.metrics.lines_of_code,
              coverage: sonarInfo.metrics.coverage,
              bugs: sonarInfo.metrics.bugs,
              vulnerabilities: sonarInfo.metrics.vulnerabilities,
              code_smells: sonarInfo.metrics.code_smells,
              technical_debt: sonarInfo.metrics.technical_debt,
              complexity: sonarInfo.metrics.complexity,
              collected_at: new Date().toISOString()
            });
          
          sonarError = error;
        }
        
        if (sonarError) {
          console.error(`Error saving SonarCloud data for ${repo.name}:`, sonarError);
        } else {
          console.log(`Successfully saved SonarCloud data for ${repo.name}`);
          savedCount++;
        }
      } catch (repoError) {
        console.error(`Unexpected error processing SonarCloud data for ${repo.name}:`, repoError);
      }
    }

    console.log(`Completed SonarCloud data sync - Saved: ${savedCount}, Skipped: ${skippedCount}`);
  } catch (error) {
    console.error("Error in saveSonarData:", error);
    throw error;
  }
}

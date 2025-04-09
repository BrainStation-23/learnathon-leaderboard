
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7';

// Required headers for CORS
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Handle CORS preflight requests
function handleCors(req: Request) {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
}

// Fetch repositories from GitHub
async function fetchRepositoriesForOrg(
  org: string,
  token: string
): Promise<any[]> {
  try {
    let allRepos: any[] = [];
    let page = 1;
    let hasMorePages = true;
    
    while (hasMorePages) {
      const url = `https://api.github.com/orgs/${org}/repos?per_page=100&page=${page}`;
      const response = await fetch(url, {
        headers: {
          Authorization: `token ${token}`,
          Accept: "application/vnd.github.v3+json",
        },
      });
      
      if (!response.ok) {
        throw new Error(`GitHub API error: ${response.status} - ${response.statusText}`);
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

// Fetch repository details (contributors, commits, etc.)
async function fetchRepoDetails(
  repoData: any[], 
  org: string,
  token: string
): Promise<any[]> {
  try {
    const enhancedRepos = await Promise.all(
      repoData.map(async (repo) => {
        try {
          // Fetch contributors
          const contributorsUrl = `https://api.github.com/repos/${org}/${repo.name}/contributors?per_page=100`;
          
          let contributors: any[] = [];
          let commits_count = 0;
          
          try {
            const contributorsResponse = await fetch(contributorsUrl, {
              headers: {
                Authorization: `token ${token}`,
                Accept: "application/vnd.github.v3+json",
              },
            });
            
            if (contributorsResponse.ok) {
              contributors = await contributorsResponse.json();
            }
          } catch (contributorsError) {
            console.error(`Failed to fetch contributors for ${repo.name}`, contributorsError);
          }

          // Fetch commit count
          const commitsUrl = `https://api.github.com/repos/${org}/${repo.name}/commits?per_page=1`;
          
          try {
            const commitsResponse = await fetch(commitsUrl, {
              headers: {
                Authorization: `token ${token}`,
                Accept: "application/vnd.github.v3+json",
              },
            });
            
            if (commitsResponse.ok) {
              // Get total count from header
              const linkHeader = commitsResponse.headers.get("link") || "";
              const match = linkHeader.match(/page=(\d+)>; rel="last"/);
              if (match) {
                commits_count = parseInt(match[1], 10);
              }
            }
          } catch (commitsError) {
            console.error(`Failed to fetch commit count for ${repo.name}`, commitsError);
          }
          
          // Fetch security vulnerabilities
          const securityIssues = await fetchSecurityIssues(org, repo.name, token);

          return {
            ...repo,
            contributors_count: contributors.length,
            commits_count,
            contributors,
            security_issues: securityIssues
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

// Fetch security issues for a repository
async function fetchSecurityIssues(
  org: string,
  repoName: string,
  token: string
): Promise<any[]> {
  try {
    // First try with Dependabot alerts API
    const dependabotUrl = `https://api.github.com/repos/${org}/${repoName}/dependabot/alerts`;
    
    try {
      const dependabotResponse = await fetch(dependabotUrl, {
        headers: {
          Authorization: `token ${token}`,
          Accept: "application/vnd.github.v4+json",
        },
      });
      
      if (dependabotResponse.ok) {
        const alerts = await dependabotResponse.json();
        
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
      }
      
      // If we get here, try with CodeQL alerts API
      const codeQLUrl = `https://api.github.com/repos/${org}/${repoName}/code-scanning/alerts`;
      const codeQLResponse = await fetch(codeQLUrl, {
        headers: {
          Authorization: `token ${token}`,
          Accept: "application/vnd.github.v3+json",
        },
      });
      
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
    } catch (error) {
      console.error(`Error fetching security issues for ${repoName}:`, error);
    }
    
    return [];
  } catch (error) {
    console.error(`Error in fetchSecurityIssues for ${repoName}:`, error);
    return [];
  }
}

// Save repository data to database
async function saveRepositoryData(
  repos: any[],
  supabase: any
): Promise<void> {
  try {
    // For each repository, upsert the data
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
          console.error(`Error upserting repository ${repo.name}`, repoError);
          continue;
        }

        if (!repoData || repoData.length === 0) continue;
        
        const repositoryId = repoData[0].id;

        // Save repository metrics
        await saveRepositoryMetrics(repositoryId, repo, supabase);
        
        // Save contributors data if available
        if (repo.contributors && repo.contributors.length > 0) {
          await saveContributors(repositoryId, repo.contributors, supabase);
        }
        
        // Save security issues if available
        if (repo.security_issues && repo.security_issues.length > 0) {
          await saveSecurityIssues(repositoryId, repo.security_issues, supabase);
        }
      } catch (repoError) {
        console.error(`Unexpected error processing repo ${repo.name}`, repoError);
      }
    }
  } catch (error) {
    console.error("Error in saveRepositoryData", error);
    throw error;
  }
}

async function saveRepositoryMetrics(
  repositoryId: string,
  repo: any,
  supabase: any
): Promise<void> {
  // First check if metrics already exist for this repository
  const { data: existingMetrics, error: fetchError } = await supabase
    .from("repository_metrics")
    .select("id")
    .eq("repository_id", repositoryId)
    .maybeSingle();

  let metricsError;
  
  if (fetchError && fetchError.code !== 'PGRST116') {
    console.error(`Error checking metrics for ${repo.name}`, fetchError);
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
    console.error(`Error upserting metrics for ${repo.name}`, metricsError);
  } else {
    console.log(`Successfully saved metrics for repository ${repo.name}`);
  }
}

async function saveContributors(
  repositoryId: string, 
  contributors: any[], 
  supabase: any
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

    if (contributorsToUpsert.length > 0) {
      const { error: contributorsError } = await supabase
        .from("contributors")
        .upsert(contributorsToUpsert, {
          onConflict: "repository_id,github_id",
          ignoreDuplicates: false
        });

      if (contributorsError) {
        console.error(`Error saving contributors`, contributorsError);
      } else {
        console.log(`Saved ${contributorsToUpsert.length} contributors for repository ${repositoryId}`);
      }
    }
  } catch (contribError) {
    console.error(`Error processing contributors`, contribError);
  }
}

async function saveSecurityIssues(
  repositoryId: string,
  securityIssues: any[],
  supabase: any
): Promise<void> {
  try {
    // First delete existing security issues for this repository
    const { error: deleteError } = await supabase
      .from("security_issues")
      .delete()
      .eq("repository_id", repositoryId);
      
    if (deleteError) {
      console.error(`Error deleting existing security issues for repository ${repositoryId}`, deleteError);
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
        console.error(`Error inserting security issues for repository ${repositoryId}`, insertError);
      } else {
        console.log(`Saved ${securityIssues.length} security issues for repository ${repositoryId}`);
      }
    }
  } catch (error) {
    console.error(`Error processing security issues for repository ${repositoryId}`, error);
  }
}

// Fetch SonarCloud data for repositories
async function fetchSonarCloudData(
  orgSlug: string,
  repos: any[]
): Promise<Map<string, any>> {
  try {
    const sonarDataMap = new Map<string, any>();
    
    // We'll fetch data for each repo in parallel
    await Promise.all(
      repos.map(async (repo) => {
        try {
          // Format repository name to handle special characters
          const formattedRepoName = repo.name.replace(/[^a-zA-Z0-9-_]/g, "-");
          
          const pascalCaseOrg = orgSlug.split('-')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join('-');
            
          const pascalCaseRepo = formattedRepoName.split('-')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join('');
          
          const possibleProjectKeys = [
            // Original formats we were trying
            `${orgSlug}_${formattedRepoName}`,
            `${orgSlug}-${formattedRepoName}`,
            `${formattedRepoName}`,
            // New formats with proper casing
            `${pascalCaseOrg}_${formattedRepoName}`,
            `${pascalCaseOrg}-${formattedRepoName}_${formattedRepoName}`,
            `${pascalCaseOrg}_${pascalCaseRepo}`,
          ];
          
          console.log(`Trying to find SonarCloud project for ${repo.name} with keys: ${possibleProjectKeys.join(', ')}`);

          let metricsData = null;
          let usedKey = '';
          
          // Try each project key format until we find one that works
          for (const projectKey of possibleProjectKeys) {
            try {
              // Fetch core metrics
              const apiUrl = `https://sonarcloud.io/api/measures/component?component=${projectKey}&metricKeys=ncloc,coverage,bugs,vulnerabilities,code_smells,sqale_index,cognitive_complexity`;
              
              console.log(`Trying SonarCloud key: ${projectKey}`);
              
              const metricsResponse = await fetch(
                apiUrl,
                {
                  headers: {
                    Accept: "application/json",
                  },
                }
              );

              if (metricsResponse.ok) {
                metricsData = await metricsResponse.json();
                usedKey = projectKey;
                console.log(`Found SonarCloud project using key format: ${projectKey}`);
                break; // Found a working key format, stop trying others
              }
            } catch (error) {
              // Continue to the next key format on error
              console.error(`Error with key format ${projectKey}:`, error);
            }
          }

          if (metricsData) {
            const metrics = extractMetrics(metricsData);
            
            sonarDataMap.set(repo.name, {
              project_key: usedKey,
              name: repo.name,
              metrics,
            });
          } else {
            // Failed with all key formats, log it
            console.log(`No SonarCloud data found for repository: ${repo.name}`);
          }
        } catch (error) {
          console.error(`Error fetching SonarCloud data for ${repo.name}:`, error);
        }
      })
    );

    return sonarDataMap;
  } catch (error) {
    console.error("Error fetching SonarCloud data:", error);
    throw error;
  }
}

// Extract metrics from SonarCloud response
function extractMetrics(metricsData: any): any {
  const measures = metricsData.component?.measures || [];
  const metrics: any = {};

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

// Format technical debt minutes into human-readable form
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

// Save SonarCloud data to database
async function saveSonarData(
  sonarData: Map<string, any>,
  supabase: any
): Promise<void> {
  try {
    // Get all repositories
    const { data: repositories, error } = await supabase
      .from("repositories")
      .select("id, name");

    if (error) {
      console.error("Error fetching repositories for SonarCloud data", error);
      throw error;
    }

    // For each repository with sonar data, save it
    for (const repo of repositories || []) {
      try {
        const sonarInfo = sonarData.get(repo.name);
        
        if (!sonarInfo) {
          continue;
        }

        // Check if sonar metrics already exist for this repository
        const { data: existingSonar, error: fetchError } = await supabase
          .from("sonar_metrics")
          .select("id")
          .eq("repository_id", repo.id)
          .maybeSingle();
        
        let sonarError;
        
        if (fetchError && fetchError.code !== 'PGRST116') {
          console.error(`Error checking SonarCloud data for ${repo.name}`, fetchError);
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
          console.error(`Error saving SonarCloud data for ${repo.name}`, sonarError);
        } else {
          console.log(`Successfully saved SonarCloud data for ${repo.name}`);
        }
      } catch (repoError) {
        console.error(`Unexpected error processing SonarCloud data for ${repo.name}`, repoError);
      }
    }
  } catch (error) {
    console.error("Error in saveSonarData", error);
    throw error;
  }
}

// Log to database
async function logToDatabase(
  supabase: any,
  action: string,
  entityType: string,
  details: Record<string, any>,
  userId?: string,
  entityId?: string
): Promise<void> {
  try {
    await supabase.from("audit_logs").insert({
      user_id: userId,
      action,
      entity_type: entityType,
      entity_id: entityId,
      details
    });
  } catch (error) {
    console.error("Failed to log to database:", error);
  }
}

// Get admin configuration
async function getAdminConfig(supabase: any): Promise<any> {
  try {
    const { data, error } = await supabase
      .from("configurations")
      .select("github_org, github_pat, sonarcloud_org, filtered_contributors")
      .single();

    if (error) {
      console.error("Error fetching admin configuration:", error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error("Failed to get admin configuration:", error);
    throw error;
  }
}

// Main handler for the edge function
Deno.serve(async (req) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  try {
    // Get Supabase client with service role for admin access
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseServiceRole = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    
    if (!supabaseUrl || !supabaseServiceRole) {
      return new Response(
        JSON.stringify({ error: 'Missing Supabase environment variables' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    const supabase = createClient(supabaseUrl, supabaseServiceRole);
    
    // Get admin configuration
    const config = await getAdminConfig(supabase);
    
    if (!config || !config.github_org || !config.github_pat || !config.sonarcloud_org) {
      return new Response(
        JSON.stringify({ error: 'No configuration found or incomplete configuration' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Starting data sync for GitHub org: ${config.github_org} and SonarCloud org: ${config.sonarcloud_org}`);

    // Start timing the operation
    const startTime = new Date();
    
    // Log the start of the operation
    await logToDatabase(
      supabase,
      'start_sync',
      'sync',
      { 
        github_org: config.github_org,
        sonarcloud_org: config.sonarcloud_org 
      },
      'system'
    );
    
    // 1. Fetch GitHub repositories
    console.log("Fetching GitHub repositories...");
    const repos = await fetchRepositoriesForOrg(config.github_org, config.github_pat);
    console.log(`Found ${repos.length} repositories on GitHub`);
    
    // 2. Fetch additional GitHub data (contributors, etc.)
    console.log("Fetching repository details...");
    const detailedRepos = await fetchRepoDetails(repos, config.github_org, config.github_pat);
    console.log(`Retrieved details for ${detailedRepos.length} repositories`);
    
    // 3. Save GitHub data to Supabase
    console.log("Saving repository data to database...");
    await saveRepositoryData(detailedRepos, supabase);
    console.log("Repository data saved successfully");
    
    // 4. Fetch SonarCloud data
    console.log("Fetching SonarCloud data...");
    const sonarDataMap = await fetchSonarCloudData(config.sonarcloud_org, detailedRepos);
    console.log(`Retrieved SonarCloud data for ${sonarDataMap.size} repositories`);
    
    // 5. Save SonarCloud data to Supabase
    console.log("Saving SonarCloud data to database...");
    await saveSonarData(sonarDataMap, supabase);
    console.log("SonarCloud data saved successfully");
    
    // Calculate duration
    const endTime = new Date();
    const duration = (endTime.getTime() - startTime.getTime()) / 1000;
    
    // Log the completion of the operation
    await logToDatabase(
      supabase,
      'complete_sync',
      'sync',
      { 
        github_org: config.github_org,
        sonarcloud_org: config.sonarcloud_org,
        duration: `${duration.toFixed(1)}s`,
        repositories: detailedRepos.length,
        sonarData: sonarDataMap.size
      },
      'system'
    );
    
    return new Response(
      JSON.stringify({
        success: true,
        message: `Data sync completed successfully in ${duration.toFixed(1)}s`,
        stats: {
          repositories: detailedRepos.length,
          sonarData: sonarDataMap.size,
          duration: `${duration.toFixed(1)}s`
        }
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
    
  } catch (error) {
    console.error('Error in data-sync function:', error);
    
    // Log the error
    try {
      const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
      const supabaseServiceRole = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
      
      if (supabaseUrl && supabaseServiceRole) {
        const supabase = createClient(supabaseUrl, supabaseServiceRole);
        await logToDatabase(
          supabase,
          'sync_error',
          'sync',
          { 
            error: error.message || 'Unknown error',
            stack: error.stack
          },
          'system'
        );
      }
    } catch (logError) {
      console.error('Failed to log error to database:', logError);
    }
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || 'Unknown error occurred'
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

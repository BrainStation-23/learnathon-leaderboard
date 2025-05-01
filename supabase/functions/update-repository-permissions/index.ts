
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'
import { z } from 'https://esm.sh/zod@3.21.4'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Schema validation for request body
const RequestSchema = z.object({
  permissionLevel: z.enum(['read', 'admin']),
  userId: z.string().uuid(),  // Require the userId to be passed from the frontend
  batchSize: z.number().min(1).max(100).optional(),
  startIndex: z.number().min(0).optional(),
})

interface RepositoryResult {
  name: string;
  success: boolean;
  errors?: string;
  collaboratorsUpdated?: number;
  collaboratorsSkipped?: number;
  rateLimit?: {
    remaining: number;
    resetTime: number;
  };
}

// Sleep function for rate limiting
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Format date for logging
const formatDate = () => {
  return new Date().toISOString();
};

// Log with timestamp and level
const log = (level: 'info' | 'warn' | 'error', message: string, data?: any) => {
  const timestamp = formatDate();
  const logMessage = `[${timestamp}] [${level.toUpperCase()}] ${message}`;
  
  if (data) {
    console.log(logMessage, data);
  } else {
    console.log(logMessage);
  }
};

Deno.serve(async (req) => {
  log('info', "Update repository permissions function called");
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    log('info', "Handling CORS preflight request");
    return new Response(null, { headers: corsHeaders });
  }
  
  try {
    // Create a Supabase client with the service role key
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseServiceRole = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    
    log('info', `SUPABASE_URL defined: ${!!supabaseUrl}, SUPABASE_SERVICE_ROLE_KEY defined: ${!!supabaseServiceRole}`);
    
    if (!supabaseUrl || !supabaseServiceRole) {
      log('error', "Missing Supabase environment variables");
      return new Response(
        JSON.stringify({ error: 'Server Configuration Error', message: 'Missing required environment variables' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create a server-side admin client
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRole);
    
    // Get and validate request body
    let requestBody;
    try {
      requestBody = await req.json();
      log('info', "Request body received", requestBody);
      
      const parsedBody = RequestSchema.safeParse(requestBody);
      
      if (!parsedBody.success) {
        log('error', "Invalid request body", parsedBody.error.format());
        return new Response(
          JSON.stringify({ 
            error: 'Bad Request', 
            message: 'Invalid request parameters',
            details: parsedBody.error.format()
          }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      // Extract validated data with defaults for batch processing
      const { 
        permissionLevel, 
        userId,
        batchSize = 100,  // Default batch size
        startIndex = 0    // Default start index
      } = parsedBody.data;
      
      // Use the service role to get the user data
      const { data: userData, error: userError } = await supabaseAdmin.auth.admin.getUserById(userId);
      
      if (userError || !userData) {
        log('error', "Error fetching user", userError);
        return new Response(
          JSON.stringify({ error: 'User Error', message: 'Could not validate user', details: userError?.message }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      log('info', `User ${userId} requested permission change to ${permissionLevel}`);
      
      // Get user's GitHub configuration
      log('info', "Fetching GitHub configuration for user:", userId);
      const { data: config, error: configError } = await supabaseAdmin
        .from('configurations')
        .select('github_org, github_pat')
        .eq('user_id', userId)
        .single();
        
      if (configError) {
        log('error', "Configuration fetch error:", configError);
      } else {
        log('info', "Config fetched", {
          hasGithubOrg: !!config?.github_org,
          hasGithubPat: !!config?.github_pat
        });
      }
        
      if (configError || !config || !config.github_pat || !config.github_org) {
        const reason = !config ? 'Configuration not found' : 
                       !config.github_pat ? 'GitHub PAT missing' : 
                       !config.github_org ? 'GitHub organization missing' : 
                       configError?.message;
        
        log('error', "Configuration error", { reason });             
        return new Response(
          JSON.stringify({ error: 'Configuration Error', message: 'GitHub configuration incomplete', details: reason }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      const { github_org, github_pat } = config;
      
      // Test PAT validity by checking user info first
      let initialRateLimit = {
        remaining: 5000,
        resetTime: 0
      };
      
      try {
        log('info', "Testing GitHub PAT validity");
        const testResponse = await fetch('https://api.github.com/user', {
          headers: {
            'Authorization': `token ${github_pat}`,
            'Accept': 'application/vnd.github.v3+json'
          }
        });
        
        log('info', "GitHub PAT test response status:", testResponse.status);
        
        // Save initial rate limit information
        initialRateLimit = {
          remaining: parseInt(testResponse.headers.get('x-ratelimit-remaining') || '5000'),
          resetTime: parseInt(testResponse.headers.get('x-ratelimit-reset') || '0')
        };
        
        log('info', "Initial GitHub rate limits", initialRateLimit);
        
        if (!testResponse.ok) {
          const errorMessage = await testResponse.text();
          log('error', 'GitHub PAT validation failed', errorMessage);
          
          return new Response(
            JSON.stringify({ 
              error: 'GitHub Authentication Error', 
              message: 'GitHub token validation failed. Token may be expired or have insufficient permissions.',
              details: errorMessage
            }),
            { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        
        // Check if rate limit is critically low
        if (initialRateLimit.remaining < 100) {
          log('warn', `Low GitHub rate limit remaining: ${initialRateLimit.remaining}`);
          
          // Check if we're below the threshold for safe operation
          if (initialRateLimit.remaining < 50) {
            const resetDate = new Date(initialRateLimit.resetTime * 1000);
            return new Response(
              JSON.stringify({ 
                error: 'Rate Limit Error', 
                message: `GitHub API rate limit too low (${initialRateLimit.remaining}). Please try again after ${resetDate.toISOString()}`,
                details: {
                  resetTime: initialRateLimit.resetTime,
                  resetDate: resetDate.toISOString()
                }
              }),
              { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }
        }
      } catch (error) {
        log('error', 'Error validating GitHub PAT', error);
        return new Response(
          JSON.stringify({ error: 'GitHub API Error', message: 'Failed to validate GitHub token', details: error.message }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      // Map permission level to GitHub API permission format
      const githubPermission = permissionLevel === 'read' ? 'pull' : 'admin';
      
      // Fetch all repositories for the organization with pagination support
      let allRepos = [];
      let page = 1;
      let hasMorePages = true;
      
      log('info', `Fetching repositories for organization ${github_org}`);
      
      // Estimate API calls needed - for planning purposes
      // We'll need 1 call per 100 repos, plus 2 calls per repo on average
      const estimatedCallsNeeded = Math.ceil(180 / 100) + (180 * 2);
      log('info', `Estimated API calls needed: ~${estimatedCallsNeeded} (with 180 repos)`, { 
        initialRateRemaining: initialRateLimit.remaining
      });
      
      while (hasMorePages) {
        try {
          log('info', `Fetching repositories page ${page}`);
          const requestStartTime = Date.now();
          
          const reposResponse = await fetch(`https://api.github.com/orgs/${github_org}/repos?per_page=100&page=${page}&type=public`, {
            headers: {
              'Accept': 'application/vnd.github.v3+json',
              'Authorization': `token ${github_pat}`
            }
          });
          
          const requestDuration = Date.now() - requestStartTime;
          
          // Capture rate limit information
          const rateLimit = {
            remaining: parseInt(reposResponse.headers.get('x-ratelimit-remaining') || '5000'),
            limit: parseInt(reposResponse.headers.get('x-ratelimit-limit') || '5000'),
            resetTime: parseInt(reposResponse.headers.get('x-ratelimit-reset') || '0')
          };
          
          log('info', `Repo fetch page ${page} completed in ${requestDuration}ms, rate limit: ${rateLimit.remaining}/${rateLimit.limit}`);
          
          if (!reposResponse.ok) {
            const errorText = await reposResponse.text();
            throw new Error(`Failed to fetch repos (page ${page}, status ${reposResponse.status}): ${errorText}`);
          }
          
          const repos = await reposResponse.json();
          
          // Check if we received any repos
          if (repos.length === 0) {
            log('info', `No more repositories found on page ${page}`);
            hasMorePages = false;
          } else {
            log('info', `Retrieved ${repos.length} repositories on page ${page}`);
            allRepos = [...allRepos, ...repos];
            
            // Check Link header for next page
            const linkHeader = reposResponse.headers.get('Link');
            hasMorePages = linkHeader ? linkHeader.includes('rel="next"') : false;
            page++;
            
            // Check rate limit and wait if needed
            if (rateLimit.remaining < 50) {
              const resetTime = rateLimit.resetTime * 1000;
              const now = Date.now();
              if (resetTime > now) {
                const waitTime = resetTime - now + 5000; // Add 5s buffer
                log('warn', `Critical GitHub rate limit: ${rateLimit.remaining} requests remaining. Waiting ${waitTime/1000}s for rate limit reset`);
                // Wait for rate limit to reset
                await sleep(waitTime);
              }
            } else if (rateLimit.remaining < 100) {
              // Add small delay to conserve rate limit
              log('warn', `Low GitHub rate limit: ${rateLimit.remaining} - adding delay between requests`);
              await sleep(1000);
            }
          }
        } catch (error) {
          log('error', `Error fetching repositories page ${page}:`, error);
          return new Response(
            JSON.stringify({ error: 'GitHub API Error', message: `Failed to fetch repositories (page ${page})`, details: error.message }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      }
      
      log('info', `Found ${allRepos.length} repositories for organization ${github_org}`);
      
      // Apply batching if requested
      const totalRepositories = allRepos.length;
      const endIndex = Math.min(startIndex + batchSize, totalRepositories);
      
      // Slice the array to get just the requested batch
      const batchRepos = allRepos.slice(startIndex, endIndex);
      
      log('info', `Processing batch of repositories: ${startIndex} to ${endIndex - 1} of ${totalRepositories} total repositories`);
      
      // Process each repository in the batch
      const results: RepositoryResult[] = [];
      let successCount = 0;
      let failureCount = 0;
      let reposWithDirectCollaborators = 0;
      let reposWithoutDirectCollaborators = 0;
      
      for (const repo of batchRepos) {
        try {
          log('info', `Processing repository: ${repo.name} [${batchRepos.indexOf(repo) + 1}/${batchRepos.length}]`);
          
          // Get ONLY direct repository collaborators with pagination
          // Using affiliation=direct to filter for direct collaborators only
          let directCollaborators = [];
          let collabPage = 1;
          let hasMoreCollabs = true;
          
          while (hasMoreCollabs) {
            try {
              log('info', `Fetching collaborators for ${repo.name}, page ${collabPage}`);
              const collabRequestStartTime = Date.now();
              
              const collabResponse = await fetch(
                `https://api.github.com/repos/${github_org}/${repo.name}/collaborators?per_page=100&page=${collabPage}&affiliation=direct`, 
                {
                  headers: {
                    'Accept': 'application/vnd.github.v3+json',
                    'Authorization': `token ${github_pat}`
                  }
                }
              );
              
              const collabRequestDuration = Date.now() - collabRequestStartTime;
              
              // Check for rate limit information
              const rateLimit = {
                remaining: parseInt(collabResponse.headers.get('x-ratelimit-remaining') || '5000'),
                limit: parseInt(collabResponse.headers.get('x-ratelimit-limit') || '5000'),
                reset: parseInt(collabResponse.headers.get('x-ratelimit-reset') || '0')
              };
              
              log('info', `Collaborator fetch for ${repo.name} page ${collabPage} completed in ${collabRequestDuration}ms, rate limit: ${rateLimit.remaining}/${rateLimit.limit}`);
              
              if (!collabResponse.ok) {
                if (collabResponse.status === 403 && rateLimit.remaining === 0) {
                  // Rate limited - wait and retry
                  const resetTime = rateLimit.reset * 1000;
                  const now = Date.now();
                  if (resetTime > now) {
                    const waitTime = resetTime - now + 5000; // Add 5s buffer
                    log('warn', `Rate limited when fetching collaborators. Waiting ${waitTime/1000}s for reset`);
                    await sleep(waitTime);
                    continue; // Retry this page
                  }
                }
                
                if (collabResponse.status === 404) {
                  // Repository may have been deleted or renamed
                  log('warn', `Repository not found: ${repo.name}. It may have been deleted or renamed.`);
                  throw new Error(`Repository not found: ${repo.name}. It may have been deleted or renamed.`);
                }
                
                const errorText = await collabResponse.text();
                throw new Error(`Failed to fetch direct collaborators for ${repo.name} (page ${collabPage}, status ${collabResponse.status}): ${errorText}`);
              }
              
              const collaborators = await collabResponse.json();
              
              // Check if we received any collaborators
              if (collaborators.length === 0) {
                log('info', `No more collaborators found for ${repo.name} on page ${collabPage}`);
                hasMoreCollabs = false;
              } else {
                log('info', `Found ${collaborators.length} collaborators for ${repo.name} on page ${collabPage}`);
                directCollaborators = [...directCollaborators, ...collaborators];
                
                // Check Link header for next page
                const linkHeader = collabResponse.headers.get('Link');
                hasMoreCollabs = linkHeader ? linkHeader.includes('rel="next"') : false;
                collabPage++;
                
                // Add a small delay between requests to avoid abuse detection
                if (rateLimit.remaining < 100) {
                  await sleep(500); 
                } else {
                  await sleep(100);
                }
              }
            } catch (error) {
              log('error', `Error fetching direct collaborators for ${repo.name} page ${collabPage}`, error);
              throw new Error(`Error fetching direct collaborators for ${repo.name} page ${collabPage}: ${error.message}`);
            }
          }
          
          log('info', `Found ${directCollaborators.length} direct collaborators for ${repo.name}`);
          
          // If no direct collaborators, continue to next repo and don't count it as a failure
          if (directCollaborators.length === 0) {
            log('info', `No direct collaborators found for ${repo.name}, skipping`);
            reposWithoutDirectCollaborators++;
            results.push({
              name: repo.name,
              success: true,
              collaboratorsUpdated: 0,
              collaboratorsSkipped: 0,
              errors: "No direct collaborators found"
            });
            continue;
          }
          
          reposWithDirectCollaborators++;
          let collaboratorsUpdated = 0;
          let collaboratorsSkipped = 0;
          let collaboratorErrors = [];
          
          // Update each direct collaborator's permission
          for (const collaborator of directCollaborators) {
            // Skip bot accounts (usually end with [bot])
            if (collaborator.login.endsWith('[bot]')) {
              log('info', `Skipping bot account: ${collaborator.login} in ${repo.name}`);
              collaboratorsSkipped++;
              continue;
            }
            
            try {
              log('info', `Updating permission for ${collaborator.login} in ${repo.name} to ${githubPermission}`);
              const updateStartTime = Date.now();
              
              const updateResponse = await fetch(`https://api.github.com/repos/${github_org}/${repo.name}/collaborators/${collaborator.login}`, {
                method: 'PUT',
                headers: {
                  'Accept': 'application/vnd.github.v3+json',
                  'Authorization': `token ${github_pat}`,
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify({ permission: githubPermission })
              });
              
              const updateDuration = Date.now() - updateStartTime;
              
              // Check for rate limit information
              const rateLimit = {
                remaining: parseInt(updateResponse.headers.get('x-ratelimit-remaining') || '5000'),
                limit: parseInt(updateResponse.headers.get('x-ratelimit-limit') || '5000'),
                reset: parseInt(updateResponse.headers.get('x-ratelimit-reset') || '0')
              };
              
              log('info', `Permission update for ${collaborator.login} in ${repo.name} completed in ${updateDuration}ms, status: ${updateResponse.status}, rate limit: ${rateLimit.remaining}/${rateLimit.limit}`);
              
              if (!updateResponse.ok) {
                if (updateResponse.status === 403 && rateLimit.remaining === 0) {
                  // Rate limited - wait and retry
                  const resetTime = rateLimit.reset * 1000;
                  const now = Date.now();
                  if (resetTime > now) {
                    const waitTime = resetTime - now + 5000; // Add 5s buffer
                    log('warn', `Rate limited during permission update. Waiting ${waitTime/1000}s for reset`);
                    await sleep(waitTime);
                    // Retry this collaborator update
                    continue;
                  }
                }
                
                const errorText = await updateResponse.text();
                throw new Error(`Failed to update ${collaborator.login} (status ${updateResponse.status}): ${errorText}`);
              }
              
              log('info', `Successfully updated ${collaborator.login} to ${githubPermission} permission on ${repo.name}`);
              collaboratorsUpdated++;
              
              // Add delay based on rate limit
              if (rateLimit.remaining < 50) {
                await sleep(500); // Slow down significantly if rate limit is getting low
              } else if (rateLimit.remaining < 100) {
                await sleep(200); // Moderate delay for lower rate limits
              } else {
                await sleep(100); // Small delay for normal operation
              }
            } catch (error) {
              log('error', `Error updating ${collaborator.login} on ${repo.name}:`, error);
              collaboratorErrors.push(`${collaborator.login}: ${error.message}`);
              collaboratorsSkipped++;
            }
          }
          
          // Add result for this repo
          const repoResult: RepositoryResult = {
            name: repo.name,
            success: collaboratorErrors.length === 0,
            collaboratorsUpdated,
            collaboratorsSkipped
          };
          
          if (collaboratorErrors.length > 0) {
            repoResult.errors = collaboratorErrors.join('; ');
          }
          
          results.push(repoResult);
          
          if (collaboratorErrors.length === 0) {
            successCount++;
          } else {
            // Consider partial success if at least one collaborator was updated
            if (collaboratorsUpdated > 0) {
              successCount++;
            } else {
              failureCount++;
            }
          }
        } catch (error) {
          log('error', `Error processing repo ${repo.name}:`, error);
          results.push({
            name: repo.name,
            success: false,
            errors: error.message,
            collaboratorsUpdated: 0,
            collaboratorsSkipped: 0
          });
          
          failureCount++;
        }
      }
      
      // Log the action in audit_logs
      try {
        await supabaseAdmin.rpc('log_audit_event', {
          p_user_id: userId,
          p_action: 'update_repository_permissions',
          p_entity_type: 'repository',
          p_entity_id: null,
          p_details: { 
            permission_level: permissionLevel,
            repos_processed: batchRepos.length,
            repos_with_direct_collaborators: reposWithDirectCollaborators,
            repos_without_direct_collaborators: reposWithoutDirectCollaborators,
            success_count: successCount,
            failure_count: failureCount,
            batch_info: {
              startIndex,
              endIndex: endIndex - 1,
              batchSize,
              totalRepositories
            }
          }
        });
        log('info', 'Successfully logged audit event');
      } catch (auditError) {
        log('error', 'Failed to log audit event:', auditError);
        // Continue despite audit log failure
      }
      
      // Create response with pagination info
      const responseBody = {
        message: 'Repository permissions update completed',
        totalRepos: allRepos.length,
        reposWithDirectCollaborators,
        reposWithoutDirectCollaborators,
        successCount,
        failureCount,
        results,
        batchInfo: {
          startIndex,
          endIndex: endIndex - 1,
          batchSize,
          totalRepositories,
          hasMoreBatches: endIndex < totalRepositories,
          nextBatchStartIndex: endIndex < totalRepositories ? endIndex : null
        },
        rateLimitInfo: {
          initialRemaining: initialRateLimit.remaining,
          // We'll get the current remaining from the last API call, or default to the initial value
          currentRemaining: results.length > 0 && results[results.length - 1].rateLimit ? 
                           results[results.length - 1].rateLimit.remaining : 
                           initialRateLimit.remaining
        }
      };
      
      log('info', 'Function completed successfully', { 
        reposProcessed: batchRepos.length,
        successCount,
        failureCount
      });
      
      return new Response(
        JSON.stringify(responseBody),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } catch (error) {
      log('error', "Error parsing request or processing data:", error);
      return new Response(
        JSON.stringify({ error: 'Bad Request', message: 'Error processing request data', details: error.message }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
  } catch (error) {
    log('error', 'Unhandled error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal Server Error', message: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
})

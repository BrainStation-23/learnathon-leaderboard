
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'
import { z } from 'https://esm.sh/zod@3.21.4'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Schema validation for request body
const RequestSchema = z.object({
  permissionLevel: z.enum(['read', 'admin']),
  userId: z.string().uuid()  // Require the userId to be passed from the frontend
})

interface RepositoryResult {
  name: string;
  success: boolean;
  errors?: string;
  collaboratorsUpdated?: number;
  rateLimit?: {
    remaining: number;
    reset: number;
  };
}

// Sleep function for rate limiting
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

Deno.serve(async (req) => {
  console.log("Update repository permissions function called");
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    console.log("Handling CORS preflight request");
    return new Response(null, { headers: corsHeaders });
  }
  
  try {
    // Create a Supabase client with the service role key
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseServiceRole = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    
    console.log(`SUPABASE_URL defined: ${!!supabaseUrl}`);
    console.log(`SUPABASE_SERVICE_ROLE_KEY defined: ${!!supabaseServiceRole}`);
    
    if (!supabaseUrl || !supabaseServiceRole) {
      console.error("Missing Supabase environment variables");
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
      console.log("Request body:", JSON.stringify(requestBody));
      
      const parsedBody = RequestSchema.safeParse(requestBody);
      
      if (!parsedBody.success) {
        console.error("Invalid request body:", parsedBody.error.format());
        return new Response(
          JSON.stringify({ 
            error: 'Bad Request', 
            message: 'Invalid request parameters',
            details: parsedBody.error.format()
          }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      // Extract validated data
      const { permissionLevel, userId } = parsedBody.data;
      
      // Use the service role to get the user data
      const { data: userData, error: userError } = await supabaseAdmin.auth.admin.getUserById(userId);
      
      if (userError || !userData) {
        console.error("Error fetching user:", userError);
        return new Response(
          JSON.stringify({ error: 'User Error', message: 'Could not validate user', details: userError?.message }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      console.log(`User ${userId} requested permission change to ${permissionLevel}`);
      
      // Get user's GitHub configuration
      console.log("Fetching GitHub configuration for user:", userId);
      const { data: config, error: configError } = await supabaseAdmin
        .from('configurations')
        .select('github_org, github_pat')
        .eq('user_id', userId)
        .single();
        
      if (configError) {
        console.error("Configuration fetch error:", configError);
      } else {
        console.log("Config fetched:", {
          hasGithubOrg: !!config?.github_org,
          hasGithubPat: !!config?.github_pat
        });
      }
        
      if (configError || !config || !config.github_pat || !config.github_org) {
        const reason = !config ? 'Configuration not found' : 
                       !config.github_pat ? 'GitHub PAT missing' : 
                       !config.github_org ? 'GitHub organization missing' : 
                       configError?.message;
        
        console.error("Configuration error:", reason);             
        return new Response(
          JSON.stringify({ error: 'Configuration Error', message: 'GitHub configuration incomplete', details: reason }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      const { github_org, github_pat } = config;
      
      // Test PAT validity by checking user info first
      try {
        console.log("Testing GitHub PAT validity");
        const testResponse = await fetch('https://api.github.com/user', {
          headers: {
            'Authorization': `token ${github_pat}`,
            'Accept': 'application/vnd.github.v3+json'
          }
        });
        
        console.log("GitHub PAT test response status:", testResponse.status);
        
        if (!testResponse.ok) {
          const errorMessage = await testResponse.text();
          console.error('GitHub PAT validation failed:', errorMessage);
          
          return new Response(
            JSON.stringify({ 
              error: 'GitHub Authentication Error', 
              message: 'GitHub token validation failed. Token may be expired or have insufficient permissions.',
              details: errorMessage
            }),
            { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        
        // Check rate limit
        const rateLimit = {
          remaining: parseInt(testResponse.headers.get('x-ratelimit-remaining') || '5000'),
          resetTime: parseInt(testResponse.headers.get('x-ratelimit-reset') || '0')
        };
        
        console.log("GitHub rate limits:", rateLimit);
        
        if (rateLimit.remaining < 100) {
          console.warn(`Low GitHub rate limit remaining: ${rateLimit.remaining}`);
          // Continue but log the warning
        }
      } catch (error) {
        console.error('Error validating GitHub PAT:', error);
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
      
      console.log(`Fetching repositories for organization ${github_org}`);
      
      while (hasMorePages) {
        try {
          const reposResponse = await fetch(`https://api.github.com/orgs/${github_org}/repos?per_page=100&page=${page}&type=public`, {
            headers: {
              'Accept': 'application/vnd.github.v3+json',
              'Authorization': `token ${github_pat}`
            }
          });
          
          if (!reposResponse.ok) {
            throw new Error(`Failed to fetch repos (page ${page}): ${await reposResponse.text()}`);
          }
          
          const repos = await reposResponse.json();
          
          // Check if we received any repos
          if (repos.length === 0) {
            hasMorePages = false;
          } else {
            allRepos = [...allRepos, ...repos];
            
            // Check Link header for next page
            const linkHeader = reposResponse.headers.get('Link');
            hasMorePages = linkHeader ? linkHeader.includes('rel="next"') : false;
            page++;
            
            // Check rate limit
            const remaining = parseInt(reposResponse.headers.get('x-ratelimit-remaining') || '1000');
            if (remaining < 20) {
              console.warn(`Critical GitHub rate limit: ${remaining} requests remaining. Pausing.`);
              // Calculate reset time and wait if needed
              const resetTime = parseInt(reposResponse.headers.get('x-ratelimit-reset') || '0') * 1000;
              const now = Date.now();
              if (resetTime > now) {
                const waitTime = resetTime - now + 5000; // Add 5s buffer
                console.log(`Waiting ${waitTime/1000}s for rate limit reset`);
                await sleep(waitTime);
              }
            }
          }
        } catch (error) {
          console.error(`Error fetching repositories page ${page}:`, error);
          return new Response(
            JSON.stringify({ error: 'GitHub API Error', message: `Failed to fetch repositories (page ${page})`, details: error.message }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      }
      
      console.log(`Found ${allRepos.length} repositories for organization ${github_org}`);
      
      // Process each repository
      const results: RepositoryResult[] = [];
      let successCount = 0;
      let failureCount = 0;
      
      for (const repo of allRepos) {
        try {
          console.log(`Processing repository: ${repo.name}`);
          
          // Get repository collaborators with pagination
          let allCollaborators = [];
          let collabPage = 1;
          let hasMoreCollabs = true;
          
          while (hasMoreCollabs) {
            try {
              const collabResponse = await fetch(`https://api.github.com/repos/${github_org}/${repo.name}/collaborators?per_page=100&page=${collabPage}`, {
                headers: {
                  'Accept': 'application/vnd.github.v3+json',
                  'Authorization': `token ${github_pat}`
                }
              });
              
              // Check for rate limit information
              const rateLimit = {
                remaining: parseInt(collabResponse.headers.get('x-ratelimit-remaining') || '5000'),
                reset: parseInt(collabResponse.headers.get('x-ratelimit-reset') || '0')
              };
              
              if (!collabResponse.ok) {
                if (collabResponse.status === 403 && rateLimit.remaining === 0) {
                  // Rate limited - wait and retry
                  const resetTime = rateLimit.reset * 1000;
                  const now = Date.now();
                  if (resetTime > now) {
                    const waitTime = resetTime - now + 5000; // Add 5s buffer
                    console.log(`Rate limited. Waiting ${waitTime/1000}s for reset`);
                    await sleep(waitTime);
                    continue; // Retry this page
                  }
                }
                
                throw new Error(`Failed to fetch collaborators for ${repo.name} (page ${collabPage}): ${await collabResponse.text()}`);
              }
              
              const collaborators = await collabResponse.json();
              
              // Check if we received any collaborators
              if (collaborators.length === 0) {
                hasMoreCollabs = false;
              } else {
                allCollaborators = [...allCollaborators, ...collaborators];
                
                // Check Link header for next page
                const linkHeader = collabResponse.headers.get('Link');
                hasMoreCollabs = linkHeader ? linkHeader.includes('rel="next"') : false;
                collabPage++;
                
                // Add a small delay between requests to avoid abuse detection
                await sleep(100);
              }
            } catch (error) {
              throw new Error(`Error fetching collaborators page ${collabPage}: ${error.message}`);
            }
          }
          
          console.log(`Found ${allCollaborators.length} collaborators for ${repo.name}`);
          let collaboratorsUpdated = 0;
          let collaboratorErrors = [];
          
          // Update each collaborator's permission
          for (const collaborator of allCollaborators) {
            // Skip bot accounts (usually end with [bot])
            if (collaborator.login.endsWith('[bot]')) {
              continue;
            }
            
            try {
              const updateResponse = await fetch(`https://api.github.com/repos/${github_org}/${repo.name}/collaborators/${collaborator.login}`, {
                method: 'PUT',
                headers: {
                  'Accept': 'application/vnd.github.v3+json',
                  'Authorization': `token ${github_pat}`,
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify({ permission: githubPermission })
              });
              
              // Check for rate limit information
              const rateLimit = {
                remaining: parseInt(updateResponse.headers.get('x-ratelimit-remaining') || '5000'),
                reset: parseInt(updateResponse.headers.get('x-ratelimit-reset') || '0')
              };
              
              if (!updateResponse.ok) {
                if (updateResponse.status === 403 && rateLimit.remaining === 0) {
                  // Rate limited - wait and retry
                  const resetTime = rateLimit.reset * 1000;
                  const now = Date.now();
                  if (resetTime > now) {
                    const waitTime = resetTime - now + 5000; // Add 5s buffer
                    console.log(`Rate limited. Waiting ${waitTime/1000}s for reset`);
                    await sleep(waitTime);
                    // Retry this collaborator update
                    continue;
                  }
                }
                
                const errorText = await updateResponse.text();
                throw new Error(`Failed to update ${collaborator.login}: ${errorText}`);
              }
              
              collaboratorsUpdated++;
              await sleep(100); // Small delay to avoid hitting rate limits too quickly
            } catch (error) {
              console.error(`Error updating ${collaborator.login} on ${repo.name}:`, error);
              collaboratorErrors.push(`${collaborator.login}: ${error.message}`);
            }
          }
          
          // Add result for this repo
          const repoResult: RepositoryResult = {
            name: repo.name,
            success: collaboratorErrors.length === 0,
            collaboratorsUpdated
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
          console.error(`Error processing repo ${repo.name}:`, error);
          results.push({
            name: repo.name,
            success: false,
            errors: error.message
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
            repos_processed: allRepos.length,
            success_count: successCount,
            failure_count: failureCount
          }
        });
      } catch (auditError) {
        console.error('Failed to log audit event:', auditError);
        // Continue despite audit log failure
      }
      
      return new Response(
        JSON.stringify({
          message: 'Repository permissions update completed',
          totalRepos: allRepos.length,
          successCount,
          failureCount,
          results
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } catch (error) {
      console.error("Error parsing request or processing data:", error);
      return new Response(
        JSON.stringify({ error: 'Bad Request', message: 'Error processing request data', details: error.message }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
  } catch (error) {
    console.error('Unhandled error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal Server Error', message: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
})

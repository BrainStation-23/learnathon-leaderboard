
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface RequestBody {
  permissionLevel: 'read' | 'admin'
}

interface RepositoryResult {
  name: string;
  success: boolean;
  errors?: string;
  collaboratorsUpdated?: number;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  
  try {
    // Get the JWT from the request if available
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized', message: 'No authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
    
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    )

    // Get request body
    const { permissionLevel } = await req.json() as RequestBody
    
    if (permissionLevel !== 'read' && permissionLevel !== 'admin') {
      return new Response(
        JSON.stringify({ error: 'Bad Request', message: 'Permission level must be "read" or "admin"' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
    
    // Get user id from JWT
    const { data: { user } } = await supabaseClient.auth.getUser()
    if (!user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized', message: 'User not found' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
    
    console.log(`User ${user.id} requested permission change to ${permissionLevel}`)
    
    // Get user's GitHub configuration
    const { data: config, error: configError } = await supabaseClient
      .from('configurations')
      .select('github_org, github_pat')
      .eq('user_id', user.id)
      .single()
      
    if (configError || !config) {
      return new Response(
        JSON.stringify({ error: 'Not Found', message: 'GitHub configuration not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
    
    const { github_org, github_pat } = config
    
    // Map permission level to GitHub API permission format
    const githubPermission = permissionLevel === 'read' ? 'pull' : 'admin'
    
    // Fetch all repositories for the organization
    const reposResponse = await fetch(`https://api.github.com/orgs/${github_org}/repos?per_page=100&type=public`, {
      headers: {
        'Accept': 'application/vnd.github.v3+json',
        'Authorization': `token ${github_pat}`
      }
    })
    
    if (!reposResponse.ok) {
      const errorData = await reposResponse.text()
      console.error(`Failed to fetch repos: ${errorData}`)
      return new Response(
        JSON.stringify({ error: 'GitHub API Error', message: 'Failed to fetch repositories', details: errorData }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
    
    const repos = await reposResponse.json()
    
    // Process each repository
    const results: RepositoryResult[] = []
    let successCount = 0
    let failureCount = 0
    
    for (const repo of repos) {
      try {
        // Get repository collaborators
        const collabResponse = await fetch(`https://api.github.com/repos/${github_org}/${repo.name}/collaborators?per_page=100`, {
          headers: {
            'Accept': 'application/vnd.github.v3+json',
            'Authorization': `token ${github_pat}`
          }
        })
        
        if (!collabResponse.ok) {
          throw new Error(`Failed to fetch collaborators: ${await collabResponse.text()}`)
        }
        
        const collaborators = await collabResponse.json()
        let collaboratorsUpdated = 0
        
        // Update each collaborator's permission
        for (const collaborator of collaborators) {
          // Skip bot accounts (usually end with [bot])
          if (collaborator.login.endsWith('[bot]')) {
            continue
          }
          
          const updateResponse = await fetch(`https://api.github.com/repos/${github_org}/${repo.name}/collaborators/${collaborator.login}`, {
            method: 'PUT',
            headers: {
              'Accept': 'application/vnd.github.v3+json',
              'Authorization': `token ${github_pat}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ permission: githubPermission })
          })
          
          if (updateResponse.ok) {
            collaboratorsUpdated++
          } else {
            console.error(`Failed to update ${collaborator.login} on ${repo.name}: ${await updateResponse.text()}`)
          }
        }
        
        results.push({
          name: repo.name,
          success: true,
          collaboratorsUpdated
        })
        
        successCount++
        
      } catch (error) {
        console.error(`Error processing repo ${repo.name}:`, error)
        results.push({
          name: repo.name,
          success: false,
          errors: error.message
        })
        
        failureCount++
      }
    }
    
    // Log the action in audit_logs
    await supabaseClient.rpc('log_audit_event', {
      p_user_id: user.id,
      p_action: 'update_repository_permissions',
      p_entity_type: 'repository',
      p_entity_id: null,
      p_details: { 
        permission_level: permissionLevel,
        repos_processed: repos.length,
        success_count: successCount,
        failure_count: failureCount
      }
    })
    
    return new Response(
      JSON.stringify({
        message: 'Repository permissions update completed',
        totalRepos: repos.length,
        successCount,
        failureCount,
        results
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
    
  } catch (error) {
    console.error('Unhandled error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal Server Error', message: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

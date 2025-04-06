
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Set up CORS headers
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Create a Supabase client
const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const supabase = createClient(supabaseUrl, supabaseServiceKey);

serve(async (req) => {
  // Handle CORS preflight request
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    });
  }

  try {
    // Only allow POST requests for webhook events
    if (req.method !== "POST") {
      return new Response(
        JSON.stringify({ error: "Method not allowed" }),
        { 
          status: 405,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        }
      );
    }

    // Get the webhook payload
    const payload = await req.json();
    const event = req.headers.get("x-github-event");

    console.log(`Received GitHub webhook: ${event}`);

    // Process different webhook events
    if (event === "push") {
      await processPushEvent(payload);
    } else if (event === "pull_request") {
      await processPullRequestEvent(payload);
    } else {
      console.log(`Unhandled event type: ${event}`);
    }

    return new Response(
      JSON.stringify({ success: true }),
      { 
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );
  } catch (error) {
    console.error("Webhook processing error:", error);
    
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { 
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );
  }
});

// Process push events
async function processPushEvent(payload: any) {
  const repoName = payload.repository?.name;
  const repoId = payload.repository?.id;

  if (!repoName || !repoId) {
    console.error("Missing repository information in webhook payload");
    return;
  }

  try {
    // Find the repository in our database
    const { data: repoData, error: repoError } = await supabase
      .from("repositories")
      .select("id")
      .eq("github_repo_id", repoId)
      .single();

    if (repoError) {
      console.error(`Error finding repository ${repoName}:`, repoError);
      return;
    }

    if (!repoData) {
      console.log(`Repository ${repoName} not found in our database`);
      return;
    }

    // Update the commit count (simple increment for now)
    const { error: updateError } = await supabase.rpc("increment_commit_count", { 
      repo_id: repoData.id,
      count: 1  // Each push might contain multiple commits, but for simplicity we'll add 1
    });

    if (updateError) {
      console.error(`Error updating commit count for ${repoName}:`, updateError);
    }

    console.log(`Successfully processed push event for ${repoName}`);
  } catch (error) {
    console.error(`Error processing push event for ${repoName}:`, error);
  }
}

// Process pull request events
async function processPullRequestEvent(payload: any) {
  // Can be implemented in the future to track PR-related metrics
  console.log("Pull request event received, but not yet implemented");
}

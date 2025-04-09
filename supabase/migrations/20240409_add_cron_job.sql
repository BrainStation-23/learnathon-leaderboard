
-- Enable the required extensions
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Create a scheduled job to run the data-sync function every day at 2:00 AM UTC
SELECT cron.schedule(
  'daily-data-sync',        -- job name
  '0 2 * * *',              -- cron schedule (2:00 AM every day)
  $$
  SELECT
    net.http_post(
      url:='https://gxfdqrussltcibptiltm.supabase.co/functions/v1/data-sync',
      headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd4ZmRxcnVzc2x0Y2licHRpbHRtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM5NDE1NjUsImV4cCI6MjA1OTUxNzU2NX0.aJbVEWeoKnzIUiafuhHvTyGznae7B-YnFCznc6ZU3G0"}'::jsonb,
      body:='{"automated": true, "source": "pg_cron"}'::jsonb
    ) as request_id;
  $$
);

-- We also need a function to store admin configuration for the service to use
-- Create a function to ensure an admin configuration exists
CREATE OR REPLACE FUNCTION public.ensure_admin_config()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  config_exists boolean;
  any_config_exists boolean;
BEGIN
  -- Check if an admin configuration already exists
  SELECT EXISTS (
    SELECT 1 
    FROM public.configurations 
    WHERE user_id = '00000000-0000-0000-0000-000000000000'
  ) INTO config_exists;
  
  -- Check if any configuration exists
  SELECT EXISTS (
    SELECT 1 
    FROM public.configurations 
    LIMIT 1
  ) INTO any_config_exists;
  
  IF NOT config_exists AND any_config_exists THEN
    -- If no admin config but some other config exists, copy the first one
    INSERT INTO public.configurations 
      (user_id, github_org, github_pat, sonarcloud_org, filtered_contributors)
    SELECT 
      '00000000-0000-0000-0000-000000000000',
      github_org,
      github_pat,
      sonarcloud_org,
      filtered_contributors
    FROM 
      public.configurations
    LIMIT 1;
  END IF;
END;
$$;

-- Run the function to ensure admin configuration
SELECT public.ensure_admin_config();

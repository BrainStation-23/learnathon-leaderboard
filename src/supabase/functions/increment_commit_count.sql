
-- Create a function to increment the commit count for a repository
CREATE OR REPLACE FUNCTION increment_commit_count(repo_id UUID, count INT)
RETURNS void AS $$
DECLARE
  metric_id UUID;
BEGIN
  -- Check if a metric record already exists for this repository
  SELECT id INTO metric_id
  FROM repository_metrics
  WHERE repository_id = repo_id;
  
  IF metric_id IS NULL THEN
    -- Create a new metric record if none exists
    INSERT INTO repository_metrics (repository_id, commits_count, last_commit_date)
    VALUES (repo_id, count, now());
  ELSE
    -- Update the existing record
    UPDATE repository_metrics
    SET 
      commits_count = commits_count + count,
      last_commit_date = now(),
      collected_at = now()
    WHERE id = metric_id;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


CREATE OR REPLACE FUNCTION public.get_contributors_with_repos(
  p_page INTEGER DEFAULT 1,
  p_page_size INTEGER DEFAULT 20,
  p_filtered_logins TEXT[] DEFAULT ARRAY[]::TEXT[]
)
RETURNS TABLE (
  login TEXT,
  avatar_url TEXT,
  repository_id UUID,
  repository_name TEXT,
  contributions INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    c.login,
    c.avatar_url,
    c.repository_id,
    r.name AS repository_name,
    c.contributions
  FROM 
    public.contributors c
  JOIN 
    public.repositories r ON c.repository_id = r.id
  WHERE 
    c.login IS NOT NULL
    AND r.id NOT IN (SELECT repository_id FROM filtered_repositories)
    AND NOT(c.login = ANY(p_filtered_logins))
  ORDER BY 
    c.login, c.contributions DESC
  OFFSET ((p_page - 1) * p_page_size)
  LIMIT p_page_size;
END;
$function$;

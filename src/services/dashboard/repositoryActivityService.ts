
import { supabase } from "@/integrations/supabase/client";
import { logger } from "../logService";

// Repository activity response type
interface RepositoryActivityResponse {
  reposwithrecentactivity: number;
  reposwithnorecentactivity: number;
}

// Repository activity (last commit dates)
export async function fetchRepositoryActivity() {
  try {
    const { data, error } = await supabase
      .rpc('get_repository_activity')
      .single();
    
    if (error) {
      logger.error("Error fetching repository activity", { error });
      return { reposWithRecentActivity: 0, reposWithNoRecentActivity: 0 };
    }
    
    const typedData = data as unknown as RepositoryActivityResponse;
    
    return { 
      reposWithRecentActivity: Number(typedData.reposwithrecentactivity) || 0, 
      reposWithNoRecentActivity: Number(typedData.reposwithnorecentactivity) || 0 
    };
  } catch (error) {
    logger.error("Error in fetchRepositoryActivity", { error });
    return { reposWithRecentActivity: 0, reposWithNoRecentActivity: 0 };
  }
}

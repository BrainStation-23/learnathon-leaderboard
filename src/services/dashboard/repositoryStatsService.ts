
import { supabase } from "@/integrations/supabase/client";
import { logger } from "../logService";

// Repository stats response type
interface RepositoryStatsResponse {
  totalrepos: number;
  totalcontributors: number;
}

// Basic repository stats (total repos, contributors)
export async function fetchRepositoryStats() {
  try {
    const { data, error } = await supabase
      .rpc('get_repository_stats')
      .single();
    
    if (error) {
      logger.error("Error fetching repository stats", { error });
      return { totalRepos: 0, totalContributors: 0 };
    }
    
    const typedData = data as unknown as RepositoryStatsResponse;
    
    return {
      totalRepos: Number(typedData.totalrepos) || 0,
      totalContributors: Number(typedData.totalcontributors) || 0
    };
  } catch (error) {
    logger.error("Error in fetchRepositoryStats", { error });
    return { totalRepos: 0, totalContributors: 0 };
  }
}

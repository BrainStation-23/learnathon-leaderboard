
import { supabase } from "@/integrations/supabase/client";
import { logger } from "../logService";

// Contributor distribution response type
interface ContributorDistributionResponse {
  reposwithoneactivecontributor: number;
  reposwithtwoactivecontributors: number; 
  reposwiththreeactivecontributors: number;
  reposwithnorecentactivity: number;
}

// Contributor distribution across repositories - using updated database function
export async function fetchContributorDistribution() {
  try {
    const { data, error } = await supabase
      .rpc('get_contributor_distribution')
      .single();
    
    if (error) {
      logger.error("Error fetching contributor distribution", { error });
      return {
        reposWithOneActiveContributor: 0,
        reposWithTwoActiveContributors: 0,
        reposWithThreeActiveContributors: 0,
        reposWithNoRecentActivity: 0
      };
    }
    
    const typedData = data as unknown as ContributorDistributionResponse;
    
    return {
      reposWithOneActiveContributor: Number(typedData.reposwithoneactivecontributor) || 0,
      reposWithTwoActiveContributors: Number(typedData.reposwithtwoactivecontributors) || 0,
      reposWithThreeActiveContributors: Number(typedData.reposwiththreeactivecontributors) || 0,
      reposWithNoRecentActivity: Number(typedData.reposwithnorecentactivity) || 0
    };
  } catch (error) {
    logger.error("Error in fetchContributorDistribution", { error });
    return {
      reposWithOneActiveContributor: 0,
      reposWithTwoActiveContributors: 0,
      reposWithThreeActiveContributors: 0,
      reposWithNoRecentActivity: 0
    };
  }
}

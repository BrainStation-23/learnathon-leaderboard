
import { supabase } from "@/integrations/supabase/client";
import { logger } from "../logService";

export interface IndividualContributor {
  login: string;
  avatar_url: string;
  total_contributions: number;
  repositories: {
    id: string;
    name: string;
    contributions: number;
  }[];
}

interface ContributorRepoData {
  login: string;
  avatar_url: string | null;
  repository_id: string;
  repository_name: string;
  contributions: number;
}

// Define a type for the RPC function to extend the types in the Supabase client
type GetContributorsWithReposParams = {
  p_page?: number;
  p_page_size?: number;
  p_filtered_logins?: string[];
};

export async function fetchIndividualContributors(
  page: number = 1, 
  pageSize: number = 20
): Promise<{ data: IndividualContributor[], hasMore: boolean }> {
  try {
    // First, fetch filtered contributor logins to exclude them
    const { data: configData } = await supabase
      .from('configurations')
      .select('filtered_contributors')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();
    
    const filteredContributors = configData?.filtered_contributors || [];
    
    // Get contributors with repositories using our custom SQL function
    const { data: contributorsData, error } = await supabase
      .rpc<ContributorRepoData, GetContributorsWithReposParams>('get_contributors_with_repos', {
        p_page: page,
        p_page_size: pageSize,
        p_filtered_logins: filteredContributors
      });
      
    if (error) {
      logger.error("Error fetching individual contributors:", { error });
      return { data: [], hasMore: false };
    }
    
    // Transform the data to the format we need
    const groupedContributors: Record<string, IndividualContributor> = {};
    
    if (Array.isArray(contributorsData)) {
      contributorsData.forEach((item) => {
        if (!groupedContributors[item.login]) {
          groupedContributors[item.login] = {
            login: item.login,
            avatar_url: item.avatar_url || '', 
            total_contributions: 0,
            repositories: []
          };
        }
        
        // Add repository to the contributor's list
        if (item.repository_id) {
          groupedContributors[item.login].repositories.push({
            id: item.repository_id,
            name: item.repository_name,
            contributions: item.contributions
          });
          
          // Add to total contributions
          groupedContributors[item.login].total_contributions += item.contributions;
        }
      });
    }
    
    // Convert to array and sort by total contributions
    const contributors = Object.values(groupedContributors)
      .sort((a, b) => b.total_contributions - a.total_contributions);
    
    // Determine if there are more contributors to load
    const hasMore = contributors.length === pageSize;
    
    return { 
      data: contributors,
      hasMore
    };
  } catch (error) {
    logger.error("Error in fetchIndividualContributors:", { error });
    return { data: [], hasMore: false };
  }
}

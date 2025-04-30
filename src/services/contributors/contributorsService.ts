
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

interface GetIndividualContributorsResponse {
  data: IndividualContributor[];
  hasMore: boolean;
}

export async function fetchIndividualContributors(
  page: number = 1, 
  pageSize: number = 20,
  searchTerm: string = '',
  sortOrder: 'asc' | 'desc' = 'desc'
): Promise<GetIndividualContributorsResponse> {
  try {
    // Use the new database RPC function
    const { data, error } = await supabase
      .rpc('get_individual_contributors', {
        p_page: page,
        p_page_size: pageSize,
        p_search_term: searchTerm || null, // Convert empty string to null
        p_sort_order: sortOrder
      });
      
    if (error) {
      logger.error("Error fetching individual contributors:", { error });
      return { data: [], hasMore: false };
    }
    
    if (!Array.isArray(data) || data.length === 0) {
      return { data: [], hasMore: false };
    }
    
    // Extract hasMore from the first row's result
    const hasMore = data[0]?.has_more || false;
    
    // Map the data to match our interface
    const contributors: IndividualContributor[] = data.map(item => ({
      login: item.login,
      avatar_url: item.avatar_url || '',
      total_contributions: Number(item.total_contributions),
      repositories: Array.isArray(item.repositories) 
        ? item.repositories 
        : (typeof item.repositories === 'object' && item.repositories !== null)
          ? Object.values(item.repositories)
          : []
    }));
    
    return { 
      data: contributors,
      hasMore
    };
  } catch (error) {
    logger.error("Error in fetchIndividualContributors:", { error });
    return { data: [], hasMore: false };
  }
}

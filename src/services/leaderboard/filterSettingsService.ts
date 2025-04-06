
import { supabase } from "@/integrations/supabase/client";
import { logger } from "../logService";

/**
 * Fetches the list of filtered contributors from the most recent configuration
 */
export async function fetchFilteredContributors(): Promise<string[]> {
  try {
    logger.info("Fetching filtered contributors...");
    
    const { data, error } = await supabase
      .from('configurations')
      .select('filtered_contributors')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    
    if (error) {
      logger.error("Error fetching filtered contributors:", { error });
      return [];
    }
    
    logger.info("Filtered contributors data:", { data });
    
    if (data && data.filtered_contributors) {
      const filteredList = data.filtered_contributors;
      logger.info("Setting filtered contributors:", filteredList);
      return filteredList;
    } else {
      logger.info("No filtered contributors found or empty array");
      return [];
    }
  } catch (err) {
    logger.error("Error in fetchFilteredContributors:", { error: err });
    return [];
  }
}

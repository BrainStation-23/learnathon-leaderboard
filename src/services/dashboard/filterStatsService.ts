
import { supabase } from "@/integrations/supabase/client";
import { logger } from "../logService";

// Filter stats response type
interface FilterStatsResponse {
  total: number;
  droppedout: number;
  nocontact: number;
  gotjob: number;
  other: number;
}

// Filter stats (dropped out, job offers)
export async function fetchFilterStats() {
  try {
    const { data, error } = await supabase
      .rpc('get_filter_stats')
      .single();
    
    if (error) {
      logger.error("Error fetching filter stats", { error });
      return { 
        total: 0, 
        droppedOut: 0, 
        noContact: 0, 
        gotJob: 0, 
        other: 0 
      };
    }
    
    const typedData = data as unknown as FilterStatsResponse;
    
    return { 
      total: Number(typedData.total) || 0, 
      droppedOut: Number(typedData.droppedout) || 0, 
      noContact: Number(typedData.nocontact) || 0, 
      gotJob: Number(typedData.gotjob) || 0, 
      other: Number(typedData.other) || 0 
    };
  } catch (error) {
    logger.error("Error in fetchFilterStats", { error });
    return { 
      total: 0, 
      droppedOut: 0, 
      noContact: 0, 
      gotJob: 0, 
      other: 0 
    };
  }
}

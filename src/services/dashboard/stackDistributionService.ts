
import { supabase } from "@/integrations/supabase/client";
import { logger } from "../logService";

// Stack distribution response type
interface DetailedStackDistributionItem {
  name: string;
  total_count: number;
  dropped_out_count: number;
  inactive_count: number;
}

// Tech stack distribution with detailed metrics
export async function fetchDetailedStackDistribution() {
  try {
    // Use rpc instead of from for calling a database function
    const { data, error } = await supabase
      .rpc('get_detailed_stack_distribution');
    
    if (error) {
      logger.error("Error fetching detailed stack distribution", { error });
      return {
        stackDistribution: {},
        droppedOutByStack: {},
        inactiveByStack: {}
      };
    }
    
    // Format the data into the expected structure
    const stackDistribution: Record<string, number> = {};
    const droppedOutByStack: Record<string, number> = {};
    const inactiveByStack: Record<string, number> = {};
    
    if (data && Array.isArray(data)) {
      const typedData = data as unknown as DetailedStackDistributionItem[];
      typedData.forEach(item => {
        if (item.name) {
          stackDistribution[item.name] = Number(item.total_count) || 0;
          droppedOutByStack[item.name] = Number(item.dropped_out_count) || 0;
          inactiveByStack[item.name] = Number(item.inactive_count) || 0;
        }
      });
    }
    
    return {
      stackDistribution,
      droppedOutByStack,
      inactiveByStack
    };
  } catch (error) {
    logger.error("Error in fetchDetailedStackDistribution", { error });
    return {
      stackDistribution: {},
      droppedOutByStack: {},
      inactiveByStack: {}
    };
  }
}

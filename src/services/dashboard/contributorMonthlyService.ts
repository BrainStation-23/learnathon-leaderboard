
import { supabase } from "@/integrations/supabase/client";
import { logger } from "../logService";

export interface MonthlyContributorData {
  month: string;
  contributor_count: number;
}

export async function fetchMonthlyContributorCounts(): Promise<MonthlyContributorData[]> {
  try {
    const { data, error } = await supabase
      .rpc('get_monthly_contributor_counts');
    
    if (error) {
      logger.error("Error fetching monthly contributor counts", { error });
      throw error;
    }
    
    // Transform and format the data
    return data.map((item: any) => ({
      month: item.month,
      contributor_count: Number(item.contributor_count) || 0
    }));
  } catch (error) {
    logger.error("Error in fetchMonthlyContributorCounts", { error });
    return [];
  }
}

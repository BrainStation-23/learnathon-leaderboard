
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";

interface Contributor {
  login: string;
  contributions: number;
  isFiltered: boolean;
}

export function useContributorsData() {
  const [contributors, setContributors] = useState<Contributor[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const { user } = useAuth();
  const { toast } = useToast();

  // Fetch all unique contributors across repositories
  useEffect(() => {
    const fetchContributors = async () => {
      if (!user) return;
      
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('contributors')
          .select('login, contributions')
          .order('contributions', { ascending: false });
        
        if (error) {
          throw error;
        }

        // Get unique contributors by login name
        const uniqueContributors = Array.from(
          new Map(data.map(item => [item.login, item])).values()
        );
        
        // Get filtered contributors from user settings
        const { data: configData, error: configError } = await supabase
          .from('configurations')
          .select('filtered_contributors')
          .eq('user_id', user.id)
          .single();
        
        if (configError && configError.code !== 'PGRST116') { // PGRST116 = no rows found
          console.error("Error fetching filtered contributors:", configError);
        }
        
        // Check if configData exists and has filtered_contributors
        const filteredContributors = configData?.filtered_contributors || [];
        
        // Merge data
        const mergedContributors = uniqueContributors.map(contributor => ({
          login: contributor.login,
          contributions: contributor.contributions,
          isFiltered: filteredContributors.includes(contributor.login)
        }));
        
        setContributors(mergedContributors);
      } catch (error) {
        console.error("Error loading contributors:", error);
        toast({
          title: "Error loading contributors",
          description: "Failed to load contributor data. Please try again.",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchContributors();
  }, [user, toast]);

  // Toggle contributor filter status
  const toggleContributor = (login: string) => {
    setContributors(prev => 
      prev.map(contributor => 
        contributor.login === login 
          ? { ...contributor, isFiltered: !contributor.isFiltered } 
          : contributor
      )
    );
  };

  return {
    contributors,
    loading,
    toggleContributor
  };
}

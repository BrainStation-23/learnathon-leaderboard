
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { TechStack } from "@/types/leaderboard";

export interface Repository {
  id: string;
  name: string;
  tech_stacks?: TechStack[];
}

export function useTechStackRepository() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [repositories, setRepositories] = useState<Repository[]>([]);
  const [techStacks, setTechStacks] = useState<TechStack[]>([]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch all tech stacks
      const { data: techStacksData, error: techStacksError } = await supabase
        .from('tech_stacks')
        .select("*")
        .order("name");

      if (techStacksError) throw techStacksError;
      setTechStacks(techStacksData as TechStack[]);

      // Fetch repositories
      const { data: reposData, error: reposError } = await supabase
        .from("repositories")
        .select("id, name")
        .order("name");

      if (reposError) throw reposError;
      
      // Fetch the repository-tech stack relationships directly
      const { data: repoTechStacksData, error: repoTechStacksError } = await supabase
        .from('repository_tech_stacks')
        .select(`
          repository_id,
          tech_stack:tech_stack_id (id, name)
        `);
          
      if (repoTechStacksError) throw repoTechStacksError;
      
      // Transform the data
      const techStacksByRepo: Record<string, TechStack[]> = {};
      
      if (repoTechStacksData) {
        repoTechStacksData.forEach((item: any) => {
          const repoId = item.repository_id;
          if (!techStacksByRepo[repoId]) {
            techStacksByRepo[repoId] = [];
          }
          techStacksByRepo[repoId].push(item.tech_stack);
        });
      }
      
      // Merge data to create repositories with their tech stacks
      const reposWithTechStacks = reposData.map((repo: any) => {
        return {
          ...repo,
          tech_stacks: techStacksByRepo[repo.id] || []
        };
      });
      
      setRepositories(reposWithTechStacks);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast({
        title: "Error loading data",
        description: "Could not load repositories and tech stacks",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return {
    loading,
    repositories,
    techStacks,
    fetchData
  };
}

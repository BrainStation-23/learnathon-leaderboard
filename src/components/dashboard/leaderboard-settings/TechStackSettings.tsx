
import React, { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Loader2, Plus, X } from "lucide-react";
import { TechStack } from "@/types/leaderboard";

interface Repository {
  id: string;
  name: string;
  tech_stacks?: TechStack[];
}

export function TechStackSettings() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [repositories, setRepositories] = useState<Repository[]>([]);
  const [techStacks, setTechStacks] = useState<TechStack[]>([]);
  const [selectedRepository, setSelectedRepository] = useState<string | null>(null);
  const [selectedTechStack, setSelectedTechStack] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch all tech stacks - using raw query to bypass type checking temporarily
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
      
      // Fetch repository tech stacks relationships - using raw query
      const { data: repoTechStacksData, error: repoTechStacksError } = await supabase
        .rpc('get_repository_tech_stacks');

      if (repoTechStacksError) {
        // Try alternative approach if RPC doesn't exist
        const { data: altData, error: altError } = await supabase
          .from('repository_tech_stacks')
          .select(`
            repository_id,
            tech_stack:tech_stack_id (id, name)
          `);
          
        if (altError) throw altError;
        
        // Transform the data
        const techStacksByRepo: Record<string, TechStack[]> = {};
        
        if (altData) {
          altData.forEach((item: any) => {
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
      } else {
        // If the RPC exists and worked
        // Merge data to create repositories with their tech stacks
        const reposWithTechStacks = reposData.map((repo: any) => {
          const repoTechStacks = repoTechStacksData
            .filter((rts: any) => rts.repository_id === repo.id)
            .map((rts: any) => rts.tech_stack);
            
          return {
            ...repo,
            tech_stacks: repoTechStacks || []
          };
        });
        
        setRepositories(reposWithTechStacks);
      }
      
      // Set first repository as selected by default if available
      if (reposData.length > 0 && !selectedRepository) {
        setSelectedRepository(reposData[0].id);
      }
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

  const handleAddTechStack = async () => {
    if (!selectedRepository || !selectedTechStack) return;
    
    setSaving(true);
    try {
      // Check if the relationship already exists - using raw query
      const { data: existing } = await supabase
        .from('repository_tech_stacks')
        .select("*")
        .eq("repository_id", selectedRepository)
        .eq("tech_stack_id", selectedTechStack)
        .single();
        
      if (existing) {
        toast({
          title: "Already added",
          description: "This tech stack is already assigned to the repository",
        });
        setSaving(false);
        return;
      }
      
      // Add the relationship - using raw query
      const { error } = await supabase
        .from('repository_tech_stacks')
        .insert({
          repository_id: selectedRepository,
          tech_stack_id: selectedTechStack
        });

      if (error) throw error;
      
      toast({
        title: "Tech stack added",
        description: "The tech stack has been assigned to the repository",
      });
      
      // Refresh data
      await fetchData();
      setSelectedTechStack(null);
    } catch (error) {
      console.error("Error adding tech stack:", error);
      toast({
        title: "Error adding tech stack",
        description: "Failed to assign tech stack to repository",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveTechStack = async (repositoryId: string, techStackId: string) => {
    setSaving(true);
    try {
      // Delete relationship - using raw query
      const { error } = await supabase
        .from('repository_tech_stacks')
        .delete()
        .eq("repository_id", repositoryId)
        .eq("tech_stack_id", techStackId);

      if (error) throw error;
      
      toast({
        title: "Tech stack removed",
        description: "The tech stack has been removed from the repository",
      });
      
      // Refresh data
      await fetchData();
    } catch (error) {
      console.error("Error removing tech stack:", error);
      toast({
        title: "Error removing tech stack",
        description: "Failed to remove tech stack from repository",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const getRepositoryTechStacks = (repositoryId: string) => {
    const repository = repositories.find(repo => repo.id === repositoryId);
    return repository?.tech_stacks || [];
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-10">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Repository Tech Stacks</CardTitle>
        <CardDescription>
          Assign technology stacks to repositories to categorize them
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Repository selector */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Select Repository</label>
          <Select value={selectedRepository || ""} onValueChange={setSelectedRepository}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select a repository" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectLabel>Repositories</SelectLabel>
                {repositories.map(repo => (
                  <SelectItem key={repo.id} value={repo.id}>{repo.name}</SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>

        {/* Current tech stacks for selected repository */}
        {selectedRepository && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Current Tech Stacks</h4>
            <div className="flex flex-wrap gap-2 min-h-10 p-2 border rounded-md bg-muted/30">
              {getRepositoryTechStacks(selectedRepository).length === 0 ? (
                <p className="text-sm text-muted-foreground">No tech stacks assigned</p>
              ) : (
                getRepositoryTechStacks(selectedRepository).map((techStack: TechStack) => (
                  <Badge key={techStack.id} variant="secondary" className="flex items-center gap-1">
                    {techStack.name}
                    <button
                      onClick={() => handleRemoveTechStack(selectedRepository, techStack.id)}
                      className="hover:text-destructive focus:outline-none"
                      disabled={saving}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))
              )}
            </div>
          </div>
        )}

        <Separator />

        {/* Add new tech stack section */}
        {selectedRepository && (
          <div className="space-y-4">
            <h4 className="text-sm font-medium">Add Tech Stack</h4>
            <div className="flex gap-2">
              <Select value={selectedTechStack || ""} onValueChange={setSelectedTechStack}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a tech stack" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectLabel>Tech Stacks</SelectLabel>
                    {techStacks.map(stack => (
                      <SelectItem key={stack.id} value={stack.id}>{stack.name}</SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
              <Button 
                onClick={handleAddTechStack} 
                disabled={!selectedTechStack || saving}
                size="sm"
              >
                {saving ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Plus className="h-4 w-4 mr-2" />
                )}
                Add
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

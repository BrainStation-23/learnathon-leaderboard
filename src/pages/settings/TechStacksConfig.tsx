
import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import SettingsLayout from "@/components/layout/SettingsLayout";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Search, Check, X, Tag, Plus, Save, Loader2 } from "lucide-react";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SelectGroup,
  SelectLabel
} from "@/components/ui/select";
import { TechStack } from "@/types/leaderboard";

export default function TechStacksConfig() {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRepo, setSelectedRepo] = useState<string | null>(null);
  const [savingRepoId, setSavingRepoId] = useState<string | null>(null);
  const [editingTechStacks, setEditingTechStacks] = useState<Record<string, string[]>>({});
  const [selectedTechStack, setSelectedTechStack] = useState<string | null>(null);

  // Fetch repositories with their tech stacks
  const { data: repositories, isLoading: loadingRepos, refetch: refetchRepos } = useQuery({
    queryKey: ['repositories-with-tech-stacks'],
    queryFn: async () => {
      // First get all repositories
      const { data: repos, error: reposError } = await supabase
        .from("repositories")
        .select("id, name, description")
        .order("name");
      
      if (reposError) throw reposError;
      
      // Get all tech stacks for each repository
      const { data: repoTechStacksData, error: repoTechStacksError } = await supabase
        .from('repository_tech_stacks')
        .select(`
          repository_id,
          tech_stack:tech_stack_id (id, name)
        `);
          
      if (repoTechStacksError) throw repoTechStacksError;
      
      // Transform the data to associate tech stacks with repositories
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
      
      // Combine data
      return repos.map((repo: any) => ({
        ...repo,
        tech_stacks: techStacksByRepo[repo.id] || []
      }));
    }
  });

  // Fetch all available tech stacks
  const { data: techStacks, isLoading: loadingTechStacks } = useQuery({
    queryKey: ['tech-stacks'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tech_stacks')
        .select("*")
        .order("name");
      
      if (error) throw error;
      return data;
    }
  });

  // Filter repositories based on search term
  const filteredRepositories = repositories?.filter(repo => 
    repo.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (repo.description && repo.description.toLowerCase().includes(searchTerm.toLowerCase()))
  ) || [];

  // Initialize tech stack editing for a repository
  const startEditing = (repoId: string, currentTechStacks: TechStack[]) => {
    setSelectedRepo(repoId);
    setEditingTechStacks({
      ...editingTechStacks,
      [repoId]: currentTechStacks.map(stack => stack.id)
    });
  };

  // Add a tech stack to a repository in the editing state
  const addTechStack = (repoId: string, techStackId: string) => {
    const currentStacks = editingTechStacks[repoId] || [];
    if (!currentStacks.includes(techStackId)) {
      setEditingTechStacks({
        ...editingTechStacks,
        [repoId]: [...currentStacks, techStackId]
      });
    }
    setSelectedTechStack(null);
  };

  // Remove a tech stack from a repository in the editing state
  const removeTechStack = (repoId: string, techStackId: string) => {
    const currentStacks = editingTechStacks[repoId] || [];
    setEditingTechStacks({
      ...editingTechStacks,
      [repoId]: currentStacks.filter(id => id !== techStackId)
    });
  };

  // Save tech stack changes for a repository
  const saveTechStacks = async (repoId: string) => {
    if (!editingTechStacks[repoId]) return;
    
    setSavingRepoId(repoId);
    try {
      // Get current tech stacks for this repo
      const { data: current } = await supabase
        .from('repository_tech_stacks')
        .select('tech_stack_id')
        .eq('repository_id', repoId);
      
      const currentIds = current?.map(item => item.tech_stack_id) || [];
      const newIds = editingTechStacks[repoId] || [];
      
      // Find tech stacks to add and remove
      const toAdd = newIds.filter(id => !currentIds.includes(id));
      const toRemove = currentIds.filter(id => !newIds.includes(id));
      
      // Remove tech stacks that are no longer associated
      if (toRemove.length > 0) {
        const { error: removeError } = await supabase
          .from('repository_tech_stacks')
          .delete()
          .eq('repository_id', repoId)
          .in('tech_stack_id', toRemove);
          
        if (removeError) throw removeError;
      }
      
      // Add new tech stacks
      if (toAdd.length > 0) {
        const newEntries = toAdd.map(techStackId => ({
          repository_id: repoId,
          tech_stack_id: techStackId
        }));
        
        const { error: addError } = await supabase
          .from('repository_tech_stacks')
          .insert(newEntries);
          
        if (addError) throw addError;
      }
      
      // Clear editing state for this repo
      const newEditingState = {...editingTechStacks};
      delete newEditingState[repoId];
      setEditingTechStacks(newEditingState);
      
      // Refresh data
      refetchRepos();
      
      toast({
        title: "Tech Stacks Updated",
        description: `Tech stacks for ${repositories?.find(r => r.id === repoId)?.name} have been updated.`
      });
    } catch (error) {
      console.error("Error saving tech stacks:", error);
      toast({
        title: "Error Saving Tech Stacks",
        description: "There was a problem updating the tech stacks.",
        variant: "destructive"
      });
    } finally {
      setSavingRepoId(null);
    }
  };

  // Get tech stack name by ID
  const getTechStackName = (id: string) => {
    const stack = techStacks?.find(stack => stack.id === id);
    return stack?.name || "Unknown Stack";
  };

  // Check if a repository is currently being edited
  const isEditing = (repoId: string) => editingTechStacks[repoId] !== undefined;

  return (
    <SettingsLayout>
      <div className="space-y-6">
        <div>
          <h3 className="text-xl font-medium mb-2">Tech Stack Management</h3>
          <p className="text-muted-foreground mb-4">
            Assign technology stacks to repositories to categorize and filter them.
          </p>
        </div>
        
        {/* Search and filter */}
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search repositories..."
            className="pl-9"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {loadingRepos || loadingTechStacks ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="space-y-4">
            {filteredRepositories.length === 0 ? (
              <Card>
                <CardContent className="py-6 text-center text-muted-foreground">
                  No repositories found matching your search.
                </CardContent>
              </Card>
            ) : (
              filteredRepositories.map(repo => (
                <Card key={repo.id} className="overflow-hidden">
                  <CardContent className="p-0">
                    <div className="p-4 border-b">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-medium">{repo.name}</h4>
                          {repo.description && (
                            <p className="text-sm text-muted-foreground mt-1">
                              {repo.description}
                            </p>
                          )}
                        </div>
                        
                        {isEditing(repo.id) ? (
                          <div className="flex gap-2">
                            <Button 
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                const newEditingState = {...editingTechStacks};
                                delete newEditingState[repo.id];
                                setEditingTechStacks(newEditingState);
                              }}
                            >
                              <X className="h-4 w-4 mr-1" /> Cancel
                            </Button>
                            <Button 
                              size="sm"
                              onClick={() => saveTechStacks(repo.id)}
                              disabled={savingRepoId === repo.id}
                            >
                              {savingRepoId === repo.id ? (
                                <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                              ) : (
                                <Save className="h-4 w-4 mr-1" />
                              )}
                              Save
                            </Button>
                          </div>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => startEditing(repo.id, repo.tech_stacks)}
                          >
                            <Tag className="h-4 w-4 mr-1" /> Edit Tech Stacks
                          </Button>
                        )}
                      </div>
                    </div>

                    <div className="p-4 bg-muted/30">
                      <div className="flex items-center gap-2 mb-2">
                        <h5 className="text-sm font-medium">Tech Stacks:</h5>
                        {!isEditing(repo.id) && repo.tech_stacks.length === 0 && (
                          <span className="text-sm text-muted-foreground">None assigned</span>
                        )}
                      </div>
                      
                      <div className="flex flex-wrap gap-2">
                        {isEditing(repo.id) ? (
                          // Editing mode: Show current selections with remove option
                          <>
                            {(editingTechStacks[repo.id] || []).map(stackId => (
                              <Badge key={stackId} variant="secondary" className="flex items-center gap-1">
                                {getTechStackName(stackId)}
                                <button
                                  onClick={() => removeTechStack(repo.id, stackId)}
                                  className="ml-1 hover:text-destructive focus:outline-none"
                                >
                                  <X className="h-3 w-3" />
                                </button>
                              </Badge>
                            ))}
                            
                            {/* Tech stack selector */}
                            <div className="flex items-center gap-2 mt-3">
                              <Select
                                value={selectedTechStack || ""}
                                onValueChange={(value) => setSelectedTechStack(value)}
                              >
                                <SelectTrigger className="w-[200px]">
                                  <SelectValue placeholder="Add tech stack..." />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectGroup>
                                    <SelectLabel>Technology Stacks</SelectLabel>
                                    {techStacks?.map(stack => (
                                      <SelectItem 
                                        key={stack.id} 
                                        value={stack.id}
                                        disabled={(editingTechStacks[repo.id] || []).includes(stack.id)}
                                      >
                                        {stack.name}
                                      </SelectItem>
                                    ))}
                                  </SelectGroup>
                                </SelectContent>
                              </Select>
                              
                              <Button 
                                size="sm"
                                disabled={!selectedTechStack}
                                onClick={() => selectedTechStack && addTechStack(repo.id, selectedTechStack)}
                              >
                                <Plus className="h-4 w-4" />
                              </Button>
                            </div>
                          </>
                        ) : (
                          // Display mode: Just show the tech stacks
                          repo.tech_stacks.map(stack => (
                            <Badge key={stack.id} variant="secondary">
                              {stack.name}
                            </Badge>
                          ))
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        )}
      </div>
    </SettingsLayout>
  );
}

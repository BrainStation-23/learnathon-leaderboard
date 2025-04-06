
import React, { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Loader2 } from "lucide-react";
import { TechStack } from "@/types/leaderboard";
import { useTechStackRepository } from "./hooks/useTechStackRepository";
import { RepositorySelector } from "./components/RepositorySelector";
import { CurrentTechStacks } from "./components/CurrentTechStacks";
import { AddTechStack } from "./components/AddTechStack";

export function TechStackSettings() {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [selectedRepository, setSelectedRepository] = useState<string | null>(null);
  const [selectedTechStack, setSelectedTechStack] = useState<string | null>(null);
  const { loading, repositories, techStacks, fetchData } = useTechStackRepository();

  const handleAddTechStack = async () => {
    if (!selectedRepository || !selectedTechStack) return;
    
    setSaving(true);
    try {
      // Check if the relationship already exists
      const { data: existing, error: checkError } = await supabase
        .from('repository_tech_stacks')
        .select("*")
        .eq("repository_id", selectedRepository)
        .eq("tech_stack_id", selectedTechStack)
        .single();
        
      if (checkError && checkError.code !== 'PGRST116') { // PGRST116 is "No rows found"
        throw checkError;
      }
        
      if (existing) {
        toast({
          title: "Already added",
          description: "This tech stack is already assigned to the repository",
        });
        setSaving(false);
        return;
      }
      
      // Add the relationship
      const { error: insertError } = await supabase
        .from('repository_tech_stacks')
        .insert({
          repository_id: selectedRepository,
          tech_stack_id: selectedTechStack
        });

      if (insertError) throw insertError;
      
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

  const handleRemoveTechStack = async (techStackId: string) => {
    if (!selectedRepository) return;
    
    setSaving(true);
    try {
      // Delete relationship
      const { error } = await supabase
        .from('repository_tech_stacks')
        .delete()
        .eq("repository_id", selectedRepository)
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
        <RepositorySelector 
          repositories={repositories}
          selectedRepository={selectedRepository}
          setSelectedRepository={setSelectedRepository}
        />

        {/* Current tech stacks for selected repository */}
        {selectedRepository && (
          <CurrentTechStacks 
            techStacks={getRepositoryTechStacks(selectedRepository)}
            onRemove={handleRemoveTechStack}
            saving={saving}
          />
        )}

        <Separator />

        {/* Add new tech stack section */}
        {selectedRepository && (
          <AddTechStack 
            techStacks={techStacks}
            selectedTechStack={selectedTechStack}
            setSelectedTechStack={setSelectedTechStack}
            onAdd={handleAddTechStack}
            saving={saving}
          />
        )}
      </CardContent>
    </Card>
  );
}

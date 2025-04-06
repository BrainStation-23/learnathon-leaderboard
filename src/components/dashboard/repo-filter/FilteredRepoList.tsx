
import React, { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, AlertCircle } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface Repository {
  id: string;
  name: string;
  description: string | null;
  isFiltered: boolean;
  reason: string;
}

interface FilteredRepoListProps {
  filteredRepos: Repository[];
  setRepositories: React.Dispatch<React.SetStateAction<any[]>>;
  setFilteredRepos: React.Dispatch<React.SetStateAction<any[]>>;
}

export default function FilteredRepoList({ 
  filteredRepos, 
  setRepositories, 
  setFilteredRepos 
}: FilteredRepoListProps) {
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [selectedRepo, setSelectedRepo] = useState<Repository | null>(null);
  const [removing, setRemoving] = useState(false);
  const { toast } = useToast();

  const handleRemoveFilter = (repo: Repository) => {
    setSelectedRepo(repo);
    setConfirmDialogOpen(true);
  };

  const confirmRemoveFilter = async () => {
    if (!selectedRepo) return;
    
    setRemoving(true);
    try {
      // Delete from filtered_repositories with type assertion
      const { error } = await (supabase
        .from('filtered_repositories' as any)
        .delete()
        .eq('repository_id', selectedRepo.id));
      
      if (error) throw error;
      
      // Update local state
      setRepositories(prev => 
        prev.map(repo => 
          repo.id === selectedRepo.id 
            ? { ...repo, isFiltered: false, reason: "" } 
            : repo
        )
      );
      
      setFilteredRepos(prev => prev.filter(repo => repo.id !== selectedRepo.id));
      
      toast({
        title: "Filter removed",
        description: `${selectedRepo.name} will now be included in the leaderboard.`,
      });
    } catch (error) {
      console.error("Error removing filter:", error);
      toast({
        title: "Error removing filter",
        description: "Failed to remove filter. Please try again.",
        variant: "destructive"
      });
    } finally {
      setRemoving(false);
      setConfirmDialogOpen(false);
    }
  };

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-6">
        {filteredRepos.map(repo => (
          <div 
            key={repo.id}
            className="group flex flex-col justify-between rounded-lg border bg-card p-3 transition-all hover:shadow-md"
          >
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <h4 className="font-medium">{repo.name}</h4>
                {repo.reason && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <AlertCircle className="h-4 w-4 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{repo.reason}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
              </div>
              <Badge variant="secondary" className="mb-2">Filtered</Badge>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              className="mt-2 w-full"
              onClick={() => handleRemoveFilter(repo)}
            >
              Remove Filter
            </Button>
          </div>
        ))}
      </div>

      <AlertDialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove filter?</AlertDialogTitle>
            <AlertDialogDescription>
              This will include {selectedRepo?.name} in the leaderboard and dashboard data again.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={removing}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmRemoveFilter} disabled={removing}>
              {removing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Removing...
                </>
              ) : (
                "Yes, remove filter"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

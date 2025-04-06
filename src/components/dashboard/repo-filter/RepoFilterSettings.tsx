
import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Search, Loader2, Filter } from "lucide-react";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import RepoFilterList from "./RepoFilterList";
import FilteredRepoList from "./FilteredRepoList";

export default function RepoFilterSettings() {
  const [loading, setLoading] = useState(true);
  const [repositories, setRepositories] = useState<any[]>([]);
  const [filteredRepos, setFilteredRepos] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const { user } = useAuth();
  const { toast } = useToast();

  // Fetch repositories and filtered repositories
  useEffect(() => {
    async function fetchData() {
      if (!user) return;
      
      setLoading(true);
      try {
        // Fetch all repositories
        const { data: reposData, error: reposError } = await supabase
          .from('repositories')
          .select('id, name, description')
          .order('name');
          
        if (reposError) throw reposError;
        
        // Fetch filtered repositories with type assertion
        const { data: filteredData, error: filteredError } = await (supabase
          .from('filtered_repositories' as any)
          .select('repository_id, reason'));
          
        if (filteredError) throw filteredError;
        
        // Mark filtered repositories
        const filteredIds = new Set(filteredData ? filteredData.map((item: any) => item.repository_id) : []);
        const filteredReasons = new Map(filteredData ? filteredData.map((item: any) => [item.repository_id, item.reason]) : []);
        
        const reposWithFilterStatus = reposData.map((repo: any) => ({
          ...repo,
          isFiltered: filteredIds.has(repo.id),
          reason: filteredReasons.get(repo.id) || ""
        }));
        
        setRepositories(reposWithFilterStatus);
        setFilteredRepos(reposWithFilterStatus.filter(repo => repo.isFiltered));
      } catch (error) {
        console.error("Error fetching repositories:", error);
        toast({
          title: "Error fetching repositories",
          description: "Failed to load repository data. Please try again.",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    }
    
    fetchData();
  }, [user, toast]);
  
  // Filter repositories based on search query
  const filteredRepositories = repositories.filter(repo => 
    repo.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (repo.description && repo.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );
  
  // Calculate statistics
  const totalRepos = repositories.length;
  const filteredCount = filteredRepos.length;

  return (
    <Card className="mt-4">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Repository Filtering</span>
          <div className="flex items-center gap-2">
            <Badge variant="outline">
              {totalRepos} Total Repositories
            </Badge>
            <Badge variant="secondary">
              {filteredCount} Filtered
            </Badge>
          </div>
        </CardTitle>
        <CardDescription>
          Select repositories to exclude from the leaderboard and dashboard
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center items-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="space-y-6">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search repositories..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            {filteredCount > 0 && (
              <>
                <div className="pt-2">
                  <h4 className="text-sm font-medium flex items-center gap-2 mb-3">
                    <Filter className="h-4 w-4" />
                    Filtered Repositories
                  </h4>
                  <FilteredRepoList 
                    filteredRepos={filteredRepos}
                    setRepositories={setRepositories}
                    setFilteredRepos={setFilteredRepos}
                  />
                </div>
                <Separator />
              </>
            )}
            
            <div>
              <h4 className="text-sm font-medium mb-3">All Repositories</h4>
              <RepoFilterList 
                repositories={filteredRepositories} 
                setRepositories={setRepositories}
                setFilteredRepos={setFilteredRepos}
              />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

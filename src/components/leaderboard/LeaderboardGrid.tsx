
import { useLeaderboardData } from "@/hooks/useLeaderboardData";
import { RepositoryScoreCard } from "./RepositoryScoreCard";
import { Loader2, RefreshCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEffect } from "react";

export function LeaderboardGrid() {
  const { loading, leaderboardData, error, refreshData } = useLeaderboardData();

  // Debug log when leaderboard data changes
  useEffect(() => {
    if (leaderboardData.length > 0) {
      console.log("LeaderboardGrid - Data received:", {
        repositoriesCount: leaderboardData.length,
        repositories: leaderboardData.map(item => ({
          name: item.repositoryName,
          contributors: item.contributors?.map(c => c.login) || [],
          contributorsCount: item.contributors?.length || 0,
          totalCommits: item.commitsCount,
          // Additional debug information
          filteredContributorsApplied: item.contributors?.length < 
            (item.contributors?.length || 0 + (item.commitsCount || 0))
        }))
      });
    }
  }, [leaderboardData]);

  if (loading && leaderboardData.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 min-h-[400px] text-muted-foreground">
        <Loader2 className="h-8 w-8 animate-spin mb-4" />
        <p>Loading leaderboard data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-16 min-h-[400px] text-muted-foreground">
        <p className="text-destructive mb-4">{error}</p>
        <Button variant="outline" onClick={refreshData}>
          <RefreshCcw className="h-4 w-4 mr-2" />
          Try again
        </Button>
      </div>
    );
  }

  if (leaderboardData.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 min-h-[400px] text-muted-foreground">
        <p className="mb-4">No repositories with quality metrics available.</p>
        <Button variant="outline" onClick={refreshData}>
          <RefreshCcw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-end">
        <Button variant="outline" size="sm" onClick={refreshData} disabled={loading}>
          {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <RefreshCcw className="h-4 w-4 mr-2" />}
          Refresh
        </Button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {leaderboardData.map((item, index) => (
          <RepositoryScoreCard 
            key={item.repositoryId} 
            item={item} 
            rank={index + 1}
          />
        ))}
      </div>
    </div>
  );
}

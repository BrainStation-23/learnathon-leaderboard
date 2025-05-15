
import { useLeaderboardData } from "@/hooks/useLeaderboardData";
import { RepositoryScoreCard } from "./RepositoryScoreCard";
import { LeaderboardFilters } from "./LeaderboardFilters";
import { Loader2, RefreshCcw, Filter, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { LeaderboardItem } from "@/types/leaderboard";
import { exportLeaderboardToCsv } from "@/utils/csvExport";
import { useToast } from "@/hooks/use-toast";

export function LeaderboardGrid() {
  const { loading, leaderboardData, error, refreshData } = useLeaderboardData();
  const [filteredData, setFilteredData] = useState<LeaderboardItem[]>([]);
  const { toast } = useToast();

  // Set filtered data whenever leaderboard data changes
  useEffect(() => {
    setFilteredData(leaderboardData);
  }, [leaderboardData]);

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

  const handleExportCsv = () => {
    try {
      exportLeaderboardToCsv(filteredData);
      toast({
        title: "Export successful",
        description: "Leaderboard data has been exported to CSV",
      });
    } catch (error) {
      console.error("Error exporting CSV:", error);
      toast({
        title: "Export failed",
        description: "Failed to export leaderboard data",
        variant: "destructive"
      });
    }
  };

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
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">
            Some repositories may be filtered out in settings
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleExportCsv}
            disabled={loading || filteredData.length === 0}
          >
            <FileText className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
          <Button variant="outline" size="sm" onClick={refreshData} disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <RefreshCcw className="h-4 w-4 mr-2" />}
            Refresh
          </Button>
        </div>
      </div>
      
      {/* Add the filters component */}
      <LeaderboardFilters data={leaderboardData} onFiltered={setFilteredData} />
      
      {filteredData.length === 0 ? (
        <div className="text-center py-10 text-muted-foreground">
          <p>No repositories match the current filters.</p>
          <Button 
            variant="link" 
            onClick={() => setFilteredData(leaderboardData)}
            className="mt-2"
          >
            Clear filters
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredData.map((item, index) => (
            <RepositoryScoreCard 
              key={item.repositoryId} 
              item={item} 
              rank={index + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}

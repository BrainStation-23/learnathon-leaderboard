
import { useConfig } from "@/context/ConfigContext";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import useRepositoryData from "@/hooks/repository/useRepositoryData";
import ProgressTracker from "./ProgressTracker";
import ErrorDisplay from "./ErrorDisplay";
import { TeamDashboardData } from "@/types";
import { useState, useMemo } from "react";
import SearchAndFilters from "./repositories/SearchAndFilters";
import RepositoryListTable from "./repositories/RepositoryListTable";
import RepositoryControls from "./repositories/RepositoryControls";
import { LoadingState, EmptyState } from "./repositories/LoadingAndEmptyStates";

interface RepositoriesTableProps {
  onSelectRepository: (repo: TeamDashboardData) => void;
  selectedRepo: TeamDashboardData | null;
}

export default function RepositoriesTable({ onSelectRepository, selectedRepo }: RepositoriesTableProps) {
  const { isConfigured, config } = useConfig();
  const { user } = useAuth();
  const {
    loading,
    refreshing,
    dashboardData,
    progressStages,
    currentStage,
    currentProgress,
    statusMessage,
    errors,
    loadData,
    fetchData
  } = useRepositoryData();

  // Search and filter state
  const [searchTerm, setSearchTerm] = useState("");
  const [securityFilter, setSecurityFilter] = useState("all");
  const [sortBy, setSortBy] = useState("name");
  
  // Filtered and sorted data
  const filteredData = useMemo(() => {
    let filtered = [...dashboardData];
    
    // Apply search filter
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase().trim();
      filtered = filtered.filter(repo => 
        repo.repoData.name.toLowerCase().includes(term) || 
        (repo.repoData.description && repo.repoData.description.toLowerCase().includes(term))
      );
    }
    
    // Apply security filter
    if (securityFilter !== "all") {
      if (securityFilter === "issues") {
        filtered = filtered.filter(repo => 
          repo.securityIssues && repo.securityIssues.length > 0
        );
      } else if (securityFilter === "secure") {
        filtered = filtered.filter(repo => 
          !repo.securityIssues || repo.securityIssues.length === 0
        );
      } else if (securityFilter === "critical") {
        filtered = filtered.filter(repo => 
          repo.securityIssues && repo.securityIssues.some(issue => 
            issue.severity.toLowerCase() === "critical"
          )
        );
      }
    }
    
    // Sort results
    return filtered.sort((a, b) => {
      if (sortBy === "name") {
        return a.repoData.name.localeCompare(b.repoData.name);
      } else if (sortBy === "updated") {
        const dateA = a.repoData.last_commit_date ? new Date(a.repoData.last_commit_date).getTime() : 0;
        const dateB = b.repoData.last_commit_date ? new Date(b.repoData.last_commit_date).getTime() : 0;
        return dateB - dateA; // Most recent first
      } else if (sortBy === "contributors") {
        const countA = a.repoData.contributors_count || 0;
        const countB = b.repoData.contributors_count || 0;
        return countB - countA; // Most contributors first
      }
      return 0;
    });
  }, [dashboardData, searchTerm, securityFilter, sortBy]);

  if (!user) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Authentication Required</CardTitle>
          <CardDescription>
            Please log in to view repository data.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (!isConfigured) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Configuration Required</CardTitle>
          <CardDescription>
            Please configure your GitHub and SonarCloud settings to view repository data.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild>
            <a href="/settings">Configure Dashboard</a>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Repositories</h2>
        <RepositoryControls
          loading={loading}
          refreshing={refreshing}
          onLoadData={loadData}
          onFetchData={fetchData}
        />
      </div>

      {/* Progress Display */}
      {refreshing && (
        <ProgressTracker
          currentStage={currentStage}
          currentProgress={currentProgress}
          statusMessage={statusMessage}
          progressStages={progressStages}
        />
      )}
      
      {/* Errors Display */}
      <ErrorDisplay errors={errors} />

      {/* Search and Filters */}
      {!loading && dashboardData.length > 0 && (
        <SearchAndFilters
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          securityFilter={securityFilter}
          setSecurityFilter={setSecurityFilter}
          sortBy={sortBy}
          setSortBy={setSortBy}
        />
      )}

      {loading ? (
        <LoadingState />
      ) : filteredData.length === 0 ? (
        <EmptyState 
          totalRepositoriesCount={dashboardData.length}
          configOrg={config.github_org}
        />
      ) : (
        <RepositoryListTable
          repositories={filteredData}
          selectedRepo={selectedRepo}
          onSelectRepository={onSelectRepository}
        />
      )}
    </div>
  );
}

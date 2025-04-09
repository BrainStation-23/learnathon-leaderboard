
import DashboardLayout from "@/components/layout/DashboardLayout";
import { useState } from "react";
import { TeamDashboardData } from "@/types";
import RepositoriesTable from "@/components/dashboard/repositories/RepositoryListTable";
import useRepositoryData from "@/hooks/repository/useRepositoryData";
import SearchAndFilters from "@/components/dashboard/repositories/SearchAndFilters";
import RepositoryControls from "@/components/dashboard/repositories/RepositoryControls";
import ProgressTracker from "@/components/dashboard/ProgressTracker";
import ErrorDisplay from "@/components/dashboard/ErrorDisplay";
import { useMemo } from "react";

const Repositories = () => {
  const [selectedRepo, setSelectedRepo] = useState<TeamDashboardData | null>(null);
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
  
  return (
    <DashboardLayout>
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

        <RepositoriesTable 
          repositories={filteredData} 
          onSelectRepository={setSelectedRepo} 
          selectedRepo={selectedRepo} 
        />
      </div>
    </DashboardLayout>
  );
};

export default Repositories;

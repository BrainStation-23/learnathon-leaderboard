
import { useConfig } from "@/context/ConfigContext";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, RefreshCw, Search as SearchIcon, Filter } from "lucide-react";
import useRepositoryData from "@/hooks/repository/useRepositoryData";
import ProgressTracker from "./ProgressTracker";
import ErrorDisplay from "./ErrorDisplay";
import { TeamDashboardData } from "@/types";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";
import { Input } from "@/components/ui/input";
import { useState, useMemo } from "react";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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
  const [sortBy, setSortBy] = useState("name"); // Options: name, updated, contributors
  
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

  // Get relative date
  const formatDate = (dateString?: string) => {
    if (!dateString) return "No data";
    return formatDistanceToNow(new Date(dateString), { addSuffix: true });
  };

  // Count security issues by severity for a repo
  const getSecurityIssuesCount = (repo: TeamDashboardData) => {
    if (!repo.securityIssues || repo.securityIssues.length === 0) return null;
    
    const issues = {
      critical: 0,
      high: 0,
      medium: 0,
      low: 0,
      total: repo.securityIssues.length
    };
    
    repo.securityIssues.forEach(issue => {
      const severity = issue.severity.toLowerCase();
      if (severity === "critical") issues.critical++;
      else if (severity === "high") issues.high++;
      else if (severity === "medium" || severity === "moderate") issues.medium++;
      else issues.low++;
    });
    
    return issues;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Repositories</h2>
        <div className="flex gap-2">
          <Button 
            onClick={loadData} 
            variant="outline"
            disabled={loading || refreshing}
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              "Load Data"
            )}
          </Button>
          <Button 
            onClick={fetchData} 
            disabled={loading || refreshing} 
            className="flex items-center gap-2"
          >
            {refreshing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <RefreshCw className="h-4 w-4" />
                <span>Refresh from GitHub</span>
              </>
            )}
          </Button>
        </div>
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div className="relative">
            <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input 
              placeholder="Search repositories..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)} 
              className="pl-9"
            />
          </div>
          <div>
            <Select value={securityFilter} onValueChange={setSecurityFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Security Filter" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Repositories</SelectItem>
                <SelectItem value="secure">Secure Only</SelectItem>
                <SelectItem value="issues">With Issues</SelectItem>
                <SelectItem value="critical">Critical Issues</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger>
                <SelectValue placeholder="Sort By" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="name">Name</SelectItem>
                <SelectItem value="updated">Last Updated</SelectItem>
                <SelectItem value="contributors">Contributors Count</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      )}

      {loading ? (
        <Card className="p-4">
          <div className="flex items-center justify-center p-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        </Card>
      ) : filteredData.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>
              {dashboardData.length === 0 ? "No repositories found" : "No matching repositories"}
            </CardTitle>
            <CardDescription>
              {dashboardData.length === 0 
                ? `No repositories were found for the GitHub organization ${config.github_org}.`
                : "No repositories match your search criteria. Try adjusting your filters."
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p>Try refreshing the data from GitHub or adjust your search filters.</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Repository</TableHead>
                    <TableHead>Last Update</TableHead>
                    <TableHead>Contributors</TableHead>
                    <TableHead>Security</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredData.map((repo) => {
                    const isSelected = selectedRepo?.repoData.id === repo.repoData.id;
                    const securityIssues = getSecurityIssuesCount(repo);
                    
                    return (
                      <TableRow 
                        key={repo.repoData.id} 
                        className={`cursor-pointer ${isSelected ? 'bg-muted' : ''}`}
                        onClick={() => onSelectRepository(repo)}
                      >
                        <TableCell className="font-medium">
                          {repo.repoData.name}
                        </TableCell>
                        <TableCell>
                          {formatDate(repo.repoData.last_commit_date)}
                        </TableCell>
                        <TableCell>{repo.repoData.contributors_count || "N/A"}</TableCell>
                        <TableCell>
                          {securityIssues ? (
                            <div className="flex gap-1">
                              {securityIssues.critical > 0 && (
                                <Badge variant="destructive">{securityIssues.critical}</Badge>
                              )}
                              {securityIssues.high > 0 && (
                                <Badge className="bg-orange-500">{securityIssues.high}</Badge>
                              )}
                              {(securityIssues.critical === 0 && securityIssues.high === 0) && (
                                <Badge variant="outline">OK</Badge>
                              )}
                            </div>
                          ) : (
                            <Badge variant="outline" className="bg-green-50 text-green-600">Secure</Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

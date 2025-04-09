
import { useConfig } from "@/context/ConfigContext";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, RefreshCw } from "lucide-react";
import useRepositoryData from "@/hooks/repository/useRepositoryData";
import ProgressTracker from "./ProgressTracker";
import ErrorDisplay from "./ErrorDisplay";
import { TeamDashboardData } from "@/types";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";

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

      {loading ? (
        <Card className="p-4">
          <div className="flex items-center justify-center p-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        </Card>
      ) : dashboardData.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>No repositories found</CardTitle>
            <CardDescription>
              No repositories were found for the GitHub organization {config.github_org}.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p>Try refreshing the data from GitHub or check your configuration settings.</p>
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
                  {dashboardData.map((repo) => {
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
                        <TableCell>{repo.repoData.contributors_count || 0}</TableCell>
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

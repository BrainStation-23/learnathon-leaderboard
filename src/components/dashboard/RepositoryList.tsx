
import { useState, useEffect } from "react";
import { useConfig } from "@/context/ConfigContext";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { fetchRepositoriesForOrg, fetchRepoDetails } from "@/services/githubService";
import { fetchSonarCloudData } from "@/services/sonarCloudService";
import { saveRepositoryData, saveSonarData, fetchDashboardData, ProgressCallback } from "@/services/supabaseService";
import { TeamDashboardData } from "@/types";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, Calendar, Users, GitCommit, AlertTriangle, Bug, Shield, Code, RefreshCw, Info, AlertCircle } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { logger } from "@/services/logService";
import { Skeleton } from "@/components/ui/skeleton";

type ProgressStage = {
  stage: 'github' | 'sonar' | 'complete';
  progress: number;
  message: string;
};

export default function RepositoryList() {
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [dashboardData, setDashboardData] = useState<TeamDashboardData[]>([]);
  const [progressStages, setProgressStages] = useState<ProgressStage[]>([]);
  const [currentStage, setCurrentStage] = useState<string>('');
  const [currentProgress, setCurrentProgress] = useState<number>(0);
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [errors, setErrors] = useState<string[]>([]);
  
  const { config, isConfigured } = useConfig();
  const { user } = useAuth();
  const { toast } = useToast();

  // Progress callback for tracking operations
  const progressCallback: ProgressCallback = (stage, progress, message) => {
    setCurrentStage(stage);
    setCurrentProgress(progress);
    setStatusMessage(message);
    
    // Add to progress history
    setProgressStages(prev => [...prev, {
      stage: stage as 'github' | 'sonar' | 'complete',
      progress,
      message
    }]);
  };
  
  // Load data from Supabase
  const loadData = async () => {
    if (!user) return;
    
    setLoading(true);
    setErrors([]);
    try {
      const data = await fetchDashboardData();
      setDashboardData(data);
      logger.info("Dashboard data loaded successfully", { count: data.length }, user.id, 'dashboard');
    } catch (error) {
      console.error("Error loading dashboard data:", error);
      logger.error("Failed to load dashboard data", { error }, user.id, 'dashboard');
      setErrors(prev => [...prev, "Failed to retrieve dashboard data"]);
      toast({
        title: "Error loading data",
        description: "Failed to retrieve dashboard data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Fetch and sync data from GitHub and SonarCloud
  const fetchData = async () => {
    if (!isConfigured || !user) {
      toast({
        title: "Configuration required",
        description: "Please configure your GitHub and SonarCloud settings first.",
        variant: "destructive",
      });
      return;
    }

    setRefreshing(true);
    setProgressStages([]);
    setErrors([]);
    
    try {
      // Start progress tracking
      progressCallback('github', 0, 'Fetching repositories from GitHub...');
      
      // Log the start of the operation
      logger.info("Starting data refresh", { 
        github_org: config.github_org,
        sonarcloud_org: config.sonarcloud_org 
      }, user.id, 'sync');
      
      // Fetch GitHub repositories
      let repos;
      try {
        repos = await fetchRepositoriesForOrg(
          config.github_org,
          config.github_pat
        );
        progressCallback('github', 25, `Found ${repos.length} repositories`);
        logger.info("GitHub repositories fetched", { count: repos.length }, user.id, 'sync');
      } catch (error) {
        logger.error("Failed to fetch repositories from GitHub", { error }, user.id, 'sync');
        setErrors(prev => [...prev, "Failed to fetch repositories from GitHub"]);
        toast({
          title: "GitHub Error",
          description: "Could not retrieve repositories from GitHub. Check your organization name and PAT.",
          variant: "destructive",
        });
        // Continue with empty repos
        repos = [];
      }

      // Fetch additional GitHub data (contributors, etc.)
      let detailedRepos;
      try {
        progressCallback('github', 40, 'Fetching repository details...');
        detailedRepos = await fetchRepoDetails(
          repos,
          config.github_org,
          config.github_pat
        );
        progressCallback('github', 60, `Retrieved details for ${detailedRepos.length} repositories`);
        logger.info("GitHub repository details fetched", { count: detailedRepos.length }, user.id, 'sync');
      } catch (error) {
        logger.error("Failed to fetch repository details", { error }, user.id, 'sync');
        setErrors(prev => [...prev, "Failed to fetch repository details from GitHub"]);
        // Continue with the basic repos data
        detailedRepos = repos;
      }

      // Fetch SonarCloud data for these repositories
      let sonarDataMap;
      try {
        progressCallback('sonar', 0, 'Fetching SonarCloud data...');
        sonarDataMap = await fetchSonarCloudData(
          config.sonarcloud_org,
          detailedRepos
        );
        progressCallback('sonar', 50, `Retrieved SonarCloud data for ${sonarDataMap.size} repositories`);
        logger.info("SonarCloud data fetched", { count: sonarDataMap.size }, user.id, 'sync');
      } catch (error) {
        logger.error("Failed to fetch SonarCloud data", { error }, user.id, 'sync');
        setErrors(prev => [...prev, "Failed to fetch SonarCloud data"]);
        // Continue with empty sonar data
        sonarDataMap = new Map();
      }

      // Save data to Supabase
      try {
        progressCallback('github', 70, 'Saving repository data to database...');
        await saveRepositoryData(detailedRepos, user.id, progressCallback);
        progressCallback('github', 100, 'Repository data saved successfully');
      } catch (error) {
        logger.error("Failed to save repository data to database", { error }, user.id, 'sync');
        setErrors(prev => [...prev, "Failed to save repository data to database"]);
      }

      try {
        progressCallback('sonar', 60, 'Saving SonarCloud data to database...');
        await saveSonarData(sonarDataMap, user.id, progressCallback);
        progressCallback('sonar', 100, 'SonarCloud data saved successfully');
      } catch (error) {
        logger.error("Failed to save SonarCloud data to database", { error }, user.id, 'sync');
        setErrors(prev => [...prev, "Failed to save SonarCloud data to database"]);
      }

      // Reload data from Supabase
      try {
        progressCallback('complete', 0, 'Refreshing dashboard data...');
        await loadData();
        progressCallback('complete', 100, 'Dashboard refreshed successfully');
      } catch (error) {
        logger.error("Failed to refresh dashboard after sync", { error }, user.id, 'sync');
        setErrors(prev => [...prev, "Failed to refresh dashboard after data sync"]);
      }

      // Show completion toast
      toast({
        title: errors.length > 0 ? "Data refreshed with warnings" : "Data refreshed",
        description: errors.length > 0 
          ? `Data has been updated with ${errors.length} warnings. Check the logs for details.` 
          : "Repository data has been successfully updated",
        variant: errors.length > 0 ? "default" : "default",
      });
      
      // Log the completion of the operation
      logger.info("Data refresh completed", { 
        warnings: errors.length,
        repositories: detailedRepos.length,
        sonarData: sonarDataMap.size
      }, user.id, 'sync');
      
    } catch (error) {
      console.error("Error refreshing dashboard data:", error);
      logger.error("Fatal error during data refresh", { error }, user.id, 'sync');
      toast({
        title: "Error refreshing data",
        description: "Failed to complete the data refresh operation",
        variant: "destructive",
      });
    } finally {
      setRefreshing(false);
    }
  };

  // Initial data load
  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // Calculate overall progress
  const calculateOverallProgress = () => {
    if (currentStage === 'complete' && currentProgress === 100) return 100;
    if (currentStage === 'sonar') return 50 + (currentProgress / 2);
    if (currentStage === 'github') return currentProgress / 2;
    return 0;
  };

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
        <Card className="mb-6">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Refreshing Data</CardTitle>
            <CardDescription>{statusMessage}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="text-sm font-medium">Overall Progress</div>
                <div className="text-sm text-muted-foreground">{Math.round(calculateOverallProgress())}%</div>
              </div>
              <Progress value={calculateOverallProgress()} className="h-2" />
            </div>
            
            {/* Detailed Progress Log */}
            <div className="border rounded-md p-4 bg-muted/20 max-h-40 overflow-y-auto space-y-2">
              {progressStages.map((stage, index) => (
                <div key={index} className="text-xs text-muted-foreground flex items-start gap-2">
                  <span className="text-muted-foreground">[{new Date().toLocaleTimeString()}]</span>
                  <span>{stage.message}</span>
                </div>
              ))}
              {progressStages.length === 0 && (
                <div className="text-xs text-muted-foreground">Starting data refresh...</div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* Errors Display */}
      {errors.length > 0 && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Warning</AlertTitle>
          <AlertDescription>
            <p className="mb-2">The following errors occurred during the refresh:</p>
            <ul className="list-disc pl-5 space-y-1">
              {errors.map((error, index) => (
                <li key={index} className="text-sm">{error}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {loading && dashboardData.length === 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((placeholder) => (
            <Card key={`placeholder-${placeholder}`} className="overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-hackathon-900/40 to-hackathon-800/40 text-white">
                <Skeleton className="h-6 w-1/2 bg-white/20" />
                <Skeleton className="h-4 w-3/4 bg-white/10 mt-2" />
              </CardHeader>
              <CardContent className="pt-6">
                <div className="space-y-6">
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-28" />
                    <div className="grid grid-cols-3 gap-4">
                      {[1, 2, 3].map((item) => (
                        <div key={`metric-${item}`} className="flex flex-col items-center">
                          <Skeleton className="h-5 w-5 rounded-full" />
                          <Skeleton className="h-4 w-8 mt-1" />
                          <Skeleton className="h-3 w-16 mt-1" />
                        </div>
                      ))}
                    </div>
                  </div>
                  <Skeleton className="h-px w-full" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <div className="grid grid-cols-2 gap-4">
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-full" />
                    </div>
                    <div className="grid grid-cols-3 gap-2 mt-4">
                      {[1, 2, 3].map((item) => (
                        <Skeleton key={`sonar-${item}`} className="h-16 w-full" />
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {dashboardData.map((team) => (
            <Card key={team.repoData.id} className="overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-hackathon-900 to-hackathon-800 text-white">
                <CardTitle className="text-lg">{team.repoData.name}</CardTitle>
                <CardDescription className="text-gray-300">
                  {team.repoData.description || "No description available"}
                </CardDescription>
              </CardHeader>
              
              <CardContent className="pt-6">
                <div className="space-y-6">
                  {/* GitHub Metrics */}
                  <div className="space-y-2">
                    <h3 className="text-sm font-semibold text-muted-foreground">GitHub Metrics</h3>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="flex flex-col items-center">
                        <Users className="h-5 w-5 text-hackathon-600 mb-1" />
                        <span className="text-lg font-bold">{team.repoData.contributors_count || 0}</span>
                        <span className="text-xs text-muted-foreground">Contributors</span>
                      </div>
                      <div className="flex flex-col items-center">
                        <GitCommit className="h-5 w-5 text-hackathon-600 mb-1" />
                        <span className="text-lg font-bold">{team.repoData.commits_count || 0}</span>
                        <span className="text-xs text-muted-foreground">Commits</span>
                      </div>
                      <div className="flex flex-col items-center">
                        <Calendar className="h-5 w-5 text-hackathon-600 mb-1" />
                        <span className="text-xs font-medium">
                          {formatDate(team.repoData.updated_at)}
                        </span>
                        <span className="text-xs text-muted-foreground">Updated</span>
                      </div>
                    </div>
                  </div>
                  
                  <Separator />
                  
                  {/* SonarCloud Metrics */}
                  {team.sonarData ? (
                    <div className="space-y-4">
                      <h3 className="text-sm font-semibold text-muted-foreground">SonarCloud Metrics</h3>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <div className="text-xs font-medium text-muted-foreground mb-1">Code Coverage</div>
                          <div className="flex items-center gap-2">
                            <Progress 
                              value={team.sonarData.metrics.coverage || 0} 
                              className="h-2"
                            />
                            <span className="text-sm font-medium">
                              {team.sonarData.metrics.coverage?.toFixed(1) || 0}%
                            </span>
                          </div>
                        </div>
                        <div>
                          <div className="text-xs font-medium text-muted-foreground mb-1">Lines of Code</div>
                          <div className="text-sm font-medium">
                            {team.sonarData.metrics.lines_of_code?.toLocaleString() || 0}
                          </div>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-3 gap-2">
                        <div className="flex flex-col items-center p-2 bg-red-50 rounded-md">
                          <Bug className="h-4 w-4 text-red-500 mb-1" />
                          <span className="text-sm font-bold">{team.sonarData.metrics.bugs || 0}</span>
                          <span className="text-xs text-muted-foreground">Bugs</span>
                        </div>
                        <div className="flex flex-col items-center p-2 bg-orange-50 rounded-md">
                          <AlertTriangle className="h-4 w-4 text-orange-500 mb-1" />
                          <span className="text-sm font-bold">{team.sonarData.metrics.vulnerabilities || 0}</span>
                          <span className="text-xs text-muted-foreground">Vulnerabilities</span>
                        </div>
                        <div className="flex flex-col items-center p-2 bg-blue-50 rounded-md">
                          <Code className="h-4 w-4 text-blue-500 mb-1" />
                          <span className="text-sm font-bold">{team.sonarData.metrics.code_smells || 0}</span>
                          <span className="text-xs text-muted-foreground">Code Smells</span>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <div className="text-xs font-medium text-muted-foreground mb-1">Technical Debt</div>
                          <div className="text-sm font-medium">
                            {team.sonarData.metrics.technical_debt || '0m'}
                          </div>
                        </div>
                        <div>
                          <div className="text-xs font-medium text-muted-foreground mb-1">Complexity</div>
                          <div className="text-sm font-medium">
                            {team.sonarData.metrics.complexity || 0}
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-4">
                      <p className="text-sm text-muted-foreground mb-2">
                        No SonarCloud data available for this repository
                      </p>
                      <Badge variant="outline">Not Analyzed</Badge>
                    </div>
                  )}
                </div>
              </CardContent>
              
              <CardFooter className="bg-muted/30 border-t">
                <Button variant="outline" asChild className="w-full">
                  <a 
                    href={team.repoData.html_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                  >
                    View on GitHub
                  </a>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

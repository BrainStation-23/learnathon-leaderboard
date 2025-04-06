
import { useState, useEffect } from "react";
import { useConfig } from "@/context/ConfigContext";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { fetchRepositoriesForOrg, fetchRepoDetails } from "@/services/githubService";
import { fetchSonarCloudData } from "@/services/sonarCloudService";
import { saveRepositoryData, saveSonarData, fetchDashboardData } from "@/services/supabaseService";
import { TeamDashboardData } from "@/types";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, Calendar, Users, GitCommit, AlertTriangle, Bug, Shield, Code } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";

export default function RepositoryList() {
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [dashboardData, setDashboardData] = useState<TeamDashboardData[]>([]);
  const { config, isConfigured } = useConfig();
  const { user } = useAuth();
  const { toast } = useToast();

  // Load data from Supabase
  const loadData = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const data = await fetchDashboardData();
      setDashboardData(data);
    } catch (error) {
      console.error("Error loading dashboard data:", error);
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
    try {
      // Fetch GitHub repositories
      const repos = await fetchRepositoriesForOrg(
        config.github_org,
        config.github_pat
      );

      // Fetch additional GitHub data (contributors, etc.)
      const detailedRepos = await fetchRepoDetails(
        repos,
        config.github_org,
        config.github_pat
      );

      // Fetch SonarCloud data for these repositories
      const sonarDataMap = await fetchSonarCloudData(
        config.sonarcloud_org,
        detailedRepos
      );

      // Save data to Supabase
      await saveRepositoryData(detailedRepos, user.id);
      await saveSonarData(sonarDataMap, user.id);

      // Reload data from Supabase
      await loadData();

      toast({
        title: "Data refreshed",
        description: "Repository data has been successfully updated",
      });
    } catch (error) {
      console.error("Error refreshing dashboard data:", error);
      toast({
        title: "Error refreshing data",
        description: "Failed to update repository data. Please check your configuration.",
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
              "Refresh from GitHub"
            )}
          </Button>
        </div>
      </div>

      {loading && dashboardData.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12">
          <Loader2 className="h-8 w-8 animate-spin text-hackathon-500 mb-4" />
          <p className="text-muted-foreground">Loading repository data...</p>
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

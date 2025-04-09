
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { TeamDashboardData } from "@/types";
import SecurityIssuesList from "@/components/dashboard/SecurityIssuesList";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import useRepositoryData from "@/hooks/repository/useRepositoryData";

const RepositoryDetails = () => {
  const params = useParams();
  const { repoId } = params;
  const navigate = useNavigate();
  const { toast } = useToast();
  const { dashboardData } = useRepositoryData();
  const [selectedRepo, setSelectedRepo] = useState<TeamDashboardData | null>(null);
  
  useEffect(() => {
    if (repoId && dashboardData.length > 0) {
      const repo = dashboardData.find(repo => repo.repoData.id.toString() === repoId);
      if (repo) {
        setSelectedRepo(repo);
      } else {
        toast({
          variant: "destructive",
          title: "Repository not found",
          description: "The repository you're looking for could not be found."
        });
        navigate("/repositories");
      }
    }
  }, [repoId, dashboardData, navigate, toast]);
  
  if (!selectedRepo) {
    return (
      <DashboardLayout>
        <div className="flex justify-between mb-6">
          <Button 
            variant="outline" 
            onClick={() => navigate("/repositories")} 
            className="gap-2"
          >
            <ArrowLeft size={16} />
            Back to repositories
          </Button>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Loading repository details...</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Please wait while we load the repository details.
            </p>
          </CardContent>
        </Card>
      </DashboardLayout>
    );
  }
  
  return (
    <DashboardLayout>
      <div className="flex justify-between mb-6">
        <Button 
          variant="outline" 
          onClick={() => navigate("/repositories")} 
          className="gap-2"
        >
          <ArrowLeft size={16} />
          Back to repositories
        </Button>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader className="flex flex-row items-start justify-between">
              <div>
                <CardTitle className="text-2xl">{selectedRepo.repoData.name}</CardTitle>
                <CardDescription className="mt-1">
                  {selectedRepo.repoData.description || "No description available"}
                </CardDescription>
              </div>
              <Button variant="outline" size="sm" className="flex items-center gap-2" asChild>
                <a href={selectedRepo.repoData.html_url} target="_blank" rel="noopener noreferrer">
                  <span>View on GitHub</span>
                  <ExternalLink size={16} />
                </a>
              </Button>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="border shadow-sm">
                  <CardHeader>
                    <CardTitle className="text-lg">Repository Information</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-col space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Contributors:</span>
                        <span>{selectedRepo.repoData.contributors_count || "Not available"}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Commits:</span>
                        <span>{selectedRepo.repoData.commits_count || "Not available"}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">License:</span>
                        <span>{selectedRepo.repoData.license ? selectedRepo.repoData.license.name : "Not specified"}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Last Updated:</span>
                        <span>{selectedRepo.repoData.last_commit_date ? new Date(selectedRepo.repoData.last_commit_date).toLocaleDateString() : "Unknown"}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                {selectedRepo.sonarData ? (
                  <Card className="border shadow-sm">
                    <CardHeader>
                      <CardTitle className="text-lg">SonarCloud Metrics</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-col space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Code Coverage:</span>
                          <span>{selectedRepo.sonarData.metrics.coverage?.toFixed(1) || "0"}%</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Lines of Code:</span>
                          <span>{selectedRepo.sonarData.metrics.lines_of_code?.toLocaleString() || "0"}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Bugs:</span>
                          <span>{selectedRepo.sonarData.metrics.bugs || "0"}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Vulnerabilities:</span>
                          <span>{selectedRepo.sonarData.metrics.vulnerabilities || "0"}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Code Smells:</span>
                          <span>{selectedRepo.sonarData.metrics.code_smells || "0"}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <Card className="border shadow-sm">
                    <CardHeader>
                      <CardTitle className="text-lg">SonarCloud Metrics</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-muted-foreground">No SonarCloud data available for this repository.</p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
        
        <div className="lg:sticky lg:top-4 h-fit max-h-[calc(100vh-2rem)] overflow-auto">
          <SecurityIssuesList 
            issues={selectedRepo.securityIssues || []} 
            repoName={selectedRepo.repoData.name}
          />
        </div>
      </div>
    </DashboardLayout>
  );
};

export default RepositoryDetails;

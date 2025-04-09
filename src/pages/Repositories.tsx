
import DashboardLayout from "@/components/layout/DashboardLayout";
import { useState } from "react";
import { TeamDashboardData } from "@/types";
import SecurityIssuesList from "@/components/dashboard/SecurityIssuesList";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import RepositoriesTable from "@/components/dashboard/RepositoriesTable";
import { ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";

const Repositories = () => {
  const [selectedRepo, setSelectedRepo] = useState<TeamDashboardData | null>(null);
  
  return (
    <DashboardLayout>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <RepositoriesTable onSelectRepository={setSelectedRepo} selectedRepo={selectedRepo} />
        </div>
        <div className="lg:sticky lg:top-4 space-y-6 h-fit max-h-[calc(100vh-2rem)] overflow-auto">
          {selectedRepo ? (
            <>
              <Card>
                <CardHeader className="flex flex-row items-start justify-between">
                  <div>
                    <CardTitle>{selectedRepo.repoData.name}</CardTitle>
                    <CardDescription className="mt-1">
                      {selectedRepo.repoData.description || "No description available"}
                    </CardDescription>
                  </div>
                  <Button variant="outline" size="sm" className="flex items-center gap-2" asChild>
                    <a href={selectedRepo.repoData.html_url} target="_blank" rel="noopener noreferrer">
                      <span>View Repo</span>
                      <ExternalLink size={16} />
                    </a>
                  </Button>
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
                    {selectedRepo.sonarData && (
                      <>
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
                      </>
                    )}
                    {!selectedRepo.sonarData && (
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">SonarCloud Data:</span>
                        <span>Not available</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
              
              {/* Security issues component */}
              <SecurityIssuesList 
                issues={selectedRepo.securityIssues || []} 
                repoName={selectedRepo.repoData.name}
              />
            </>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Repository Details</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Select a repository to view its details and security vulnerabilities.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Repositories;


import DashboardLayout from "@/components/layout/DashboardLayout";
import { useState } from "react";
import { TeamDashboardData } from "@/types";
import SecurityIssuesList from "@/components/dashboard/SecurityIssuesList";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import RepositoriesTable from "@/components/dashboard/RepositoriesTable";

const Repositories = () => {
  const [selectedRepo, setSelectedRepo] = useState<TeamDashboardData | null>(null);
  
  return (
    <DashboardLayout>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <RepositoriesTable onSelectRepository={setSelectedRepo} selectedRepo={selectedRepo} />
        </div>
        <div className="space-y-6">
          {selectedRepo ? (
            <>
              <Card>
                <CardHeader>
                  <CardTitle>{selectedRepo.repoData.name}</CardTitle>
                  <CardDescription>{selectedRepo.repoData.description || "No description available"}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Contributors:</span>
                      <span>{selectedRepo.repoData.contributors_count || 0}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Commits:</span>
                      <span>{selectedRepo.repoData.commits_count || 0}</span>
                    </div>
                    {selectedRepo.repoData.license && (
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">License:</span>
                        <span>{selectedRepo.repoData.license.name}</span>
                      </div>
                    )}
                    {selectedRepo.sonarData && (
                      <>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Code Coverage:</span>
                          <span>{selectedRepo.sonarData.metrics.coverage?.toFixed(1) || 0}%</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Lines of Code:</span>
                          <span>{selectedRepo.sonarData.metrics.lines_of_code?.toLocaleString() || 0}</span>
                        </div>
                      </>
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


import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { TeamDashboardData } from "@/types";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import useRepositoryData from "@/hooks/repository/useRepositoryData";
import { fetchFilteredContributors } from "@/services/leaderboard/filterSettingsService";

// Import newly created components
import { RepositoryHeader } from "@/components/repository/RepositoryHeader";
import { RepositoryDescription } from "@/components/repository/RepositoryDescription";
import { RepositoryMetricCards } from "@/components/repository/RepositoryMetricCards";
import { RepositoryDetailsTabs } from "@/components/repository/RepositoryDetailsTabs";

const RepositoryDetails = () => {
  const params = useParams();
  const { repoId } = params;
  const navigate = useNavigate();
  const { toast } = useToast();
  const { dashboardData } = useRepositoryData();
  const [selectedRepo, setSelectedRepo] = useState<TeamDashboardData | null>(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [filteredContributorsList, setFilteredContributorsList] = useState<string[]>([]);
  
  useEffect(() => {
    const getFilteredContributors = async () => {
      const filteredList = await fetchFilteredContributors();
      setFilteredContributorsList(filteredList);
    };
    
    getFilteredContributors();
  }, []);

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
          <CardContent className="py-6">
            <p className="text-muted-foreground">
              Loading repository details...
            </p>
          </CardContent>
        </Card>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <RepositoryHeader 
        repository={selectedRepo.repoData} 
        sonarData={selectedRepo.sonarData}
        onBackClick={() => navigate("/repositories")} 
      />
      
      <RepositoryDescription description={selectedRepo.repoData.description} />
      
      <RepositoryMetricCards 
        repository={selectedRepo.repoData}
        filteredContributors={filteredContributorsList}
        securityIssues={selectedRepo.securityIssues}
      />
      
      <RepositoryDetailsTabs
        repository={selectedRepo.repoData}
        sonarData={selectedRepo.sonarData}
        securityIssues={selectedRepo.securityIssues}
        filteredContributorsList={filteredContributorsList}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />
    </DashboardLayout>
  );
};

export default RepositoryDetails;

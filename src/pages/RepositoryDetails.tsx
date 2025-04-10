
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { TeamDashboardData } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import useRepositoryData from "@/hooks/repository/useRepositoryData";
import RepositoryDetailsView from "@/components/repository/RepositoryDetailsView";

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
      <RepositoryDetailsView 
        repository={selectedRepo} 
        showBackButton={true}
        onBackClick={() => navigate("/repositories")}
      />
    </DashboardLayout>
  );
};

export default RepositoryDetails;

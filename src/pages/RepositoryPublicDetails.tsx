
import { useParams, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { useLeaderboardData } from "@/hooks/useLeaderboardData";
import { TeamDashboardData } from "@/types";
import RepositoryDetailsView from "@/components/repository/RepositoryDetailsView";

const RepositoryPublicDetails = () => {
  const { repoId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { leaderboardData } = useLeaderboardData();
  const [repository, setRepository] = useState<TeamDashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  // Convert leaderboard item to TeamDashboardData format for the details view
  useEffect(() => {
    if (repoId && leaderboardData.length > 0) {
      setLoading(true);
      const foundRepo = leaderboardData.find(
        (item) => item.repositoryId === repoId
      );

      if (foundRepo) {
        // Convert LeaderboardItem to TeamDashboardData format
        const repoData = {
          repoData: {
            id: foundRepo.repositoryId,
            name: foundRepo.repositoryName,
            full_name: foundRepo.repositoryName,
            html_url: foundRepo.githubUrl || "",
            description: "",  // Default empty string since it doesn't exist in LeaderboardItem
            updated_at: foundRepo.lastUpdated,
            last_commit_date: foundRepo.lastUpdated,
            license: undefined,  // Default undefined since it doesn't exist in LeaderboardItem
            contributors_count: foundRepo.contributors?.length || 0,
            commits_count: foundRepo.commitsCount || 0,
            contributors: foundRepo.contributors?.map(c => ({
              id: c.id,
              login: c.login,
              avatar_url: c.avatar_url,
              contributions: c.contributions
            })) || []
          },
          sonarData: {
            project_key: "",  // Default empty string since sonarProjectKey doesn't exist in LeaderboardItem
            name: foundRepo.repositoryName,
            metrics: {
              lines_of_code: foundRepo.linesOfCode,
              coverage: foundRepo.coverage,
              bugs: foundRepo.bugs,
              vulnerabilities: foundRepo.vulnerabilities,
              code_smells: foundRepo.codeSmells,
              technical_debt: foundRepo.technicalDebt || "0",
              complexity: foundRepo.complexity || 0
            }
          },
          securityIssues: []  // Default empty array since securityIssues doesn't exist in LeaderboardItem
        };

        setRepository(repoData);
      } else {
        toast({
          variant: "destructive",
          title: "Repository not found",
          description: "The repository you're looking for could not be found."
        });
        navigate("/");
      }
      setLoading(false);
    }
  }, [repoId, leaderboardData, navigate, toast]);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-10 max-w-screen-xl">
        <div className="flex justify-between mb-6">
          <Button 
            variant="outline" 
            onClick={() => navigate("/")} 
            className="gap-2"
          >
            <ArrowLeft size={16} />
            Back to leaderboard
          </Button>
        </div>
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col space-y-4 items-center justify-center py-12">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              <p>Loading repository details...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!repository) {
    return (
      <div className="container mx-auto px-4 py-10 max-w-screen-xl">
        <div className="flex justify-between mb-6">
          <Button 
            variant="outline" 
            onClick={() => navigate("/")} 
            className="gap-2"
          >
            <ArrowLeft size={16} />
            Back to leaderboard
          </Button>
        </div>
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col space-y-4 items-center justify-center py-12">
              <p className="text-xl font-medium">Repository not found</p>
              <p className="text-muted-foreground">
                The repository you're looking for could not be found.
              </p>
              <Button onClick={() => navigate("/")}>
                Return to leaderboard
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-10 max-w-screen-xl">
      <RepositoryDetailsView 
        repository={repository} 
        showBackButton={true}
        onBackClick={() => navigate("/")}
      />
    </div>
  );
};

export default RepositoryPublicDetails;

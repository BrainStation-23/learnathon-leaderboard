
import { useConfig } from "@/context/ConfigContext";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, RefreshCw } from "lucide-react";
import useRepositoryData from "@/hooks/repository/useRepositoryData";
import ProgressTracker from "./ProgressTracker";
import ErrorDisplay from "./ErrorDisplay";
import RepositoryCard from "./RepositoryCard";
import RepositoryCardSkeleton from "./RepositoryCardSkeleton";

export default function RepositoryList() {
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

      {loading && dashboardData.length === 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((placeholder) => (
            <RepositoryCardSkeleton key={`placeholder-${placeholder}`} />
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
            <RepositoryCard 
              key={team.repoData.id} 
              data={team} 
            />
          ))}
        </div>
      )}
    </div>
  );
}


import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/AuthContext";
import { useConfig } from "@/context/ConfigContext";
import { TeamDashboardData } from "@/types";
import { useProgressTracking } from "./useProgressTracking";
import { fetchAndSaveGithubData } from "./useGithubData";
import { fetchAndSaveSonarData } from "./useSonarData";

export function useSingleRepositorySync(repository: TeamDashboardData) {
  const [syncing, setSyncing] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const { user } = useAuth();
  const { config } = useConfig();
  const { toast } = useToast();
  const {
    progressStages,
    currentStage,
    currentProgress,
    statusMessage,
    progressCallback,
    resetProgress
  } = useProgressTracking();

  // Add error helper
  const addError = (error: string) => {
    setErrors(prev => [...prev, error]);
  };

  const syncRepository = async () => {
    if (!config.github_org || !config.github_pat || !user) {
      toast({
        title: "Configuration required",
        description: "Please configure your GitHub and SonarCloud settings first.",
        variant: "destructive",
      });
      return;
    }

    setSyncing(true);
    resetProgress();
    setErrors([]);

    try {
      // Filter repositories to only include the current one
      const repoData = await fetchAndSaveGithubData(
        config,
        user.id,
        progressCallback,
        addError,
        repository.repoData.name // Pass repository name to filter
      );

      if (repoData.length > 0) {
        await fetchAndSaveSonarData(
          config.sonarcloud_org,
          repoData,
          user.id,
          progressCallback,
          addError
        );
      }

      progressCallback('complete', 100, 'Repository sync completed');

      // Show completion toast
      toast({
        title: errors.length > 0 ? "Sync completed with warnings" : "Sync completed",
        description: errors.length > 0
          ? `Repository has been synced with ${errors.length} warnings`
          : "Repository has been successfully synced",
        variant: errors.length > 0 ? "default" : "default",
      });

    } catch (error) {
      console.error("Error syncing repository:", error);
      toast({
        title: "Error syncing repository",
        description: "Failed to sync repository data",
        variant: "destructive",
      });
    } finally {
      setSyncing(false);
    }
  };

  return {
    syncing,
    errors,
    progressStages,
    currentStage,
    currentProgress,
    statusMessage,
    syncRepository
  };
}

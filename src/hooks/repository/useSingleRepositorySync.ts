
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/AuthContext";
import { useConfig } from "@/context/ConfigContext";
import { TeamDashboardData } from "@/types";
import { useProgressTracking } from "./useProgressTracking";
import { fetchAndSaveGithubData } from "./useGithubData";
import { fetchAndSaveSonarData } from "./useSonarData";
import { logger } from "@/services/logService";

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
      logger.info(`Starting sync for single repository: ${repository.repoData.name}`, {
        repositoryId: repository.repoData.id,
        repositoryName: repository.repoData.name
      }, user.id, 'sync');

      // Filter repositories to only include the current one
      const repoData = await fetchAndSaveGithubData(
        config,
        user.id,
        progressCallback,
        addError,
        repository.repoData.name // Pass repository name to filter
      );

      logger.info(`Completed GitHub data fetch for ${repository.repoData.name}`, {
        dataCount: repoData.length
      }, user.id, 'sync');

      if (repoData.length > 0) {
        // Log SonarCloud configuration before fetching
        logger.info(`Starting SonarCloud data fetch for ${repository.repoData.name}`, {
          sonarOrg: config.sonarcloud_org
        }, user.id, 'sync');

        const sonarData = await fetchAndSaveSonarData(
          config.sonarcloud_org,
          repoData,
          user.id,
          progressCallback,
          addError
        );

        // Log what was returned from SonarCloud
        const repoSonarData = sonarData.get(repository.repoData.name);
        if (repoSonarData) {
          logger.info(`Retrieved SonarCloud data for ${repository.repoData.name}`, {
            projectKey: repoSonarData.project_key,
            metrics: repoSonarData.metrics
          }, user.id, 'sync');
        } else {
          logger.warn(`No SonarCloud data found for ${repository.repoData.name}`, {}, user.id, 'sync');
        }
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
      logger.error(`Error syncing repository ${repository.repoData.name}`, { error }, user.id, 'sync');
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

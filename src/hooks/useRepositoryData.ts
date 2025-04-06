
import { useState, useEffect } from "react";
import { useConfig } from "@/context/ConfigContext";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { fetchRepositoriesForOrg, fetchRepoDetails } from "@/services/githubService";
import { fetchSonarCloudData } from "@/services/sonarCloudService";
import { saveRepositoryData, saveSonarData, fetchDashboardData, ProgressCallback } from "@/services/supabaseService";
import { TeamDashboardData } from "@/types";
import { logger } from "@/services/logService";
import { ProgressStage } from "@/components/dashboard/ProgressTracker";

export default function useRepositoryData() {
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [dashboardData, setDashboardData] = useState<TeamDashboardData[]>([]);
  const [progressStages, setProgressStages] = useState<ProgressStage[]>([]);
  const [currentStage, setCurrentStage] = useState<string>('');
  const [currentProgress, setCurrentProgress] = useState<number>(0);
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [errors, setErrors] = useState<string[]>([]);
  
  const { config, isConfigured } = useConfig();
  const { user } = useAuth();
  const { toast } = useToast();

  // Progress callback for tracking operations
  const progressCallback: ProgressCallback = (stage, progress, message) => {
    setCurrentStage(stage);
    setCurrentProgress(progress);
    setStatusMessage(message);
    
    // Add to progress history
    setProgressStages(prev => [...prev, {
      stage: stage as 'github' | 'sonar' | 'complete',
      progress,
      message
    }]);
  };
  
  // Load data from Supabase
  const loadData = async () => {
    if (!user) return;
    
    setLoading(true);
    setErrors([]);
    try {
      const data = await fetchDashboardData();
      setDashboardData(data);
      logger.info("Dashboard data loaded successfully", { count: data.length }, user.id, 'dashboard');
    } catch (error) {
      console.error("Error loading dashboard data:", error);
      logger.error("Failed to load dashboard data", { error }, user.id, 'dashboard');
      setErrors(prev => [...prev, "Failed to retrieve dashboard data"]);
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
    setProgressStages([]);
    setErrors([]);
    
    try {
      // Start progress tracking
      progressCallback('github', 0, 'Fetching repositories from GitHub...');
      
      // Log the start of the operation
      logger.info("Starting data refresh", { 
        github_org: config.github_org,
        sonarcloud_org: config.sonarcloud_org 
      }, user.id, 'sync');
      
      // 1. Fetch GitHub repositories - 25% of overall progress
      let repos;
      try {
        repos = await fetchRepositoriesForOrg(
          config.github_org,
          config.github_pat
        );
        progressCallback('github', 25, `Found ${repos.length} repositories`);
        logger.info("GitHub repositories fetched", { count: repos.length }, user.id, 'sync');
      } catch (error) {
        logger.error("Failed to fetch repositories from GitHub", { error }, user.id, 'sync');
        setErrors(prev => [...prev, "Failed to fetch repositories from GitHub"]);
        toast({
          title: "GitHub Error",
          description: "Could not retrieve repositories from GitHub. Check your organization name and PAT.",
          variant: "destructive",
        });
        // Continue with empty repos
        repos = [];
      }

      // 2. Fetch additional GitHub data (contributors, etc.) - 25% -> 50% of overall progress
      let detailedRepos;
      try {
        progressCallback('github', 30, 'Fetching repository details...');
        detailedRepos = await fetchRepoDetails(
          repos,
          config.github_org,
          config.github_pat
        );
        progressCallback('github', 50, `Retrieved details for ${detailedRepos.length} repositories`);
        logger.info("GitHub repository details fetched", { count: detailedRepos.length }, user.id, 'sync');
      } catch (error) {
        logger.error("Failed to fetch repository details", { error }, user.id, 'sync');
        setErrors(prev => [...prev, "Failed to fetch repository details from GitHub"]);
        // Continue with the basic repos data
        detailedRepos = repos;
      }

      // 3. Save GitHub data to Supabase - 50% -> 60% of overall progress
      try {
        progressCallback('github', 55, 'Saving repository data to database...');
        await saveRepositoryData(detailedRepos, user.id, (_, progress, message) => {
          // Map internal progress to our overall progress (50-60%)
          const mappedProgress = 50 + progress * 0.1; // 0-100% -> 50-60%
          progressCallback('github', mappedProgress, message);
        });
        progressCallback('github', 60, 'Repository data saved successfully');
      } catch (error) {
        logger.error("Failed to save repository data to database", { error }, user.id, 'sync');
        setErrors(prev => [...prev, "Failed to save repository data to database"]);
      }

      // 4. Fetch SonarCloud data - 60% -> 80% of overall progress
      let sonarDataMap;
      try {
        progressCallback('sonar', 60, 'Fetching SonarCloud data...');
        sonarDataMap = await fetchSonarCloudData(
          config.sonarcloud_org,
          detailedRepos
        );
        progressCallback('sonar', 80, `Retrieved SonarCloud data for ${sonarDataMap.size} repositories`);
        logger.info("SonarCloud data fetched", { count: sonarDataMap.size }, user.id, 'sync');
      } catch (error) {
        logger.error("Failed to fetch SonarCloud data", { error }, user.id, 'sync');
        setErrors(prev => [...prev, "Failed to fetch SonarCloud data"]);
        // Continue with empty sonar data
        sonarDataMap = new Map();
      }

      // 5. Save SonarCloud data to Supabase - 80% -> 90% of overall progress
      try {
        progressCallback('sonar', 80, 'Saving SonarCloud data to database...');
        await saveSonarData(sonarDataMap, user.id, (_, progress, message) => {
          // Map internal progress to our overall progress (80-90%)
          const mappedProgress = 80 + progress * 0.1; // 0-100% -> 80-90%
          progressCallback('sonar', mappedProgress, message);
        });
        progressCallback('sonar', 90, 'SonarCloud data saved successfully');
      } catch (error) {
        logger.error("Failed to save SonarCloud data to database", { error }, user.id, 'sync');
        setErrors(prev => [...prev, "Failed to save SonarCloud data to database"]);
      }

      // 6. Reload data from Supabase - 90% -> 100% of overall progress
      try {
        progressCallback('complete', 90, 'Refreshing dashboard data...');
        await loadData();
        progressCallback('complete', 100, 'Dashboard refreshed successfully');
      } catch (error) {
        logger.error("Failed to refresh dashboard after sync", { error }, user.id, 'sync');
        setErrors(prev => [...prev, "Failed to refresh dashboard after data sync"]);
      }

      // Show completion toast
      toast({
        title: errors.length > 0 ? "Data refreshed with warnings" : "Data refreshed",
        description: errors.length > 0 
          ? `Data has been updated with ${errors.length} warnings. Check the logs for details.` 
          : "Repository data has been successfully updated",
        variant: errors.length > 0 ? "default" : "default",
      });
      
      // Log the completion of the operation
      logger.info("Data refresh completed", { 
        warnings: errors.length,
        repositories: detailedRepos.length,
        sonarData: sonarDataMap.size
      }, user.id, 'sync');
      
    } catch (error) {
      console.error("Error refreshing dashboard data:", error);
      logger.error("Fatal error during data refresh", { error }, user.id, 'sync');
      toast({
        title: "Error refreshing data",
        description: "Failed to complete the data refresh operation",
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

  return {
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
  };
}

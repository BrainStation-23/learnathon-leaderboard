import { useState, useEffect } from "react";
import { useConfig } from "@/context/ConfigContext";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { fetchDashboardData } from "@/services/dashboard/dashboardService";
import { TeamDashboardData } from "@/types";
import { logger } from "@/services/logService";
import { useProgressTracking } from "./useProgressTracking";
import { fetchAndSaveGithubData } from "./useGithubData";
import { fetchAndSaveSonarData } from "./useSonarData";

export default function useRepositoryData() {
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [dashboardData, setDashboardData] = useState<TeamDashboardData[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  
  const { config, isConfigured } = useConfig();
  const { user } = useAuth();
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
      addError("Failed to retrieve dashboard data");
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
    resetProgress();
    setErrors([]);
    
    try {
      // Log the start of the operation
      logger.info("Starting data refresh", { 
        github_org: config.github_org,
        sonarcloud_org: config.sonarcloud_org 
      }, user.id, 'sync');
      
      // 1. Fetch and save GitHub data
      const detailedRepos = await fetchAndSaveGithubData(
        config, 
        user.id, 
        progressCallback,
        addError
      );
      
      // 2. Fetch and save SonarCloud data
      await fetchAndSaveSonarData(
        config.sonarcloud_org,
        detailedRepos,
        user.id,
        progressCallback,
        addError
      );

      // 3. Reload data from Supabase - 90% -> 100% of overall progress
      try {
        progressCallback('complete', 90, 'Refreshing dashboard data...');
        await loadData();
        progressCallback('complete', 100, 'Dashboard refreshed successfully');
      } catch (error) {
        logger.error("Failed to refresh dashboard after sync", { error }, user.id, 'sync');
        addError("Failed to refresh dashboard after data sync");
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
        sonarData: detailedRepos.length // Approximate, as we don't have the size here
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

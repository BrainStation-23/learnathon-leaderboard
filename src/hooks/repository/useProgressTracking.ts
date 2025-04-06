
import { useState, useCallback } from "react";
import { ProgressStage } from "@/components/dashboard/ProgressTracker";
import { RepositoryDataState, ProgressCallback } from "./types";

export function useProgressTracking() {
  const [progressStages, setProgressStages] = useState<ProgressStage[]>([]);
  const [currentStage, setCurrentStage] = useState<string>('');
  const [currentProgress, setCurrentProgress] = useState<number>(0);
  const [statusMessage, setStatusMessage] = useState<string>('');
  
  const progressCallback: ProgressCallback = useCallback((stage, progress, message) => {
    setCurrentStage(stage);
    setCurrentProgress(progress);
    setStatusMessage(message);
    
    // Add to progress history
    setProgressStages(prev => [...prev, {
      stage: stage as 'github' | 'sonar' | 'complete',
      progress,
      message
    }]);
  }, []);
  
  const resetProgress = useCallback(() => {
    setProgressStages([]);
    setCurrentStage('');
    setCurrentProgress(0);
    setStatusMessage('');
  }, []);

  return {
    progressStages,
    currentStage,
    currentProgress,
    statusMessage,
    progressCallback,
    resetProgress
  };
}

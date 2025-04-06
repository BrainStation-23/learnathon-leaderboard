
import { ProgressStage } from "@/components/dashboard/ProgressTracker";

export interface RepositoryDataState {
  loading: boolean;
  refreshing: boolean;
  progressStages: ProgressStage[];
  currentStage: string;
  currentProgress: number;
  statusMessage: string;
  errors: string[];
}

export type ProgressCallback = (stage: string, progress: number, message: string) => void;

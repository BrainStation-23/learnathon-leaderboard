
import React from "react";
import { Button } from "@/components/ui/button";
import { Loader2, RefreshCw } from "lucide-react";
import { TeamDashboardData } from "@/types";
import { useSingleRepositorySync } from "@/hooks/repository/useSingleRepositorySync";
import ProgressTracker from "../dashboard/ProgressTracker";
import ErrorDisplay from "../dashboard/ErrorDisplay";

interface RepositorySyncProps {
  repository: TeamDashboardData;
}

export function RepositorySync({ repository }: RepositorySyncProps) {
  const {
    syncing,
    errors,
    progressStages,
    currentStage,
    currentProgress,
    statusMessage,
    syncRepository
  } = useSingleRepositorySync(repository);

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button
          onClick={syncRepository}
          disabled={syncing}
          className="flex items-center gap-2"
        >
          {syncing ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <>
              <RefreshCw className="h-4 w-4" />
              <span>Sync Now</span>
            </>
          )}
        </Button>
      </div>

      {syncing && (
        <ProgressTracker
          currentStage={currentStage}
          currentProgress={currentProgress}
          statusMessage={statusMessage}
          progressStages={progressStages}
        />
      )}

      {errors.length > 0 && <ErrorDisplay errors={errors} />}
    </div>
  );
}

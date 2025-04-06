
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Loader2 } from "lucide-react";

export type ProgressStage = {
  stage: 'github' | 'sonar' | 'complete';
  progress: number;
  message: string;
};

type ProgressTrackerProps = {
  currentStage: string;
  currentProgress: number;
  statusMessage: string;
  progressStages: ProgressStage[];
};

export default function ProgressTracker({
  currentStage,
  currentProgress,
  statusMessage,
  progressStages
}: ProgressTrackerProps) {
  // Calculate overall progress
  const calculateOverallProgress = () => {
    if (currentStage === 'complete' && currentProgress === 100) return 100;
    if (currentStage === 'sonar') return 50 + (currentProgress / 2);
    if (currentStage === 'github') return currentProgress / 2;
    return 0;
  };

  return (
    <Card className="mb-6">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">Refreshing Data</CardTitle>
        <CardDescription>{statusMessage}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="text-sm font-medium">Overall Progress</div>
            <div className="text-sm text-muted-foreground">{Math.round(calculateOverallProgress())}%</div>
          </div>
          <Progress value={calculateOverallProgress()} className="h-2" />
        </div>
        
        {/* Detailed Progress Log */}
        <div className="border rounded-md p-4 bg-muted/20 max-h-40 overflow-y-auto space-y-2">
          {progressStages.map((stage, index) => (
            <div key={index} className="text-xs text-muted-foreground flex items-start gap-2">
              <span className="text-muted-foreground">[{new Date().toLocaleTimeString()}]</span>
              <span>{stage.message}</span>
            </div>
          ))}
          {progressStages.length === 0 && (
            <div className="text-xs text-muted-foreground">Starting data refresh...</div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

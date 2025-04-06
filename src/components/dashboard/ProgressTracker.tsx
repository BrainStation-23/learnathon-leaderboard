
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
  // Calculate overall progress based on the sequential stages
  const calculateOverallProgress = () => {
    // Our workflow is now truly sequential and percentages are already
    // calculated properly in the hook
    return currentProgress;
  };

  const renderStageBadge = (stage: string) => {
    const isActive = currentStage === stage;
    const isComplete = 
      (stage === 'github' && ['sonar', 'complete'].includes(currentStage)) ||
      (stage === 'sonar' && currentStage === 'complete') ||
      (currentStage === stage && currentProgress === 100);
    
    return (
      <div 
        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
          isComplete 
            ? 'bg-green-100 text-green-800' 
            : isActive 
              ? 'bg-blue-100 text-blue-800' 
              : 'bg-gray-100 text-gray-800'
        }`}
      >
        {isActive && currentProgress < 100 && (
          <Loader2 className="h-3 w-3 mr-1 animate-spin" />
        )}
        {stage.charAt(0).toUpperCase() + stage.slice(1)}
      </div>
    );
  };

  return (
    <Card className="mb-6">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg">Refreshing Data</CardTitle>
          <div className="flex space-x-2">
            {renderStageBadge('github')}
            {renderStageBadge('sonar')}
            {renderStageBadge('complete')}
          </div>
        </div>
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

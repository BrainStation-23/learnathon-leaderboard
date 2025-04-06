
import React from "react";
import { Progress } from "@/components/ui/progress";

interface ScoreProgressProps {
  score: number;
  maxScore: number;
  label: string;
  value: number | string | null;
  valueUnit?: string;
}

export function ScoreProgressBar({ score, maxScore, label, value, valueUnit = "" }: ScoreProgressProps) {
  const percentage = (score / maxScore) * 100;
  
  // Define the color based on the percentage
  let progressColor = "";
  if (percentage >= 80) progressColor = "bg-green-500";
  else if (percentage >= 60) progressColor = "bg-yellow-500";
  else if (percentage >= 40) progressColor = "bg-orange-500";
  else progressColor = "bg-red-500";
  
  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center text-sm">
        <span className="font-medium">{label}</span>
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground">
            {value !== null ? `${value}${valueUnit}` : 'N/A'}
          </span>
          <span className="font-semibold">
            {score}/{maxScore}
          </span>
        </div>
      </div>
      <Progress value={percentage} className="h-2" indicatorClassName={progressColor} />
    </div>
  );
}


import React from "react";
import { Code } from "lucide-react";

interface LinesOfCodeIndicatorProps {
  linesOfCode: number | null;
}

export function LinesOfCodeIndicator({ linesOfCode }: LinesOfCodeIndicatorProps) {
  if (linesOfCode === null) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Code size={16} />
        <span>Lines of code not available</span>
      </div>
    );
  }

  // Determine color based on lines of code
  let colorClass = "";
  let statusText = "";

  if (linesOfCode < 1000) {
    colorClass = "text-red-500 bg-red-50";
    statusText = "Small";
  } else if (linesOfCode < 3000) {
    colorClass = "text-yellow-500 bg-yellow-50";
    statusText = "Medium";
  } else {
    colorClass = "text-green-500 bg-green-50";
    statusText = "Large";
  }

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2 text-sm">
        <Code size={16} />
        <span>
          {linesOfCode.toLocaleString()} lines of code
        </span>
      </div>
      <div className={`px-2 py-1 rounded-full text-xs font-medium ${colorClass}`}>
        {statusText}
      </div>
    </div>
  );
}


import React from "react";
import { CircleX } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface TechStackIconsProps {
  techStacks?: string[];
}

export const TechStackIcons: React.FC<TechStackIconsProps> = ({ techStacks = [] }) => {
  // If no tech stacks, show placeholder
  if (!techStacks.length) {
    return (
      <Badge variant="outline" className="bg-muted/50 gap-1 text-xs">
        <CircleX className="h-3 w-3 text-muted-foreground" />
        <span>Not assigned</span>
      </Badge>
    );
  }

  // Display tech stack names as badges
  return (
    <div className="flex flex-wrap gap-1">
      {techStacks.map((stack) => (
        <Badge 
          key={stack}
          variant="outline" 
          className={`text-xs ${getColorClass(stack)}`}
        >
          {stack}
        </Badge>
      ))}
    </div>
  );
};

function getColorClass(name: string): string {
  // Convert name to lowercase for case-insensitive comparison
  const normalizedName = name.toLowerCase();
  
  // Define background colors for each stack
  switch (normalizedName) {
    case "unity":
      return "bg-green-50 text-green-700 border-green-200";
    case ".net":
      return "bg-blue-50 text-blue-700 border-blue-200";
    case "java":
      return "bg-red-50 text-red-700 border-red-200";
    case "python":
      return "bg-yellow-50 text-yellow-700 border-yellow-200";
    case "php":
      return "bg-purple-50 text-purple-700 border-purple-200";
    case "cross-platform":
      return "bg-teal-50 text-teal-700 border-teal-200";
    case "mern":
      return "bg-orange-50 text-orange-700 border-orange-200";
    default:
      return "bg-gray-50 text-gray-700 border-gray-200";
  }
}

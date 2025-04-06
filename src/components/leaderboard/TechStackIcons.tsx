
import React from "react";
import { Unity, CircleX } from "lucide-react";
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

  // Map tech stack names to icons
  return (
    <div className="flex flex-wrap gap-1">
      {techStacks.map((stack) => (
        <TechStackIcon key={stack} name={stack} />
      ))}
    </div>
  );
};

interface TechStackIconProps {
  name: string;
}

const TechStackIcon: React.FC<TechStackIconProps> = ({ name }) => {
  const stackInfo = getStackInfo(name);
  
  return (
    <Badge 
      variant="outline" 
      className={`gap-1 text-xs ${stackInfo.bgClass}`}
    >
      {stackInfo.icon}
      <span>{name}</span>
    </Badge>
  );
};

function getStackInfo(name: string): { icon: JSX.Element; bgClass: string } {
  // Convert name to lowercase for case-insensitive comparison
  const normalizedName = name.toLowerCase();
  
  // Define icons for each stack
  switch (normalizedName) {
    case "unity":
      return { 
        icon: <Unity className="h-3 w-3" />,
        bgClass: "bg-green-50 text-green-700 border-green-200" 
      };
    case ".net":
      return { 
        icon: <Unity className="h-3 w-3" />, // This should be .NET icon from lucide if available
        bgClass: "bg-blue-50 text-blue-700 border-blue-200" 
      };
    case "java":
      return { 
        icon: <Unity className="h-3 w-3" />, // This should be Java icon from lucide if available
        bgClass: "bg-red-50 text-red-700 border-red-200" 
      };
    case "python":
      return { 
        icon: <Unity className="h-3 w-3" />, // This should be Python icon from lucide if available 
        bgClass: "bg-yellow-50 text-yellow-700 border-yellow-200" 
      };
    case "php":
      return { 
        icon: <Unity className="h-3 w-3" />, // This should be PHP icon from lucide if available
        bgClass: "bg-purple-50 text-purple-700 border-purple-200" 
      };
    case "cross-platform":
      return { 
        icon: <Unity className="h-3 w-3" />, // This should be Cross-Platform icon from lucide if available
        bgClass: "bg-teal-50 text-teal-700 border-teal-200" 
      };
    case "mern":
      return { 
        icon: <Unity className="h-3 w-3" />, // This should be MERN icon from lucide if available
        bgClass: "bg-orange-50 text-orange-700 border-orange-200" 
      };
    default:
      return {
        icon: <CircleX className="h-3 w-3" />,
        bgClass: "bg-gray-50 text-gray-700 border-gray-200"
      };
  }
}

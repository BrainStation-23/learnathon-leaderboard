
import React from "react";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";
import { TechStack } from "@/types/leaderboard";

interface CurrentTechStacksProps {
  techStacks: TechStack[];
  onRemove: (techStackId: string) => void;
  saving: boolean;
}

export function CurrentTechStacks({ 
  techStacks, 
  onRemove, 
  saving 
}: CurrentTechStacksProps) {
  return (
    <div className="space-y-2">
      <h4 className="text-sm font-medium">Current Tech Stacks</h4>
      <div className="flex flex-wrap gap-2 min-h-10 p-2 border rounded-md bg-muted/30">
        {techStacks.length === 0 ? (
          <p className="text-sm text-muted-foreground">No tech stacks assigned</p>
        ) : (
          techStacks.map((techStack: TechStack) => (
            <Badge key={techStack.id} variant="secondary" className="flex items-center gap-1">
              {techStack.name}
              <button
                onClick={() => onRemove(techStack.id)}
                className="hover:text-destructive focus:outline-none"
                disabled={saving}
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))
        )}
      </div>
    </div>
  );
}

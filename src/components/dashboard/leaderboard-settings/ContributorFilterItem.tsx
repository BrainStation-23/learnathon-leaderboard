
import React from "react";
import { Checkbox } from "@/components/ui/checkbox";

interface ContributorFilterItemProps {
  login: string;
  contributions: number;
  isFiltered: boolean;
  onToggle: (login: string) => void;
}

export function ContributorFilterItem({ 
  login, 
  contributions, 
  isFiltered, 
  onToggle 
}: ContributorFilterItemProps) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center space-x-2">
        <Checkbox 
          id={`filter-${login}`}
          checked={isFiltered}
          onCheckedChange={() => onToggle(login)}
        />
        <label
          htmlFor={`filter-${login}`}
          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
        >
          {login}
        </label>
      </div>
      <span className="text-xs text-muted-foreground">
        {contributions} commits
      </span>
    </div>
  );
}

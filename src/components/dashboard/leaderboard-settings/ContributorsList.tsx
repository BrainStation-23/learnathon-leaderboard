
import React from "react";
import { ContributorFilterItem } from "./ContributorFilterItem";

interface Contributor {
  login: string;
  contributions: number;
  isFiltered: boolean;
}

interface ContributorsListProps {
  contributors: Contributor[];
  onToggleContributor: (login: string) => void;
}

export function ContributorsList({ contributors, onToggleContributor }: ContributorsListProps) {
  if (contributors.length === 0) {
    return (
      <div className="text-center py-6 text-muted-foreground">
        No contributors found. Please sync repository data first.
      </div>
    );
  }

  return (
    <div className="max-h-96 overflow-y-auto border rounded-md p-4">
      <div className="space-y-4">
        {contributors.map((contributor) => (
          <ContributorFilterItem
            key={contributor.login}
            login={contributor.login}
            contributions={contributor.contributions}
            isFiltered={contributor.isFiltered}
            onToggle={onToggleContributor}
          />
        ))}
      </div>
    </div>
  );
}

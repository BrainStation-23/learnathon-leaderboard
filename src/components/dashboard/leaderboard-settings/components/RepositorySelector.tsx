
import React from "react";
import { 
  Select, 
  SelectContent, 
  SelectGroup, 
  SelectItem, 
  SelectLabel, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Repository } from "../hooks/useTechStackRepository";

interface RepositorySelectorProps {
  repositories: Repository[];
  selectedRepository: string | null;
  setSelectedRepository: (id: string) => void;
}

export function RepositorySelector({ 
  repositories, 
  selectedRepository, 
  setSelectedRepository 
}: RepositorySelectorProps) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">Select Repository</label>
      <Select 
        value={selectedRepository || ""} 
        onValueChange={setSelectedRepository}
      >
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Select a repository" />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectLabel>Repositories</SelectLabel>
            {repositories.map(repo => (
              <SelectItem key={repo.id} value={repo.id}>{repo.name}</SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
    </div>
  );
}

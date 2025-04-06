
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
import { Button } from "@/components/ui/button";
import { Loader2, Plus } from "lucide-react";
import { TechStack } from "@/types/leaderboard";

interface AddTechStackProps {
  techStacks: TechStack[];
  selectedTechStack: string | null;
  setSelectedTechStack: (id: string) => void;
  onAdd: () => Promise<void>;
  saving: boolean;
}

export function AddTechStack({
  techStacks,
  selectedTechStack,
  setSelectedTechStack,
  onAdd,
  saving
}: AddTechStackProps) {
  return (
    <div className="space-y-4">
      <h4 className="text-sm font-medium">Add Tech Stack</h4>
      <div className="flex gap-2">
        <Select 
          value={selectedTechStack || ""} 
          onValueChange={setSelectedTechStack}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select a tech stack" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectLabel>Tech Stacks</SelectLabel>
              {techStacks.map(stack => (
                <SelectItem key={stack.id} value={stack.id}>{stack.name}</SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
        <Button 
          onClick={onAdd} 
          disabled={!selectedTechStack || saving}
          size="sm"
        >
          {saving ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : (
            <Plus className="h-4 w-4 mr-2" />
          )}
          Add
        </Button>
      </div>
    </div>
  );
}

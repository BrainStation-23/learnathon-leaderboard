
import React, { useState, useMemo } from "react";
import { Search, Filter } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { LeaderboardItem } from "@/types/leaderboard";

interface LeaderboardFiltersProps {
  data: LeaderboardItem[];
  onFiltered: (filtered: LeaderboardItem[]) => void;
}

export function LeaderboardFilters({ data, onFiltered }: LeaderboardFiltersProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStacks, setSelectedStacks] = useState<string[]>([]);
  const [locRange, setLocRange] = useState<[number, number]>([0, 1000000]);
  const [activeFilters, setActiveFilters] = useState(0);

  // Extract all unique tech stacks from the data
  const availableStacks = useMemo(() => {
    const stacksSet = new Set<string>();
    data.forEach(item => {
      if (item.techStacks) {
        item.techStacks.forEach(stack => stacksSet.add(stack));
      }
    });
    return Array.from(stacksSet).sort();
  }, [data]);

  // Find min/max lines of code
  const locBoundaries = useMemo(() => {
    let min = Number.MAX_SAFE_INTEGER;
    let max = 0;
    data.forEach(item => {
      if (item.linesOfCode) {
        min = Math.min(min, item.linesOfCode);
        max = Math.max(max, item.linesOfCode);
      }
    });
    // Set reasonable defaults if no data
    if (min === Number.MAX_SAFE_INTEGER) min = 0;
    if (max === 0) max = 100000;
    
    // Round to nice numbers
    min = Math.max(0, Math.floor(min / 1000) * 1000);
    max = Math.ceil(max / 1000) * 1000;
    
    return { min, max };
  }, [data]);

  // Set default LOC range on first render
  React.useEffect(() => {
    setLocRange([locBoundaries.min, locBoundaries.max]);
  }, [locBoundaries.min, locBoundaries.max]);

  // Apply filters
  const applyFilters = () => {
    let filtered = [...data];
    
    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(item => 
        item.repositoryName.toLowerCase().includes(query)
      );
    }
    
    // Apply tech stack filter
    if (selectedStacks.length > 0) {
      filtered = filtered.filter(item => {
        if (!item.techStacks || item.techStacks.length === 0) return false;
        return selectedStacks.some(stack => item.techStacks?.includes(stack));
      });
    }
    
    // Apply LOC range filter
    filtered = filtered.filter(item => {
      const loc = item.linesOfCode || 0;
      return loc >= locRange[0] && loc <= locRange[1];
    });
    
    onFiltered(filtered);
    
    // Update active filters count
    let filterCount = 0;
    if (searchQuery.trim()) filterCount++;
    if (selectedStacks.length > 0) filterCount++;
    if (locRange[0] > locBoundaries.min || locRange[1] < locBoundaries.max) filterCount++;
    setActiveFilters(filterCount);
  };

  // Reset all filters
  const resetFilters = () => {
    setSearchQuery("");
    setSelectedStacks([]);
    setLocRange([locBoundaries.min, locBoundaries.max]);
    onFiltered(data);
    setActiveFilters(0);
  };

  // Toggle stack selection
  const toggleStack = (stack: string) => {
    setSelectedStacks(prev => {
      if (prev.includes(stack)) {
        return prev.filter(s => s !== stack);
      } else {
        return [...prev, stack];
      }
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 md:flex-row md:items-center">
        <div className="relative flex-grow">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search repositories..."
            className="pl-8 pr-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") applyFilters();
            }}
          />
          {searchQuery && (
            <Button
              variant="ghost"
              size="sm"
              className="absolute right-1 top-1.5 h-7 w-7 rounded-full p-0"
              onClick={() => {
                setSearchQuery("");
                applyFilters();
              }}
            >
              <span className="sr-only">Clear search</span>
              <span className="text-sm font-medium">✕</span>
            </Button>
          )}
        </div>

        <div className="flex gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="flex items-center gap-1">
                <Filter className="h-3.5 w-3.5" />
                <span>Filter</span>
                {activeFilters > 0 && (
                  <span className="ml-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-medium text-primary-foreground">
                    {activeFilters}
                  </span>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-72">
              <div className="p-2">
                <h4 className="font-medium mb-2">Tech Stacks</h4>
                <div className="max-h-40 overflow-y-auto space-y-1">
                  {availableStacks.length === 0 ? (
                    <p className="text-sm text-muted-foreground py-1">No tech stacks available</p>
                  ) : (
                    availableStacks.map((stack) => (
                      <div key={stack} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id={`stack-${stack}`}
                          className="rounded border-gray-300"
                          checked={selectedStacks.includes(stack)}
                          onChange={() => toggleStack(stack)}
                        />
                        <label
                          htmlFor={`stack-${stack}`}
                          className="text-sm flex-grow cursor-pointer"
                        >
                          {stack}
                        </label>
                      </div>
                    ))
                  )}
                </div>
              </div>
              
              <DropdownMenuSeparator />
              
              <div className="p-2">
                <h4 className="font-medium mb-2">Lines of Code</h4>
                <div className="px-3">
                  <Slider
                    defaultValue={[locBoundaries.min, locBoundaries.max]}
                    min={locBoundaries.min}
                    max={locBoundaries.max}
                    step={1000}
                    value={locRange}
                    onValueChange={(value) => setLocRange(value as [number, number])}
                  />
                </div>
                <div className="flex justify-between text-xs mt-2 text-muted-foreground">
                  <span>{locRange[0].toLocaleString()} lines</span>
                  <span>{locRange[1].toLocaleString()} lines</span>
                </div>
              </div>
              
              <DropdownMenuSeparator />
              
              <div className="p-2 flex justify-between">
                <Button variant="ghost" size="sm" onClick={resetFilters}>
                  Reset filters
                </Button>
                <Button size="sm" onClick={applyFilters}>
                  Apply filters
                </Button>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
          
          <Button size="sm" onClick={applyFilters}>Search</Button>
        </div>
      </div>
    </div>
  );
}

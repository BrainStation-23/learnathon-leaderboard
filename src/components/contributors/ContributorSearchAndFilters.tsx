
import React from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, ArrowUp, ArrowDown } from "lucide-react";

interface ContributorSearchAndFiltersProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  sortOrder: 'asc' | 'desc';
  setSortOrder: (order: 'asc' | 'desc') => void;
}

export default function ContributorSearchAndFilters({
  searchTerm,
  setSearchTerm,
  sortOrder,
  setSortOrder
}: ContributorSearchAndFiltersProps) {
  const toggleSortOrder = () => {
    setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc');
  };

  return (
    <div className="flex flex-col sm:flex-row gap-4 mb-6">
      <div className="relative flex-grow">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
        <Input 
          placeholder="Search by username or repository..." 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-9"
        />
      </div>
      <Button 
        variant="outline" 
        className="flex items-center gap-2"
        onClick={toggleSortOrder}
      >
        {sortOrder === 'desc' ? (
          <>
            <ArrowDown className="h-4 w-4" />
            Sort by contributions (High to Low)
          </>
        ) : (
          <>
            <ArrowUp className="h-4 w-4" />
            Sort by contributions (Low to High)
          </>
        )}
      </Button>
    </div>
  );
}

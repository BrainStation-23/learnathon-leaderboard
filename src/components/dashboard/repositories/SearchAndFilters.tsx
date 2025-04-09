
import { Search as SearchIcon } from "lucide-react";
import { Input } from "@/components/ui/input";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface SearchAndFiltersProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  securityFilter: string;
  setSecurityFilter: (filter: string) => void;
  sortBy: string;
  setSortBy: (sort: string) => void;
}

export default function SearchAndFilters({
  searchTerm,
  setSearchTerm,
  securityFilter,
  setSecurityFilter,
  sortBy,
  setSortBy
}: SearchAndFiltersProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
      <div className="relative">
        <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
        <Input 
          placeholder="Search repositories..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)} 
          className="pl-9"
        />
      </div>
      <div>
        <Select value={securityFilter} onValueChange={setSecurityFilter}>
          <SelectTrigger>
            <SelectValue placeholder="Security Filter" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Repositories</SelectItem>
            <SelectItem value="secure">Secure Only</SelectItem>
            <SelectItem value="issues">With Issues</SelectItem>
            <SelectItem value="critical">Critical Issues</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div>
        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger>
            <SelectValue placeholder="Sort By" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="name">Name</SelectItem>
            <SelectItem value="updated">Last Updated</SelectItem>
            <SelectItem value="contributors">Contributors Count</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}

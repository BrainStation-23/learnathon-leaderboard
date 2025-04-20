
import { Search, Filter } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AuditLogFilters } from "@/services/auditService";
import { getActionIcon, getEntityIcon } from "../utils/auditIcons";

interface AuditFiltersProps {
  filters: AuditLogFilters;
  searchTerm: string;
  actionTypes: string[];
  entityTypes: string[];
  onSearchChange: (value: string) => void;
  onFilterChange: (key: keyof AuditLogFilters, value: string | undefined) => void;
  onResetFilters: () => void;
}

export function AuditFilters({
  filters,
  searchTerm,
  actionTypes,
  entityTypes,
  onSearchChange,
  onFilterChange,
  onResetFilters,
}: AuditFiltersProps) {
  return (
    <div className="flex flex-wrap gap-4 items-center">
      <div className="flex-1 min-w-[300px]">
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search audit logs (ID, action, type, details...)..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>
      </div>
      
      <div className="flex items-center gap-2">
        <Filter className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm font-medium">Filters:</span>
      </div>
      
      <div className="w-[180px]">
        <Select 
          value={filters.action || ""} 
          onValueChange={(value) => onFilterChange('action', value || undefined)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Action" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Actions</SelectItem>
            {actionTypes.map(action => (
              <SelectItem key={action} value={action}>
                <div className="flex items-center gap-2">
                  {getActionIcon(action)}
                  <span>{action}</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      
      <div className="w-[180px]">
        <Select 
          value={filters.entityType || ""} 
          onValueChange={(value) => onFilterChange('entityType', value || undefined)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Entity Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Entity Types</SelectItem>
            {entityTypes.map(type => (
              <SelectItem key={type} value={type}>
                <div className="flex items-center gap-2">
                  {getEntityIcon(type)}
                  <span>{type}</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      
      <Button 
        variant="outline" 
        onClick={onResetFilters}
        className="whitespace-nowrap"
      >
        Clear Filters
      </Button>
    </div>
  );
}

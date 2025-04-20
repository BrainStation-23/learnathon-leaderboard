
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious
} from "@/components/ui/pagination";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { 
  fetchAuditLogs, 
  fetchActionTypes, 
  fetchEntityTypes, 
  AuditLogFilters 
} from "@/services/auditService";
import { format } from "date-fns";
import { 
  Search, 
  Filter, 
  User, 
  Plus, 
  Edit, 
  Trash2, 
  FileText, 
  Settings, 
  Code, 
  Info,
  ArrowDown,
  ArrowUp
} from "lucide-react";
import { AuditDetailsCell } from "./AuditDetailsCell";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export function AuditLogsTable() {
  const [page, setPage] = useState(1);
  const pageSize = 10;
  
  const [filters, setFilters] = useState<AuditLogFilters>({});
  const [searchTerm, setSearchTerm] = useState("");

  // Fetch the audit logs with pagination
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['audit-logs', page, pageSize, filters],
    queryFn: () => fetchAuditLogs({ page, pageSize }, filters)
  });

  // Fetch action types for filtering
  const { data: actionTypes = [] } = useQuery({
    queryKey: ['audit-log-actions'],
    queryFn: fetchActionTypes
  });

  // Fetch entity types for filtering
  const { data: entityTypes = [] } = useQuery({
    queryKey: ['audit-log-entities'],
    queryFn: fetchEntityTypes
  });

  // Apply search after a delay
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchTerm !== filters.search) {
        setFilters(prev => ({ ...prev, search: searchTerm }));
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [searchTerm, filters.search]);

  // Handle page change
  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  // Total pages calculation
  const totalPages = data?.count ? Math.ceil(data.count / pageSize) : 0;

  // Handle filter changes
  const handleFilterChange = (key: keyof AuditLogFilters, value: string | undefined) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPage(1); // Reset to first page when filters change
  };

  // Helper function to get appropriate icon for action type
  const getActionIcon = (action: string) => {
    switch(action.toLowerCase()) {
      case 'create':
        return <Plus className="h-4 w-4 text-green-500" />;
      case 'update':
        return <Edit className="h-4 w-4 text-amber-500" />;
      case 'delete':
        return <Trash2 className="h-4 w-4 text-red-500" />;
      case 'read':
        return <FileText className="h-4 w-4 text-blue-500" />;
      default:
        return <Info className="h-4 w-4 text-gray-500" />;
    }
  };

  // Helper function to get appropriate icon for entity type
  const getEntityIcon = (entityType: string) => {
    switch(entityType.toLowerCase()) {
      case 'repository':
        return <Code className="h-4 w-4" />;
      case 'user':
        return <User className="h-4 w-4" />;
      case 'configuration':
        return <Settings className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  // Get user initials from user ID for avatar
  const getUserInitials = (userId: string | null) => {
    if (!userId) return "SYS";
    return "U" + userId.substring(0, 2).toUpperCase();
  };

  // Get user display name
  const getUserDisplayName = (userId: string | null) => {
    if (!userId) return "System";
    return `User ${userId.substring(0, 8)}`;
  };

  // Reset all filters
  const resetFilters = () => {
    setFilters({});
    setSearchTerm("");
    setPage(1);
  };

  if (isLoading) {
    return <div className="flex justify-center p-8">Loading audit logs...</div>;
  }

  return (
    <div className="space-y-4">
      {/* Filters and search */}
      <div className="flex flex-wrap gap-4 items-center">
        <div className="flex-1 min-w-[300px]">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search audit logs..."
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
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
            onValueChange={(value) => handleFilterChange('action', value || undefined)}
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
            onValueChange={(value) => handleFilterChange('entityType', value || undefined)}
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
          onClick={resetFilters}
          className="whitespace-nowrap"
        >
          Clear Filters
        </Button>
      </div>

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[120px]">
                <div className="flex items-center">
                  Action
                  <ArrowDown className="ml-1 h-3 w-3" />
                </div>
              </TableHead>
              <TableHead className="w-[150px]">Entity Type</TableHead>
              <TableHead className="w-[180px]">Date</TableHead>
              <TableHead className="w-[180px]">User</TableHead>
              <TableHead>Details</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data?.data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                  No audit logs found
                </TableCell>
              </TableRow>
            ) : (
              data?.data.map((log) => (
                <TableRow key={log.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      {getActionIcon(log.action)}
                      <span>{log.action}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {getEntityIcon(log.entityType)}
                      <span>{log.entityType}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {format(new Date(log.createdAt), 'MMM d, yyyy HH:mm')}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Avatar className="h-6 w-6">
                        <AvatarFallback className="text-xs bg-primary text-primary-foreground">
                          {getUserInitials(log.userId)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="truncate max-w-[120px]">
                        {getUserDisplayName(log.userId)}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <AuditDetailsCell details={log.details} entityId={log.entityId} />
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious 
                onClick={() => page > 1 && handlePageChange(page - 1)} 
                className={page === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
              />
            </PaginationItem>

            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const pageNumber = i + 1;
              return (
                <PaginationItem key={i}>
                  <PaginationLink 
                    isActive={pageNumber === page}
                    onClick={() => handlePageChange(pageNumber)}
                  >
                    {pageNumber}
                  </PaginationLink>
                </PaginationItem>
              );
            })}

            {totalPages > 5 && (
              <>
                <PaginationItem>
                  <span className="flex h-9 w-9 items-center justify-center">...</span>
                </PaginationItem>
                <PaginationItem>
                  <PaginationLink 
                    isActive={totalPages === page}
                    onClick={() => handlePageChange(totalPages)}
                  >
                    {totalPages}
                  </PaginationLink>
                </PaginationItem>
              </>
            )}

            <PaginationItem>
              <PaginationNext 
                onClick={() => page < totalPages && handlePageChange(page + 1)} 
                className={page === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}
    </div>
  );
}

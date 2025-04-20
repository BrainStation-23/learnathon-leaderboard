
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchAuditLogs, fetchActionTypes, fetchEntityTypes, AuditLogFilters } from "@/services/auditService";
import { AuditFilters } from "./filters/AuditFilters";
import { AuditTable } from "./table/AuditTable";
import { AuditPagination } from "./pagination/AuditPagination";

export function AuditLogsTable() {
  const [page, setPage] = useState(1);
  const pageSize = 10;
  
  const [filters, setFilters] = useState<AuditLogFilters>({});
  const [searchTerm, setSearchTerm] = useState("");

  // Fetch the audit logs with pagination
  const { data, isLoading } = useQuery({
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

  // Handle filter changes
  const handleFilterChange = (key: keyof AuditLogFilters, value: string | undefined) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPage(1); // Reset to first page when filters change
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
      <AuditFilters
        filters={filters}
        searchTerm={searchTerm}
        actionTypes={actionTypes}
        entityTypes={entityTypes}
        onSearchChange={setSearchTerm}
        onFilterChange={handleFilterChange}
        onResetFilters={resetFilters}
      />
      
      <AuditTable data={data?.data || []} />
      
      <AuditPagination
        currentPage={page}
        totalPages={data?.count ? Math.ceil(data.count / pageSize) : 0}
        onPageChange={setPage}
      />
    </div>
  );
}


import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchAuditLogs, fetchActionTypes, fetchEntityTypes, AuditLogFilters } from "@/services/auditService";
import { AuditFilters } from "./filters/AuditFilters";
import { AuditTable } from "./table/AuditTable";
import { AuditPagination } from "./pagination/AuditPagination";
import { useAuditFilters } from "./hooks/useAuditFilters";

export function AuditLogsTable() {
  const [page, setPage] = useState(1);
  const pageSize = 10;
  
  const {
    filters,
    searchTerm,
    setSearchTerm,
    handleFilterChange,
    resetFilters
  } = useAuditFilters((newFilters: AuditLogFilters) => {
    setPage(1); // Reset to first page when filters change
  });

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

  if (isLoading) {
    return <div className="flex justify-center p-8">Loading audit logs...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="sticky top-0 z-10 bg-background pb-4 border-b">
        <AuditFilters
          filters={filters}
          searchTerm={searchTerm}
          actionTypes={actionTypes}
          entityTypes={entityTypes}
          onSearchChange={setSearchTerm}
          onFilterChange={handleFilterChange}
          onResetFilters={resetFilters}
        />
      </div>
      
      <div className="pt-4">
        <AuditTable data={data?.data || []} />
        
        <div className="mt-4">
          <AuditPagination
            currentPage={page}
            totalPages={data?.count ? Math.ceil(data.count / pageSize) : 0}
            onPageChange={setPage}
          />
        </div>
      </div>
    </div>
  );
}

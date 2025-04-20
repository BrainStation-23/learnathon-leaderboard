
import { useState, useEffect } from 'react';
import { AuditLogFilters } from '@/services/auditService';

interface UseAuditFiltersResult {
  filters: AuditLogFilters;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  handleFilterChange: (key: keyof AuditLogFilters, value: string | undefined) => void;
  resetFilters: () => void;
}

export function useAuditFilters(onFiltersChange: (filters: AuditLogFilters) => void): UseAuditFiltersResult {
  const [filters, setFilters] = useState<AuditLogFilters>({});
  const [searchTerm, setSearchTerm] = useState("");
  
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchTerm !== filters.search) {
        const newFilters = { ...filters, search: searchTerm };
        setFilters(newFilters);
        onFiltersChange(newFilters);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm, filters.search, onFiltersChange]);

  const handleFilterChange = (key: keyof AuditLogFilters, value: string | undefined) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onFiltersChange(newFilters);
  };

  const resetFilters = () => {
    setFilters({});
    setSearchTerm("");
    onFiltersChange({});
  };

  return {
    filters,
    searchTerm,
    setSearchTerm,
    handleFilterChange,
    resetFilters
  };
}

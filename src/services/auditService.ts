import { supabase } from "@/integrations/supabase/client";
import { AuditLog } from "@/types/audit";
import { Json } from "@/integrations/supabase/types";

export interface AuditLogFilters {
  action?: string;
  entityType?: string;
  search?: string;
}

export interface PaginationParams {
  page: number;
  pageSize: number;
}

// Function to fetch action types for filtering
export async function fetchActionTypes(): Promise<string[]> {
  const { data, error } = await supabase.rpc('get_unique_action_types');
  
  if (error) {
    console.error("Error fetching action types:", error);
    throw error;
  }
  
  return data.map(item => item.action);
}

// Function to fetch entity types for filtering
export async function fetchEntityTypes(): Promise<string[]> {
  const { data, error } = await supabase.rpc('get_unique_entity_types');
  
  if (error) {
    console.error("Error fetching entity types:", error);
    throw error;
  }
  
  return data.map(item => item.entity_type);
}

// Function to fetch user information by ID
export async function fetchUserById(userId: string): Promise<{ email: string } | null> {
  if (!userId) return null;
  
  // Since we can't directly access user information due to RLS
  // Return a generic user display name
  return {
    email: `User ${userId.substring(0, 8)}`
  };
}

export async function fetchAuditLogs(
  pagination: PaginationParams, 
  filters?: AuditLogFilters
): Promise<{ data: AuditLog[], count: number }> {
  const { data, error } = await supabase.rpc('get_audit_logs', {
    p_page: pagination.page,
    p_page_size: pagination.pageSize,
    p_action: filters?.action === 'all' ? null : filters?.action,
    p_entity_type: filters?.entityType === 'all' ? null : filters?.entityType,
    p_search: filters?.search || null
  });

  if (error) {
    console.error("Error fetching audit logs:", error);
    throw error;
  }

  // If data is empty, return an empty array and 0 count
  if (!data || data.length === 0) {
    return { data: [], count: 0 };
  }

  return { 
    data: data.map(log => ({
      id: log.id,
      action: log.action,
      entityType: log.entity_type,
      createdAt: log.created_at,
      details: log.details as Record<string, any> | null,
      entityId: log.entity_id,
      userId: log.user_id
    })),
    count: data[0].total_count 
  };
}

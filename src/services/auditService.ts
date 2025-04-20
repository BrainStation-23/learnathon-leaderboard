
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

export async function fetchAuditLogs(
  pagination: PaginationParams, 
  filters?: AuditLogFilters
): Promise<{ data: AuditLog[], count: number }> {
  // Start building the query
  let query = supabase
    .from('audit_logs')
    .select('*', { count: 'exact' });
  
  // Apply filters if provided
  if (filters) {
    if (filters.action) {
      query = query.eq('action', filters.action);
    }
    if (filters.entityType) {
      query = query.eq('entity_type', filters.entityType);
    }
    if (filters.search) {
      query = query.or(`user_id.ilike.%${filters.search}%,action.ilike.%${filters.search}%,entity_type.ilike.%${filters.search}%`);
    }
  }

  // Apply pagination
  const { from, to } = getPaginationRange(pagination);
  
  const { data, error, count } = await query
    .order('created_at', { ascending: false })
    .range(from, to);

  if (error) {
    console.error("Error fetching audit logs:", error);
    throw error;
  }

  return { 
    data: data.map(log => ({
      id: log.id,
      action: log.action,
      entityType: log.entity_type,
      createdAt: log.created_at,
      details: log.details as Record<string, any> | null, // Type assertion to ensure compatibility
      entityId: log.entity_id,
      userId: log.user_id
    })),
    count: count || 0
  };
}

// Helper function to calculate pagination range
function getPaginationRange(pagination: PaginationParams): { from: number; to: number } {
  const from = (pagination.page - 1) * pagination.pageSize;
  const to = from + pagination.pageSize - 1;
  return { from, to };
}

// Function to fetch distinct action types for filter dropdown
export async function fetchActionTypes(): Promise<string[]> {
  const { data, error } = await supabase
    .from('audit_logs')
    .select('action')
    .distinct();
  
  if (error) {
    console.error("Error fetching action types:", error);
    throw error;
  }
  
  return data.map(item => item.action);
}

// Function to fetch distinct entity types for filter dropdown
export async function fetchEntityTypes(): Promise<string[]> {
  const { data, error } = await supabase
    .from('audit_logs')
    .select('entity_type')
    .distinct();
  
  if (error) {
    console.error("Error fetching entity types:", error);
    throw error;
  }
  
  return data.map(item => item.entity_type);
}

// Function to fetch user information by ID
export async function fetchUserById(userId: string): Promise<{ email: string } | null> {
  if (!userId) return null;
  
  const { data, error } = await supabase
    .from('auth.users') // This might not work directly due to RLS
    .select('email')
    .eq('id', userId)
    .single();
    
  if (error) {
    console.warn("Could not fetch user info:", error);
    return null;
  }
  
  return data;
}

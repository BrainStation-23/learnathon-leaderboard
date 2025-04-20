
import { supabase } from "@/integrations/supabase/client";
import { AuditLog } from "@/types/audit";

export async function fetchAuditLogs(): Promise<AuditLog[]> {
  const { data, error } = await supabase
    .from('audit_logs')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error("Error fetching audit logs:", error);
    throw error;
  }

  return data.map(log => ({
    id: log.id,
    action: log.action,
    entityType: log.entity_type,
    createdAt: log.created_at,
    details: log.details,
    entityId: log.entity_id,
    userId: log.user_id
  }));
}

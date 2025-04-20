
export interface AuditLog {
  id: string;
  action: string;
  entityType: string;
  createdAt: string;
  details: Record<string, any> | null;
  entityId: string | null;
  userId: string | null;
}

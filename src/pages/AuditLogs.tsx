
import DashboardLayout from "@/components/layout/DashboardLayout";
import { AuditLogsTable } from "@/components/audit/AuditLogsTable";

export default function AuditLogs() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Audit Logs</h1>
          <p className="text-muted-foreground">Review system activity and changes</p>
        </div>
        <AuditLogsTable />
      </div>
    </DashboardLayout>
  );
}

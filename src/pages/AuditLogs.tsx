
import DashboardLayout from "@/components/layout/DashboardLayout";
import { AuditLogsTable } from "@/components/audit/AuditLogsTable";
import { History } from "lucide-react";

export default function AuditLogs() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <History className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Audit Logs</h1>
            <p className="text-muted-foreground">Review system activity and changes</p>
          </div>
        </div>
        <AuditLogsTable />
      </div>
    </DashboardLayout>
  );
}

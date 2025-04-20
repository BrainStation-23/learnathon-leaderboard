
import { useQuery } from "@tanstack/react-query";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { fetchAuditLogs } from "@/services/auditService";
import { format } from "date-fns";

export function AuditLogsTable() {
  const { data: logs, isLoading } = useQuery({
    queryKey: ['audit-logs'],
    queryFn: fetchAuditLogs
  });

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Action</TableHead>
            <TableHead>Entity Type</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>User ID</TableHead>
            <TableHead>Details</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {logs?.map((log) => (
            <TableRow key={log.id}>
              <TableCell className="font-medium">{log.action}</TableCell>
              <TableCell>{log.entityType}</TableCell>
              <TableCell>{format(new Date(log.createdAt), 'MMM d, yyyy HH:mm')}</TableCell>
              <TableCell>{log.userId || 'System'}</TableCell>
              <TableCell>{JSON.stringify(log.details)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

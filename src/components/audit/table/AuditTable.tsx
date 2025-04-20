
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { format } from "date-fns";
import { ArrowDown } from "lucide-react";
import { AuditLog } from "@/types/audit";
import { AuditDetailsCell } from "../AuditDetailsCell";
import { getActionIcon, getEntityIcon } from "../utils/auditIcons";
import { getUserDisplayName, getUserInitials } from "../utils/userUtils";

interface AuditTableProps {
  data: AuditLog[];
}

export function AuditTable({ data }: AuditTableProps) {
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[120px]">
              <div className="flex items-center">
                Action
                <ArrowDown className="ml-1 h-3 w-3" />
              </div>
            </TableHead>
            <TableHead className="w-[150px]">Entity Type</TableHead>
            <TableHead className="w-[180px]">Date</TableHead>
            <TableHead className="w-[180px]">User</TableHead>
            <TableHead>Details</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                No audit logs found
              </TableCell>
            </TableRow>
          ) : (
            data.map((log) => (
              <TableRow key={log.id}>
                <TableCell className="font-medium">
                  <div className="flex items-center gap-2">
                    {getActionIcon(log.action)}
                    <span>{log.action}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    {getEntityIcon(log.entityType)}
                    <span>{log.entityType}</span>
                  </div>
                </TableCell>
                <TableCell>
                  {format(new Date(log.createdAt), 'MMM d, yyyy HH:mm')}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Avatar className="h-6 w-6">
                      <AvatarFallback className="text-xs bg-primary text-primary-foreground">
                        {getUserInitials(log.userId)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="truncate max-w-[120px]">
                      {getUserDisplayName(log.userId)}
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  <AuditDetailsCell details={log.details} entityId={log.entityId} />
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}

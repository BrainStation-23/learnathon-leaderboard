
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { LayoutList } from "lucide-react";

interface StackDistributionTableProps {
  distribution: Record<string, number>;
}

export default function StackDistributionTable({ distribution }: StackDistributionTableProps) {
  // Sort stacks by count (descending)
  const sortedStacks = Object.entries(distribution)
    .sort(([, countA], [, countB]) => countB - countA);
    
  const totalRepos = sortedStacks.reduce((sum, [, count]) => sum + count, 0);
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <LayoutList className="h-5 w-5 text-hackathon-600" />
          Stack Distribution
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Technology Stack</TableHead>
              <TableHead className="text-right">Repos Count</TableHead>
              <TableHead className="text-right">Percentage</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedStacks.map(([stack, count]) => (
              <TableRow key={stack}>
                <TableCell className="font-medium">{stack}</TableCell>
                <TableCell className="text-right">{count}</TableCell>
                <TableCell className="text-right">
                  {totalRepos > 0 ? Math.round((count / totalRepos) * 100) : 0}%
                </TableCell>
              </TableRow>
            ))}
            {sortedStacks.length === 0 && (
              <TableRow>
                <TableCell colSpan={3} className="text-center text-muted-foreground">
                  No stack data available
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

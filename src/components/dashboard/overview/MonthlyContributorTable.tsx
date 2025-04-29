
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users } from "lucide-react";
import { MonthlyContributorData } from "@/services/dashboard/contributorMonthlyService";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface MonthlyContributorTableProps {
  data: MonthlyContributorData[];
}

export default function MonthlyContributorTable({ data }: MonthlyContributorTableProps) {
  // Format month display from YYYY-MM to Month YYYY
  const formatMonth = (monthStr: string) => {
    try {
      const [year, month] = monthStr.split('-');
      const date = new Date(parseInt(year), parseInt(month) - 1);
      return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    } catch (e) {
      return monthStr;
    }
  };
  
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Users className="h-4 w-4 text-hackathon-600" />
          Monthly Contributor Activity
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Month</TableHead>
              <TableHead className="text-right">Contributors</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((item, index) => (
              <TableRow key={index}>
                <TableCell>{formatMonth(item.month)}</TableCell>
                <TableCell className="text-right font-mono">{item.contributor_count}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

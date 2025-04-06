
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";

interface IssueDistribution {
  name: string;
  value: number;
  color: string;
}

interface IssueDistributionChartProps {
  issueDistribution: IssueDistribution[];
}

export default function IssueDistributionChart({ issueDistribution }: IssueDistributionChartProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Issue Distribution</CardTitle>
        <CardDescription>Bugs, vulnerabilities and code smells</CardDescription>
      </CardHeader>
      <CardContent className="flex justify-center items-center">
        <div className="h-72 w-full flex items-center justify-center">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={issueDistribution}
                cx="50%"
                cy="50%"
                labelLine={false}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              >
                {issueDistribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

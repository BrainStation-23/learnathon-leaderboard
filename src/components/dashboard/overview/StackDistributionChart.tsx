
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { ChartBarIcon } from "lucide-react";

interface StackDistributionChartProps {
  stackDistribution: Record<string, number>;
  droppedOutByStack: Record<string, number>;
  inactiveByStack: Record<string, number>;
}

export default function StackDistributionChart({ 
  stackDistribution,
  droppedOutByStack,
  inactiveByStack
}: StackDistributionChartProps) {
  // Convert the data to the format required by recharts
  const chartData = Object.entries(stackDistribution)
    .map(([name, total]) => ({
      name,
      total,
      droppedOut: droppedOutByStack[name] || 0,
      inactive: inactiveByStack[name] || 0,
      active: total - (droppedOutByStack[name] || 0) - (inactiveByStack[name] || 0)
    }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 10); // Limit to top 10 for better visibility
  
  if (chartData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <ChartBarIcon className="h-5 w-5 text-hackathon-600" />
            Stack Distribution Chart
          </CardTitle>
        </CardHeader>
        <CardContent className="h-[300px] flex items-center justify-center">
          <p className="text-muted-foreground">No stack distribution data available</p>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <ChartBarIcon className="h-5 w-5 text-hackathon-600" />
          Stack Distribution Chart
        </CardTitle>
      </CardHeader>
      <CardContent className="h-[350px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            margin={{ top: 20, right: 30, left: 20, bottom: 45 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="name" 
              angle={-45} 
              textAnchor="end"
              height={60}
            />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="active" name="Active" fill="#10B981" stackId="stack" />
            <Bar dataKey="inactive" name="Inactive (30+ days)" fill="#F59E0B" stackId="stack" />
            <Bar dataKey="droppedOut" name="Dropped Out" fill="#EF4444" stackId="stack" />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

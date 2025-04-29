
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users } from "lucide-react";
import { MonthlyContributorData } from "@/services/dashboard/contributorMonthlyService";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from "recharts";
import { ChartContainer, ChartTooltipContent } from "@/components/ui/chart";

interface MonthlyContributorChartProps {
  data: MonthlyContributorData[];
}

export default function MonthlyContributorChart({ data }: MonthlyContributorChartProps) {
  // Format month display from YYYY-MM to Month abbreviation
  const chartData = data.map(item => {
    try {
      const [year, month] = item.month.split('-');
      const date = new Date(parseInt(year), parseInt(month) - 1);
      const formattedMonth = date.toLocaleDateString('en-US', { month: 'short' });
      
      return {
        ...item,
        displayMonth: formattedMonth
      };
    } catch (e) {
      return {
        ...item,
        displayMonth: item.month
      };
    }
  });
  
  const chartConfig = {
    contributors: {
      label: "Contributors",
      color: "#0369a1"
    }
  };
  
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Users className="h-4 w-4 text-hackathon-600" />
          Monthly Contributor Chart
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px] w-full">
          <ChartContainer config={chartConfig}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 30 }}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                <XAxis 
                  dataKey="displayMonth" 
                  tick={{ fontSize: 12 }}
                  axisLine={{ stroke: '#e5e7eb', strokeWidth: 1 }}
                />
                <YAxis 
                  tick={{ fontSize: 12 }}
                  axisLine={{ stroke: '#e5e7eb', strokeWidth: 1 }}
                />
                <Tooltip content={<ChartTooltipContent />} />
                <Bar 
                  dataKey="contributor_count"
                  name="contributors"
                  fill="#0369a1"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
        </div>
      </CardContent>
    </Card>
  );
}

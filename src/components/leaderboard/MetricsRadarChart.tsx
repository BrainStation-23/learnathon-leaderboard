
import React from "react";
import { 
  RadarChart, 
  PolarGrid, 
  PolarAngleAxis, 
  PolarRadiusAxis, 
  Radar, 
  ResponsiveContainer,
  Tooltip
} from "recharts";
import { LeaderboardItem } from "@/types/leaderboard";
import { ChartContainer } from "@/components/ui/chart";

interface MetricsRadarChartProps {
  item: LeaderboardItem;
}

export function MetricsRadarChart({ item }: MetricsRadarChartProps) {
  // Normalize scores to 0-100 range for radar chart
  const data = [
    {
      metric: "Coverage",
      value: (item.coverageScore / 20) * 100,
      fullScore: item.coverageScore,
      maxScore: 20,
      rawValue: item.coverage ? `${item.coverage}%` : 'N/A'
    },
    {
      metric: "Bugs",
      value: (item.bugsScore / 15) * 100,
      fullScore: item.bugsScore,
      maxScore: 15,
      rawValue: item.bugs !== null ? item.bugs : 'N/A'
    },
    {
      metric: "Vulnerabilities",
      value: (item.vulnerabilitiesScore / 15) * 100,
      fullScore: item.vulnerabilitiesScore,
      maxScore: 15,
      rawValue: item.vulnerabilities !== null ? item.vulnerabilities : 'N/A'
    },
    {
      metric: "Code Smells",
      value: (item.codeSmellsScore / 20) * 100,
      fullScore: item.codeSmellsScore,
      maxScore: 20,
      rawValue: item.codeSmells !== null ? item.codeSmells : 'N/A'
    },
    {
      metric: "Technical Debt",
      value: (item.technicalDebtScore / 20) * 100,
      fullScore: item.technicalDebtScore,
      maxScore: 20,
      rawValue: item.technicalDebt || 'N/A'
    },
    {
      metric: "Complexity",
      value: (item.complexityScore / 10) * 100,
      fullScore: item.complexityScore,
      maxScore: 10,
      rawValue: item.complexity !== null ? item.complexity : 'N/A'
    }
  ];

  const chartConfig = {
    metrics: {
      theme: {
        light: "#9b87f5",
        dark: "#9b87f5"
      }
    }
  };

  // Custom tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-background border border-border rounded-lg p-2 shadow-sm">
          <p className="font-medium">{data.metric}</p>
          <p className="text-sm text-muted-foreground">
            Score: <span className="font-mono">{data.fullScore}/{data.maxScore}</span>
          </p>
          <p className="text-sm text-muted-foreground">
            Value: <span className="font-mono">{data.rawValue}</span>
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="w-full h-64">
      <ChartContainer className="w-full h-full" config={chartConfig}>
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart outerRadius="70%" data={data}>
            <PolarGrid />
            <PolarAngleAxis dataKey="metric" tick={{ fontSize: 12, fill: 'var(--foreground)' }} />
            <PolarRadiusAxis angle={90} domain={[0, 100]} tick={false} axisLine={false} />
            <Tooltip content={<CustomTooltip />} />
            <Radar
              name="Metrics"
              dataKey="value"
              stroke="#9b87f5"
              fill="#9b87f5"
              fillOpacity={0.4}
            />
          </RadarChart>
        </ResponsiveContainer>
      </ChartContainer>
    </div>
  );
}


import React, { useEffect } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { GitHubContributor } from "@/types";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface RepositoryContributorsProps {
  contributors: GitHubContributor[] | undefined;
  totalCommits: number | undefined;
}

export function RepositoryContributors({ contributors, totalCommits }: RepositoryContributorsProps) {
  // Debug log on component render
  useEffect(() => {
    console.log("RepositoryContributors rendering with:", { 
      contributorsCount: contributors?.length, 
      contributorNames: contributors?.map(c => c.login),
      totalCommits 
    });
  }, [contributors, totalCommits]);

  if (!contributors || contributors.length === 0 || !totalCommits) {
    return (
      <div className="text-sm text-muted-foreground text-center py-2">
        No contributor data available
      </div>
    );
  }

  // Sort contributors by contributions (highest first) and limit to top 5
  const topContributors = [...contributors]
    .sort((a, b) => b.contributions - a.contributions)
    .slice(0, 5);

  // Prepare data for the stacked bar chart
  const contributionData = [
    {
      name: "Contributions",
      ...topContributors.reduce((acc, contributor) => {
        acc[contributor.login] = (contributor.contributions / totalCommits) * 100;
        return acc;
      }, {} as Record<string, number>),
    },
  ];

  // Generate unique colors for each contributor
  const colors = ["#4f46e5", "#7c3aed", "#db2777", "#ef4444", "#f97316", "#f59e0b"];

  return (
    <div className="space-y-3">
      <div className="text-sm font-medium">Contributors</div>
      
      <div className="flex flex-wrap gap-2 mb-2">
        {topContributors.map((contributor, index) => (
          <div key={contributor.id} className="flex items-center gap-1.5 text-xs">
            <Avatar className="h-5 w-5">
              <AvatarImage src={contributor.avatar_url} alt={contributor.login} />
              <AvatarFallback className="text-[10px]">
                {contributor.login.substring(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <span>
              {contributor.login}{" "}
              <span className="text-muted-foreground">
                ({contributor.contributions} commits)
              </span>
            </span>
          </div>
        ))}
      </div>

      <div className="h-8">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            layout="vertical"
            data={contributionData}
            stackOffset="expand"
            barSize={24}
          >
            <XAxis hide type="number" />
            <YAxis hide type="category" dataKey="name" />
            <Tooltip 
              formatter={(value: number) => [`${value.toFixed(1)}%`, ""]}
              labelFormatter={() => "Contribution Percentage"}
              contentStyle={{ fontSize: "12px" }}
            />
            {topContributors.map((contributor, index) => (
              <Bar
                key={contributor.login}
                dataKey={contributor.login}
                stackId="a"
                fill={colors[index % colors.length]}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

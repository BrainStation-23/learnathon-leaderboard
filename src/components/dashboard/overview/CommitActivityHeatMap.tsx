
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Calendar } from "lucide-react";
import { ChartContainer, ChartTooltipContent } from "@/components/ui/chart";
import { format, subMonths, eachMonthOfInterval } from "date-fns";
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";

interface CommitActivityHeatMapProps {
  monthlyCommitData: { month: string; commits: number }[];
}

export default function CommitActivityHeatMap({ monthlyCommitData }: CommitActivityHeatMapProps) {
  const today = new Date();
  const fiveMonthsAgo = subMonths(today, 4); // For 5 months total (current + 4 previous)
  
  // Generate all months in the past 5 months for complete heatmap
  const allMonths = eachMonthOfInterval({ 
    start: fiveMonthsAgo, 
    end: today 
  }).map(date => format(date, 'MMM'));
  
  // Create a map of month to commit count
  const commitsByMonth: Record<string, number> = {};
  monthlyCommitData.forEach(({ month, commits }) => {
    commitsByMonth[month] = commits;
  });
  
  // Find the maximum commits in any month for color scaling
  const maxCommits = Math.max(...monthlyCommitData.map(d => d.commits), 1);
  
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-hackathon-600" />
              Commit Activity (Last 5 Months)
            </CardTitle>
            <CardDescription>Monthly distribution</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-2">
        <ChartContainer
          config={{}}
          className="aspect-auto h-[300px]"
        >
          <TooltipProvider>
            <div className="flex p-4 gap-1">
              {allMonths.map((month) => {
                const commits = commitsByMonth[month] || 0;
                const intensity = maxCommits > 0 ? Math.min(0.1 + (commits / maxCommits * 0.9), 1) : 0.1;
                
                return (
                  <Tooltip key={month}>
                    <TooltipTrigger asChild>
                      <div
                        className="relative flex-1 rounded hover:ring-1 hover:ring-foreground/20 hover:shadow-sm"
                        style={{ 
                          height: 160,
                          background: `rgba(26, 73, 194, ${intensity})`,
                          transition: 'all 0.2s'
                        }}
                      >
                        <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2 text-[10px] text-white font-medium">
                          {month}
                        </div>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <div className="flex flex-col gap-1">
                        <span className="font-medium">{month}</span>
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-muted-foreground">Commits:</span>
                          <span className="font-mono tabular-nums">{commits}</span>
                        </div>
                      </div>
                    </TooltipContent>
                  </Tooltip>
                );
              })}
            </div>
          </TooltipProvider>
        </ChartContainer>
        <div className="flex justify-center mt-2 items-center gap-1">
          <div className="text-xs text-muted-foreground">Less</div>
          <div className="flex gap-[1px]">
            {[0.1, 0.25, 0.4, 0.55, 0.7, 0.85, 1].map((intensity, idx) => (
              <div
                key={idx}
                className="h-3 w-3"
                style={{ background: `rgba(26, 73, 194, ${intensity})` }}
              />
            ))}
          </div>
          <div className="text-xs text-muted-foreground">More</div>
        </div>
      </CardContent>
    </Card>
  );
}

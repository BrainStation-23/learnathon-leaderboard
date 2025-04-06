
import { Code, Users } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Stats } from "@/hooks/dashboard/useOverviewStats";

interface StatsCardsProps {
  stats: Stats;
}

export default function StatsCards({ stats }: StatsCardsProps) {
  return (
    <div className="grid gap-6 grid-cols-1 md:grid-cols-2">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Code className="h-4 w-4 text-hackathon-600" />
            Total Repositories
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">{stats.totalRepos}</div>
          <p className="text-xs text-muted-foreground mt-1">
            Active projects in the hackathon
          </p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Users className="h-4 w-4 text-hackathon-600" />
            Contributors
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">{stats.totalContributors}</div>
          <p className="text-xs text-muted-foreground mt-1">
            Active participants across all teams
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

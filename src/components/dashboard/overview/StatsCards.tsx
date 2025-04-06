
import { 
  Code, 
  Users, 
  GitCommit, 
  AlertTriangle, 
  Bug 
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Stats } from "@/hooks/dashboard/useOverviewStats";

interface StatsCardsProps {
  stats: Stats;
}

export default function StatsCards({ stats }: StatsCardsProps) {
  return (
    <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
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
            Participants across all teams
          </p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <GitCommit className="h-4 w-4 text-hackathon-600" />
            Total Commits
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">{stats.totalCommits}</div>
          <p className="text-xs text-muted-foreground mt-1">
            Contributions since the start
          </p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">
            Average Code Coverage
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-3xl font-bold">{stats.avgCodeCoverage}%</span>
            </div>
            <Progress value={stats.avgCodeCoverage} className="h-2" />
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Bug className="h-4 w-4 text-red-500" />
            Quality Issues
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">
            {stats.totalBugs + stats.totalVulnerabilities + stats.totalCodeSmells}
          </div>
          <div className="flex items-center gap-2 mt-2 text-xs">
            <span className="bg-red-100 text-red-800 px-2 py-0.5 rounded-full">
              {stats.totalBugs} bugs
            </span>
            <span className="bg-orange-100 text-orange-800 px-2 py-0.5 rounded-full">
              {stats.totalVulnerabilities} vulnerabilities
            </span>
            <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">
              {stats.totalCodeSmells} smells
            </span>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-orange-500" />
            Team Stats
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">
            {stats.teamsWithSonarcloud}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Teams with active SonarCloud analysis
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

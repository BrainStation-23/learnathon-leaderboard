
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useConfig } from "@/context/ConfigContext";
import { 
  GitCommit, 
  Users, 
  Code, 
  AlertTriangle, 
  Bug, 
  Loader2
} from "lucide-react";
import { Progress } from "@/components/ui/progress";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { Skeleton } from "@/components/ui/skeleton";

export default function DashboardOverview() {
  const { config, isConfigured } = useConfig();
  const [loading, setLoading] = useState(true);
  
  // Sample stats - will be replaced with real data from GitHub/SonarCloud
  const [stats, setStats] = useState({
    totalRepos: 0,
    totalContributors: 0,
    totalCommits: 0,
    avgCodeCoverage: 0,
    totalBugs: 0,
    totalVulnerabilities: 0,
    totalCodeSmells: 0,
  });

  // Mock data for charts
  const repoQualityData = [
    { name: "TeamA", quality: 87 },
    { name: "TeamB", quality: 74 },
    { name: "TeamC", quality: 92 },
    { name: "TeamD", quality: 63 },
    { name: "TeamE", quality: 78 },
  ];

  const commitActivityData = [
    { day: "Mon", commits: 12 },
    { day: "Tue", commits: 19 },
    { day: "Wed", commits: 28 },
    { day: "Thu", commits: 41 },
    { day: "Fri", commits: 34 },
    { day: "Sat", commits: 10 },
    { day: "Sun", commits: 8 },
  ];

  const issueDistribution = [
    { name: "Bugs", value: 15, color: "#ef4444" },
    { name: "Vulnerabilities", value: 8, color: "#f97316" },
    { name: "Code Smells", value: 27, color: "#3b82f6" },
  ];

  useEffect(() => {
    // Simulate loading data
    if (isConfigured) {
      const timer = setTimeout(() => {
        // This would be actual data fetching in a real app
        setStats({
          totalRepos: 12,
          totalContributors: 48,
          totalCommits: 1245,
          avgCodeCoverage: 72,
          totalBugs: 15,
          totalVulnerabilities: 8,
          totalCodeSmells: 27,
        });
        setLoading(false);
      }, 1500);
      
      return () => clearTimeout(timer);
    } else {
      setLoading(false);
    }
  }, [isConfigured]);
  
  if (!isConfigured) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Dashboard Not Configured</CardTitle>
          <CardDescription>
            Please configure your GitHub and SonarCloud settings to view the dashboard.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Go to the Settings page to set up your organization credentials.
          </p>
        </CardContent>
      </Card>
    );
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <h2 className="text-3xl font-bold">Dashboard Overview</h2>
        
        <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="overflow-hidden">
              <CardHeader className="pb-2">
                <Skeleton className="h-5 w-1/3" />
                <Skeleton className="h-4 w-1/4" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-16 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
        
        <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <Skeleton className="h-5 w-1/3" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-64 w-full" />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <Skeleton className="h-5 w-1/3" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-64 w-full" />
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold">Dashboard Overview</h2>
      <p className="text-muted-foreground">
        Overview of {config.github_org} organization with SonarCloud analysis
      </p>
      
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
              {repoQualityData.length}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Teams with active SonarCloud analysis
            </p>
          </CardContent>
        </Card>
      </div>
      
      <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Commit Activity</CardTitle>
            <CardDescription>Last 7 days</CardDescription>
          </CardHeader>
          <CardContent className="pt-2">
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={commitActivityData}
                  margin={{
                    top: 10,
                    right: 30,
                    left: 0,
                    bottom: 0,
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                  <XAxis dataKey="day" />
                  <YAxis />
                  <Tooltip />
                  <Area
                    type="monotone"
                    dataKey="commits"
                    stroke="#1a49c2"
                    fill="#368dff"
                    fillOpacity={0.3}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
        
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
      </div>
    </div>
  );
}


import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/context/AuthContext";
import { useConfig } from "@/context/ConfigContext";
import { useToast } from "@/hooks/use-toast";
import { fetchDashboardData } from "@/services/supabaseService";
import { TeamDashboardData } from "@/types";
import { 
  GitCommit, 
  Users, 
  Code, 
  AlertTriangle, 
  Bug, 
  Loader2
} from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
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
import { useNavigate } from "react-router-dom";

export default function DashboardOverview() {
  const { config, isConfigured } = useConfig();
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState<TeamDashboardData[]>([]);
  
  // Stats derived from dashboardData
  const [stats, setStats] = useState({
    totalRepos: 0,
    totalContributors: 0,
    totalCommits: 0,
    avgCodeCoverage: 0,
    totalBugs: 0,
    totalVulnerabilities: 0,
    totalCodeSmells: 0,
  });

  // Fetch data from Supabase
  const loadData = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const data = await fetchDashboardData();
      setDashboardData(data);
      
      // Calculate stats
      const totalRepos = data.length;
      let totalContributors = 0;
      let totalCommits = 0;
      let totalCoverage = 0;
      let coverageCount = 0;
      let totalBugs = 0;
      let totalVulnerabilities = 0;
      let totalCodeSmells = 0;

      data.forEach(item => {
        totalContributors += item.repoData.contributors_count || 0;
        totalCommits += item.repoData.commits_count || 0;
        
        if (item.sonarData) {
          if (item.sonarData.metrics.coverage) {
            totalCoverage += item.sonarData.metrics.coverage;
            coverageCount++;
          }
          totalBugs += item.sonarData.metrics.bugs || 0;
          totalVulnerabilities += item.sonarData.metrics.vulnerabilities || 0;
          totalCodeSmells += item.sonarData.metrics.code_smells || 0;
        }
      });

      setStats({
        totalRepos,
        totalContributors,
        totalCommits,
        avgCodeCoverage: coverageCount > 0 ? Math.round(totalCoverage / coverageCount) : 0,
        totalBugs,
        totalVulnerabilities,
        totalCodeSmells,
      });
    } catch (error) {
      console.error("Error loading dashboard data:", error);
      toast({
        title: "Error loading data",
        description: "Failed to retrieve dashboard data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Initial data load
  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  // Generated commit activity data based on day of week
  const commitActivityData = [
    { day: "Mon", commits: Math.floor(stats.totalCommits * 0.18) },
    { day: "Tue", commits: Math.floor(stats.totalCommits * 0.22) },
    { day: "Wed", commits: Math.floor(stats.totalCommits * 0.25) },
    { day: "Thu", commits: Math.floor(stats.totalCommits * 0.20) },
    { day: "Fri", commits: Math.floor(stats.totalCommits * 0.10) },
    { day: "Sat", commits: Math.floor(stats.totalCommits * 0.03) },
    { day: "Sun", commits: Math.floor(stats.totalCommits * 0.02) },
  ];

  // Issue distribution data
  const issueDistribution = [
    { name: "Bugs", value: stats.totalBugs, color: "#ef4444" },
    { name: "Vulnerabilities", value: stats.totalVulnerabilities, color: "#f97316" },
    { name: "Code Smells", value: stats.totalCodeSmells, color: "#3b82f6" },
  ];
  
  if (!user) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Authentication Required</CardTitle>
          <CardDescription>
            Please log in to view dashboard data.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

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
          <Button onClick={() => navigate('/settings')}>
            Configure Dashboard
          </Button>
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
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold">Dashboard Overview</h2>
          <p className="text-muted-foreground">
            Overview of {config.github_org} organization with SonarCloud analysis
          </p>
        </div>
        <Button onClick={loadData} variant="outline">Refresh Data</Button>
      </div>
      
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
              {dashboardData.filter(item => item.sonarData).length}
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
            <CardDescription>Estimated distribution</CardDescription>
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

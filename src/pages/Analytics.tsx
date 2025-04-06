
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useConfig } from "@/context/ConfigContext";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
} from "recharts";

const Analytics = () => {
  const { isConfigured } = useConfig();

  // This is sample data - would be replaced with actual data from GitHub/SonarCloud
  const teamPerformanceData = [
    {
      name: "Team A",
      commits: 120,
      bugs: 10,
      coverage: 75,
    },
    {
      name: "Team B",
      commits: 98,
      bugs: 8,
      coverage: 68,
    },
    {
      name: "Team C",
      commits: 156,
      bugs: 5,
      coverage: 85,
    },
    {
      name: "Team D",
      commits: 85,
      bugs: 15,
      coverage: 45,
    },
    {
      name: "Team E",
      commits: 132,
      bugs: 12,
      coverage: 62,
    },
  ];

  const codeQualityTrendData = [
    {
      date: "4/1",
      bugs: 28,
      vulnerabilities: 15,
      codeSmells: 42,
    },
    {
      date: "4/2",
      bugs: 24,
      vulnerabilities: 13,
      codeSmells: 38,
    },
    {
      date: "4/3",
      bugs: 20,
      vulnerabilities: 12,
      codeSmells: 35,
    },
    {
      date: "4/4",
      bugs: 18,
      vulnerabilities: 11,
      codeSmells: 32,
    },
    {
      date: "4/5",
      bugs: 15,
      vulnerabilities: 10,
      codeSmells: 30,
    },
    {
      date: "4/6",
      bugs: 12,
      vulnerabilities: 8,
      codeSmells: 27,
    },
  ];

  if (!isConfigured) {
    return (
      <DashboardLayout>
        <Card>
          <CardHeader>
            <CardTitle>Dashboard Not Configured</CardTitle>
            <CardDescription>
              Please configure your GitHub and SonarCloud settings to view analytics.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Go to the Settings page to set up your organization credentials.
            </p>
          </CardContent>
        </Card>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <h2 className="text-3xl font-bold">Analytics</h2>
        <p className="text-muted-foreground">
          In-depth analysis of team performance and code quality
        </p>

        <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Team Performance</CardTitle>
              <CardDescription>Commits vs. Bugs vs. Coverage</CardDescription>
            </CardHeader>
            <CardContent className="pt-2">
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={teamPerformanceData}
                    margin={{
                      top: 20,
                      right: 30,
                      left: 20,
                      bottom: 5,
                    }}
                  >
                    <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                    <XAxis dataKey="name" />
                    <YAxis yAxisId="left" orientation="left" stroke="#1a49c2" />
                    <YAxis yAxisId="right" orientation="right" stroke="#ef4444" />
                    <Tooltip />
                    <Legend />
                    <Bar yAxisId="left" dataKey="commits" name="Commits" fill="#1a49c2" barSize={20} />
                    <Bar yAxisId="right" dataKey="bugs" name="Bugs" fill="#ef4444" barSize={20} />
                    <Line yAxisId="right" type="monotone" dataKey="coverage" name="Coverage %" stroke="#10b981" strokeWidth={3} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Code Quality Trend</CardTitle>
              <CardDescription>Issues over time</CardDescription>
            </CardHeader>
            <CardContent className="pt-2">
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={codeQualityTrendData}
                    margin={{
                      top: 20,
                      right: 30,
                      left: 20,
                      bottom: 5,
                    }}
                  >
                    <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="bugs"
                      stroke="#ef4444"
                      activeDot={{ r: 8 }}
                      strokeWidth={2}
                    />
                    <Line
                      type="monotone"
                      dataKey="vulnerabilities"
                      stroke="#f97316"
                      strokeWidth={2}
                    />
                    <Line
                      type="monotone"
                      dataKey="codeSmells"
                      stroke="#3b82f6"
                      strokeWidth={2}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Analytics;


import { useState } from "react";
import { TeamDashboardData, GitHubContributor } from "@/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Code, 
  Shield,
  GitBranch,
  Users, 
  Calendar,
  AlertTriangle,
  FileCode,
  Bug,
  AlertCircle,
  ExternalLink
} from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import SecurityIssuesList from "@/components/dashboard/SecurityIssuesList";
import ContributorsDisplay from "@/components/dashboard/ContributorsDisplay";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

interface RepositoryDetailsViewProps {
  repository: TeamDashboardData;
  showBackButton?: boolean;
  onBackClick?: () => void;
}

const RepositoryDetailsView = ({ 
  repository, 
  showBackButton = true,
  onBackClick 
}: RepositoryDetailsViewProps) => {
  const [activeTab, setActiveTab] = useState("overview");

  // Format date for display
  const formatDate = (dateString?: string) => {
    if (!dateString) return "No data";
    return format(new Date(dateString), "PPP");
  };
  
  const formatTimeAgo = (dateString?: string) => {
    if (!dateString) return "No data";
    return formatDistanceToNow(new Date(dateString), { addSuffix: true });
  };
  
  // Prepare SonarCloud metrics data for charts
  const prepareMetricsData = () => {
    if (!repository?.sonarData?.metrics) return [];
    
    const { bugs, vulnerabilities, code_smells } = repository.sonarData.metrics;
    
    return [
      { name: 'Bugs', value: bugs || 0, fill: '#FF8042' },
      { name: 'Vulnerabilities', value: vulnerabilities || 0, fill: '#FFBB28' },
      { name: 'Code Smells', value: code_smells || 0, fill: '#00C49F' }
    ];
  };
  
  // Prepare security issues data for charts
  const prepareSecurityData = () => {
    if (!repository?.securityIssues || repository.securityIssues.length === 0) return [];
    
    const severityCounts = {
      critical: 0,
      high: 0,
      medium: 0,
      low: 0
    };
    
    repository.securityIssues.forEach(issue => {
      const severity = issue.severity.toLowerCase();
      if (severity === 'critical') severityCounts.critical++;
      else if (severity === 'high') severityCounts.high++;
      else if (severity === 'medium' || severity === 'moderate') severityCounts.medium++;
      else severityCounts.low++;
    });
    
    return [
      { name: 'Critical', value: severityCounts.critical, fill: '#FF0000' },
      { name: 'High', value: severityCounts.high, fill: '#FF8042' },
      { name: 'Medium', value: severityCounts.medium, fill: '#FFBB28' },
      { name: 'Low', value: severityCounts.low, fill: '#00C49F' }
    ];
  };

  const metricsData = prepareMetricsData();
  const securityData = prepareSecurityData();
  
  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start mb-6 gap-4">
        <div className="flex items-center gap-2">
          {showBackButton && (
            <Button 
              variant="outline" 
              onClick={onBackClick} 
              className="gap-2"
            >
              Back
            </Button>
          )}
          <h1 className="text-2xl font-bold">{repository.repoData.name}</h1>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2" asChild>
            <a href={repository.repoData.html_url} target="_blank" rel="noopener noreferrer">
              <Code size={16} />
              View Code
            </a>
          </Button>
          {repository.sonarData && (
            <Button variant="outline" className="gap-2" asChild>
              <a 
                href={`https://sonarcloud.io/project/overview?id=${repository.sonarData.project_key}`} 
                target="_blank" 
                rel="noopener noreferrer"
              >
                <Shield size={16} />
                SonarCloud
              </a>
            </Button>
          )}
        </div>
      </div>
      
      {/* Description */}
      <Card className="mb-6 bg-muted/30 border-0 shadow-sm">
        <CardContent className="p-4">
          <p className="text-muted-foreground">
            {repository.repoData.description || "No description available"}
          </p>
        </CardContent>
      </Card>
      
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-4 flex flex-col items-center justify-center text-center">
            <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center mb-2">
              <Calendar size={20} className="text-blue-600" />
            </div>
            <p className="text-muted-foreground text-sm">Last Updated</p>
            <p className="font-medium">{formatTimeAgo(repository.repoData.last_commit_date)}</p>
            <p className="text-xs text-muted-foreground">{formatDate(repository.repoData.last_commit_date)}</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 flex flex-col items-center justify-center text-center">
            <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center mb-2">
              <GitBranch size={20} className="text-green-600" />
            </div>
            <p className="text-muted-foreground text-sm">Commits</p>
            <p className="font-medium">{repository.repoData.commits_count?.toLocaleString() || "N/A"}</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 flex flex-col items-center justify-center text-center">
            <div className="h-8 w-8 rounded-full bg-purple-100 flex items-center justify-center mb-2">
              <Users size={20} className="text-purple-600" />
            </div>
            <p className="text-muted-foreground text-sm">Contributors</p>
            <p className="font-medium">{repository.repoData.contributors_count || "N/A"}</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 flex flex-col items-center justify-center text-center">
            <div className="h-8 w-8 rounded-full bg-amber-100 flex items-center justify-center mb-2">
              <AlertTriangle size={20} className="text-amber-600" />
            </div>
            <p className="text-muted-foreground text-sm">Security Issues</p>
            <p className="font-medium">{repository.securityIssues?.length || 0}</p>
          </CardContent>
        </Card>
      </div>
      
      {/* Tabs Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-3 mb-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="code-quality">Code Quality</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
        </TabsList>
        
        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* Repository Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Repository Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <p className="text-sm text-muted-foreground">Full Name</p>
                      <p className="font-medium">{repository.repoData.full_name}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">License</p>
                      <p className="font-medium">{repository.repoData.license?.name || "Not specified"}</p>
                    </div>
                  </div>
                  
                  <div>
                    <p className="text-sm text-muted-foreground">GitHub URL</p>
                    <a 
                      href={repository.repoData.html_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline flex items-center gap-1"
                    >
                      {repository.repoData.html_url}
                      <ExternalLink size={14} />
                    </a>
                  </div>
                  
                  <div>
                    <p className="text-sm text-muted-foreground">Last Updated</p>
                    <p className="font-medium">{formatDate(repository.repoData.last_commit_date)}</p>
                  </div>
                  
                  <div>
                    <p className="text-sm text-muted-foreground">Updated</p>
                    <p className="font-medium">{formatTimeAgo(repository.repoData.updated_at)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* Contributors Section */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-lg">Contributors</CardTitle>
                  <CardDescription>
                    Top contributors to this repository
                  </CardDescription>
                </div>
                <div className="rounded-full bg-purple-100 p-2">
                  <Users size={18} className="text-purple-600" />
                </div>
              </CardHeader>
              <CardContent>
                {repository.repoData.contributors && repository.repoData.contributors.length > 0 ? (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center mb-2">
                      <ContributorsDisplay 
                        contributors={repository.repoData.contributors} 
                        maxToShow={5} 
                      />
                      <span className="text-sm text-muted-foreground">
                        {repository.repoData.contributors.length} contributors
                      </span>
                    </div>
                    
                    <ScrollArea className="h-[260px]">
                      <div className="space-y-3">
                        {repository.repoData.contributors.slice(0, 8).map((contributor) => (
                          <div key={contributor.id} className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <img 
                                src={contributor.avatar_url} 
                                alt={contributor.login} 
                                className="h-8 w-8 rounded-full"
                              />
                              <a 
                                href={`https://github.com/${contributor.login}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm font-medium hover:underline"
                              >
                                {contributor.login}
                              </a>
                            </div>
                            <div className="flex items-center">
                              <span className="text-sm font-medium">{contributor.contributions}</span>
                              <span className="text-xs text-muted-foreground ml-1">commits</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-[260px] text-center">
                    <Users size={40} className="text-muted-foreground/20 mb-2" />
                    <p className="text-muted-foreground">
                      No contributor data available
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        {/* Code Quality Tab */}
        <TabsContent value="code-quality" className="space-y-6">
          {repository.sonarData ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="md:col-span-3">
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">SonarCloud Metrics Overview</CardTitle>
                    <CardDescription>
                      Code quality analysis from SonarCloud
                    </CardDescription>
                  </div>
                  <div className="rounded-full bg-blue-100 p-2">
                    <Shield size={18} className="text-blue-600" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
                    <div className="bg-muted/40 p-4 rounded-lg text-center">
                      <div className="text-2xl font-bold">
                        {repository.sonarData.metrics.lines_of_code?.toLocaleString() || "0"}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">Lines of Code</p>
                    </div>
                    
                    <div className="bg-muted/40 p-4 rounded-lg text-center">
                      <div className="text-2xl font-bold">
                        {`${repository.sonarData.metrics.coverage?.toFixed(1) || "0"}%`}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">Code Coverage</p>
                    </div>
                    
                    <div className="bg-muted/40 p-4 rounded-lg text-center">
                      <div className="text-2xl font-bold">
                        {repository.sonarData.metrics.bugs?.toString() || "0"}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">Bugs</p>
                    </div>
                    
                    <div className="bg-muted/40 p-4 rounded-lg text-center">
                      <div className="text-2xl font-bold">
                        {repository.sonarData.metrics.vulnerabilities?.toString() || "0"}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">Vulnerabilities</p>
                    </div>
                    
                    <div className="bg-muted/40 p-4 rounded-lg text-center">
                      <div className="text-2xl font-bold">
                        {repository.sonarData.metrics.code_smells?.toString() || "0"}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">Code Smells</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              {/* Code Quality Charts */}
              <Card className="md:col-span-2">
                <CardHeader>
                  <CardTitle className="text-lg">Code Issues Distribution</CardTitle>
                </CardHeader>
                <CardContent className="h-[300px]">
                  {metricsData.length > 0 && metricsData.some(item => item.value > 0) ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={metricsData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip 
                          content={({ active, payload }) => {
                            if (active && payload && payload.length) {
                              return (
                                <div className="bg-background border rounded-md shadow-md p-2">
                                  <p className="font-medium">{`${payload[0].name}: ${payload[0].value}`}</p>
                                </div>
                              );
                            }
                            return null;
                          }} 
                        />
                        <Legend />
                        <Bar dataKey="value" name="Count">
                          {metricsData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.fill} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full text-center">
                      <FileCode size={40} className="text-muted-foreground/20 mb-2" />
                      <p className="text-muted-foreground">
                        No code issues data available
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Technical Debt</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col items-center justify-center">
                  <div className="h-32 w-32 rounded-full border-8 border-muted flex items-center justify-center mb-4">
                    <div className="text-center">
                      <p className="text-2xl font-bold">
                        {repository.sonarData.metrics.technical_debt || "0"}
                      </p>
                    </div>
                  </div>
                  <div className="text-center">
                    <p className="text-muted-foreground">Estimated time to fix all code smells</p>
                  </div>
                  
                  <div className="mt-6 w-full">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Complexity:</span>
                      <span className="font-medium">{repository.sonarData.metrics.complexity || "N/A"}</span>
                    </div>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button variant="outline" className="w-full text-xs" asChild>
                    <a 
                      href={`https://sonarcloud.io/project/issues?id=${repository.sonarData.project_key}&resolved=false`} 
                      target="_blank" 
                      rel="noopener noreferrer"
                    >
                      View All Issues <ExternalLink size={12} className="ml-1" />
                    </a>
                  </Button>
                </CardFooter>
              </Card>
            </div>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">SonarCloud Metrics</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <Shield size={40} className="text-muted-foreground/20 mb-4" />
                <p className="text-lg font-medium mb-2">No SonarCloud data available</p>
                <p className="text-muted-foreground max-w-md">
                  This repository doesn't have SonarCloud integration or no data has been collected yet.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
        
        {/* Security Tab */}
        <TabsContent value="security" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Security Summary */}
            <Card className="md:col-span-3">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-lg">Security Overview</CardTitle>
                  <CardDescription>
                    Security vulnerabilities and alerts
                  </CardDescription>
                </div>
                {repository.securityIssues && repository.securityIssues.length > 0 ? (
                  <div className="rounded-full bg-red-100 p-2">
                    <AlertCircle size={18} className="text-red-600" />
                  </div>
                ) : (
                  <div className="rounded-full bg-green-100 p-2">
                    <Shield size={18} className="text-green-600" />
                  </div>
                )}
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {['Critical', 'High', 'Medium', 'Low'].map((severity) => {
                    const count = securityData.find(d => d.name === severity)?.value || 0;
                    let bgColor = 'bg-green-50';
                    let textColor = 'text-green-700';
                    
                    if (severity === 'Critical') {
                      bgColor = count > 0 ? 'bg-red-50' : 'bg-gray-50';
                      textColor = count > 0 ? 'text-red-700' : 'text-gray-500';
                    } else if (severity === 'High') {
                      bgColor = count > 0 ? 'bg-orange-50' : 'bg-gray-50';
                      textColor = count > 0 ? 'text-orange-700' : 'text-gray-500';
                    } else if (severity === 'Medium') {
                      bgColor = count > 0 ? 'bg-yellow-50' : 'bg-gray-50';
                      textColor = count > 0 ? 'text-yellow-700' : 'text-gray-500';
                    } else {
                      bgColor = count > 0 ? 'bg-green-50' : 'bg-gray-50';
                      textColor = count > 0 ? 'text-green-700' : 'text-gray-500';
                    }
                    
                    return (
                      <div key={severity} className={`p-4 rounded-lg ${bgColor}`}>
                        <div className="text-2xl font-bold mb-1 flex items-center gap-2">
                          <span className={textColor}>{count}</span>
                        </div>
                        <p className={`text-sm ${textColor}`}>{severity}</p>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
            
            {/* Security Distribution */}
            <Card className="md:col-span-1">
              <CardHeader>
                <CardTitle className="text-lg">Severity Distribution</CardTitle>
              </CardHeader>
              <CardContent className="h-[300px]">
                {securityData.length > 0 && securityData.some(item => item.value > 0) ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={securityData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {securityData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Pie>
                      <Tooltip 
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            return (
                              <div className="bg-background border rounded-md shadow-md p-2">
                                <p className="font-medium">{`${payload[0].name}: ${payload[0].value}`}</p>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-center">
                    <Shield size={40} className="text-green-500 mb-2" />
                    <p className="text-green-600 font-medium">
                      No security issues found
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
            
            {/* Security Issues List */}
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle className="text-lg">Security Issues</CardTitle>
              </CardHeader>
              <CardContent className="h-[300px] overflow-auto">
                {repository.securityIssues && repository.securityIssues.length > 0 ? (
                  <div className="space-y-3">
                    {repository.securityIssues.map((issue) => {
                      let severityColor = '';
                      const severity = issue.severity.toLowerCase();
                      
                      if (severity === 'critical') {
                        severityColor = 'bg-red-100 text-red-700';
                      } else if (severity === 'high') {
                        severityColor = 'bg-orange-100 text-orange-700';
                      } else if (severity === 'medium' || severity === 'moderate') {
                        severityColor = 'bg-yellow-100 text-yellow-700';
                      } else {
                        severityColor = 'bg-green-100 text-green-700';
                      }
                      
                      return (
                        <div key={issue.id} className="border rounded-lg p-3 shadow-sm">
                          <div className="flex justify-between items-start">
                            <h3 className="font-medium text-sm">{issue.title}</h3>
                            <span className={`text-xs px-2 py-1 rounded-full ${severityColor}`}>
                              {issue.severity}
                            </span>
                          </div>
                          <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
                            <span>State: {issue.state}</span>
                            <span>
                              {issue.published_at && 
                                `Reported ${formatDistanceToNow(new Date(issue.published_at), { addSuffix: true })}`}
                            </span>
                          </div>
                          {issue.html_url && (
                            <div className="mt-2">
                              <a 
                                href={issue.html_url} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-xs text-blue-600 hover:underline"
                              >
                                View details
                              </a>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-center">
                    <Shield size={40} className="text-green-500 mb-2" />
                    <p className="text-green-600 font-medium mb-2">No security issues found</p>
                    <p className="text-muted-foreground text-sm">
                      This repository has no detected security vulnerabilities.
                    </p>
                  </div>
                )}
              </CardContent>
              {repository.securityIssues && repository.securityIssues.length > 0 && (
                <CardFooter>
                  <Button variant="outline" className="w-full gap-2" asChild>
                    <a 
                      href={`${repository.repoData.html_url}/security/dependabot`} 
                      target="_blank" 
                      rel="noopener noreferrer"
                    >
                      <Bug size={14} />
                      <span>View All Security Issues</span>
                    </a>
                  </Button>
                </CardFooter>
              )}
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default RepositoryDetailsView;

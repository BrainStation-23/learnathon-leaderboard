
import { TeamDashboardData } from "@/types";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Calendar, Users, GitCommit, AlertTriangle, Bug, Shield, Code, BookOpen, AlertCircle } from "lucide-react";
import ContributorsDisplay from "./ContributorsDisplay";
import { formatDistanceToNow } from "date-fns";

type RepositoryCardProps = {
  data: TeamDashboardData;
};

export default function RepositoryCard({ data }: RepositoryCardProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const renderSecurityIssuesSummary = () => {
    if (!data.securityIssues || data.securityIssues.length === 0) {
      return (
        <div className="flex items-center justify-center py-2">
          <Shield className="h-4 w-4 text-green-500 mr-2" />
          <span className="text-sm text-green-600">No security issues detected</span>
        </div>
      );
    }

    // Count issues by severity
    const severityCounts = data.securityIssues.reduce((acc, issue) => {
      const severity = issue.severity.toLowerCase();
      acc[severity] = (acc[severity] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return (
      <div className="space-y-2">
        <h4 className="text-xs font-medium text-muted-foreground">Security Issues</h4>
        <div className="grid grid-cols-3 gap-2">
          <div className="flex flex-col items-center p-1 bg-red-50 rounded-md">
            <AlertCircle className="h-4 w-4 text-red-500 mb-1" />
            <span className="text-sm font-bold">{severityCounts.critical || 0}</span>
            <span className="text-xs text-muted-foreground">Critical</span>
          </div>
          <div className="flex flex-col items-center p-1 bg-orange-50 rounded-md">
            <AlertTriangle className="h-4 w-4 text-orange-500 mb-1" />
            <span className="text-sm font-bold">{severityCounts.high || 0}</span>
            <span className="text-xs text-muted-foreground">High</span>
          </div>
          <div className="flex flex-col items-center p-1 bg-yellow-50 rounded-md">
            <AlertTriangle className="h-4 w-4 text-yellow-500 mb-1" />
            <span className="text-sm font-bold">{(severityCounts.moderate || 0) + (severityCounts.medium || 0)}</span>
            <span className="text-xs text-muted-foreground">Medium</span>
          </div>
        </div>

        {data.securityIssues.length > 0 && (
          <div className="mt-1">
            <Button variant="ghost" size="sm" className="w-full text-xs" asChild>
              <a 
                href={`${data.repoData.html_url}/security/dependabot`} 
                target="_blank" 
                rel="noopener noreferrer"
              >
                View All Issues
              </a>
            </Button>
          </div>
        )}
      </div>
    );
  };

  return (
    <Card className="overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-hackathon-900 to-hackathon-800 text-white">
        <CardTitle className="text-lg">{data.repoData.name}</CardTitle>
        <CardDescription className="text-gray-300">
          {data.repoData.description || "No description available"}
        </CardDescription>
      </CardHeader>
      
      <CardContent className="pt-6">
        <div className="space-y-6">
          {/* GitHub Metrics */}
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-muted-foreground">GitHub Metrics</h3>
            <div className="grid grid-cols-3 gap-4">
              <div className="flex flex-col items-center">
                <Users className="h-5 w-5 text-hackathon-600 mb-1" />
                <span className="text-lg font-bold">{data.repoData.contributors_count || 0}</span>
                <span className="text-xs text-muted-foreground">Contributors</span>
              </div>
              <div className="flex flex-col items-center">
                <GitCommit className="h-5 w-5 text-hackathon-600 mb-1" />
                <span className="text-lg font-bold">{data.repoData.commits_count || 0}</span>
                <span className="text-xs text-muted-foreground">Commits</span>
              </div>
              <div className="flex flex-col items-center">
                <Calendar className="h-5 w-5 text-hackathon-600 mb-1" />
                <span className="text-xs font-medium">
                  {data.repoData.last_commit_date 
                    ? formatDate(data.repoData.last_commit_date) 
                    : 'No data'}
                </span>
                <span className="text-xs text-muted-foreground">Last Commit</span>
              </div>
            </div>
            
            {/* License info */}
            {data.repoData.license && (
              <div className="mt-2 flex items-center">
                <BookOpen className="h-4 w-4 text-blue-600 mr-2" />
                <div>
                  <span className="text-xs text-muted-foreground mr-1">License:</span>
                  <Badge variant="secondary" className="text-xs">
                    {data.repoData.license.spdx_id || data.repoData.license.name}
                  </Badge>
                </div>
              </div>
            )}
            
            {/* Contributors display */}
            <div className="mt-4">
              <h4 className="text-xs font-medium text-muted-foreground mb-2">Top Contributors</h4>
              <ContributorsDisplay 
                contributors={data.repoData.contributors} 
                maxToShow={5} 
              />
            </div>
            
            {/* Security Issues */}
            {renderSecurityIssuesSummary()}
          </div>
          
          <Separator />
          
          {/* SonarCloud Metrics */}
          {data.sonarData ? (
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-muted-foreground">SonarCloud Metrics</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-xs font-medium text-muted-foreground mb-1">Code Coverage</div>
                  <div className="flex items-center gap-2">
                    <Progress 
                      value={data.sonarData.metrics.coverage || 0} 
                      className="h-2"
                    />
                    <span className="text-sm font-medium">
                      {data.sonarData.metrics.coverage?.toFixed(1) || 0}%
                    </span>
                  </div>
                </div>
                <div>
                  <div className="text-xs font-medium text-muted-foreground mb-1">Lines of Code</div>
                  <div className="text-sm font-medium">
                    {data.sonarData.metrics.lines_of_code?.toLocaleString() || 0}
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-2">
                <div className="flex flex-col items-center p-2 bg-red-50 rounded-md">
                  <Bug className="h-4 w-4 text-red-500 mb-1" />
                  <span className="text-sm font-bold">{data.sonarData.metrics.bugs || 0}</span>
                  <span className="text-xs text-muted-foreground">Bugs</span>
                </div>
                <div className="flex flex-col items-center p-2 bg-orange-50 rounded-md">
                  <AlertTriangle className="h-4 w-4 text-orange-500 mb-1" />
                  <span className="text-sm font-bold">{data.sonarData.metrics.vulnerabilities || 0}</span>
                  <span className="text-xs text-muted-foreground">Vulnerabilities</span>
                </div>
                <div className="flex flex-col items-center p-2 bg-blue-50 rounded-md">
                  <Code className="h-4 w-4 text-blue-500 mb-1" />
                  <span className="text-sm font-bold">{data.sonarData.metrics.code_smells || 0}</span>
                  <span className="text-xs text-muted-foreground">Code Smells</span>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-xs font-medium text-muted-foreground mb-1">Technical Debt</div>
                  <div className="text-sm font-medium">
                    {data.sonarData.metrics.technical_debt || '0m'}
                  </div>
                </div>
                <div>
                  <div className="text-xs font-medium text-muted-foreground mb-1">Complexity</div>
                  <div className="text-sm font-medium">
                    {data.sonarData.metrics.complexity || 0}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-4">
              <p className="text-sm text-muted-foreground mb-2">
                No SonarCloud data available for this repository
              </p>
              <Badge variant="outline">Not Analyzed</Badge>
            </div>
          )}
        </div>
      </CardContent>
      
      <CardFooter className="bg-muted/30 border-t">
        <Button variant="outline" asChild className="w-full">
          <a 
            href={data.repoData.html_url} 
            target="_blank" 
            rel="noopener noreferrer"
          >
            View on GitHub
          </a>
        </Button>
      </CardFooter>
    </Card>
  );
}

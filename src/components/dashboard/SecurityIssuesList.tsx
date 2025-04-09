
import { GitHubSecurityIssue } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, AlertTriangle, Shield } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface SecurityIssuesListProps {
  issues: GitHubSecurityIssue[];
  repoName: string;
}

export default function SecurityIssuesList({ issues, repoName }: SecurityIssuesListProps) {
  if (!issues || issues.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center">
            <Shield className="h-5 w-5 text-green-500 mr-2" />
            Security Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-4 text-center">
            <p className="text-green-600 font-medium mb-2">No security issues found</p>
            <p className="text-muted-foreground text-sm">
              This repository has no detected security vulnerabilities at this time.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Get severity counts
  const severityCounts = issues.reduce(
    (acc, issue) => {
      const severity = issue.severity.toLowerCase();
      if (severity === "critical") acc.critical++;
      else if (severity === "high") acc.high++;
      else if (severity === "medium" || severity === "moderate") acc.medium++;
      else acc.low++;
      return acc;
    },
    { critical: 0, high: 0, medium: 0, low: 0 }
  );

  const getSeverityBadge = (severity: string) => {
    const lowerSeverity = severity.toLowerCase();
    
    if (lowerSeverity === "critical") {
      return <Badge variant="destructive">Critical</Badge>;
    } else if (lowerSeverity === "high") {
      return <Badge className="bg-orange-500">High</Badge>;
    } else if (lowerSeverity === "medium" || lowerSeverity === "moderate") {
      return <Badge className="bg-yellow-500">Medium</Badge>;
    } else {
      return <Badge variant="outline">Low</Badge>;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center">
          {severityCounts.critical + severityCounts.high > 0 ? (
            <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
          ) : (
            <AlertTriangle className="h-5 w-5 text-yellow-500 mr-2" />
          )}
          Security Issues
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-4 gap-2 mb-4">
          <div className="flex flex-col items-center p-2 rounded-md bg-red-50">
            <span className="text-lg font-bold text-red-600">{severityCounts.critical}</span>
            <span className="text-xs text-muted-foreground">Critical</span>
          </div>
          <div className="flex flex-col items-center p-2 rounded-md bg-orange-50">
            <span className="text-lg font-bold text-orange-600">{severityCounts.high}</span>
            <span className="text-xs text-muted-foreground">High</span>
          </div>
          <div className="flex flex-col items-center p-2 rounded-md bg-yellow-50">
            <span className="text-lg font-bold text-yellow-600">{severityCounts.medium}</span>
            <span className="text-xs text-muted-foreground">Medium</span>
          </div>
          <div className="flex flex-col items-center p-2 rounded-md bg-blue-50">
            <span className="text-lg font-bold text-blue-600">{severityCounts.low}</span>
            <span className="text-xs text-muted-foreground">Low</span>
          </div>
        </div>
        
        <div className="space-y-3 max-h-[300px] overflow-y-auto">
          {issues.map((issue) => (
            <div key={issue.id} className="border rounded-lg p-3 shadow-sm">
              <div className="flex justify-between items-start">
                <h3 className="font-medium text-sm">{issue.title}</h3>
                {getSeverityBadge(issue.severity)}
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
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

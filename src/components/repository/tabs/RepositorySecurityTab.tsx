
import React from "react";
import { Card, CardHeader, CardContent, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { GitHubRepoData, GitHubSecurityIssue } from "@/types";
import {
  AlertCircle,
  AlertTriangle,
  ShieldCheck,
  ShieldX,
  LineChart,
  Bug,
  FileWarning
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import {
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  Legend
} from "recharts";

interface RepositorySecurityTabProps {
  repository: GitHubRepoData;
  securityIssues?: GitHubSecurityIssue[];
}

export const RepositorySecurityTab: React.FC<RepositorySecurityTabProps> = ({
  repository,
  securityIssues
}) => {
  const prepareSecurityData = () => {
    if (!securityIssues || securityIssues.length === 0) return [];
    
    const severityCounts = {
      critical: 0,
      high: 0,
      medium: 0,
      low: 0
    };
    
    securityIssues.forEach(issue => {
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

  const securityData = prepareSecurityData();

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-3">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg">Security Overview</CardTitle>
              <CardDescription>
                Security vulnerabilities and alerts
              </CardDescription>
            </div>
            {securityIssues && securityIssues.length > 0 ? (
              <div className="rounded-full bg-red-100 p-2">
                <AlertCircle size={18} className="text-red-600" />
              </div>
            ) : (
              <div className="rounded-full bg-green-100 p-2">
                <ShieldCheck size={18} className="text-green-600" />
              </div>
            )}
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { name: 'Critical', icon: <ShieldX size={24} className="text-red-500" /> },
                { name: 'High', icon: <AlertCircle size={24} className="text-orange-500" /> },
                { name: 'Medium', icon: <AlertTriangle size={24} className="text-yellow-500" /> },
                { name: 'Low', icon: <ShieldCheck size={24} className="text-green-500" /> }
              ].map((severity) => {
                const count = securityData.find(d => d.name === severity.name)?.value || 0;
                let bgColor = 'bg-green-50';
                let textColor = 'text-green-700';
                
                if (severity.name === 'Critical') {
                  bgColor = count > 0 ? 'bg-red-50' : 'bg-gray-50';
                  textColor = count > 0 ? 'text-red-700' : 'text-gray-500';
                } else if (severity.name === 'High') {
                  bgColor = count > 0 ? 'bg-orange-50' : 'bg-gray-50';
                  textColor = count > 0 ? 'text-orange-700' : 'text-gray-500';
                } else if (severity.name === 'Medium') {
                  bgColor = count > 0 ? 'bg-yellow-50' : 'bg-gray-50';
                  textColor = count > 0 ? 'text-yellow-700' : 'text-gray-500';
                } else {
                  bgColor = count > 0 ? 'bg-green-50' : 'bg-gray-50';
                  textColor = count > 0 ? 'text-green-700' : 'text-gray-500';
                }
                
                return (
                  <div key={severity.name} className={`p-4 rounded-lg ${bgColor}`}>
                    <div className="flex justify-center mb-2">
                      {severity.icon}
                    </div>
                    <div className="text-2xl font-bold mb-1 flex items-center justify-center">
                      <span className={textColor}>{count}</span>
                    </div>
                    <p className={`text-sm ${textColor} text-center`}>{severity.name}</p>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
        
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <LineChart size={18} className="text-blue-500" />
              Severity Distribution
            </CardTitle>
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
                <ShieldCheck size={40} className="text-green-500 mb-2" />
                <p className="text-green-600 font-medium">
                  No security issues found
                </p>
              </div>
            )}
          </CardContent>
        </Card>
        
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <FileWarning size={18} className="text-red-500" />
              Security Issues
            </CardTitle>
          </CardHeader>
          <CardContent className="h-[300px] overflow-auto">
            {securityIssues && securityIssues.length > 0 ? (
              <div className="space-y-3">
                {securityIssues.map((issue) => {
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
                <ShieldCheck size={40} className="text-green-500 mb-2" />
                <p className="text-green-600 font-medium mb-2">No security issues found</p>
                <p className="text-muted-foreground text-sm">
                  This repository has no detected security vulnerabilities.
                </p>
              </div>
            )}
          </CardContent>
          {securityIssues && securityIssues.length > 0 && (
            <CardFooter>
              <Button variant="outline" className="w-full gap-2" asChild>
                <a 
                  href={`${repository.html_url}/security/dependabot`} 
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
    </div>
  );
};

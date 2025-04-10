
import React from "react";
import { Calendar, GitBranch, Users, AlertTriangle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { GitHubRepoData, GitHubContributor, GitHubSecurityIssue } from "@/types";
import { formatDistanceToNow, format } from "date-fns";

interface RepositoryMetricCardsProps {
  repository: GitHubRepoData;
  filteredContributors: string[];
  securityIssues?: GitHubSecurityIssue[];
}

export const RepositoryMetricCards: React.FC<RepositoryMetricCardsProps> = ({ 
  repository, 
  filteredContributors,
  securityIssues 
}) => {
  const formatDate = (dateString?: string) => {
    if (!dateString) return "No data";
    return format(new Date(dateString), "PPP");
  };
  
  const formatTimeAgo = (dateString?: string) => {
    if (!dateString) return "No data";
    return formatDistanceToNow(new Date(dateString), { addSuffix: true });
  };
  
  const getFilteredContributorsCount = () => {
    if (!repository.contributors) return 0;
    return repository.contributors.filter(
      contributor => !filteredContributors.includes(contributor.login)
    ).length;
  };
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <Card>
        <CardContent className="p-4 flex flex-col items-center justify-center text-center">
          <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center mb-2">
            <Calendar size={20} className="text-blue-600" />
          </div>
          <p className="text-muted-foreground text-sm">Last Updated</p>
          <p className="font-medium">{formatTimeAgo(repository.last_commit_date)}</p>
          <p className="text-xs text-muted-foreground">{formatDate(repository.last_commit_date)}</p>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="p-4 flex flex-col items-center justify-center text-center">
          <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center mb-2">
            <GitBranch size={20} className="text-green-600" />
          </div>
          <p className="text-muted-foreground text-sm">Commits</p>
          <p className="font-medium">{repository.commits_count?.toLocaleString() || "N/A"}</p>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="p-4 flex flex-col items-center justify-center text-center">
          <div className="h-8 w-8 rounded-full bg-purple-100 flex items-center justify-center mb-2">
            <Users size={20} className="text-purple-600" />
          </div>
          <p className="text-muted-foreground text-sm">Contributors</p>
          <p className="font-medium">{getFilteredContributorsCount() || "N/A"}</p>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="p-4 flex flex-col items-center justify-center text-center">
          <div className="h-8 w-8 rounded-full bg-amber-100 flex items-center justify-center mb-2">
            <AlertTriangle size={20} className="text-amber-600" />
          </div>
          <p className="text-muted-foreground text-sm">Security Issues</p>
          <p className="font-medium">{securityIssues?.length || 0}</p>
        </CardContent>
      </Card>
    </div>
  );
};

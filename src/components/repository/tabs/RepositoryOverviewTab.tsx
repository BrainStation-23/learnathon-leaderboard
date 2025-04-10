
import React from "react";
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from "@/components/ui/card";
import { GitHubRepoData, GitHubContributor } from "@/types";
import { formatDistanceToNow, format } from "date-fns";
import { ExternalLink, Users } from "lucide-react";
import ContributorsDisplay from "@/components/dashboard/ContributorsDisplay";
import { ScrollArea } from "@/components/ui/scroll-area";

interface RepositoryOverviewTabProps {
  repository: GitHubRepoData;
  filteredContributorsList: string[];
}

export const RepositoryOverviewTab: React.FC<RepositoryOverviewTabProps> = ({
  repository,
  filteredContributorsList
}) => {
  const formatDate = (dateString?: string) => {
    if (!dateString) return "Not specified";
    return format(new Date(dateString), "PPP");
  };
  
  const formatTimeAgo = (dateString?: string) => {
    if (!dateString) return "Not specified";
    return formatDistanceToNow(new Date(dateString), { addSuffix: true });
  };
  
  const filteredContributors = React.useMemo(() => {
    if (!repository.contributors) return [];
    return repository.contributors.filter(
      contributor => !filteredContributorsList.includes(contributor.login)
    );
  }, [repository.contributors, filteredContributorsList]);

  return (
    <div className="space-y-6">
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
                  <p className="font-medium">{repository.full_name}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">License</p>
                  <p className="font-medium">{repository.license?.name || "Not specified"}</p>
                </div>
              </div>
              
              <div>
                <p className="text-sm text-muted-foreground">GitHub URL</p>
                <a 
                  href={repository.html_url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline flex items-center gap-1"
                >
                  {repository.html_url}
                  <ExternalLink size={14} />
                </a>
              </div>
              
              <div>
                <p className="text-sm text-muted-foreground">Last Updated</p>
                <p className="font-medium">{formatDate(repository.last_commit_date)}</p>
              </div>
              
              <div>
                <p className="text-sm text-muted-foreground">Updated</p>
                <p className="font-medium">{formatTimeAgo(repository.updated_at)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
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
            {filteredContributors && filteredContributors.length > 0 ? (
              <div className="space-y-4">
                <div className="flex justify-between items-center mb-2">
                  <ContributorsDisplay 
                    contributors={filteredContributors} 
                    maxToShow={5} 
                  />
                  <span className="text-sm text-muted-foreground">
                    {filteredContributors.length} contributors
                  </span>
                </div>
                
                <ScrollArea className="h-[260px]">
                  <div className="space-y-3">
                    {filteredContributors.slice(0, 8).map((contributor) => (
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
    </div>
  );
};

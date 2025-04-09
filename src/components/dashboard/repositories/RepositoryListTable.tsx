
import { formatDistanceToNow } from "date-fns";
import { TeamDashboardData } from "@/types";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ExternalLink } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface RepositoryListTableProps {
  repositories: TeamDashboardData[];
  selectedRepo: TeamDashboardData | null;
  onSelectRepository: (repo: TeamDashboardData) => void;
}

export default function RepositoryListTable({ 
  repositories, 
  selectedRepo, 
  onSelectRepository 
}: RepositoryListTableProps) {
  const navigate = useNavigate();
  
  // Format date for display
  const formatDate = (dateString?: string) => {
    if (!dateString) return "No data";
    return formatDistanceToNow(new Date(dateString), { addSuffix: true });
  };

  // Count security issues by severity for a repo
  const getSecurityIssuesCount = (repo: TeamDashboardData) => {
    if (!repo.securityIssues || repo.securityIssues.length === 0) return null;
    
    const issues = {
      critical: 0,
      high: 0,
      medium: 0,
      low: 0,
      total: repo.securityIssues.length
    };
    
    repo.securityIssues.forEach(issue => {
      const severity = issue.severity.toLowerCase();
      if (severity === "critical") issues.critical++;
      else if (severity === "high") issues.high++;
      else if (severity === "medium" || severity === "moderate") issues.medium++;
      else issues.low++;
    });
    
    return issues;
  };

  // Navigate to repository details page
  const handleViewDetails = (repo: TeamDashboardData) => {
    navigate(`/repositories/${repo.repoData.id}`);
  };

  return (
    <Card>
      <CardContent className="p-0">
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Repository</TableHead>
                <TableHead>Last Update</TableHead>
                <TableHead>Contributors</TableHead>
                <TableHead>Security</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {repositories.map((repo) => {
                const isSelected = selectedRepo?.repoData.id === repo.repoData.id;
                const securityIssues = getSecurityIssuesCount(repo);
                
                return (
                  <TableRow 
                    key={repo.repoData.id} 
                    className={`cursor-pointer ${isSelected ? 'bg-muted' : ''}`}
                    onClick={() => onSelectRepository(repo)}
                  >
                    <TableCell className="font-medium">
                      {repo.repoData.name}
                    </TableCell>
                    <TableCell>
                      {formatDate(repo.repoData.last_commit_date)}
                    </TableCell>
                    <TableCell>{repo.repoData.contributors_count || "N/A"}</TableCell>
                    <TableCell>
                      {securityIssues ? (
                        <div className="flex gap-1">
                          {securityIssues.critical > 0 && (
                            <Badge variant="destructive">{securityIssues.critical}</Badge>
                          )}
                          {securityIssues.high > 0 && (
                            <Badge className="bg-orange-500">{securityIssues.high}</Badge>
                          )}
                          {(securityIssues.critical === 0 && securityIssues.high === 0) && (
                            <Badge variant="outline">OK</Badge>
                          )}
                        </div>
                      ) : (
                        <Badge variant="outline" className="bg-green-50 text-green-600">Secure</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="ml-auto gap-1"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleViewDetails(repo);
                        }}
                      >
                        <span>Details</span>
                        <ExternalLink size={14} />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}

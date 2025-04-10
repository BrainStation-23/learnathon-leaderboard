
import React from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { IndividualContributor } from '@/services/contributors/contributorsService';
import { Code, GitCommit } from 'lucide-react';
import { Link } from 'react-router-dom';

interface ContributorCardProps {
  contributor: IndividualContributor;
}

export function ContributorCard({ contributor }: ContributorCardProps) {
  // Get the repository with the most contributions
  const topRepo = [...contributor.repositories].sort((a, b) => b.contributions - a.contributions)[0];
  
  return (
    <Card className="h-full hover:shadow-md transition-shadow">
      <CardHeader className="pb-2">
        <div className="flex items-center space-x-4">
          <Avatar className="h-12 w-12 border-2 border-primary/10">
            <AvatarImage src={contributor.avatar_url} alt={contributor.login} />
            <AvatarFallback>{contributor.login.slice(0, 2).toUpperCase()}</AvatarFallback>
          </Avatar>
          <div>
            <h3 className="font-semibold text-lg">{contributor.login}</h3>
            <div className="flex items-center text-muted-foreground text-sm">
              <GitCommit className="h-4 w-4 mr-1" />
              <span>{contributor.total_contributions} total contributions</span>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Top repositories:</h4>
          <div className="space-y-1">
            {contributor.repositories.slice(0, 3).map(repo => (
              <div key={`${contributor.login}-${repo.id}`} className="flex justify-between items-center">
                <Link 
                  to={`/repositories/${repo.id}`} 
                  className="flex items-center hover:underline text-sm"
                >
                  <Code className="h-4 w-4 mr-1 text-muted-foreground" />
                  {repo.name}
                </Link>
                <Badge variant="secondary" className="text-xs">{repo.contributions}</Badge>
              </div>
            ))}
          </div>
          {contributor.repositories.length > 3 && (
            <div className="text-xs text-muted-foreground pt-1">
              +{contributor.repositories.length - 3} more repositories
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

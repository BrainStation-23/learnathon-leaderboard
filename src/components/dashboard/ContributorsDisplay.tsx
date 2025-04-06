
import { GitHubContributor } from "@/types";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

type ContributorsDisplayProps = {
  contributors?: GitHubContributor[];
  maxToShow?: number;
};

export default function ContributorsDisplay({ contributors = [], maxToShow = 5 }: ContributorsDisplayProps) {
  if (!contributors || contributors.length === 0) {
    return <div className="text-xs text-muted-foreground">No contributor data available</div>;
  }

  const displayContributors = contributors.slice(0, maxToShow);

  return (
    <div>
      <div className="flex -space-x-2 overflow-hidden">
        <TooltipProvider>
          {displayContributors.map((contributor) => (
            <Tooltip key={contributor.id}>
              <TooltipTrigger asChild>
                <Avatar className="h-7 w-7 border-2 border-background">
                  <AvatarImage src={contributor.avatar_url} alt={contributor.login} />
                  <AvatarFallback>{contributor.login.slice(0, 2).toUpperCase()}</AvatarFallback>
                </Avatar>
              </TooltipTrigger>
              <TooltipContent>
                <div className="text-sm font-medium">{contributor.login}</div>
                <div className="text-xs text-muted-foreground">{contributor.contributions} commits</div>
              </TooltipContent>
            </Tooltip>
          ))}
          {contributors.length > maxToShow && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Avatar className="h-7 w-7 border-2 border-background bg-muted">
                  <AvatarFallback>+{contributors.length - maxToShow}</AvatarFallback>
                </Avatar>
              </TooltipTrigger>
              <TooltipContent>
                <div className="text-sm">{contributors.length - maxToShow} more contributors</div>
              </TooltipContent>
            </Tooltip>
          )}
        </TooltipProvider>
      </div>
    </div>
  );
}

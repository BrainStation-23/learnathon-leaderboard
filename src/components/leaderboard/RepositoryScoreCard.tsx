
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LeaderboardItem } from "@/types/leaderboard";
import { ScoreProgressBar } from "./ScoreProgressBar";
import { formatDistanceToNow } from "date-fns";
import { RepositoryContributors } from "./RepositoryContributors";
import { LinesOfCodeIndicator } from "./LinesOfCodeIndicator";
import { Separator } from "@/components/ui/separator";

interface RepositoryScoreCardProps {
  item: LeaderboardItem;
  rank: number;
}

export function RepositoryScoreCard({ item, rank }: RepositoryScoreCardProps) {
  const lastUpdatedDate = new Date(item.lastUpdated);
  
  // Determine badge color based on ranking
  let badgeVariant: "default" | "secondary" | "destructive" = "default";
  if (rank === 1) badgeVariant = "default";
  else if (rank <= 3) badgeVariant = "secondary";
  
  return (
    <Card className="overflow-hidden transition-all hover:shadow-md">
      <CardHeader className="bg-muted/50 pb-4">
        <div className="flex justify-between items-start">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Badge variant={badgeVariant}>#{rank}</Badge>
              {item.totalScore >= 80 && (
                <Badge variant="outline" className="bg-green-500/10 text-green-700 border-green-200">
                  High Quality
                </Badge>
              )}
            </div>
            <CardTitle className="text-xl">{item.repositoryName}</CardTitle>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold">{item.totalScore}</div>
            <div className="text-xs text-muted-foreground">out of 100</div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-4 space-y-4">
        {/* Show Lines of Code Indicator */}
        <LinesOfCodeIndicator linesOfCode={item.linesOfCode} />
        
        <Separator />
        
        {/* Show Contributors */}
        {item.contributors && item.contributors.length > 0 && (
          <>
            <RepositoryContributors 
              contributors={item.contributors} 
              totalCommits={item.commitsCount} 
            />
            <Separator />
          </>
        )}
        
        <ScoreProgressBar 
          label="Code Coverage" 
          score={item.coverageScore} 
          maxScore={20}
          value={item.coverage}
          valueUnit="%"
        />
        <ScoreProgressBar 
          label="Bugs" 
          score={item.bugsScore} 
          maxScore={15}
          value={item.bugs}
        />
        <ScoreProgressBar 
          label="Vulnerabilities" 
          score={item.vulnerabilitiesScore} 
          maxScore={15}
          value={item.vulnerabilities}
        />
        <ScoreProgressBar 
          label="Code Smells" 
          score={item.codeSmellsScore} 
          maxScore={20}
          value={item.codeSmells}
        />
        <ScoreProgressBar 
          label="Technical Debt" 
          score={item.technicalDebtScore} 
          maxScore={20}
          value={item.technicalDebt}
        />
        <ScoreProgressBar 
          label="Code Complexity" 
          score={item.complexityScore} 
          maxScore={10}
          value={item.complexity}
        />
        
        <div className="text-xs text-muted-foreground text-right pt-2">
          Last updated: {formatDistanceToNow(lastUpdatedDate, { addSuffix: true })}
        </div>
      </CardContent>
    </Card>
  );
}

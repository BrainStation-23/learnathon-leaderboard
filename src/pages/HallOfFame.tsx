
import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useLeaderboardData } from "@/hooks/useLeaderboardData";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trophy, Crown, Medal, Star, ChevronRight } from "lucide-react";
import { LeaderboardItem, TechStack } from "@/types/leaderboard";

export default function HallOfFame() {
  const { leaderboardData, loading } = useLeaderboardData();
  const [stacksWithTopRepos, setStacksWithTopRepos] = useState<{ stack: string; repos: LeaderboardItem[] }[]>([]);
  
  // Group repositories by tech stack and get top 3 for each
  useEffect(() => {
    if (leaderboardData.length === 0) return;
    
    // Create a map to group repositories by tech stack
    const stackMap: Record<string, LeaderboardItem[]> = {};
    
    // Process each repository and add it to appropriate stack groups
    leaderboardData.forEach(repo => {
      if (!repo.techStacks || repo.techStacks.length === 0) return;
      
      repo.techStacks.forEach(stack => {
        if (!stackMap[stack]) {
          stackMap[stack] = [];
        }
        stackMap[stack].push(repo);
      });
    });
    
    // For each stack, sort repos by score and get top 3
    const stacks = Object.keys(stackMap).map(stack => {
      const sortedRepos = stackMap[stack]
        .sort((a, b) => b.totalScore - a.totalScore)
        .slice(0, 3);
        
      return {
        stack,
        repos: sortedRepos
      };
    });
    
    // Sort stacks by the highest score in each stack
    stacks.sort((a, b) => {
      const aHighestScore = a.repos[0]?.totalScore || 0;
      const bHighestScore = b.repos[0]?.totalScore || 0;
      return bHighestScore - aHighestScore;
    });
    
    setStacksWithTopRepos(stacks);
  }, [leaderboardData]);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-20 max-w-screen-xl">
        <div className="flex justify-center">
          <div className="animate-pulse w-full max-w-4xl">
            <div className="h-24 bg-muted rounded-lg mb-10"></div>
            {[1, 2, 3].map((i) => (
              <div key={i} className="mb-12">
                <div className="h-10 bg-muted rounded w-1/4 mb-6"></div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {[1, 2, 3].map((j) => (
                    <div key={j} className="h-40 bg-muted rounded-lg"></div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-10 max-w-screen-xl">
      <div className="mb-12 text-center">
        <div className="relative inline-block">
          <div className="inline-flex items-center justify-center p-4 bg-gradient-to-r from-amber-300 to-yellow-500 rounded-full mb-6">
            <Trophy className="h-10 w-10 text-white" />
          </div>
          <div className="absolute -top-2 -right-2 animate-bounce">
            <Star className="h-6 w-6 text-amber-400 fill-amber-400" />
          </div>
        </div>
        <h1 className="text-4xl md:text-5xl font-bold mb-2 bg-clip-text text-transparent bg-gradient-to-r from-amber-500 to-yellow-600">
          Hall of Fame
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Celebrating excellence in code quality across tech stacks
        </p>
        <div className="mt-4">
          <Button variant="outline" size="sm" asChild>
            <Link to="/">
              View Full Leaderboard
              <ChevronRight className="ml-1 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>

      {stacksWithTopRepos.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <p>No data available for the Hall of Fame yet.</p>
        </div>
      ) : (
        <div className="space-y-16">
          {stacksWithTopRepos.map((stackData) => (
            <div key={stackData.stack} className="animate-fade-in">
              <div className="flex items-center gap-2 mb-6">
                <Crown className="h-6 w-6 text-amber-500" />
                <h2 className="text-2xl font-bold">{stackData.stack}</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {stackData.repos.map((repo, index) => (
                  <TopRepoCard key={repo.repositoryId} repo={repo} rank={index + 1} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

interface TopRepoCardProps {
  repo: LeaderboardItem;
  rank: number;
}

function TopRepoCard({ repo, rank }: TopRepoCardProps) {
  // Different medal for top 3 positions
  const getMedalIcon = () => {
    switch (rank) {
      case 1:
        return <Medal className="h-5 w-5 text-amber-500 fill-amber-500" />;
      case 2:
        return <Medal className="h-5 w-5 text-gray-400 fill-gray-400" />;
      case 3:
        return <Medal className="h-5 w-5 text-amber-700 fill-amber-700" />;
      default:
        return null;
    }
  };

  return (
    <Card className="overflow-hidden transform transition-all hover:scale-105 hover:shadow-lg border-t-4 border-t-amber-500 bg-gradient-to-b from-amber-50 to-white">
      <CardHeader className="relative pb-2">
        <div className="absolute top-0 right-0 p-2">
          <div className="text-3xl font-bold text-amber-500">{repo.totalScore}</div>
          <div className="text-xs text-muted-foreground text-right">points</div>
        </div>
        <div className="flex items-center gap-2">
          {getMedalIcon()}
          <h3 className="font-bold text-lg truncate">{repo.repositoryName}</h3>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="flex justify-between items-center">
          <a 
            href={repo.githubUrl || "#"} 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-blue-600 hover:underline text-sm flex items-center"
          >
            View Repository
            <ChevronRight className="h-4 w-4 ml-1" />
          </a>
        </div>
      </CardContent>
    </Card>
  );
}

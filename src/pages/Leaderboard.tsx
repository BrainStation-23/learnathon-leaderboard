
import React from "react";
import { LeaderboardGrid } from "@/components/leaderboard/LeaderboardGrid";
import { Card, CardContent } from "@/components/ui/card";
import { Trophy } from "lucide-react";

export default function Leaderboard() {
  return (
    <div className="container mx-auto px-4 py-10 max-w-screen-xl">
      <div className="mb-10 text-center">
        <div className="inline-flex items-center justify-center p-3 bg-muted rounded-full mb-4">
          <Trophy className="h-8 w-8 text-primary" />
        </div>
        <h1 className="text-3xl md:text-4xl font-bold mb-2">Code Quality Leaderboard</h1>
        <p className="text-muted-foreground max-w-lg mx-auto">
          Repositories ranked by code quality metrics from SonarCloud. 
          The score is calculated based on coverage, bugs, vulnerabilities, code smells, technical debt, and complexity.
        </p>
      </div>

      <Card>
        <CardContent className="p-6">
          <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-lg bg-muted/50">
              <h3 className="font-semibold mb-1">Quality Scoring</h3>
              <p className="text-sm text-muted-foreground">
                Each repository is scored out of 100 points across multiple metrics
              </p>
            </div>
            <div className="p-4 rounded-lg bg-muted/50">
              <h3 className="font-semibold mb-1">Data Source</h3>
              <p className="text-sm text-muted-foreground">
                All metrics are sourced from SonarCloud static analysis reports
              </p>
            </div>
            <div className="p-4 rounded-lg bg-muted/50">
              <h3 className="font-semibold mb-1">Ranking System</h3>
              <p className="text-sm text-muted-foreground">
                Repositories are ranked by their total score in descending order
              </p>
            </div>
          </div>

          <LeaderboardGrid />
        </CardContent>
      </Card>
    </div>
  );
}

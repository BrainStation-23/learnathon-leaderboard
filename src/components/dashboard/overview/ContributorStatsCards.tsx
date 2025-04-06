
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Briefcase, UserX, Calendar } from "lucide-react";

interface ContributorStatsCardsProps {
  reposWithOneActiveContributor: number;
  reposWithTwoActiveContributors: number;
  reposWithThreeActiveContributors: number;
  reposWithJobOffer: number;
  reposDroppedOut: number;
  reposWithNoRecentActivity: number;
}

export default function ContributorStatsCards({
  reposWithOneActiveContributor,
  reposWithTwoActiveContributors,
  reposWithThreeActiveContributors,
  reposWithJobOffer,
  reposDroppedOut,
  reposWithNoRecentActivity,
}: ContributorStatsCardsProps) {
  return (
    <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Users className="h-4 w-4 text-blue-500" />
            Repos with 3+ Active Contributors
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{reposWithThreeActiveContributors}</div>
          <p className="text-xs text-muted-foreground mt-1">
            Excluding filtered contributors
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Users className="h-4 w-4 text-green-500" />
            Repos with 2 Active Contributors
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{reposWithTwoActiveContributors}</div>
          <p className="text-xs text-muted-foreground mt-1">
            Excluding filtered contributors
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Users className="h-4 w-4 text-yellow-500" />
            Repos with 1 Active Contributor
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{reposWithOneActiveContributor}</div>
          <p className="text-xs text-muted-foreground mt-1">
            Excluding filtered contributors
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Briefcase className="h-4 w-4 text-green-600" />
            Jobs Offered
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{reposWithJobOffer}</div>
          <p className="text-xs text-muted-foreground mt-1">
            From repository filters
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <UserX className="h-4 w-4 text-red-500" />
            Dropped Out
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{reposDroppedOut}</div>
          <p className="text-xs text-muted-foreground mt-1">
            From repository filters
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Calendar className="h-4 w-4 text-orange-500" />
            No Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{reposWithNoRecentActivity}</div>
          <p className="text-xs text-muted-foreground mt-1">
            No commits in the past month
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

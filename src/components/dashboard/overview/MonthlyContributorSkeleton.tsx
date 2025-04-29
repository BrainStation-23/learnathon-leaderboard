
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function MonthlyContributorSkeleton() {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">
          <Skeleton className="h-4 w-40" />
        </CardTitle>
      </CardHeader>
      <CardContent className="h-[300px]">
        <div className="flex flex-col space-y-4">
          <Skeleton className="h-[240px] w-full" />
        </div>
      </CardContent>
    </Card>
  );
}

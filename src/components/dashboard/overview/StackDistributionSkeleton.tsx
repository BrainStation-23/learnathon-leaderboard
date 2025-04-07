
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function StackDistributionSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-6 w-1/3 flex items-center gap-2">
          <Skeleton className="h-5 w-5 rounded-sm" />
          <div className="w-full" />
        </Skeleton>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="flex items-center justify-between pb-2">
            <Skeleton className="h-5 w-1/4" />
            <Skeleton className="h-5 w-1/4" />
            <Skeleton className="h-5 w-1/4" />
          </div>
          {Array(5).fill(0).map((_, i) => (
            <div key={`row-${i}`} className="flex items-center justify-between py-2">
              <Skeleton className="h-4 w-1/3" />
              <Skeleton className="h-4 w-12" />
              <Skeleton className="h-4 w-12" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

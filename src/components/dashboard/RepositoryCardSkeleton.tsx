
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function RepositoryCardSkeleton() {
  return (
    <Card className="overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-hackathon-900/40 to-hackathon-800/40 text-white">
        <Skeleton className="h-6 w-1/2 bg-white/20" />
        <Skeleton className="h-4 w-3/4 bg-white/10 mt-2" />
      </CardHeader>
      <CardContent className="pt-6">
        <div className="space-y-6">
          <div className="space-y-2">
            <Skeleton className="h-4 w-28" />
            <div className="grid grid-cols-3 gap-4">
              {[1, 2, 3].map((item) => (
                <div key={`metric-${item}`} className="flex flex-col items-center">
                  <Skeleton className="h-5 w-5 rounded-full" />
                  <Skeleton className="h-4 w-8 mt-1" />
                  <Skeleton className="h-3 w-16 mt-1" />
                </div>
              ))}
            </div>
          </div>
          <Skeleton className="h-px w-full" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-32" />
            <div className="grid grid-cols-2 gap-4">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
            </div>
            <div className="grid grid-cols-3 gap-2 mt-4">
              {[1, 2, 3].map((item) => (
                <Skeleton key={`sonar-${item}`} className="h-16 w-full" />
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

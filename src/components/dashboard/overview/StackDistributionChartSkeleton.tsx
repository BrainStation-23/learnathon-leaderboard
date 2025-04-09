
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function StackDistributionChartSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-6 w-1/3 flex items-center gap-2">
          <Skeleton className="h-5 w-5 rounded-sm" />
          <div className="w-full" />
        </Skeleton>
      </CardHeader>
      <CardContent className="h-[350px]">
        <div className="h-full w-full flex flex-col">
          <div className="flex-1 flex items-end space-x-2">
            {Array(8).fill(0).map((_, i) => (
              <div 
                key={`bar-${i}`} 
                className="h-full flex-1 flex flex-col justify-end"
              >
                <div className="w-full flex flex-col">
                  <Skeleton 
                    className="w-full mb-0.5" 
                    style={{ 
                      height: `${Math.max(5, Math.random() * 20)}%`,
                    }} 
                  />
                  <Skeleton 
                    className="w-full mb-0.5" 
                    style={{ 
                      height: `${Math.max(5, Math.random() * 15)}%`,
                    }} 
                  />
                  <Skeleton 
                    className="w-full" 
                    style={{ 
                      height: `${Math.max(15, Math.random() * 50)}%`,
                    }} 
                  />
                </div>
              </div>
            ))}
          </div>
          <div className="h-12 mt-6 flex items-center justify-between">
            <Skeleton className="h-5 w-3/4" />
          </div>
          <div className="h-12 mt-4 flex items-center justify-center gap-4">
            {Array(3).fill(0).map((_, i) => (
              <div key={`legend-${i}`} className="flex items-center gap-2">
                <Skeleton className="h-3 w-3" />
                <Skeleton className="h-4 w-16" />
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

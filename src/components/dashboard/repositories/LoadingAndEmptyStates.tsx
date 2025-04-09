
import { Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

interface EmptyStateProps {
  totalRepositoriesCount: number;
  configOrg?: string;
}

export function LoadingState() {
  return (
    <Card className="p-4">
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    </Card>
  );
}

export function EmptyState({ totalRepositoriesCount, configOrg }: EmptyStateProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {totalRepositoriesCount === 0 ? "No repositories found" : "No matching repositories"}
        </CardTitle>
        <CardDescription>
          {totalRepositoriesCount === 0 
            ? `No repositories were found for the GitHub organization ${configOrg}.`
            : "No repositories match your search criteria. Try adjusting your filters."
          }
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p>Try refreshing the data from GitHub or adjust your search filters.</p>
        <p className="text-sm text-muted-foreground mt-2">
          Note: To view security alerts, ensure your GitHub token has the 'repo' and 'security_events' scopes,
          and that Dependabot alerts are enabled in your repositories.
        </p>
      </CardContent>
    </Card>
  );
}

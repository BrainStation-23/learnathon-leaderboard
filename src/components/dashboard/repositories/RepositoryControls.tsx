
import { Button } from "@/components/ui/button";
import { Loader2, RefreshCw, Info } from "lucide-react";
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from "@/components/ui/tooltip";

interface RepositoryControlsProps {
  loading: boolean;
  refreshing: boolean;
  onLoadData: () => void;
  onFetchData: () => void;
}

export default function RepositoryControls({
  loading,
  refreshing,
  onLoadData,
  onFetchData
}: RepositoryControlsProps) {
  return (
    <div className="flex gap-2 items-center">
      <Button 
        onClick={onLoadData} 
        variant="outline"
        disabled={loading || refreshing}
      >
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          "Load Data"
        )}
      </Button>
      <Button 
        onClick={onFetchData} 
        disabled={loading || refreshing} 
        className="flex items-center gap-2"
      >
        {refreshing ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <>
            <RefreshCw className="h-4 w-4" />
            <span>Refresh from GitHub</span>
          </>
        )}
      </Button>
      
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger>
            <Info size={16} className="text-muted-foreground ml-1" />
          </TooltipTrigger>
          <TooltipContent className="max-w-xs">
            <p>To fetch security alerts, your GitHub token requires 'repo' and 'security_events' scopes, and Dependabot alerts must be enabled in your repositories.</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
}

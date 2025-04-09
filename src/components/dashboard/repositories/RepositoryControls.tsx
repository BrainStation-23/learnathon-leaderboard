
import { Button } from "@/components/ui/button";
import { Loader2, RefreshCw } from "lucide-react";

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
    <div className="flex gap-2">
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
    </div>
  );
}

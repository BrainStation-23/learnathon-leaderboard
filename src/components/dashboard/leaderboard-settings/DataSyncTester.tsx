
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { RefreshCw, Play, Loader2 } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { logger } from "@/services/logService";

export function DataSyncTester() {
  const [loading, setLoading] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const { toast } = useToast();

  const addLog = (message: string) => {
    const timestamp = new Date().toISOString();
    setLogs(prev => [...prev, `[${timestamp}] ${message}`]);
  };

  const clearLogs = () => {
    setLogs([]);
  };

  const runDataSync = async () => {
    setLoading(true);
    addLog("Starting data sync process...");
    
    try {
      const response = await supabase.functions.invoke('data-sync', {
        body: { source: 'manual' }
      });

      if (response.error) {
        throw new Error(response.error.message || 'Failed to run data sync');
      }

      addLog("Data sync completed successfully!");
      
      if (response.data) {
        if (typeof response.data === 'string') {
          addLog(response.data);
        } else {
          addLog(JSON.stringify(response.data, null, 2));
        }
      }
      
      toast({
        title: "Data Sync Complete",
        description: "The data sync process has completed successfully.",
      });
      
      logger.info("Data sync triggered manually", { response: response.data });
    } catch (error) {
      addLog(`Error: ${error instanceof Error ? error.message : String(error)}`);
      console.error("Data sync error:", error);
      
      toast({
        title: "Data Sync Failed",
        description: "There was a problem running the data sync process.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Data Sync Test Panel</CardTitle>
        <CardDescription>
          Test the data sync edge function that fetches data from GitHub and SonarCloud
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-64 w-full rounded-md border p-4 bg-muted/20">
          {logs.length === 0 ? (
            <div className="text-muted-foreground italic text-center py-8">
              No logs yet. Run the data sync to see results.
            </div>
          ) : (
            <pre className="text-xs whitespace-pre-wrap font-mono">
              {logs.join("\n")}
            </pre>
          )}
        </ScrollArea>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button 
          variant="outline" 
          onClick={clearLogs} 
          disabled={loading || logs.length === 0}
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Clear Logs
        </Button>
        <Button 
          onClick={runDataSync} 
          disabled={loading}
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Running...
            </>
          ) : (
            <>
              <Play className="h-4 w-4 mr-2" />
              Run Data Sync
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}

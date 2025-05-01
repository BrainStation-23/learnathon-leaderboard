
import React, { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Shield, AlertCircle, CheckCircle, Loader2 } from "lucide-react";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { supabase } from "@/integrations/supabase/client";
import { Progress } from "@/components/ui/progress";

export default function RepoPermissionsConfig() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [permissionLevel, setPermissionLevel] = useState<'read' | 'admin'>('read');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'in-progress' | 'complete' | 'error'>('idle');
  const [progress, setProgress] = useState<number>(0);
  const [batchProgress, setBatchProgress] = useState<{
    currentBatch: number;
    totalBatches: number;
    reposProcessed: number;
    totalRepos: number;
  }>({
    currentBatch: 0,
    totalBatches: 0,
    reposProcessed: 0,
    totalRepos: 0
  });
  const [results, setResults] = useState<Array<{
    name: string;
    success: boolean;
    errors?: string;
    collaboratorsUpdated?: number;
    collaboratorsSkipped?: number;
  }>>([]);
  const [rateLimitInfo, setRateLimitInfo] = useState<{
    remaining: number;
    initialRemaining: number;
  } | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handlePermissionChange = async () => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please sign in to update repository permissions",
        variant: "destructive",
      });
      return;
    }

    try {
      // Reset state
      setLoading(true);
      setStatus('in-progress');
      setProgress(0);
      setResults([]);
      setErrorMessage(null);
      setBatchProgress({
        currentBatch: 1,
        totalBatches: 0,
        reposProcessed: 0,
        totalRepos: 0
      });
      
      // Process the first batch
      await processNextBatch(0);
      
    } catch (error) {
      console.error("Error starting permission update:", error);
      setErrorMessage(error instanceof Error ? error.message : "An unknown error occurred");
      toast({
        title: "Error",
        description: "Failed to update repository permissions. See console for details.",
        variant: "destructive",
      });
      setStatus('error');
    } finally {
      setLoading(false);
    }
  };

  const processNextBatch = async (startIndex: number) => {
    try {
      const response = await supabase.functions.invoke("update-repository-permissions", {
        body: {
          permissionLevel,
          userId: user!.id,
          batchSize: 25, // Process 25 repos at a time
          startIndex,
        }
      });

      if (response.error) {
        throw new Error(response.error.message || "Error updating permissions");
      }

      const data = response.data;
      const newResults = [...results, ...(data.results || [])];
      setResults(newResults);
      
      // Update rate limit info
      setRateLimitInfo({
        remaining: data.rateLimitInfo.currentRemaining,
        initialRemaining: data.rateLimitInfo.initialRemaining
      });

      // Update progress information
      const totalRepos = data.totalRepos;
      const reposProcessed = startIndex + data.results.length;
      const totalBatches = Math.ceil(totalRepos / 25);
      const currentBatch = Math.ceil(reposProcessed / 25);
      
      setBatchProgress({
        currentBatch,
        totalBatches,
        reposProcessed,
        totalRepos
      });
      
      setProgress(Math.round((reposProcessed / totalRepos) * 100));

      // If there are more batches to process
      if (data.batchInfo.hasMoreBatches) {
        // Process next batch
        await processNextBatch(data.batchInfo.nextBatchStartIndex);
      } else {
        // All batches completed
        setStatus('complete');
        toast({
          title: "Success",
          description: `Updated permissions for ${reposProcessed} repositories`,
          variant: "default",
        });
      }
    } catch (error) {
      console.error("Error processing batch:", error);
      setErrorMessage(error instanceof Error ? error.message : "An unknown error occurred");
      setStatus('error');
      toast({
        title: "Error",
        description: "Failed to update all repository permissions",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Repository Permissions
          </CardTitle>
          <CardDescription>
            Update permissions for all repositories in your organization at once.
            This operation will update all direct collaborators on each repository.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!user ? (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Authentication Required</AlertTitle>
              <AlertDescription>
                Please sign in to update repository permissions.
              </AlertDescription>
            </Alert>
          ) : (
            <>
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-medium">Permission Level</h3>
                  <p className="text-sm text-muted-foreground">
                    Select the permission level to apply to all repositories
                  </p>
                </div>

                <RadioGroup
                  defaultValue={permissionLevel}
                  value={permissionLevel}
                  onValueChange={(value) => setPermissionLevel(value as 'read' | 'admin')}
                  className="grid grid-cols-2 gap-4"
                >
                  <div>
                    <RadioGroupItem
                      value="read"
                      id="read"
                      className="peer sr-only"
                      disabled={loading}
                    />
                    <Label
                      htmlFor="read"
                      className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                    >
                      <span>Read-only</span>
                      <span className="text-sm text-muted-foreground">
                        Contributors can only view and clone repositories
                      </span>
                    </Label>
                  </div>

                  <div>
                    <RadioGroupItem
                      value="admin"
                      id="admin"
                      className="peer sr-only"
                      disabled={loading}
                    />
                    <Label
                      htmlFor="admin"
                      className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                    >
                      <span>Admin</span>
                      <span className="text-sm text-muted-foreground">
                        Contributors have full rights to modify repositories
                      </span>
                    </Label>
                  </div>
                </RadioGroup>

                <Alert variant="warning">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Important Information</AlertTitle>
                  <AlertDescription>
                    This action will update permissions for all direct collaborators on all repositories in your GitHub organization.
                    For large organizations, this may take several minutes and consume a significant amount of GitHub API rate limit.
                  </AlertDescription>
                </Alert>

                <Button
                  onClick={handlePermissionChange}
                  disabled={loading}
                  className="w-full"
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Updating Permissions...
                    </>
                  ) : (
                    `Set All Repositories to ${
                      permissionLevel === "read" ? "Read-Only" : "Admin"
                    } Access`
                  )}
                </Button>
              </div>

              {/* Progress Section */}
              {status === 'in-progress' && (
                <div className="mt-6 space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm font-medium">Overall Progress</span>
                      <span className="text-sm text-muted-foreground">
                        {batchProgress.reposProcessed} of {batchProgress.totalRepos} repositories
                      </span>
                    </div>
                    <Progress value={progress} className="h-2" />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Batch {batchProgress.currentBatch} of {batchProgress.totalBatches}</span>
                      <span>{progress}% complete</span>
                    </div>
                  </div>

                  {rateLimitInfo && (
                    <div className="text-xs text-muted-foreground">
                      GitHub Rate Limit: {rateLimitInfo.remaining} / {rateLimitInfo.initialRemaining} remaining
                    </div>
                  )}
                </div>
              )}

              {/* Results Section */}
              {status === 'complete' && results.length > 0 && (
                <div className="mt-6 space-y-4">
                  <Alert>
                    <CheckCircle className="h-4 w-4" />
                    <AlertTitle>Operation Complete</AlertTitle>
                    <AlertDescription>
                      Processed {batchProgress.reposProcessed} repositories
                    </AlertDescription>
                  </Alert>
                  
                  <div className="max-h-80 overflow-y-auto border rounded-md p-4">
                    <h4 className="text-sm font-medium mb-2">Repository Results</h4>
                    <div className="space-y-2">
                      {results.map((result, idx) => (
                        <div key={idx} className={`text-xs p-2 rounded-md ${result.success ? 'bg-green-50' : 'bg-red-50'}`}>
                          <div className="font-medium">{result.name}</div>
                          {result.collaboratorsUpdated !== undefined && (
                            <div>Updated: {result.collaboratorsUpdated}</div>
                          )}
                          {result.collaboratorsSkipped !== undefined && (
                            <div>Skipped: {result.collaboratorsSkipped}</div>
                          )}
                          {result.errors && (
                            <div className="text-red-600 mt-1">{result.errors}</div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Error Section */}
              {status === 'error' && errorMessage && (
                <Alert variant="destructive" className="mt-4">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Error Updating Permissions</AlertTitle>
                  <AlertDescription>{errorMessage}</AlertDescription>
                </Alert>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

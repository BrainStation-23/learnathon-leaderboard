
import { useState, useEffect } from "react";
import { useConfig } from "@/context/ConfigContext";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { AlertCircle, Check, Shield, ShieldOff, Loader2, Info, ArrowRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { logger } from "@/services/logService";
import { Progress } from "@/components/ui/progress";

type PermissionLevel = "read" | "admin";
type PermissionResult = {
  message: string;
  totalRepos: number;
  reposWithDirectCollaborators: number;
  reposWithoutDirectCollaborators: number;
  successCount: number;
  failureCount: number;
  results: Array<{
    name: string;
    success: boolean;
    errors?: string;
    collaboratorsUpdated?: number;
    collaboratorsSkipped?: number;
  }>;
  batchInfo?: {
    startIndex: number;
    endIndex: number;
    batchSize: number;
    totalRepositories: number;
    hasMoreBatches: boolean;
    nextBatchStartIndex: number | null;
  };
  rateLimitInfo?: {
    initialRemaining: number;
    currentRemaining: number;
  };
};

// Constants for batch processing
const DEFAULT_BATCH_SIZE = 25;

export default function RepoPermissionsConfig() {
  const { config, isConfigured } = useConfig();
  const { user } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [permissionResult, setPermissionResult] = useState<PermissionResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [currentBatch, setCurrentBatch] = useState<number>(0);
  const [batchProgress, setBatchProgress] = useState<number>(0);
  const [isProcessingBatches, setIsProcessingBatches] = useState<boolean>(false);
  const [processingPermissionLevel, setProcessingPermissionLevel] = useState<PermissionLevel | null>(null);

  // Debug logging for auth state
  useEffect(() => {
    if (user) {
      logger.info("User authenticated", { 
        userId: user.id
      });
    } else {
      logger.warn("No authenticated user available");
    }
  }, [user]);

  const updatePermissions = async (permissionLevel: PermissionLevel, startIndex = 0, continueBatch = false) => {
    if (!user) {
      toast({
        title: "Not authenticated",
        description: "You must be logged in to perform this action.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    
    // Only reset state if we're starting a new operation
    if (!continueBatch) {
      setError(null);
      setPermissionResult(null);
      setCurrentBatch(0);
      setBatchProgress(0);
      setProcessingPermissionLevel(permissionLevel);
    }
    
    try {
      logger.info("Calling update-repository-permissions function", { 
        permissionLevel, 
        userId: user.id,
        startIndex,
        batchSize: DEFAULT_BATCH_SIZE 
      });
      
      const { data, error: functionError } = await supabase.functions.invoke("update-repository-permissions", {
        body: { 
          permissionLevel,
          userId: user.id,
          startIndex,
          batchSize: DEFAULT_BATCH_SIZE
        }
      });
      
      if (functionError) {
        logger.error("Function error:", functionError);
        throw new Error(functionError.message || "Failed to update permissions");
      }
      
      logger.info("Function response:", data);
      setPermissionResult(data);

      // Update batch progress
      if (data.batchInfo) {
        const { startIndex, endIndex, totalRepositories } = data.batchInfo;
        const batchNum = Math.floor(startIndex / DEFAULT_BATCH_SIZE) + 1;
        const totalBatches = Math.ceil(totalRepositories / DEFAULT_BATCH_SIZE);
        setCurrentBatch(batchNum);
        setBatchProgress(((endIndex + 1) / totalRepositories) * 100);
      
        // If we have more batches and are in continuous mode, process the next batch
        if (data.batchInfo.hasMoreBatches && isProcessingBatches) {
          // Show an interim toast with progress
          toast({
            title: "Batch Processing",
            description: `Completed batch ${batchNum} of ${totalBatches}. Processing next batch...`,
            variant: "default",
          });
          
          // Small delay to let the UI update
          setTimeout(() => {
            updatePermissions(permissionLevel, data.batchInfo.nextBatchStartIndex, true);
          }, 1000);
        } else if (isProcessingBatches) {
          // We've completed all batches
          setIsProcessingBatches(false);
          toast({
            title: "All Batches Completed",
            description: `Successfully processed all ${totalBatches} batches of repositories.`,
            variant: "default",
          });
        } else {
          // Single batch completed
          toast({
            title: "Permissions Updated",
            description: `Successfully updated ${data.successCount} repositories with direct collaborators to ${permissionLevel} permissions.`,
            variant: "default",
          });
        }
      } else {
        // Legacy response without batch info
        toast({
          title: "Permissions Updated",
          description: `Successfully updated ${data.successCount} repositories with direct collaborators to ${permissionLevel} permissions.`,
          variant: "default",
        });
      }
    } catch (err: any) {
      logger.error("Error updating permissions:", err);
      setError(err.message || "Failed to update permissions");
      
      toast({
        title: "Error",
        description: "Failed to update repository permissions. Please try again.",
        variant: "destructive",
      });
      
      // Stop batch processing if there's an error
      setIsProcessingBatches(false);
    } finally {
      setIsLoading(!isProcessingBatches);
    }
  };

  // Start batch processing all repositories
  const processBatchPermissions = (permissionLevel: PermissionLevel) => {
    setIsProcessingBatches(true);
    updatePermissions(permissionLevel, 0, false);
  };

  // Cancel ongoing batch processing
  const cancelBatchProcessing = () => {
    setIsProcessingBatches(false);
    setIsLoading(false);
    toast({
      title: "Processing Cancelled",
      description: "Batch processing has been cancelled.",
      variant: "default",
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Repository Permission Management</h2>
        <p className="text-muted-foreground">
          Manage collaborator permissions across all public repositories in your GitHub organization.
        </p>
      </div>

      <Alert variant="warning" className="bg-amber-50 border-amber-200">
        <Info className="h-4 w-4 text-amber-600" />
        <AlertTitle className="text-amber-800">How It Works</AlertTitle>
        <AlertDescription className="text-amber-700">
          This will update permissions only for <strong>direct collaborators</strong> on your repositories.
          Team members and organization-wide collaborators won't be affected.
          {permissionResult?.totalRepos && permissionResult.totalRepos > 50 && (
            <div className="mt-2">
              <strong>Note:</strong> You have {permissionResult.totalRepos} repositories. Consider using batch processing
              for large organizations to avoid rate limits.
            </div>
          )}
        </AlertDescription>
      </Alert>

      {!isConfigured && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Configuration Required</AlertTitle>
          <AlertDescription>
            You need to configure your GitHub organization and personal access token first.
          </AlertDescription>
        </Alert>
      )}

      {isProcessingBatches && (
        <Card className="mb-4 border border-blue-200 bg-blue-50">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-xl text-blue-800">
              <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
              Processing in Batches
            </CardTitle>
            <CardDescription className="text-blue-700">
              Processing batch {currentBatch} for {processingPermissionLevel} permissions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Progress</span>
                <span>{Math.round(batchProgress)}%</span>
              </div>
              <Progress value={batchProgress} className="h-2" />
            </div>
          </CardContent>
          <CardFooter>
            <Button variant="destructive" size="sm" onClick={cancelBatchProcessing}>
              Cancel Processing
            </Button>
          </CardFooter>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShieldOff className="h-5 w-5 text-amber-500" />
              Read-Only Access
            </CardTitle>
            <CardDescription>
              Set all direct collaborators to read-only access across repositories.
              This will restrict them from making direct changes.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Collaborators will still be able to view code and open pull requests, 
              but cannot directly push to repositories.
            </p>
          </CardContent>
          <CardFooter className="flex flex-col sm:flex-row gap-2">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button 
                  variant="outline" 
                  disabled={!isConfigured || isLoading || !user || isProcessingBatches}
                  className="w-full sm:w-auto"
                >
                  {isLoading && processingPermissionLevel === "read" && !isProcessingBatches ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <ShieldOff className="h-4 w-4 mr-2" />
                  )}
                  Set All To Read-Only
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Change All To Read-Only?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will set all direct collaborators on all repositories to read-only access. 
                    They will no longer be able to push directly to the repositories but can still open pull requests.
                    This action cannot be undone automatically.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => updatePermissions("read")}
                  >
                    Continue
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button 
                  variant="secondary"
                  disabled={!isConfigured || isLoading || !user || isProcessingBatches}
                  className="w-full sm:w-auto"
                >
                  <ShieldOff className="h-4 w-4 mr-2" />
                  Process in Batches
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Process In Batches</AlertDialogTitle>
                  <AlertDialogDescription>
                    For large organizations with many repositories, processing in batches helps avoid GitHub API rate limits.
                    This will process repositories in groups of {DEFAULT_BATCH_SIZE} until all are complete.
                    This may take several minutes to complete.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => processBatchPermissions("read")}
                  >
                    Start Batch Processing
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-blue-500" />
              Admin Access
            </CardTitle>
            <CardDescription>
              Grant all direct collaborators admin access across repositories.
              This will give them full control.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Collaborators will be able to push code directly, manage settings, and
              configure repository options.
            </p>
          </CardContent>
          <CardFooter className="flex flex-col sm:flex-row gap-2">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button 
                  variant="outline" 
                  disabled={!isConfigured || isLoading || !user || isProcessingBatches}
                  className="w-full sm:w-auto"
                >
                  {isLoading && processingPermissionLevel === "admin" && !isProcessingBatches ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Shield className="h-4 w-4 mr-2" />
                  )}
                  Set All To Admin
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Change All To Admin?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will set all direct collaborators on all repositories to admin access.
                    They will have full control over the repositories, including settings.
                    Proceed with caution.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => updatePermissions("admin")}
                  >
                    Continue
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button 
                  variant="secondary"
                  disabled={!isConfigured || isLoading || !user || isProcessingBatches}
                  className="w-full sm:w-auto"
                >
                  <Shield className="h-4 w-4 mr-2" />
                  Process in Batches
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Process In Batches</AlertDialogTitle>
                  <AlertDialogDescription>
                    For large organizations with many repositories, processing in batches helps avoid GitHub API rate limits.
                    This will process repositories in groups of {DEFAULT_BATCH_SIZE} until all are complete.
                    This may take several minutes to complete.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => processBatchPermissions("admin")}
                  >
                    Start Batch Processing
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </CardFooter>
        </Card>
      </div>

      {error && (
        <Alert variant="destructive" className="mt-4">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {permissionResult && (
        <Card className="mt-4">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Check className="h-5 w-5 text-green-500" />
              Operation Results
            </CardTitle>
            <CardDescription>
              Summary of permission changes
              {permissionResult.batchInfo && (
                <span className="ml-2 text-sm text-muted-foreground">
                  (Batch {Math.floor(permissionResult.batchInfo.startIndex / DEFAULT_BATCH_SIZE) + 1} 
                  of {Math.ceil(permissionResult.batchInfo.totalRepositories / DEFAULT_BATCH_SIZE)})
                </span>
              )}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 bg-muted rounded-lg text-center">
                  <p className="text-2xl font-bold">{permissionResult.totalRepos}</p>
                  <p className="text-xs text-muted-foreground">Total repositories</p>
                </div>
                <div className="p-4 bg-blue-50 text-blue-700 rounded-lg text-center">
                  <p className="text-2xl font-bold">{permissionResult.reposWithDirectCollaborators}</p>
                  <p className="text-xs">With collaborators</p>
                </div>
                <div className="p-4 bg-green-50 text-green-700 rounded-lg text-center">
                  <p className="text-2xl font-bold">{permissionResult.successCount}</p>
                  <p className="text-xs">Success</p>
                </div>
                <div className="p-4 bg-red-50 text-red-700 rounded-lg text-center">
                  <p className="text-2xl font-bold">{permissionResult.failureCount}</p>
                  <p className="text-xs">Failed</p>
                </div>
              </div>

              {permissionResult.rateLimitInfo && (
                <Alert className="bg-gray-50 border-gray-200">
                  <Info className="h-4 w-4 text-gray-600" />
                  <AlertTitle className="text-gray-800">GitHub API Rate Limit</AlertTitle>
                  <AlertDescription className="text-gray-700">
                    Started with {permissionResult.rateLimitInfo.initialRemaining} API calls remaining. 
                    Now have {permissionResult.rateLimitInfo.currentRemaining} API calls remaining.
                  </AlertDescription>
                </Alert>
              )}

              {permissionResult.reposWithoutDirectCollaborators > 0 && (
                <Alert className="bg-gray-50 border-gray-200">
                  <Info className="h-4 w-4 text-gray-600" />
                  <AlertTitle className="text-gray-800">Repositories Without Direct Collaborators</AlertTitle>
                  <AlertDescription className="text-gray-700">
                    {permissionResult.reposWithoutDirectCollaborators} repositories don't have any direct 
                    collaborators and were skipped.
                  </AlertDescription>
                </Alert>
              )}

              {permissionResult.batchInfo && permissionResult.batchInfo.hasMoreBatches && !isProcessingBatches && (
                <div className="border rounded-lg p-4 bg-blue-50 border-blue-200">
                  <h4 className="text-sm font-medium text-blue-800 mb-2">More Repositories to Process</h4>
                  <p className="text-sm text-blue-700 mb-3">
                    Processed repositories {permissionResult.batchInfo.startIndex + 1} to {permissionResult.batchInfo.endIndex + 1} of {permissionResult.batchInfo.totalRepositories}.
                    There are more repositories to process.
                  </p>
                  <Button
                    onClick={() => updatePermissions(processingPermissionLevel!, permissionResult.batchInfo!.nextBatchStartIndex!, true)}
                    variant="outline"
                    className="bg-white"
                  >
                    Process Next Batch
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              )}

              {permissionResult.failureCount > 0 && (
                <div className="mt-4">
                  <h4 className="text-sm font-medium mb-2">Failed Repositories:</h4>
                  <div className="border rounded-lg p-3 max-h-40 overflow-y-auto bg-red-50">
                    <ul className="text-sm space-y-1">
                      {permissionResult.results
                        .filter(r => !r.success)
                        .map(repo => (
                          <li key={repo.name} className="text-red-600">
                            {repo.name}: {repo.errors}
                          </li>
                        ))}
                    </ul>
                  </div>
                </div>
              )}

              <div className="mt-4">
                <h4 className="text-sm font-medium mb-2">Collaborator Details:</h4>
                <div className="border rounded-lg p-3 max-h-60 overflow-y-auto bg-gray-50">
                  <ul className="text-sm space-y-1">
                    {permissionResult.results
                      .filter(r => r.collaboratorsUpdated && r.collaboratorsUpdated > 0)
                      .map(repo => (
                        <li key={repo.name} className="text-green-600">
                          {repo.name}: {repo.collaboratorsUpdated} updated, {repo.collaboratorsSkipped} skipped
                        </li>
                      ))}
                  </ul>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

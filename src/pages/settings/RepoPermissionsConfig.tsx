import { useState, useEffect } from "react";
import { useConfig } from "@/context/ConfigContext";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { AlertCircle, Check, Shield, ShieldOff, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { logger } from "@/services/logService";

type PermissionLevel = "read" | "admin";
type PermissionResult = {
  message: string;
  totalRepos: number;
  successCount: number;
  failureCount: number;
  results: Array<{
    name: string;
    success: boolean;
    errors?: string;
    collaboratorsUpdated?: number;
  }>;
};

export default function RepoPermissionsConfig() {
  const { config, isConfigured } = useConfig();
  const { user } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [permissionResult, setPermissionResult] = useState<PermissionResult | null>(null);
  const [error, setError] = useState<string | null>(null);

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

  const updatePermissions = async (permissionLevel: PermissionLevel) => {
    if (!user) {
      toast({
        title: "Not authenticated",
        description: "You must be logged in to perform this action.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    setError(null);
    setPermissionResult(null);
    
    try {
      logger.info("Calling update-repository-permissions function", { 
        permissionLevel, 
        userId: user.id 
      });
      
      const { data, error: functionError } = await supabase.functions.invoke("update-repository-permissions", {
        body: { 
          permissionLevel,
          userId: user.id
        }
      });
      
      if (functionError) {
        logger.error("Function error:", functionError);
        throw new Error(functionError.message || "Failed to update permissions");
      }
      
      logger.info("Function response:", data);
      setPermissionResult(data);
      
      toast({
        title: "Permissions Updated",
        description: `Successfully updated ${data.successCount} repositories to ${permissionLevel} permissions.`,
        variant: "default",
      });
    } catch (err: any) {
      logger.error("Error updating permissions:", err);
      setError(err.message || "Failed to update permissions");
      
      toast({
        title: "Error",
        description: "Failed to update repository permissions. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Repository Permission Management</h2>
        <p className="text-muted-foreground">
          Manage collaborator permissions across all public repositories in your GitHub organization.
        </p>
      </div>

      {!isConfigured && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Configuration Required</AlertTitle>
          <AlertDescription>
            You need to configure your GitHub organization and personal access token first.
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShieldOff className="h-5 w-5 text-amber-500" />
              Read-Only Access
            </CardTitle>
            <CardDescription>
              Set all collaborators to read-only access across repositories.
              This will restrict them from making direct changes.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Collaborators will still be able to view code and open pull requests, 
              but cannot directly push to repositories.
            </p>
          </CardContent>
          <CardFooter>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button 
                  variant="outline" 
                  disabled={!isConfigured || isLoading || !user}
                  className="w-full"
                >
                  {isLoading ? (
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
                    This will set all collaborators on all repositories to read-only access. 
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
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-blue-500" />
              Admin Access
            </CardTitle>
            <CardDescription>
              Grant all collaborators admin access across repositories.
              This will give them full control.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Collaborators will be able to push code directly, manage settings, and
              configure repository options.
            </p>
          </CardContent>
          <CardFooter>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button 
                  variant="outline" 
                  disabled={!isConfigured || isLoading || !user}
                  className="w-full"
                >
                  {isLoading ? (
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
                    This will set all collaborators on all repositories to admin access.
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
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="grid grid-cols-3 gap-4">
                <div className="p-4 bg-muted rounded-lg text-center">
                  <p className="text-2xl font-bold">{permissionResult.totalRepos}</p>
                  <p className="text-xs text-muted-foreground">Total repositories</p>
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

              {permissionResult.failureCount > 0 && (
                <div className="mt-4">
                  <h4 className="text-sm font-medium mb-2">Failed Repositories:</h4>
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
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}


import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

interface Contributor {
  login: string;
  contributions: number;
  isFiltered: boolean;
}

export default function LeaderboardSettings() {
  const [contributors, setContributors] = useState<Contributor[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const { user } = useAuth();
  const { toast } = useToast();

  // Fetch all unique contributors across repositories
  useEffect(() => {
    const fetchContributors = async () => {
      if (!user) return;
      
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('contributors')
          .select('login, contributions')
          .order('contributions', { ascending: false });
        
        if (error) {
          throw error;
        }

        // Get unique contributors by login name
        const uniqueContributors = Array.from(
          new Map(data.map(item => [item.login, item])).values()
        );
        
        // Get filtered contributors from user settings
        const { data: configData, error: configError } = await supabase
          .from('configurations')
          .select('filtered_contributors')
          .eq('user_id', user.id)
          .single();
        
        if (configError && configError.code !== 'PGRST116') { // PGRST116 = no rows found
          console.error("Error fetching filtered contributors:", configError);
        }
        
        // Check if configData exists and has filtered_contributors
        const filteredContributors = configData?.filtered_contributors || [];
        
        // Merge data
        const mergedContributors = uniqueContributors.map(contributor => ({
          login: contributor.login,
          contributions: contributor.contributions,
          isFiltered: filteredContributors.includes(contributor.login)
        }));
        
        setContributors(mergedContributors);
      } catch (error) {
        console.error("Error loading contributors:", error);
        toast({
          title: "Error loading contributors",
          description: "Failed to load contributor data. Please try again.",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchContributors();
  }, [user, toast]);

  const handleSaveSettings = async () => {
    if (!user) return;
    
    setSaving(true);
    try {
      // Get filtered contributor logins
      const filteredLogins = contributors
        .filter(contributor => contributor.isFiltered)
        .map(contributor => contributor.login);
      
      // Check if configuration exists
      const { data: existingConfig } = await supabase
        .from('configurations')
        .select('id')
        .eq('user_id', user.id)
        .single();
      
      let result;
      if (existingConfig) {
        // Update existing config
        result = await supabase
          .from('configurations')
          .update({ 
            filtered_contributors: filteredLogins 
          })
          .eq('user_id', user.id);
      } else {
        // Create new config (this should not happen typically as it's created when setting GitHub/SonarCloud)
        result = await supabase
          .from('configurations')
          .insert({ 
            user_id: user.id, 
            filtered_contributors: filteredLogins,
            github_org: "",
            github_pat: "",
            sonarcloud_org: ""
          });
      }
      
      if (result.error) {
        throw result.error;
      }
      
      toast({
        title: "Settings saved",
        description: "Leaderboard filter settings have been updated.",
      });
    } catch (error) {
      console.error("Error saving settings:", error);
      toast({
        title: "Error saving settings",
        description: "Failed to save filter settings. Please try again.",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const toggleContributor = (login: string) => {
    setContributors(prev => 
      prev.map(contributor => 
        contributor.login === login 
          ? { ...contributor, isFiltered: !contributor.isFiltered } 
          : contributor
      )
    );
  };

  return (
    <Card className="mt-8 w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Leaderboard Settings</CardTitle>
        <CardDescription>
          Configure which contributors should be filtered out from the leaderboard
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center items-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : contributors.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground">
            No contributors found. Please sync repository data first.
          </div>
        ) : (
          <>
            <div className="space-y-1 mb-4">
              <p className="text-sm font-medium">Filter Contributors</p>
              <p className="text-sm text-muted-foreground">
                Select contributors to exclude from the leaderboard (e.g., bots or maintenance accounts)
              </p>
            </div>
            <div className="max-h-96 overflow-y-auto border rounded-md p-4">
              <div className="space-y-4">
                {contributors.map((contributor) => (
                  <div key={contributor.login} className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id={`filter-${contributor.login}`}
                        checked={contributor.isFiltered}
                        onCheckedChange={() => toggleContributor(contributor.login)}
                      />
                      <label
                        htmlFor={`filter-${contributor.login}`}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        {contributor.login}
                      </label>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {contributor.contributions} commits
                    </span>
                  </div>
                ))}
              </div>
            </div>
            <Separator className="my-6" />
            <div className="flex justify-end">
              <Button onClick={handleSaveSettings} disabled={saving}>
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : "Save Settings"}
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

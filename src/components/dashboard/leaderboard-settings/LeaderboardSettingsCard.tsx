
import React, { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useContributorsData } from "./useContributorsData";
import { ContributorsList } from "./ContributorsList";
import { SaveSettingsButton } from "./SaveSettingsButton";
import { Loader2 } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function LeaderboardSettingsCard() {
  const [saving, setSaving] = useState<boolean>(false);
  const { contributors, loading, toggleContributor } = useContributorsData();
  const { user } = useAuth();
  const { toast } = useToast();

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
        ) : (
          <>
            <div className="space-y-1 mb-4">
              <p className="text-sm font-medium">Filter Contributors</p>
              <p className="text-sm text-muted-foreground">
                Select contributors to exclude from the leaderboard (e.g., bots or maintenance accounts)
              </p>
            </div>
            <ContributorsList 
              contributors={contributors} 
              onToggleContributor={toggleContributor} 
            />
            <Separator className="my-6" />
            <div className="flex justify-end">
              <SaveSettingsButton 
                saving={saving} 
                onSave={handleSaveSettings} 
              />
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

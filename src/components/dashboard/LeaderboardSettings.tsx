
import React from "react";
import LeaderboardSettingsCard from "./leaderboard-settings/LeaderboardSettingsCard";
import { Separator } from "@/components/ui/separator";
import { DataSyncTester } from "./leaderboard-settings/DataSyncTester";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Info } from "lucide-react";

export default function LeaderboardSettings() {
  return (
    <div className="space-y-8">
      <LeaderboardSettingsCard />
      <Separator />
      <Alert className="mb-6 bg-amber-50 border-amber-200">
        <Info className="h-4 w-4 text-amber-600" />
        <AlertTitle className="text-amber-800">Important Setup Required</AlertTitle>
        <AlertDescription className="text-amber-700">
          For the data sync to work properly, you need to add the <strong>SUPABASE_SERVICE_ROLE_KEY</strong> secret 
          to your Edge Functions in the Supabase Dashboard.
        </AlertDescription>
      </Alert>
      <DataSyncTester />
    </div>
  );
}

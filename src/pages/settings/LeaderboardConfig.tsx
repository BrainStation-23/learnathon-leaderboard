
import React from "react";
import SettingsLayout from "@/components/layout/SettingsLayout";
import LeaderboardSettings from "@/components/dashboard/LeaderboardSettings";

export default function LeaderboardConfig() {
  return (
    <SettingsLayout>
      <div className="space-y-6">
        <div>
          <h3 className="text-xl font-medium">Leaderboard Configuration</h3>
          <p className="text-muted-foreground mt-2">
            Customize the leaderboard display, contributor filters, and manage data synchronization.
          </p>
        </div>
        <LeaderboardSettings />
      </div>
    </SettingsLayout>
  );
}


import React from "react";
import SettingsLayout from "@/components/layout/SettingsLayout";
import LeaderboardSettingsCard from "@/components/dashboard/leaderboard-settings/LeaderboardSettingsCard";

export default function LeaderboardConfig() {
  return (
    <SettingsLayout>
      <div className="space-y-6">
        <h3 className="text-xl font-medium mb-2">Leaderboard Configuration</h3>
        <p className="text-muted-foreground mb-4">
          Customize the leaderboard display and contributor filters.
        </p>
        <LeaderboardSettingsCard />
      </div>
    </SettingsLayout>
  );
}

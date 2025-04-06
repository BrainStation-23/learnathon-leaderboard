
import React from "react";
import SettingsLayout from "@/components/layout/SettingsLayout";
import RepoFilterSettings from "@/components/dashboard/repo-filter/RepoFilterSettings";

export default function RepoFilterConfig() {
  return (
    <SettingsLayout>
      <div className="space-y-6">
        <h3 className="text-xl font-medium mb-2">Repository Filter Configuration</h3>
        <p className="text-muted-foreground mb-4">
          Exclude specific repositories from the leaderboard and dashboard data.
        </p>
        <RepoFilterSettings />
      </div>
    </SettingsLayout>
  );
}

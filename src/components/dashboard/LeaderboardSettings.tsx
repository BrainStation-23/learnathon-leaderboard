
import React from "react";
import LeaderboardSettingsCard from "./leaderboard-settings/LeaderboardSettingsCard";
import { TechStackSettings } from "./leaderboard-settings/TechStackSettings";
import { Separator } from "@/components/ui/separator";

export default function LeaderboardSettings() {
  return (
    <div className="space-y-8">
      <LeaderboardSettingsCard />
      <Separator />
      <TechStackSettings />
    </div>
  );
}


import React from "react";
import SettingsLayout from "@/components/layout/SettingsLayout";
import ConfigForm from "@/components/dashboard/ConfigForm";

export default function DashboardConfig() {
  return (
    <SettingsLayout>
      <div className="space-y-6">
        <h3 className="text-xl font-medium mb-2">Dashboard Configuration</h3>
        <p className="text-muted-foreground mb-4">
          Configure your GitHub organization and SonarCloud settings.
        </p>
        <ConfigForm />
      </div>
    </SettingsLayout>
  );
}

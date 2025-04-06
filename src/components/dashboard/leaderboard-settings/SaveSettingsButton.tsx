
import React from "react";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

interface SaveSettingsButtonProps {
  saving: boolean;
  onSave: () => void;
}

export function SaveSettingsButton({ saving, onSave }: SaveSettingsButtonProps) {
  return (
    <Button onClick={onSave} disabled={saving}>
      {saving ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Saving...
        </>
      ) : "Save Settings"}
    </Button>
  );
}

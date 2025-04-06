
import DashboardLayout from "@/components/layout/DashboardLayout";
import ConfigForm from "@/components/dashboard/ConfigForm";
import LeaderboardSettings from "@/components/dashboard/LeaderboardSettings";
import { Separator } from "@/components/ui/separator";

const Settings = () => {
  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto">
        <h2 className="text-3xl font-bold mb-6">Settings</h2>
        <ConfigForm />
        <Separator className="my-8" />
        <LeaderboardSettings />
      </div>
    </DashboardLayout>
  );
};

export default Settings;

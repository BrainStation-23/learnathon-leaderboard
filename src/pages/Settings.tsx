
import DashboardLayout from "@/components/layout/DashboardLayout";
import ConfigForm from "@/components/dashboard/ConfigForm";

const Settings = () => {
  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto">
        <h2 className="text-3xl font-bold mb-6">Settings</h2>
        <ConfigForm />
      </div>
    </DashboardLayout>
  );
};

export default Settings;

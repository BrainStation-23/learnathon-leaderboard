
import { useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import ConfigForm from "@/components/dashboard/ConfigForm";
import LeaderboardSettings from "@/components/dashboard/LeaderboardSettings";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { NavigationMenu, NavigationMenuContent, NavigationMenuItem, NavigationMenuLink, NavigationMenuList, NavigationMenuTrigger, navigationMenuTriggerStyle } from "@/components/ui/navigation-menu";
import { Settings as SettingsIcon, BarChart2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Link, useLocation } from "react-router-dom";

const Settings = () => {
  const [activeTab, setActiveTab] = useState("dashboard");

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto">
        <h2 className="text-3xl font-bold mb-6">Settings</h2>
        
        <div className="mb-6">
          <Tabs defaultValue="dashboard" value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="dashboard" className="flex items-center gap-2">
                <SettingsIcon className="h-4 w-4" />
                Dashboard Configuration
              </TabsTrigger>
              <TabsTrigger value="leaderboard" className="flex items-center gap-2">
                <BarChart2 className="h-4 w-4" />
                Leaderboard Configuration
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="dashboard" className="pt-6">
              <h3 className="text-xl font-medium mb-4">Dashboard Configuration</h3>
              <ConfigForm />
            </TabsContent>
            
            <TabsContent value="leaderboard" className="pt-6">
              <h3 className="text-xl font-medium mb-4">Leaderboard Configuration</h3>
              <LeaderboardSettings />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Settings;

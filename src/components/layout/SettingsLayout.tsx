
import React from "react";
import { NavLink, Outlet } from "react-router-dom";
import DashboardLayout from "./DashboardLayout";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { Settings as SettingsIcon, BarChart2, Code, Ban } from "lucide-react";

interface SettingsNavItemProps {
  to: string;
  icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
}

const SettingsNavItem = ({ to, icon: Icon, children }: SettingsNavItemProps) => {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        cn(
          "flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors",
          isActive
            ? "bg-accent text-accent-foreground font-medium"
            : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
        )
      }
    >
      <Icon className="h-4 w-4" />
      <span>{children}</span>
    </NavLink>
  );
};

export default function SettingsLayout({ children }: { children?: React.ReactNode }) {
  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto">
        <h2 className="text-3xl font-bold mb-6">Settings</h2>
        
        <div className="grid grid-cols-12 gap-6">
          {/* Settings Sidebar */}
          <aside className="col-span-12 md:col-span-3 space-y-6">
            <nav className="flex flex-col space-y-1">
              <SettingsNavItem to="/settings/dashboard" icon={SettingsIcon}>
                Dashboard Configuration
              </SettingsNavItem>
              <SettingsNavItem to="/settings/leaderboard" icon={BarChart2}>
                Leaderboard Configuration
              </SettingsNavItem>
              <SettingsNavItem to="/settings/tech-stacks" icon={Code}>
                Tech Stack Management
              </SettingsNavItem>
              <SettingsNavItem to="/settings/repo-filter" icon={Ban}>
                Repository Filtering
              </SettingsNavItem>
            </nav>
          </aside>
          
          <Separator orientation="vertical" className="hidden md:block h-auto" />
          
          {/* Settings Content */}
          <div className="col-span-12 md:col-span-8">
            {children || <Outlet />}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

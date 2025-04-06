
import { Button } from "@/components/ui/button";
import { useConfig } from "@/context/ConfigContext";

interface DashboardHeaderProps {
  onRefreshClick: () => void;
}

export default function DashboardHeader({ onRefreshClick }: DashboardHeaderProps) {
  const { config } = useConfig();
  
  return (
    <div className="flex items-center justify-between">
      <div>
        <h2 className="text-3xl font-bold">Dashboard Overview</h2>
        <p className="text-muted-foreground">
          Overview of {config.github_org} organization with SonarCloud analysis
        </p>
      </div>
      <Button onClick={onRefreshClick} variant="outline">Refresh Data</Button>
    </div>
  );
}

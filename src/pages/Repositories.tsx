
import DashboardLayout from "@/components/layout/DashboardLayout";
import { useState } from "react";
import { TeamDashboardData } from "@/types";
import RepositoriesTable from "@/components/dashboard/repositories/RepositoryListTable";
import useRepositoryData from "@/hooks/repository/useRepositoryData";

const Repositories = () => {
  const [selectedRepo, setSelectedRepo] = useState<TeamDashboardData | null>(null);
  const { dashboardData } = useRepositoryData();
  
  return (
    <DashboardLayout>
      <RepositoriesTable 
        repositories={dashboardData} 
        onSelectRepository={setSelectedRepo} 
        selectedRepo={selectedRepo} 
      />
    </DashboardLayout>
  );
};

export default Repositories;

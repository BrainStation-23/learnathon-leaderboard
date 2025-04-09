
import DashboardLayout from "@/components/layout/DashboardLayout";
import { useState } from "react";
import { TeamDashboardData } from "@/types";
import RepositoriesTable from "@/components/dashboard/RepositoriesTable";

const Repositories = () => {
  const [selectedRepo, setSelectedRepo] = useState<TeamDashboardData | null>(null);
  
  return (
    <DashboardLayout>
      <RepositoriesTable onSelectRepository={setSelectedRepo} selectedRepo={selectedRepo} />
    </DashboardLayout>
  );
};

export default Repositories;

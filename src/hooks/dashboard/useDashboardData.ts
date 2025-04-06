
import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { fetchDashboardData } from "@/services/supabaseService";
import { TeamDashboardData } from "@/types";

export default function useDashboardData() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState<TeamDashboardData[]>([]);

  // Fetch data from Supabase
  const loadData = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const data = await fetchDashboardData();
      setDashboardData(data);
    } catch (error) {
      console.error("Error loading dashboard data:", error);
      toast({
        title: "Error loading data",
        description: "Failed to retrieve dashboard data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Initial data load
  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  return { 
    loading,
    dashboardData,
    loadData,
  };
}

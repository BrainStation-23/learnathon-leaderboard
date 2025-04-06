
import { useState, useEffect } from "react";
import { LeaderboardItem } from "@/types/leaderboard";
import { fetchLeaderboardData } from "@/services/leaderboard/leaderboardDataService";

export function useLeaderboardData() {
  const [loading, setLoading] = useState(true);
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardItem[]>([]);
  const [error, setError] = useState<string | null>(null);

  const loadLeaderboardData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const data = await fetchLeaderboardData();
      setLeaderboardData(data);
    } catch (err) {
      console.error("Error in leaderboard data loading:", err);
      setError("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLeaderboardData();
  }, []);

  return {
    loading,
    leaderboardData,
    error,
    refreshData: loadLeaderboardData
  };
}

// Export types for backward compatibility
export type { LeaderboardItem };


import React, { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Ban, AlertOctagon, UserCheck, HelpCircle } from "lucide-react";
import { fetchFilterStats } from "@/services/dashboard/dashboardService";

interface FilterStats {
  total: number;
  droppedOut: number;
  noContact: number;
  gotJob: number;
  other: number;
}

export default function FilterStatsCard() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<FilterStats>({
    total: 0,
    droppedOut: 0,
    noContact: 0,
    gotJob: 0,
    other: 0
  });

  useEffect(() => {
    async function loadStats() {
      setLoading(true);
      try {
        const data = await fetchFilterStats();
        setStats(data);
      } catch (error) {
        console.error("Error loading filter stats:", error);
      } finally {
        setLoading(false);
      }
    }

    loadStats();
  }, []);

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">Filtered Repositories</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center py-6">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-3xl font-bold">{stats.total}</span>
              <Badge variant="outline">Total Filtered</Badge>
            </div>
            
            <div className="grid grid-cols-2 gap-2">
              {stats.droppedOut > 0 && (
                <div className="flex items-center gap-2 p-2 rounded-md bg-red-50 text-red-700">
                  <Ban className="h-4 w-4" />
                  <span className="text-sm">{stats.droppedOut} Dropped Out</span>
                </div>
              )}
              
              {stats.noContact > 0 && (
                <div className="flex items-center gap-2 p-2 rounded-md bg-amber-50 text-amber-700">
                  <AlertOctagon className="h-4 w-4" />
                  <span className="text-sm">{stats.noContact} No Contact</span>
                </div>
              )}
              
              {stats.gotJob > 0 && (
                <div className="flex items-center gap-2 p-2 rounded-md bg-green-50 text-green-700">
                  <UserCheck className="h-4 w-4" />
                  <span className="text-sm">{stats.gotJob} Got Job</span>
                </div>
              )}
              
              {stats.other > 0 && (
                <div className="flex items-center gap-2 p-2 rounded-md bg-slate-50 text-slate-700">
                  <HelpCircle className="h-4 w-4" />
                  <span className="text-sm">{stats.other} Other</span>
                </div>
              )}
            </div>
            
            {stats.total === 0 && (
              <p className="text-sm text-muted-foreground text-center py-2">
                No filtered repositories found
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

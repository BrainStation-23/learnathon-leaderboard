
import { ReactNode, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import Sidebar from "./Sidebar";
import { Toaster } from "@/components/ui/toaster";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface DashboardLayoutProps {
  children: ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const { user, isLoading } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  useEffect(() => {
    // Only show toast and redirect if user is not loading and not authenticated
    if (!isLoading && !user) {
      toast({
        title: "Authentication required",
        description: "You need to log in to access the dashboard.",
        variant: "destructive",
      });
      
      // Use navigate instead of directly manipulating window.location
      navigate("/login");
    }
  }, [user, isLoading, toast, navigate]);

  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-hackathon-500" />
      </div>
    );
  }

  // Don't render anything if no user (will redirect in useEffect)
  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-muted/40">
      <Toaster />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 overflow-auto">
          <div className="container py-6 md:py-8 lg:py-10">{children}</div>
        </main>
      </div>
    </div>
  );
}

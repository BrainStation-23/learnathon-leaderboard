
import { ReactNode } from "react";
import { useAuth } from "@/context/AuthContext";
import Sidebar from "./Sidebar";
import { Toaster } from "@/components/ui/toaster";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

interface DashboardLayoutProps {
  children: ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const { user, isLoading } = useAuth();
  const { toast } = useToast();

  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-hackathon-500" />
      </div>
    );
  }

  if (!user) {
    toast({
      title: "Authentication required",
      description: "You need to log in to access the dashboard.",
      variant: "destructive",
    });
    
    // Redirect to login page
    window.location.href = "/login";
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

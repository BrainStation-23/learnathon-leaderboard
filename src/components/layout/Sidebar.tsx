
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { 
  Home, 
  Settings, 
  BarChart2,
  Code,
  LogOut
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";

export default function Sidebar() {
  const location = useLocation();
  const { logout } = useAuth();
  
  const routes = [
    {
      name: "Dashboard",
      path: "/dashboard",
      icon: Home,
    },
    {
      name: "Repositories",
      path: "/repositories",
      icon: Code,
    },
    {
      name: "Analytics",
      path: "/analytics",
      icon: BarChart2,
    },
    {
      name: "Settings",
      path: "/settings",
      icon: Settings,
      // If we're on any settings page, this should be active
      isActive: (location: { pathname: string }) => location.pathname.startsWith("/settings")
    },
  ];

  const handleLogout = async () => {
    try {
      await logout();
      // Redirect will be handled in the AuthContext
    } catch (error) {
      console.error("Logout failed", error);
    }
  };

  return (
    <aside className="flex flex-col w-64 min-h-screen bg-hackathon-950 text-white">
      <div className="p-4">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <BarChart2 className="h-6 w-6 text-hackathon-400" />
          <span>Hackathon Sonar</span>
        </h2>
      </div>
      
      <nav className="flex-1 p-4">
        <ul className="space-y-1">
          {routes.map((route) => {
            const isActive = route.isActive 
              ? route.isActive(location) 
              : location.pathname === route.path;
              
            return (
              <li key={route.path}>
                <Link 
                  to={route.path} 
                  className={cn(
                    "flex items-center gap-3 px-4 py-2 rounded-lg hover:bg-hackathon-900 transition-colors",
                    isActive ? "bg-hackathon-800 text-hackathon-100" : "text-gray-300"
                  )}
                >
                  <route.icon className="h-5 w-5" />
                  {route.name}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
      
      <div className="p-4 mt-auto border-t border-hackathon-800">
        <Button 
          variant="ghost" 
          className="w-full justify-start text-gray-300 hover:text-white hover:bg-hackathon-900"
          onClick={handleLogout}
        >
          <LogOut className="h-5 w-5 mr-2" />
          Logout
        </Button>
      </div>
    </aside>
  );
}

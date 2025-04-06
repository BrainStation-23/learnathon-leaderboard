
import { createContext, useContext, useState, useEffect, ReactNode } from "react";

interface AuthContextType {
  user: any | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
  login: async () => {},
  logout: async () => {},
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // This will be implemented when we connect to Supabase
  const login = async (email: string, password: string) => {
    // This is a placeholder for the Supabase implementation
    console.log("Login will be implemented with Supabase");
    setUser({ email });
    // We'll replace with actual Supabase auth logic when connected
  };

  const logout = async () => {
    // This is a placeholder for the Supabase implementation
    console.log("Logout will be implemented with Supabase");
    setUser(null);
    // We'll replace with actual Supabase auth logic when connected
  };

  // Mock checking auth state for now
  useEffect(() => {
    // This will be replaced with Supabase auth state check
    const checkAuthState = async () => {
      try {
        // We'll implement this with Supabase
        const storedUser = localStorage.getItem("hackathon-dashboard-user");
        if (storedUser) {
          setUser(JSON.parse(storedUser));
        }
      } catch (error) {
        console.error("Auth error:", error);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuthState();
  }, []);

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

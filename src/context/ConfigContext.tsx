
import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { ProjectConfig } from "@/types";

interface ConfigContextType {
  config: ProjectConfig;
  isConfigured: boolean;
  isLoading: boolean;
  updateConfig: (newConfig: ProjectConfig) => Promise<void>;
}

const defaultConfig: ProjectConfig = {
  github_org: "",
  github_pat: "",
  sonarcloud_org: "",
};

const ConfigContext = createContext<ConfigContextType>({
  config: defaultConfig,
  isConfigured: false,
  isLoading: true,
  updateConfig: async () => {},
});

export const ConfigProvider = ({ children }: { children: ReactNode }) => {
  const [config, setConfig] = useState<ProjectConfig>(defaultConfig);
  const [isLoading, setIsLoading] = useState(true);
  const [isConfigured, setIsConfigured] = useState(false);

  // Load config from localStorage for now
  // Later this will be moved to Supabase
  useEffect(() => {
    const loadConfig = async () => {
      try {
        // We'll replace this with Supabase storage later
        const storedConfig = localStorage.getItem("hackathon-config");
        if (storedConfig) {
          const parsedConfig = JSON.parse(storedConfig);
          setConfig(parsedConfig);
          setIsConfigured(
            !!parsedConfig.github_org && 
            !!parsedConfig.github_pat && 
            !!parsedConfig.sonarcloud_org
          );
        }
      } catch (error) {
        console.error("Failed to load config:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadConfig();
  }, []);

  const updateConfig = async (newConfig: ProjectConfig) => {
    try {
      // We'll replace this with Supabase storage later
      localStorage.setItem("hackathon-config", JSON.stringify(newConfig));
      setConfig(newConfig);
      setIsConfigured(
        !!newConfig.github_org && 
        !!newConfig.github_pat && 
        !!newConfig.sonarcloud_org
      );
    } catch (error) {
      console.error("Failed to update config:", error);
      throw error;
    }
  };

  return (
    <ConfigContext.Provider value={{ config, isConfigured, isLoading, updateConfig }}>
      {children}
    </ConfigContext.Provider>
  );
};

export const useConfig = () => useContext(ConfigContext);

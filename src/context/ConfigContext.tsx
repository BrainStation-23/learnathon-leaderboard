
import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { ProjectConfig } from "@/types";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/AuthContext";

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
  const { toast } = useToast();
  const { user } = useAuth();

  // Load config from Supabase when user changes
  useEffect(() => {
    const loadConfig = async () => {
      if (!user) {
        setConfig(defaultConfig);
        setIsConfigured(false);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      try {
        const { data: configData, error } = await supabase
          .from("configurations")
          .select("*")
          .eq("user_id", user.id)
          .single();

        if (error && error.code !== "PGRST116") {
          // PGRST116 is the error code for no rows returned
          console.error("Failed to load configuration:", error);
          toast({
            title: "Error loading configuration",
            description: "Please try again or reconfigure your settings.",
            variant: "destructive",
          });
        }

        if (configData) {
          const userConfig: ProjectConfig = {
            github_org: configData.github_org,
            github_pat: configData.github_pat,
            sonarcloud_org: configData.sonarcloud_org,
          };
          
          setConfig(userConfig);
          setIsConfigured(
            !!userConfig.github_org && 
            !!userConfig.github_pat && 
            !!userConfig.sonarcloud_org
          );
        }
      } catch (error) {
        console.error("Failed to load config:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadConfig();
  }, [user, toast]);

  const updateConfig = async (newConfig: ProjectConfig) => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "You must be logged in to save configuration.",
        variant: "destructive",
      });
      return;
    }

    try {
      // Check if config already exists for this user
      const { data: existingConfig } = await supabase
        .from("configurations")
        .select("id")
        .eq("user_id", user.id)
        .single();

      let result;
      
      if (existingConfig) {
        // Update existing config
        result = await supabase
          .from("configurations")
          .update({
            github_org: newConfig.github_org,
            github_pat: newConfig.github_pat,
            sonarcloud_org: newConfig.sonarcloud_org,
            updated_at: new Date().toISOString(),
          })
          .eq("user_id", user.id);
      } else {
        // Insert new config
        result = await supabase
          .from("configurations")
          .insert({
            user_id: user.id,
            github_org: newConfig.github_org,
            github_pat: newConfig.github_pat,
            sonarcloud_org: newConfig.sonarcloud_org,
          });
      }

      if (result.error) {
        throw result.error;
      }

      // Log audit event
      await supabase.rpc('log_audit_event', {
        p_user_id: user.id,
        p_action: existingConfig ? 'update_config' : 'create_config',
        p_entity_type: 'configuration',
        p_entity_id: null,
        p_details: { github_org: newConfig.github_org, sonarcloud_org: newConfig.sonarcloud_org }
      });

      setConfig(newConfig);
      setIsConfigured(
        !!newConfig.github_org && 
        !!newConfig.github_pat && 
        !!newConfig.sonarcloud_org
      );
      
      toast({
        title: "Configuration saved",
        description: "Your settings have been updated successfully.",
      });
    } catch (error) {
      console.error("Failed to update config:", error);
      toast({
        title: "Error saving configuration",
        description: "Please try again or contact support.",
        variant: "destructive",
      });
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

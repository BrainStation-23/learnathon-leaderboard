
import { useEffect } from "react";
import { useNavigate, Outlet } from "react-router-dom";
import SettingsLayout from "@/components/layout/SettingsLayout";

const Settings = () => {
  const navigate = useNavigate();
  
  // Redirect to dashboard settings by default
  useEffect(() => {
    navigate("/settings/dashboard", { replace: true });
  }, [navigate]);

  return <SettingsLayout><Outlet /></SettingsLayout>;
};

export default Settings;

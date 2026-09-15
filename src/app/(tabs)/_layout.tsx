import AppTabs from "@/components/app-tabs";
import { useAuth } from "@/context/auth-context";

export default function TabsLayout() {
  const { isAuthenticated } = useAuth();
  return <AppTabs isAuthenticated={isAuthenticated} />;
}

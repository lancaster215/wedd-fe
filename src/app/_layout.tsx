import { DarkTheme, DefaultTheme, ThemeProvider } from "expo-router";
import { useColorScheme } from "react-native";

import AppTabs from "@/components/app-tabs";
import { AuthProvider, useAuth } from "@/context/auth-context";
import { QueryProvider } from "@/context/query-provider";

function RootNavigator() {
  const { isAuthenticated } = useAuth();

  return <AppTabs isAuthenticated={isAuthenticated} />;
}

export default function TabLayout() {
  const colorScheme = useColorScheme();
  return (
    <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
      <QueryProvider>
        <AuthProvider>
          <RootNavigator />
        </AuthProvider>
      </QueryProvider>
    </ThemeProvider>
  );
}

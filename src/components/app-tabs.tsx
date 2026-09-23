import { Tabs } from "expo-router";
import { useColorScheme } from "react-native";
import { Home3, Planet } from "reicon-react-native";

import { Colors } from "@/constants/theme";
import { AuthUser } from "@/hooks/api/loginAPI";

type AppTabsProps = {
  isAuthenticated: boolean;
  userDetails: AuthUser | null;
};

export default function AppTabs({
  isAuthenticated,
  userDetails,
}: AppTabsProps) {
  const scheme = useColorScheme();
  const colors = Colors[scheme === "unspecified" ? "light" : scheme];
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.text,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarStyle: {
          backgroundColor: colors.background,
          display: isAuthenticated ? "flex" : "none",
        },
      }}
    >
      <Tabs.Screen name="index" options={{ href: null }} />
      <Tabs.Screen
        name="events"
        options={{
          href: userDetails?.role === "USER" ? "/events" : null,
          title: "Events",
          tabBarIcon: ({ color, size }) => (
            <Home3
              color={typeof color === "string" ? color : colors.text}
              size={size}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="dashboard"
        options={{
          href: userDetails?.role === "VENDOR" ? "/dashboard" : null,
          title: "Dashboard",
          tabBarIcon: ({ color, size }) => (
            <Home3
              color={typeof color === "string" ? color : colors.text}
              size={size}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: "Explore",
          tabBarIcon: ({ color, size }) => (
            <Planet
              color={typeof color === "string" ? color : colors.text}
              size={size}
            />
          ),
        }}
      />
    </Tabs>
  );
}

import { Tabs } from "expo-router";
import { useColorScheme } from "react-native";
import { Home3, Planet } from "reicon-react-native";

import { Colors } from "@/constants/theme";

type AppTabsProps = {
  isAuthenticated: boolean;
};

export default function AppTabs({ isAuthenticated }: AppTabsProps) {
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
      <Tabs.Screen
        name="index"
        options={{
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

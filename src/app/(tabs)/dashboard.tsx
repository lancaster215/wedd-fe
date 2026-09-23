import { Redirect } from "expo-router";
import { ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useAuth } from "@/context/auth-context";
import DashboardPage from "@/pages/DashboardPage";

export default function DashboardRoute() {
  const { isAuthenticated, isInitializing, user } = useAuth();

  if (isInitializing) {
    return (
      <SafeAreaView style={{ flex: 1, justifyContent: "center" }}>
        <ActivityIndicator color="#FF6755" />
      </SafeAreaView>
    );
  }

  if (!isAuthenticated) {
    return <Redirect href="/" />;
  }

  if (user?.role !== "VENDOR") {
    return <Redirect href="/events" />;
  }

  return <DashboardPage />;
}

import { Redirect } from "expo-router";
import { ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useAuth } from "@/context/auth-context";
import EventsPage from "@/pages/EventsPage";

export default function EventsRoute() {
  const { isAuthenticated, isInitializing } = useAuth();

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

  return <EventsPage />;
}

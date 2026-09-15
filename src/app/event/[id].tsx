import EventDetails from "@/components/ui/EventDetails";
import { useAuth } from "@/context/auth-context";
import { useGetEvents } from "@/hooks/api/eventsAPI";
import { Redirect, useLocalSearchParams, useRouter } from "expo-router";
import { ActivityIndicator, Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function EventDetailsRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { isAuthenticated, isInitializing } = useAuth();
  const events = useGetEvents();
  const event = events.data?.find((item) => item.id === id);
  const goBack = () =>
    router.canGoBack() ? router.back() : router.replace("/events");

  if (!isInitializing && !isAuthenticated) return <Redirect href="/" />;
  if (event)
    return (
      <EventDetails
        event={event}
        onBack={goBack}
        onAddVendor={() => router.push("/explore")}
      />
    );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#FCFAF7", padding: 24 }}>
      <Pressable accessibilityRole="button" onPress={goBack}>
        <Text>Back to events</Text>
      </Pressable>
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          gap: 16,
        }}
      >
        {isInitializing || events.isPending ? (
          <>
            <ActivityIndicator color="#FF6755" />
            <Text>Loading event…</Text>
          </>
        ) : (
          <>
            <Text>
              {events.isError
                ? "Couldn’t load this event."
                : "This event is no longer available."}
            </Text>
            {events.isError && (
              <Pressable
                accessibilityRole="button"
                onPress={() => void events.refetch()}
              >
                <Text>Try again</Text>
              </Pressable>
            )}
          </>
        )}
      </View>
    </SafeAreaView>
  );
}

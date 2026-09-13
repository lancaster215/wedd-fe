import CreateEventForm from "@/components/forms/EventForm";
import Avatar from "@/components/ui/Avatar";
import { Colors } from "@/constants/theme";
import { useGetEvents, type EventProfile } from "@/hooks/api/eventsAPI";
import { Image } from "expo-image";
import { useState } from "react";
import {
	ActivityIndicator,
	Platform,
	Pressable,
	RefreshControl,
	ScrollView,
	StyleSheet,
	Text,
	// useWindowDimensions,
	View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Add, More } from "reicon-react-native";

export default function EventsPage() {
  // const { height, width } = useWindowDimensions();
  const events = useGetEvents();
  const event = events.data;
  const [menuOpen, setMenuOpen] = useState(false);
  const [openAddEvent, setOpenAddEvent] = useState(false);

  const [editingEvent, setEditingEvent] = useState<EventProfile | null>(null);
  const handleEdit = () => {
    if (!event) return;
    setMenuOpen(false);
    setEditingEvent(event);
  };

  if (editingEvent) {
    return (
      <CreateEventForm
        key={editingEvent.id}
        event={editingEvent}
        onClose={() => setEditingEvent(null)}
      />
    );
  }

  if (openAddEvent) {
    return <CreateEventForm onClose={() => setOpenAddEvent(false)} />;
  }

  return (
    <SafeAreaView style={styles.home} edges={["top", "left", "right"]}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={events.isRefetching}
            onRefresh={() => void events.refetch()}
            tintColor="#FF6755"
          />
        }
      >
        <View style={styles.header}>
          <View style={{ flex: 1 }}>
            <Text style={styles.heading}>My Events</Text>
            <Text style={styles.subtitle}>Let’s plan your next big day</Text>
          </View>
          <Avatar />
        </View>

        <View style={styles.queryStatus} accessibilityLiveRegion="polite">
          {events.isPending && (
            <>
              <ActivityIndicator color="#FF6755" />
              <Text style={styles.subtitle}>
                {events.fetchStatus === "paused"
                  ? "Waiting for a connection…"
                  : "Loading your events…"}
              </Text>
            </>
          )}
          {events.isError && (
            <Text style={styles.errorText}>
              {events.data !== undefined
                ? "Couldn’t refresh your events. Showing saved data. "
                : "Couldn’t load your events. "}
              {events.error.message}
            </Text>
          )}
          {events.isRefetching && (
            <Text style={styles.subtitle}>Refreshing your events…</Text>
          )}
          {/* {events.data !== undefined &&
            events.isStale &&
            !events.isFetching &&
            !events.isError && (
              <Text style={styles.subtitle}>
                Showing saved data. Refresh for the latest updates.
              </Text>
            )} */}
          {events.data === null && (
            <Text style={styles.subtitle}>
              No events yet. Your event will appear here once it’s created.
            </Text>
          )}
        </View>

        {event && (
          <View style={styles.card}>
            {event.eventImage ? (
              <Image
                source={{
                  uri: event.eventImage,
                }}
                style={StyleSheet.absoluteFill}
                contentFit="cover"
                accessibilityLabel={`${event.userName} background`}
              />
            ) : (
              <Image
                source={{
                  uri: "https://images.unsplash.com/photo-1519741497674-611481863552?w=1200&auto=format&fit=crop&q=85",
                }}
                style={StyleSheet.absoluteFill}
                contentFit="cover"
                accessibilityLabel="Sample wedding venue"
              />
            )}
            <View style={styles.overlay} />
            <View style={styles.cardTop}>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>
                  {event.eventType.replace(/_/g, " ")}
                </Text>
              </View>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Event options"
                onPress={() => setMenuOpen(true)}
              >
                <More
                  color="white"
                  style={{ transform: [{ rotate: "90deg" }] }}
                />
              </Pressable>
            </View>
            <View style={styles.cardBottom}>
              <Text style={styles.title}>{event.userName}</Text>
              <Text style={styles.address}>{event.eventAddress}</Text>
              <View style={styles.details}>
                <View style={styles.countdown}>
                  <View style={styles.clock}>
                    <View style={styles.hour} />
                    <View style={styles.minute} />
                  </View>
                  <Text style={styles.time}>
                    {new Date(event.eventDate).toLocaleDateString(undefined, {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </Text>
                </View>
                <Text style={styles.budgetLabel}>
                  Budget:{" "}
                  <Text style={styles.budget}>
                    {new Intl.NumberFormat("en-PH", {
                      style: "currency",
                      currency: "PHP",
                    }).format(Number(event.budget))}
                  </Text>
                </Text>
              </View>
            </View>

            <View
              style={{
                position: "absolute",
                top: 10,
                right: 10,
                display: menuOpen ? "flex" : "none",
              }}
            >
              <View style={styles.panel} accessibilityViewIsModal>
                <Pressable
                  accessibilityRole="button"
                  style={({ pressed }) => [
                    styles.action,
                    pressed && styles.pressed,
                  ]}
                  onPress={handleEdit}
                >
                  <Text style={styles.actionText}>Edit</Text>
                </Pressable>
                <Pressable
                  accessibilityRole="button"
                  onPress={() => setMenuOpen(!menuOpen)}
                  style={styles.cancel}
                >
                  <Text style={styles.cancelText}>Cancel</Text>
                </Pressable>
              </View>
            </View>
          </View>
        )}
      </ScrollView>
      <Pressable
        accessibilityRole="button"
        onPress={() => setOpenAddEvent(!openAddEvent)}
        style={styles.addButton}
      >
        <Add color="#ffffff" />
      </Pressable>
    </SafeAreaView>
  );
}

const serif = Platform.select({
  ios: "Georgia",
  android: "serif",
  default: "Georgia",
});
const styles = StyleSheet.create({
  queryStatus: {
    gap: 10,
    marginBottom: 20,
    justifyContent: "center",
    alignContent: "center",
  },
  errorText: { color: "#A33125", fontSize: 15, lineHeight: 22 },
  refreshButton: {
    alignSelf: "flex-start",
    backgroundColor: "#FF6755",
    borderRadius: 10,
    paddingHorizontal: 18,
    paddingVertical: 12,
  },
  address: { color: "#FFFFFF", fontSize: 14, marginBottom: 14 },
  home: { flex: 1, backgroundColor: "#FCFAF7", position: "relative" },
  content: {
    flexGrow: 1,
    padding: 24,
    paddingBottom: 120,
    width: "100%",
    maxWidth: 736,
    alignSelf: "center",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 16,
    marginBottom: 24,
  },
  heading: {
    fontWeight: "700",
    fontSize: 32,
    color: "#100E0C",
    letterSpacing: -0.8,
  },
  subtitle: { fontSize: 15, color: "#796E68", marginTop: 6, lineHeight: 22 },
  card: {
    minHeight: 250,
    position: "relative",
    borderRadius: 24,
    overflow: "hidden",
    backgroundColor: "#626850",
    justifyContent: "space-between",
  },
  overlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: "rgba(20,20,15,0.52)",
  },
  cardTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    padding: 20,
  },
  badge: {
    backgroundColor: "#FFF2E9",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  badgeText: { color: "#FF6755", fontSize: 12, fontWeight: "600" },
  menu: {
    width: 44,
    height: 44,
    marginTop: -4,
    marginRight: -4,
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
    gap: 3,
  },
  dot: { width: 3, height: 3, borderRadius: 2, backgroundColor: "#FFFFFF" },
  pressed: { opacity: 0.5 },
  cardBottom: { padding: 20, paddingTop: 32 },
  title: {
    fontWeight: "700",
    fontSize: 27,
    lineHeight: 32,
    color: "#FFFFFF",
    maxWidth: 420,
    marginBottom: 14,
  },
  details: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    flexWrap: "wrap",
    columnGap: 12,
    rowGap: 10,
  },
  countdown: { flexDirection: "row", alignItems: "center", gap: 7 },
  time: { fontSize: 12, color: "#FFFFFF", fontWeight: "500" },
  clock: {
    width: 15,
    height: 15,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },
  hour: {
    position: "absolute",
    width: 2,
    height: 5,
    backgroundColor: "#FFFFFF",
    left: 5,
    top: 1,
  },
  minute: {
    position: "absolute",
    width: 5,
    height: 2,
    backgroundColor: "#FFFFFF",
    left: 5,
    top: 5,
    transform: [{ rotate: "25deg" }],
  },
  budgetLabel: { color: "#D9D4CD", fontSize: 13 },
  budget: { color: "#FFB43F", fontSize: 15, fontWeight: "600" },
  modal: {
    // flex: 1,
    justifyContent: "center",
    alignItems: "center",
    // padding: 24,
  },
  backdrop: { ...StyleSheet.absoluteFill, backgroundColor: "rgba(0,0,0,0.4)" },
  panel: {
    padding: 7,
    borderRadius: 7,
    backgroundColor: "#FCFAF7",
  },
  modalTitle: {
    fontFamily: serif,
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 20,
    color: "#100E0C",
  },
  action: {
    backgroundColor: "#FF6755",
    borderRadius: 5,
    padding: 5,
    alignItems: "center",
  },
  actionText: { color: "#FFFFFF", fontSize: 16, fontWeight: "600" },
  cancel: { padding: 15, alignItems: "center", marginTop: 6 },
  cancelText: { color: "#796E68", fontSize: 16 },
  label: { fontSize: 14, color: "#796E68", marginBottom: 8 },
  input: {
    borderWidth: 1,
    borderColor: "#DED6CE",
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    color: "#100E0C",
    marginBottom: 20,
  },
  addButton: {
    position: "absolute",
    right: 20,
    bottom: 20,
    backgroundColor: Colors.colors.CORAL,
    boxShadow: "0px 8px 20px 0px rgba(255, 107, 82, 0.2)",
    borderRadius: "50%",
    padding: 10,
  },
});

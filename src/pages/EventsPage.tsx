import CreateEventForm from "@/components/forms/CreateEventForm";
import ConfirmationModal from "@/components/modals/ConfirmationModal";
import Avatar from "@/components/ui/Avatar";
import { Colors } from "@/constants/theme";
import { useAuth } from "@/context/auth-context";
import {
  useDeleteEvent,
  useGetEvents,
  type EventProfile,
} from "@/hooks/api/eventsAPI";
import logoutAPI from "@/hooks/api/logoutAPI";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Add, AttachCircle, More } from "reicon-react-native";

export default function EventsPage() {
  const router = useRouter();
  const { signOut } = useAuth();
  const { width, height } = useWindowDimensions();
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });
  const events = useGetEvents();
  const deleteMutation = useDeleteEvent();
  const eventList = events.data ?? [];
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [deleteConfirmationOpen, setDeleteConfirmationOpen] = useState(false);
  const [deleteConfirmationErrorOpen, setDeleteConfirmationErrorOpen] =
    useState(false);
  const [openAddEvent, setOpenAddEvent] = useState(false);
  const [editingEvent, setEditingEvent] = useState<EventProfile | null>(null);
  const [openProfile, setOpenProfile] = useState(false);
  const [hoveredStatusId, setHoveredStatusId] = useState<string | null>(null);
  const [openStatusId, setOpenStatusId] = useState<string | null>(null);

  const handleLogout = async () => {
    setOpenProfile(false);
    await logoutAPI();
    await signOut();
    return;
  };

  const handleEdit = () => {
    setMenuOpen(false);
    const event = eventList.find((item) => item.id === selectedEventId);
    if (!event) return;
    setEditingEvent(event);
  };

  const handleDelete = (eventId: string) => {
    setSelectedEventId(eventId);
    deleteMutation.reset();
    setMenuOpen(false);
    setDeleteConfirmationOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!selectedEventId || deleteMutation.isPending) return;
    try {
      await deleteMutation.mutateAsync(selectedEventId);
      setDeleteConfirmationOpen(false);
      setSelectedEventId(null);
    } catch {
      setDeleteConfirmationOpen(false);
      setSelectedEventId(null);
      setDeleteConfirmationErrorOpen(true);
      // Keep the confirmation open and display the error for retry.
    }
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
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Profile options"
            style={{ position: "relative" }}
            onPress={(e) => {
              e.currentTarget.measureInWindow((x, y, w, h) => {
                setMenuPosition({ top: y + h + 6, left: x + w - 100 });
                setMenuOpen(false);
                setOpenProfile(true);
              });
            }}
          >
            <Avatar />
          </Pressable>
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
              {/* {events.error.message} */}
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
          {events.data !== undefined && eventList.length === 0 && (
            <Text style={styles.subtitle}>
              No events yet. Your event will appear here once it’s created.
            </Text>
          )}
        </View>

        {eventList.map((event) => (
          <Pressable
            key={event.id}
            style={styles.card}
            accessible={false}
            onPress={() =>
              router.push({ pathname: "/event/[id]", params: { id: event.id } })
            }
          >
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
              <View style={styles.badgeWrapper}>
                <View>
                  {event.eventStatus === "ENDED" ? (
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel="Rate Vendors"
                      onPress={(e) => {
                        e.stopPropagation();
                        console.log("to rate vendor page");
                      }}
                      style={({ pressed }) => [
                        styles.rateButton,
                        pressed && styles.pressed,
                      ]}
                    >
                      <Text style={styles.rateButtonText}>Rate Vendors</Text>
                    </Pressable>
                  ) : (
                    <View style={styles.statusAnchor}>
                      <Pressable
                        accessibilityRole="button"
                        accessibilityLabel={`Event status: ${event.eventStatus.replace(/_/g, " ")}`}
                        accessibilityState={{
                          expanded:
                            openStatusId === event.id ||
                            hoveredStatusId === event.id,
                        }}
                        hitSlop={10}
                        onHoverIn={() => setHoveredStatusId(event.id)}
                        onHoverOut={() => setHoveredStatusId(null)}
                        onFocus={() => setHoveredStatusId(event.id)}
                        onBlur={() => setHoveredStatusId(null)}
                        onPress={(e) => {
                          e.stopPropagation();
                          setOpenStatusId(event.id);
                        }}
                      >
                        <AttachCircle
                          height="15"
                          weight="Filled"
                          color={
                            event.eventStatus === "ACTIVE"
                              ? Colors.colors.FRESH_LIME
                              : event.eventStatus === "POSTPONE"
                                ? Colors.colors.BLOOD_RED
                                : Colors.colors.WHITE
                          }
                        />
                      </Pressable>
                      {(openStatusId === event.id ||
                        hoveredStatusId === event.id) && (
                        <View style={styles.statusPopover} pointerEvents="none">
                          <Text style={styles.statusPopoverText}>
                            {event.eventStatus.replace(/_/g, " ")}
                          </Text>
                        </View>
                      )}
                    </View>
                  )}
                </View>
                <View style={styles.badgeType}>
                  <Text style={styles.badgeTypeText}>
                    {event.eventType.replace(/_/g, " ")}
                  </Text>
                </View>
              </View>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Event options"
                onPress={(e) => {
                  e.stopPropagation();
                  e.currentTarget.measureInWindow((x, y, w, h) => {
                    setMenuPosition({ top: y + h + 6, left: x + w - 100 });
                    setOpenProfile(false);
                    setSelectedEventId(event.id);
                    setMenuOpen(true);
                  });
                }}
              >
                <More
                  color="white"
                  style={{ transform: [{ rotate: "90deg" }] }}
                />
              </Pressable>
            </View>
            <View style={styles.cardBottom}>
              <Text
                accessibilityRole="link"
                onPress={(e) => {
                  e.stopPropagation();
                  router.push({
                    pathname: "/event/[id]",
                    params: { id: event.id },
                  });
                }}
                style={styles.title}
              >
                {event.eventTitle}
              </Text>
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
                  <Text
                    style={[
                      styles.budget,
                      {
                        color:
                          event.budgetStatus === "AVAILABLE"
                            ? Colors.colors.FRESH_LIME
                            : event.budgetStatus === "LIMITED"
                              ? Colors.colors.CORAL
                              : event.budgetStatus === "OVERSPEND"
                                ? Colors.colors.BLOOD_RED
                                : Colors.colors.WHITE,
                      },
                    ]}
                  >
                    {event.budgetStatus.replace(/_/g, " ")}
                    {/* {new Intl.NumberFormat("en-PH", {
                      style: "currency",
                      currency: "PHP",
                    }).format(Number(event.budget))} */}
                  </Text>
                </Text>
              </View>
            </View>
          </Pressable>
        ))}
      </ScrollView>
      <Pressable
        accessibilityRole="button"
        onPress={() => setOpenAddEvent(!openAddEvent)}
        style={styles.addButton}
      >
        <Add color={`${Colors.colors.WHITE}`} />
      </Pressable>
      {openStatusId !== null && (
        <Pressable
          style={[StyleSheet.absoluteFill, styles.statusDismiss]}
          accessibilityRole="button"
          accessibilityLabel="Dismiss event status"
          onPress={() => {
            setOpenStatusId(null);
            setHoveredStatusId(null);
          }}
        />
      )}
      <Modal
        visible={menuOpen || deleteConfirmationOpen}
        transparent
        animationType="fade"
        onRequestClose={() => {
          if (deleteMutation.isPending) return;
          setMenuOpen(false);
          setDeleteConfirmationOpen(false);
        }}
      >
        {deleteConfirmationOpen ? (
          <ConfirmationModal
            questionText="Are you sure you wanted to delete this event?"
            yesButton
            yesButtonText={deleteMutation.isPending ? "Deleting…" : "Yes"}
            noButton
            noButtonText="No"
            yesButtonFn={handleConfirmDelete}
            noButtonFn={() => setDeleteConfirmationOpen(false)}
            busy={deleteMutation.isPending}
            errorText={deleteMutation.error?.message}
          />
        ) : deleteConfirmationErrorOpen ? (
          <ConfirmationModal
            questionText="Something went wrong."
            yesButton
            yesButtonText={deleteMutation.isPending ? "Deleting…" : "Retry"}
            noButton
            noButtonText="Close"
            yesButtonFn={handleConfirmDelete}
            noButtonFn={() => setDeleteConfirmationErrorOpen(false)}
            busy={deleteMutation.isPending}
            errorText={deleteMutation.error?.message}
          />
        ) : (
          <View style={{ flex: 1 }}>
            <Pressable
              style={StyleSheet.absoluteFill}
              accessibilityRole="button"
              accessibilityLabel="Dismiss event options"
              onPress={() => setMenuOpen(false)}
            />
            <View
              style={[
                styles.panel,
                {
                  position: "absolute",
                  top: Math.max(8, Math.min(menuPosition.top, height - 80)),
                  left: Math.max(8, Math.min(menuPosition.left, width - 108)),
                },
              ]}
              accessibilityViewIsModal
            >
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
                style={({ pressed }) => [
                  styles.actionDelete,
                  pressed && styles.pressed,
                ]}
                onPress={() => {
                  if (selectedEventId) handleDelete(selectedEventId);
                }}
              >
                <Text style={styles.actionText}>Delete</Text>
              </Pressable>
            </View>
          </View>
        )}
      </Modal>
      <Modal
        visible={openProfile}
        transparent
        animationType="fade"
        onRequestClose={() => setOpenProfile(false)}
      >
        <View style={{ flex: 1 }}>
          <Pressable
            style={StyleSheet.absoluteFill}
            accessibilityRole="button"
            accessibilityLabel="Dismiss profile options"
            onPress={() => setOpenProfile(false)}
          />
          <View
            style={[
              styles.panel,
              {
                position: "absolute",
                top: Math.max(8, Math.min(menuPosition.top, height - 80)),
                left: Math.max(8, Math.min(menuPosition.left, width - 108)),
              },
            ]}
            accessibilityViewIsModal
          >
            <Pressable
              accessibilityRole="button"
              style={({ pressed }) => [
                styles.action,
                pressed && styles.pressed,
              ]}
              onPress={handleLogout}
            >
              <Text style={styles.actionText}>Logout</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const serif = Platform.select({
  ios: "Georgia",
  android: "serif",
  default: "Georgia",
});
const styles = StyleSheet.create({
  statusAnchor: { position: "relative", zIndex: 1 },
  statusPopover: {
    position: "absolute",
    top: 28,
    left: 0,
    minWidth: 100,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: "#FCFAF7",
    boxShadow: "0px 3px 12px rgba(0,0,0,0.18)",
  },
  statusPopoverText: { fontSize: 12, fontWeight: "600", color: "#302823" },
  statusDismiss: { zIndex: 10 },
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
    marginBottom: 20,
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
  badgeWrapper: {
    width: 200,
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  badgeType: {
    backgroundColor: Colors.colors.OFFWHITE,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  // badgeStatus: {},
  badgeTypeText: {
    color: Colors.colors.CORAL,
    fontSize: 12,
    fontWeight: "600",
  },
  // badgeStatusText: {
  //   fontSize: 12,
  //   fontWeight: "600",
  // },
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
    // flexWrap: "wrap",
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
  budget: { fontSize: 15, fontWeight: "600" },
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
    width: 100,
    gap: 10,
  },
  modalTitle: {
    fontFamily: serif,
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 20,
    color: "#100E0C",
  },
  action: {
    backgroundColor: Colors.colors.CORAL,
    borderRadius: 5,
    padding: 5,
    alignItems: "center",
  },
  actionDelete: {
    backgroundColor: Colors.colors.BLOOD_RED,
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
  rateButton: {
    backgroundColor: Colors.colors.GOLDEN_HOUR,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  rateButtonText: {
    color: Colors.colors.WHITE,
  },
});

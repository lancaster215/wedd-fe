import ConfirmationModal from "@/components/modals/ConfirmationModal";
import CreateServiceForm from "@/components/forms/CreateServiceForm";
import Avatar from "@/components/ui/Avatar";
import { ENV } from "@/constants/env";
import { Colors } from "@/constants/theme";
import { useAuth } from "@/context/auth-context";
import logoutAPI from "@/hooks/api/logoutAPI";
import useGetServices, { useDeleteService, type ServiceProfile } from "@/hooks/api/servicesAPI";
import { Image } from "expo-image";
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
import { Add } from "reicon-react-native";

export function formatServicePrice(price: string) {
  const amounts = price
    .replace(/,/g, "")
    .split(/\s*[-–]\s*/)
    .map(Number);
  if (amounts.some((value) => !Number.isFinite(value))) return price;
  const money = (value: number) =>
    `₱${value.toLocaleString("en-PH", { maximumFractionDigits: 2 })}`;
  return amounts.length === 2
    ? amounts.map(money).join(" – ")
    : `${money(amounts[0])} Flat Rate`;
}

function ServiceCard({
  service,
  onEdit,
  onDelete,
}: {
  service: ServiceProfile;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const { token } = useAuth();

  const [imageFailed, setImageFailed] = useState(false);

  const gallery = [...service.gallery].sort((a, b) => a.position - b.position);
  const cover = gallery.find((item) => item.type === "image");
  const uri = cover ? new URL(cover.url, ENV.BASE_URL).toString() : undefined;
  const isApiImage =
    uri && ENV.BASE_URL && new URL(uri).origin === new URL(ENV.BASE_URL).origin;

  return (
    <View style={styles.cardContainer}>
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Edit ${service.title}`}
      onPress={onEdit}
      style={styles.menu}
    >
      <View style={styles.card}>
        <Text style={styles.cardTitle}>{service.title}</Text>
        {uri && !imageFailed ? (
          <Image
            source={{
              uri,
              ...(isApiImage && token
                ? { headers: { Authorization: `Bearer ${token}` } }
                : {}),
            }}
            style={styles.cover}
            contentFit="cover"
            accessibilityLabel={`${service.title} gallery`}
            onError={() => setImageFailed(true)}
          />
        ) : (
          <View style={[styles.cover, styles.placeholder]}>
            <Text style={styles.placeholderIcon}>
              {gallery.some((item) => item.type === "video") ? "▷" : "◇"}
            </Text>
            <Text style={styles.muted}>
              {gallery.some((item) => item.type === "video")
                ? "Video gallery"
                : "No preview available"}
            </Text>
          </View>
        )}
        <View style={styles.cardFooter}>
          <Text style={styles.price}>
            {formatServicePrice(service.price_model)}
          </Text>
        </View>
      </View>
    </Pressable>
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Delete ${service.title}`}
      onPress={onDelete}
      style={({ pressed }) => [styles.deleteButton, pressed && styles.pressed]}
    >
      <Text style={styles.deleteIcon}>×</Text>
    </Pressable>
    </View>
  );
}

export default function DashboardPage() {
  const { user, signOut } = useAuth();
  const services = useGetServices();
  const deleteMutation = useDeleteService();
  const [serviceToDelete, setServiceToDelete] = useState<ServiceProfile | null>(null);
  const closeDeleteConfirmation = () => {
    if (deleteMutation.isPending) return;
    setServiceToDelete(null);
    deleteMutation.reset();
  };
  const confirmDelete = async () => {
    if (!serviceToDelete || deleteMutation.isPending) return;
    try {
      await deleteMutation.mutateAsync(serviceToDelete.id);
      setServiceToDelete(null);
    } catch {
      // Keep the dialog open so the mutation error is visible and can be retried.
    }
  };
  const { width, height } = useWindowDimensions();
  const [showAll, setShowAll] = useState(false);
  const [editor, setEditor] = useState<ServiceProfile | "new" | null>(null);
  const [openProfile, setOpenProfile] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });

  const list = services.data?.pages.flatMap((page) => page.services) ?? [];
  const vendor = services.data?.pages[0]?.vendor;
  const name =
    [user?.firstName, user?.lastName].filter(Boolean).join(" ") ||
    vendor?.businessName ||
    "Your business";

  const handleLogout = async () => {
    setOpenProfile(false);
    await logoutAPI();
    await signOut();
    return;
  };

  if (editor)
    return (
      <CreateServiceForm
        service={editor === "new" ? undefined : editor}
        onClose={() => setEditor(null)}
      />
    );

  return (
    <SafeAreaView style={styles.home} edges={["top", "left", "right"]}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={services.isRefetching && !services.isFetchingNextPage}
            onRefresh={() => void services.refetch()}
            tintColor="#FF6755"
          />
        }
      >
        <View style={styles.header}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Profile options"
            style={{ position: "relative" }}
            onPress={(e) => {
              e.currentTarget.measureInWindow((x, y, w, h) => {
                setMenuPosition({ top: y + h + 6, left: x + w - 100 });
                setOpenProfile(true);
              });
            }}
          >
            <Avatar size={56} />
          </Pressable>
          <View style={styles.identity}>
            <Text style={styles.name}>{name}</Text>
            <View style={styles.ratingRow}>
              <Text style={styles.star}>★</Text>
              <Text style={styles.rating}>
                {vendor ? vendor.averageRating.toFixed(1) : "—"}
              </Text>
              <Text style={styles.muted}>
                ({vendor?.ratingsCount ?? 0} reviews)
              </Text>
            </View>
          </View>
          {/* <View style={styles.vendorBadge}>
            <Text style={styles.vendorText}>VENDOR</Text>
          </View> */}
        </View>
        <View style={styles.sectionHeader}>
          <Text style={styles.heading}>My Services</Text>
          {list.length > 2 && (
            <Pressable
              accessibilityRole="button"
              onPress={() => setShowAll(!showAll)}
              hitSlop={10}
            >
              <Text style={styles.link}>
                {showAll ? "Show Less" : "View All"}
              </Text>
            </Pressable>
          )}
        </View>
        {services.isPending && (
          <View style={styles.feedback}>
            <ActivityIndicator color="#FF6755" />
            <Text style={styles.muted}>Loading your services…</Text>
          </View>
        )}
        {services.isError && (
          <View style={styles.feedback} accessibilityLiveRegion="polite">
            <Text style={styles.error}>
              {services.data
                ? "Couldn’t refresh. Showing saved services."
                : "Couldn’t load your services."}
            </Text>
            <Pressable
              accessibilityRole="button"
              onPress={() => void services.refetch()}
            >
              <Text style={styles.link}>Try again</Text>
            </Pressable>
          </View>
        )}
        {services.isSuccess && list.length === 0 && (
          <View style={styles.empty}>
            <Text style={styles.heading}>Your next booking starts here</Text>
            <Text style={styles.muted}>
              Add your first service to show clients what you offer.
            </Text>
          </View>
        )}
        {(showAll ? list : list.slice(0, 2)).map((service) => (
          <ServiceCard
            key={`${service.id}-${service.updatedAt}`}
            service={service}
            onEdit={() => setEditor(service)}
            onDelete={() => {
              deleteMutation.reset();
              setServiceToDelete(service);
            }}
          />
        ))}
        {showAll && services.hasNextPage && (
          <Pressable
            accessibilityRole="button"
            disabled={services.isFetchingNextPage}
            style={styles.feedback}
            onPress={() => void services.fetchNextPage()}
          >
            <Text style={styles.link}>
              {services.isFetchingNextPage ? "Loading…" : "Load more services"}
            </Text>
          </Pressable>
        )}
      </ScrollView>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Add service"
        onPress={() => setEditor("new")}
        style={styles.addButton}
      >
        <Add color={`${Colors.colors.WHITE}`} />
      </Pressable>
      <Modal
        visible={serviceToDelete !== null}
        transparent
        animationType="fade"
        onRequestClose={closeDeleteConfirmation}
      >
        <ConfirmationModal
          questionText={`Delete “${serviceToDelete?.title ?? "this service"}”? This cannot be undone.`}
          yesButton
          yesButtonText={deleteMutation.isPending ? "Deleting…" : deleteMutation.isError ? "Retry" : "Delete"}
          noButton
          noButtonText="Cancel"
          yesButtonFn={() => void confirmDelete()}
          noButtonFn={closeDeleteConfirmation}
          busy={deleteMutation.isPending}
          errorText={deleteMutation.error?.message}
        />
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
  cardContainer: { position: "relative" },
  deleteButton: { position: "absolute", top: 6, right: 6, width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center", backgroundColor: "#FFF0EB" },
  deleteIcon: { color: "#AD3527", fontSize: 28, lineHeight: 32 },
  pressed: { opacity: 0.5 },
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
    gap: 12,
    marginBottom: 28,
  },
  identity: { flex: 1 },
  name: {
    fontSize: 26,
    fontWeight: "700",
    color: "#302823",
  },
  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 6,
    marginTop: 6,
  },
  star: { color: "#FFAA28", fontSize: 19 },
  rating: { fontSize: 16, fontWeight: "600", color: "#302823" },
  muted: { color: "#A39791", fontSize: 14, lineHeight: 21 },
  // vendorBadge: {
  //   backgroundColor: "#FFF0EB",
  //   borderRadius: 10,
  //   paddingHorizontal: 10,
  //   paddingVertical: 7,
  // },
  // vendorText: { color: "#FF6755", fontSize: 12, fontWeight: "600" },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    marginBottom: 18,
  },
  heading: {
    color: "#302823",
    fontWeight: "700",
    fontSize: 25,
    flexShrink: 1,
  },
  link: { color: "#FF6755", fontSize: 15, fontWeight: "500" },
  card: {
    width: "100%",
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#EDE5DD",
    borderRadius: 24,
    padding: 16,
    marginBottom: 20,
  },
  cardTitle: {
    paddingRight: 40,
    fontSize: 18,
    lineHeight: 25,
    fontWeight: "600",
    color: "#302823",
    marginBottom: 16,
  },
  cover: {
    width: "100%",
    aspectRatio: 2.48,
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: "#F1EAE3",
  },
  placeholder: { alignItems: "center", justifyContent: "center", gap: 4 },
  placeholderIcon: { fontSize: 32, color: "#A39791" },
  cardFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    marginTop: 10,
  },
  price: { color: "#FF6755", fontSize: 18, fontWeight: "600", flex: 1 },
  menu: {
    minWidth: 44,
    minHeight: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  feedback: { paddingVertical: 20, alignItems: "center", gap: 10 },
  error: { color: "#A33125", textAlign: "center" },
  empty: { paddingVertical: 48, gap: 14 },
  fabContainer: {
    position: "absolute",
    bottom: 24,
    width: "100%",
    maxWidth: 736,
    alignSelf: "center",
    alignItems: "flex-end",
    paddingHorizontal: 24,
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
  panel: {
    padding: 7,
    borderRadius: 7,
    backgroundColor: "#FCFAF7",
    width: 100,
    gap: 10,
  },
  action: {
    backgroundColor: Colors.colors.CORAL,
    borderRadius: 5,
    padding: 5,
    alignItems: "center",
  },
  actionText: { color: "#FFFFFF", fontSize: 16, fontWeight: "600" },
});

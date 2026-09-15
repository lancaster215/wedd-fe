import type { EventProfile } from "@/hooks/api/eventsAPI";
import { Image } from "expo-image";
import { useEffect, useState } from "react";
import {
	Platform,
	Pressable,
	ScrollView,
	StyleSheet,
	Text,
	View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Add, ArrowLeft2, Calendar4, LocationAlt } from "reicon-react-native";

type EventDetailsProps = {
  event: EventProfile;
  onBack: () => void;
  onAddVendor: () => void;
};

// Count complete calendar months, then remaining days and hours.
function countdown(target: Date, now: Date) {
  if (target.getTime() <= now.getTime()) return [0, 0, 0];
  const addMonths = (months: number) => {
    const date = new Date(now);
    date.setDate(1);
    date.setMonth(date.getMonth() + months);
    const lastDay = new Date(
      date.getFullYear(),
      date.getMonth() + 1,
      0,
    ).getDate();
    date.setDate(Math.min(now.getDate(), lastDay));
    return date;
  };
  let months =
    (target.getFullYear() - now.getFullYear()) * 12 +
    target.getMonth() -
    now.getMonth();
  if (addMonths(months) > target) months -= 1;
  const hours = Math.max(
    0,
    Math.floor((target.getTime() - addMonths(months).getTime()) / 3600000),
  );
  return [months, Math.floor(hours / 24), hours % 24];
}

export default function EventDetails({
  event,
  onBack,
  onAddVendor,
}: EventDetailsProps) {
  const insets = useSafeAreaInsets();
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);
  const date = new Date(event.eventDate);
  if (
    typeof event.eventTime === "string" &&
    /^([01]\d|2[0-3]):[0-5]\d$/.test(event.eventTime)
  ) {
    const [hours, minutes] = event.eventTime.split(":").map(Number);
    date.setHours(hours, minutes, 0, 0);
  }
  const remaining = countdown(date, now);
  const money = new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    maximumFractionDigits: 2,
  });

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={{ paddingBottom: insets.bottom + 28 }}
      showsVerticalScrollIndicator={false}
    >
      <View style={[styles.hero, { paddingTop: insets.top + 24 }]}>
        <Image
          source={{
            uri:
              event.eventImage ||
              "https://images.unsplash.com/photo-1519741497674-611481863552?w=1200&auto=format&fit=crop&q=85",
          }}
          style={StyleSheet.absoluteFill}
          contentFit="cover"
          accessible={false}
        />
        <View style={styles.shade} />
        <View style={styles.heroContent}>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>
              {event.eventType.replace(/_/g, " ")}
            </Text>
          </View>
          <View style={styles.titleRow}>
            <Text style={styles.title}>{event.eventTitle}</Text>
          </View>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Back to events"
          onPress={onBack}
          style={[styles.back, { top: insets.top + 12 }]}
        >
          <ArrowLeft2 size={20} color="#FFFFFF" />
        </Pressable>
      </View>
      <View style={styles.body}>
        <View style={styles.countdown}>
          <Text style={styles.eyebrow}>
            {date <= now ? "EVENT DATE REACHED" : "TIME REMAINING"}
          </Text>
          <View style={styles.timeRow}>
            {remaining.map((value, index) => (
              <View key={index} style={styles.timeGroup}>
                {index > 0 && <Text style={styles.colon}>:</Text>}
                <View style={styles.timeUnit}>
                  <Text style={styles.timeValue}>
                    {String(value).padStart(2, "0")}
                  </Text>
                  <Text style={styles.timeLabel}>
                    {["Months", "Days", "Hours"][index]}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </View>
        <View style={styles.metadata}>
          <View style={styles.metaRow}>
            <Calendar4 size={20} color="#FF6755" />
            <Text style={styles.metaText}>
              {date.toLocaleDateString("en-US", {
                weekday: "long",
                month: "short",
                day: "numeric",
                year: "numeric",
              })}{" "}
              •{" "}
              {date.toLocaleTimeString("en-US", {
                hour: "numeric",
                minute: "2-digit",
              })}
            </Text>
          </View>
          <View style={styles.metaRow}>
            <LocationAlt size={20} color="#FF6755" />
            <Text style={styles.metaText}>{event.eventAddress}</Text>
          </View>
        </View>
        <View style={styles.section}>
          <View style={styles.sectionHeading}>
            <Text style={styles.sectionTitle}>Budget Tracker</Text>
            <Text style={styles.budget}>
              {money.format(Number(event.budget))}
            </Text>
          </View>
          <View style={styles.track} />
          <Text style={styles.muted}>
            Spending details aren’t available yet.
          </Text>
        </View>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Selected Vendors</Text>
          <View style={styles.emptyVendors}>
            <Text style={styles.muted}>
              No vendor selections available yet.
            </Text>
          </View>
          <Pressable
            accessibilityRole="button"
            onPress={onAddVendor}
            style={({ pressed }) => [
              styles.addVendor,
              pressed && styles.pressed,
            ]}
          >
            <Add size={18} color="#FF6755" />
            <Text style={styles.addVendorText}>Add Vendor</Text>
          </Pressable>
        </View>
      </View>
    </ScrollView>
  );
}

const serif = Platform.select({
  ios: "Georgia",
  android: "serif",
  default: "Georgia",
});
const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#FCFAF7" },
  hero: {
    minHeight: 260,
    justifyContent: "flex-end",
    backgroundColor: "#62594F",
  },
  shade: { ...StyleSheet.absoluteFill, backgroundColor: "rgba(20,15,12,0.5)" },
  heroContent: {
    padding: 24,
    width: "100%",
    maxWidth: 736,
    alignSelf: "center",
  },
  badge: {
    alignSelf: "flex-start",
    backgroundColor: "#FFF2E9",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
    marginBottom: 8,
  },
  badgeText: { color: "#FF6755", fontSize: 11, fontWeight: "600" },
  titleRow: { flexDirection: "row", alignItems: "flex-end", gap: 16 },
  title: {
    flex: 1,
    fontSize: 27,
    lineHeight: 31,
    fontWeight: "700",
    color: "white",
  },
  back: {
    position: "absolute",
    left: 24,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.18)",
    alignItems: "center",
    justifyContent: "center",
  },
  body: {
    padding: 24,
    gap: 24,
    width: "100%",
    maxWidth: 736,
    alignSelf: "center",
  },
  countdown: {
    borderWidth: 1,
    borderColor: "#EDE7E1",
    borderRadius: 16,
    backgroundColor: "white",
    padding: 18,
    alignItems: "center",
  },
  eyebrow: {
    fontSize: 12,
    fontWeight: "500",
    color: "#716761",
    marginBottom: 8,
  },
  timeRow: { flexDirection: "row" },
  timeGroup: { flexDirection: "row", alignItems: "flex-start" },
  timeUnit: { minWidth: 60, alignItems: "center" },
  timeValue: {
    fontSize: 32,
    fontWeight: "700",
    color: "#FF6755",
  },
  colon: { fontSize: 25, color: "#FF6755", paddingTop: 3 },
  timeLabel: { fontSize: 12, color: "#9B9089" },
  metadata: { gap: 14 },
  metaRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  metaText: { flex: 1, fontSize: 14, lineHeight: 21, color: "#302823" },
  section: { gap: 12 },
  sectionHeading: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 8,
  },
  sectionTitle: {
    fontWeight: "700",
    fontSize: 21,
    color: "#302823",
  },
  budget: { fontWeight: "600", fontSize: 16, color: "#302823" },
  track: { height: 8, borderRadius: 4, backgroundColor: "#EDE7E1" },
  muted: { fontSize: 13, lineHeight: 20, color: "#8A7E77" },
  emptyVendors: {
    padding: 18,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#EDE7E1",
    backgroundColor: "white",
  },
  addVendor: {
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#FF6755",
    borderRadius: 12,
    minHeight: 48,
  },
  addVendorText: { fontSize: 15, fontWeight: "500", color: "#FF6755" },
  pressed: { opacity: 0.6 },
});

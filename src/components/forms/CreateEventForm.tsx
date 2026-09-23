import { eventTypes } from "@/constants/eventTypes";
import { useAuth } from "@/context/auth-context";
import {
  useCreateEvent,
  useUpdateEvent,
  type EventProfile,
} from "@/hooks/api/eventsAPI";
import { zodResolver } from "@hookform/resolvers/zod";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { useState, type ReactElement } from "react";
import { Controller, useForm } from "react-hook-form";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  ArrowDown5,
  ArrowLeft2,
  Calendar4,
  Clock2,
  CloseCircle,
  Image3,
  LocationAlt,
} from "reicon-react-native";
import { z } from "zod";
import EventDateTimeInput from "./EventDateTimeInput";

function validDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  return (
    date.getFullYear() === year &&
    date.getMonth() === month - 1 &&
    date.getDate() === day
  );
}

const formSchema = z.object({
  eventTitle: z.string().trim().min(1, "Enter an event name."),
  eventType: z.enum(eventTypes),
  place: z.string().trim().min(1, "Enter a place or venue."),
  date: z.string().refine(validDate, "Enter a valid date (YYYY-MM-DD)."),
  time: z
    .string()
    .regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Use 24-hour time (HH:MM)."),
  budget: z
    .string()
    .trim()
    .refine(
      (value) =>
        /^(\d+|\d{1,3}(,\d{3})+)(\.\d{1,2})?$/.test(value) &&
        Number(value.replace(/,/g, "")) > 0 &&
        Number(value.replace(/,/g, "")) <= 9999999999.99,
      "Enter a positive budget with up to 2 decimal places.",
    ),
});
type FormData = z.infer<typeof formSchema>;

const typeLabel = (value: string) =>
  value
    .toLowerCase()
    .split("_")
    .map((word) => word[0].toUpperCase() + word.slice(1))
    .join(" ");

export default function CreateEventForm({
  onClose,
  event,
}: {
  onClose: () => void;
  event?: EventProfile;
}) {
  const { user } = useAuth();
  const [eventImage, setEventImage] = useState<string | undefined>(
    event?.eventImage ?? undefined,
  );
  const [pickingImage, setPickingImage] = useState(false);
  const [imageError, setImageError] = useState<string>();
  const [typesOpen, setTypesOpen] = useState(false);
  const createMutation = useCreateEvent();
  const updateMutation = useUpdateEvent();
  const mutation = event ? updateMutation : createMutation;
  const eventDate = event ? new Date(event.eventDate) : undefined;
  const pad = (value: number) => String(value).padStart(2, "0");
  const {
    control,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      eventTitle: event?.eventTitle ?? "",
      eventType: event ? z.enum(eventTypes).parse(event.eventType) : "WEDDING",
      place: event?.eventAddress ?? "",
      date: eventDate
        ? `${eventDate.getFullYear()}-${pad(eventDate.getMonth() + 1)}-${pad(eventDate.getDate())}`
        : "",
      time: eventDate
        ? `${pad(eventDate.getHours())}:${pad(eventDate.getMinutes())}`
        : "",
      budget: event ? String(event.budget) : "",
    },
  });
  const busy = isSubmitting || mutation.isPending || pickingImage;

  const pickImage = async () => {
    if (busy) return;
    setPickingImage(true);
    setImageError(undefined);
    try {
      if (Platform.OS !== "web") {
        const permission =
          await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!permission.granted) {
          setImageError(
            permission.canAskAgain
              ? "Allow photo access to choose a background image."
              : "Photo access is disabled. Enable it in your phone’s app settings, then try again.",
          );
          return;
        }
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsMultipleSelection: false,
        quality: 0.8,
      });
      if (!result.canceled && result.assets[0]) {
        setEventImage(result.assets[0].uri);
      }
    } catch {
      setImageError("Couldn’t open your gallery. Please try again.");
    } finally {
      setPickingImage(false);
    }
  };

  const submit = handleSubmit(async (values) => {
    if (!user?.email) {
      setError("root", {
        message: "Please sign in again before saving your event.",
      });
      return;
    }
    const [year, month, day] = values.date.split("-").map(Number);
    const [hour, minute] = values.time.split(":").map(Number);
    try {
      const input = {
        userName: user.email,
        eventTitle: values.eventTitle,
        eventType: values.eventType,
        eventAddress: values.place,
        eventTime: values.time,
        eventDate:
          eventDate &&
          values.date ===
            `${eventDate.getFullYear()}-${pad(eventDate.getMonth() + 1)}-${pad(eventDate.getDate())}` &&
          values.time ===
            `${pad(eventDate.getHours())}:${pad(eventDate.getMinutes())}`
            ? event!.eventDate
            : new Date(year, month - 1, day, hour, minute).toISOString(),
        budget: Number(values.budget.replace(/,/g, "")),
        ...(event
          ? { eventImage: eventImage ?? "" }
          : eventImage
            ? { eventImage }
            : {}),
      };
      if (event) {
        await updateMutation.mutateAsync({ id: event.id, input });
      } else {
        await createMutation.mutateAsync(input);
      }
      onClose();
    } catch {
      /* The mutation error is displayed below; retain all entered values. */
    }
  });

  const field = (
    name: Exclude<keyof FormData, "eventType">,
    label: string,
    placeholder: string,
    icon?: ReactElement,
  ) => (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <View style={[styles.inputBox, errors[name] && styles.invalid]}>
        {icon}
        {name === "budget" && <Text style={styles.currency}>₱</Text>}
        <Controller
          control={control}
          name={name}
          render={({ field: { value, onChange, onBlur } }) =>
            name === "date" || name === "time" ? (
              <EventDateTimeInput
                mode={name}
                value={value}
                disabled={busy}
                onChange={onChange}
                onBlur={onBlur}
              />
            ) : (
              <TextInput
                accessibilityLabel={label}
                editable={!busy}
                style={styles.input}
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                placeholder={placeholder}
                placeholderTextColor="#A89D97"
                keyboardType={name === "budget" ? "decimal-pad" : "default"}
                autoCapitalize={
                  name === "eventTitle" || name === "place"
                    ? "sentences"
                    : "none"
                }
              />
            )
          }
        />
      </View>
      {errors[name] && (
        <Text style={styles.error}>{errors[name]?.message}</Text>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.screen}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={styles.header}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Go back"
            disabled={busy}
            onPress={onClose}
          >
            <ArrowLeft2 />
          </Pressable>
          <Text style={styles.title}>
            {event ? "Edit Celebration" : "New Celebration"}
          </Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Close form"
            disabled={busy}
            onPress={onClose}
          >
            <CloseCircle />
          </Pressable>
        </View>
        <ScrollView
          contentContainerStyle={styles.form}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {field(
            "eventTitle",
            "Event Name",
            "e.g., Sophisticated Garden Wedding",
          )}
          <View style={styles.field}>
            <Text style={styles.label}>Event Type</Text>
            <Controller
              control={control}
              name="eventType"
              render={({ field: { value, onChange } }) => (
                <>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={`Event type: ${typeLabel(value)}`}
                    accessibilityState={{ expanded: typesOpen }}
                    disabled={busy}
                    onPress={() => setTypesOpen(!typesOpen)}
                    style={styles.inputBox}
                  >
                    <Text style={[styles.input, styles.selection]}>
                      {typeLabel(value)}
                    </Text>
                    <ArrowDown5 />
                  </Pressable>
                  {typesOpen && (
                    <View style={styles.options}>
                      <ScrollView
                        style={styles.optionsScroll}
                        nestedScrollEnabled
                        showsVerticalScrollIndicator
                        persistentScrollbar
                        indicatorStyle="black"
                        keyboardShouldPersistTaps="handled"
                      >
                        {eventTypes.map((type) => (
                          <Pressable
                            key={type}
                            accessibilityRole="radio"
                            accessibilityState={{ checked: type === value }}
                            onPress={() => {
                              onChange(type);
                              setTypesOpen(false);
                            }}
                            style={[
                              styles.option,
                              type === value && styles.selected,
                            ]}
                          >
                            <Text style={styles.optionText}>
                              {typeLabel(type)}
                            </Text>
                          </Pressable>
                        ))}
                      </ScrollView>
                    </View>
                  )}
                </>
              )}
            />
          </View>
          {field(
            "place",
            "Place / Venue",
            "e.g., Veranda Meadows, Antipolo",
            <LocationAlt />,
          )}
          <View style={styles.row}>
            {field("date", "Date", "YYYY-MM-DD", <Calendar4 />)}
            {field("time", "Time", "HH:MM", <Clock2 />)}
          </View>
          {field("budget", "Budget Allocation", "150,000")}
          <View>
            <Text style={styles.label}>Background Image (Optional)</Text>
            <Pressable
              style={styles.upload}
              accessibilityRole="button"
              accessibilityLabel={
                eventImage
                  ? "Change background image"
                  : "Choose background image"
              }
              accessibilityState={{ disabled: busy, busy: pickingImage }}
              disabled={busy}
              onPress={() => void pickImage()}
            >
              {pickingImage ? (
                <ActivityIndicator color="#FF6B52" />
              ) : eventImage ? (
                <Image
                  source={{ uri: eventImage }}
                  style={styles.imagePreview}
                  contentFit="cover"
                  accessibilityLabel="Selected event background"
                />
              ) : (
                <Image3 />
              )}
              <Text style={styles.uploadText}>
                {eventImage
                  ? "Tap to change background image"
                  : "Upload celebratory banner image"}
              </Text>
            </Pressable>
            {eventImage && (
              <Pressable
                accessibilityRole="button"
                disabled={busy}
                onPress={() => setEventImage(undefined)}
              >
                <Text style={styles.removeImage}>Remove image</Text>
              </Pressable>
            )}
            {imageError && (
              <Text accessibilityRole="alert" style={styles.error}>
                {imageError}
              </Text>
            )}
          </View>
          {errors.root && (
            <Text accessibilityRole="alert" style={styles.error}>
              {errors.root.message}
            </Text>
          )}
          {mutation.isError && (
            <Text accessibilityRole="alert" style={styles.error}>
              {mutation.error.message}
            </Text>
          )}
        </ScrollView>
        <View style={styles.footer}>
          <Pressable
            accessibilityRole="button"
            disabled={busy}
            accessibilityState={{ disabled: busy, busy }}
            onPress={() => void submit()}
            style={({ pressed }) => [
              styles.submit,
              (pressed || busy) && styles.dim,
            ]}
          >
            {busy ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.submitText}>
                {event ? "Save Changes" : "Create Event"}
              </Text>
            )}
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  imagePreview: { width: "100%", height: 160, borderRadius: 10 },
  removeImage: { color: "#AD3527", paddingVertical: 12, textAlign: "right" },
  flex: { flex: 1 },
  screen: { flex: 1, backgroundColor: "#FCFAF7" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    width: "100%",
    maxWidth: 640,
    alignSelf: "center",
  },
  iconButton: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 25,
    fontWeight: "700",
    color: "#302823",
  },
  form: {
    padding: 24,
    paddingTop: 8,
    paddingBottom: 32,
    gap: 20,
    width: "100%",
    maxWidth: 640,
    alignSelf: "center",
    flexGrow: 1,
  },
  field: { flex: 1, minWidth: 0 },
  label: { fontSize: 15, color: "#716761", marginBottom: 9, fontWeight: "500" },
  inputBox: {
    minHeight: 54,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#EDE7E1",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  input: {
    flex: 1,
    minWidth: 0,
    fontSize: 16,
    color: "#302823",
    paddingVertical: 15,
  },
  selection: { paddingVertical: 16 },
  row: { flexDirection: "row", gap: 14 },
  currency: { fontSize: 17, fontWeight: "700", color: "#302823" },
  invalid: { borderColor: "#C34332" },
  error: { fontSize: 13, color: "#AD3527", marginTop: 5 },
  options: {
    marginTop: 6,
    borderWidth: 1,
    borderColor: "#EDE7E1",
    borderRadius: 14,
    overflow: "hidden",
    backgroundColor: "white",
  },
  optionsScroll: { maxHeight: 44 * 5 },
  option: { height: 44, paddingHorizontal: 16, justifyContent: "center" },
  selected: { backgroundColor: "#FFF0EB" },
  optionText: { fontSize: 16, color: "#302823" },
  upload: {
    minHeight: 108,
    borderWidth: 2,
    borderStyle: "dashed",
    borderColor: "#EDE7E1",
    borderRadius: 14,
    backgroundColor: "white",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    padding: 16,
  },
  uploadText: { fontSize: 14, color: "#A89D97", textAlign: "center" },
  hint: { fontSize: 12, color: "#716761", textAlign: "center" },
  footer: {
    borderTopWidth: 1,
    borderColor: "#EDE7E1",
    backgroundColor: "white",
    paddingHorizontal: 24,
    paddingVertical: 14,
  },
  submit: {
    backgroundColor: "#FF6B52",
    borderRadius: 17,
    minHeight: 60,
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    maxWidth: 592,
    alignSelf: "center",
  },
  submitText: { color: "white", fontSize: 18, fontWeight: "600" },
  dim: { opacity: 0.6 },
});

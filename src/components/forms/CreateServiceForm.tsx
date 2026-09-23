import { useUpdateService, type ServiceProfile } from "@/hooks/api/servicesAPI";
import * as ImagePicker from "expo-image-picker";
import { useState } from "react";
import {
	ActivityIndicator,
	Platform,
	Pressable,
	ScrollView,
	StyleSheet,
	Text,
	TextInput,
	View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const categories = [
  "WEDDING_PLANNER",
  "FLORIST",
  "WEDDING_DESIGNER",
  "CATERER",
  "HOST_EMCEE",
  "PHOTOGRAPHER_VIDEOGRAPHER",
  "MAKEUP_HAIR",
  "CAKE_DESIGNER",
  "VENUE_PROVIDER",
  "ENTERTAINMENT",
  "TRANSPORTATION",
];
export default function CreateServiceForm({
  service,
  onClose,
}: {
  service?: ServiceProfile;
  onClose: () => void;
}) {
  const [title, setTitle] = useState(service?.title ?? "");
  const [category, setCategory] = useState(service?.category ?? categories[0]);
  const [description, setDescription] = useState(service?.description ?? "");
  const [price, setPrice] = useState(service?.price_model ?? "");
  const [assets, setAssets] = useState<ImagePicker.ImagePickerAsset[] | null>(
    null,
  );
  const [error, setError] = useState("");
  const save = useUpdateService();
  const [busy, setBusy] = useState(false);
  const pick = async () => {
    setError("");
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images", "videos"],
        allowsMultipleSelection: true,
        selectionLimit: 5,
      });
      if (result.canceled) return;
      if (
        result.assets.length > 5 ||
        result.assets.some(
          (asset) =>
            asset.fileSize !== undefined && asset.fileSize > 5 * 1024 * 1024,
        )
      ) {
        setError("Choose up to 5 images or videos, no larger than 5 MB each.");
        return;
      }
      setAssets(result.assets);
    } catch {
      setError("Couldn’t open your gallery. Please try again.");
    }
  };
  const submit = async () => {
    if (busy) return;
    if (!title.trim() || !description.trim() || !price.trim()) {
      setError("Complete the title, description, and price.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const body = new FormData();
      body.append("title", title.trim());
      body.append("category", category);
      body.append("description", description.trim());
      body.append("price_model", price.trim());
      if (assets !== null) {
        if (!assets.length) body.append("gallery", "[]");
        for (const asset of assets) {
          const name =
            asset.fileName ??
            `gallery.${asset.type === "video" ? "mp4" : "jpg"}`;
          if (Platform.OS === "web") {
            const blob = await (await fetch(asset.uri)).blob();
            if (blob.size > 5 * 1024 * 1024)
              throw new Error("Each file must be no larger than 5 MB.");
            body.append("gallery", blob, name);
          } else {
            body.append("gallery", {
              uri: asset.uri,
              name,
              type:
                asset.mimeType ??
                (asset.type === "video" ? "video/mp4" : "image/jpeg"),
            } as unknown as Blob);
          }
        }
      } else if (!service) body.append("gallery", "[]");
      await save.mutateAsync({ id: service?.id, body });
      onClose();
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Couldn’t save your service.",
      );
    } finally {
      setBusy(false);
    }
  };
  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <Pressable disabled={busy} accessibilityRole="button" onPress={onClose}>
          <Text style={styles.link}>‹ Back to services</Text>
        </Pressable>
        <Text style={styles.heading}>
          {service ? "Edit service" : "Create service"}
        </Text>
        <Text style={styles.label}>Title</Text>
        <TextInput
          accessibilityLabel="Service title"
          style={styles.input}
          value={title}
          onChangeText={setTitle}
          maxLength={200}
        />
        <Text style={styles.label}>Category</Text>
        <View style={styles.categories}>
          {categories.map((item) => (
            <Pressable
              key={item}
              accessibilityRole="radio"
              accessibilityState={{ checked: category === item }}
              onPress={() => setCategory(item)}
              style={[styles.chip, category === item && styles.selected]}
            >
              <Text style={category === item ? styles.white : styles.label}>
                {item.toLowerCase().replace(/_/g, " ")}
              </Text>
            </Pressable>
          ))}
        </View>
        <Text style={styles.label}>Description</Text>
        <TextInput
          accessibilityLabel="Service description"
          style={[styles.input, styles.description]}
          multiline
          value={description}
          onChangeText={setDescription}
          maxLength={10000}
        />
        <Text style={styles.label}>Price (PHP)</Text>
        <TextInput
          accessibilityLabel="Service price"
          style={styles.input}
          value={price}
          onChangeText={setPrice}
          placeholder="20,000 or 15,000 - 40,000"
        />
        <Text style={styles.label}>Gallery · Up to 5 files, 5 MB each</Text>
        <Pressable
          disabled={busy}
          accessibilityRole="button"
          style={styles.input}
          onPress={() => void pick()}
        >
          <Text style={styles.link}>
            {assets === null
              ? service
                ? `Replace gallery (${service.gallery.length} files)`
                : "Choose images or videos"
              : `Change selection (${assets.length} files)`}
          </Text>
        </Pressable>
        {assets?.map((asset, index) => (
          <Text key={`${asset.uri}-${index}`} style={styles.label}>
            {asset.fileName ?? `Media ${index + 1}`}
          </Text>
        ))}
        <Pressable
          disabled={busy}
          accessibilityRole="button"
          onPress={() => setAssets([])}
        >
          <Text style={styles.link}>Clear gallery</Text>
        </Pressable>
        {!!error && (
          <Text accessibilityLiveRegion="polite" style={styles.error}>
            {error}
          </Text>
        )}
        <Pressable
          disabled={busy}
          accessibilityRole="button"
          style={styles.submit}
          onPress={() => void submit()}
        >
          {busy ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={styles.white}>Save service</Text>
          )}
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#FCFAF7" },
  content: {
    padding: 24,
    paddingBottom: 80,
    gap: 12,
    maxWidth: 736,
    width: "100%",
    alignSelf: "center",
  },
  heading: {
    fontSize: 28,
    fontWeight: "700",
    color: "#302823",
    marginVertical: 12,
  },
  label: { color: "#796E68", fontSize: 14 },
  link: { color: "#FF6755", fontSize: 16 },
  input: {
    borderWidth: 1,
    borderColor: "#DED6CE",
    borderRadius: 12,
    padding: 14,
    backgroundColor: "white",
    color: "#302823",
    fontSize: 16,
  },
  description: { minHeight: 100, textAlignVertical: "top" },
  categories: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: { padding: 10, borderRadius: 10, backgroundColor: "#F0E9E2" },
  selected: { backgroundColor: "#FF6755" },
  white: { color: "white", fontWeight: "600" },
  error: { color: "#A33125" },
  submit: {
    marginTop: 12,
    padding: 18,
    backgroundColor: "#FF6755",
    borderRadius: 14,
    alignItems: "center",
  },
});

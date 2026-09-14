import { Pressable, StyleSheet, Text, View } from "react-native";

type ConfirmationModalProps = {
  questionText: string;
  yesButton: boolean;
  yesButtonText: string;
  noButton: boolean;
  noButtonText: string;
  yesButtonFn: () => void;
  noButtonFn: () => void;
  busy?: boolean;
  errorText?: string;
};

// Render inside a React Native Modal so the dialog shares its native host.
export default function ConfirmationModal({
  questionText,
  yesButton,
  yesButtonText,
  noButton,
  noButtonText,
  yesButtonFn,
  noButtonFn,
  busy = false,
  errorText,
}: ConfirmationModalProps) {
  return (
    <View style={styles.container}>
      <Pressable
        style={styles.backdrop}
        accessibilityRole="button"
        accessibilityLabel="Dismiss confirmation"
        onPress={noButtonFn}
        disabled={busy}
      />
      <View style={styles.panel} accessibilityViewIsModal>
        <Text style={styles.question}>{questionText}</Text>
        {errorText && <Text accessibilityRole="alert" style={styles.error}>{errorText}</Text>}
        <View style={styles.buttons}>
          {noButton && (
            <Pressable accessibilityRole="button" onPress={noButtonFn} disabled={busy}
              style={({ pressed }) => [styles.button, styles.noButton, pressed && styles.pressed]}>
              <Text style={styles.noText}>{noButtonText}</Text>
            </Pressable>
          )}
          {yesButton && (
            <Pressable accessibilityRole="button" onPress={yesButtonFn} disabled={busy} accessibilityState={{ disabled: busy, busy }}
              style={({ pressed }) => [styles.button, styles.yesButton, pressed && styles.pressed]}>
              <Text style={styles.yesText}>{yesButtonText}</Text>
            </Pressable>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", alignItems: "center", padding: 24 },
  backdrop: { ...StyleSheet.absoluteFill, backgroundColor: "rgba(0,0,0,0.4)" },
  panel: { width: "100%", maxWidth: 380, padding: 24, borderRadius: 20, backgroundColor: "#FCFAF7" },
  question: { fontSize: 20, lineHeight: 28, fontWeight: "600", color: "#302823", textAlign: "center", marginBottom: 24 },
  buttons: { flexDirection: "row", gap: 12 },
  button: { flex: 1, minHeight: 48, borderRadius: 12, padding: 12, alignItems: "center", justifyContent: "center" },
  noButton: { backgroundColor: "#EDE7E1" },
  yesButton: { backgroundColor: "#AD3527" },
  noText: { fontSize: 16, fontWeight: "600", color: "#302823" },
  yesText: { fontSize: 16, fontWeight: "600", color: "#FFFFFF" },
  pressed: { opacity: 0.6 },
  error: { color: "#AD3527", marginBottom: 16, textAlign: "center" },
});

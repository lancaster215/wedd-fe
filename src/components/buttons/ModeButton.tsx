import { Colors } from "@/constants/theme";
import { Pressable, StyleSheet, Text, View } from "react-native";

function ModeButton({
  active,
  label,
  onPress,
}: {
  active: boolean;
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={styles.modeButton}>
      <Text style={[styles.modeText, active && styles.modeTextActive]}>
        {label}
      </Text>
      <View
        style={[styles.modeUnderline, active && styles.modeUnderlineActive]}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  modeButton: { alignItems: "center", paddingTop: 4 },
  modeText: { color: "#9B918D", fontSize: 16, lineHeight: 24 },
  modeTextActive: { color: Colors.colors.CORAL },
  modeUnderline: {
    width: 40,
    height: 3,
    borderRadius: 2,
    marginTop: 8,
    backgroundColor: "transparent",
  },
  modeUnderlineActive: { backgroundColor: Colors.colors.CORAL },
});

export default ModeButton;

import { DateTimePicker } from "@expo/ui/community/datetime-picker";
import { useState } from "react";
import { Keyboard, Modal, Platform, Pressable, StyleSheet, Text, View } from "react-native";

export type EventDateTimeInputProps = {
  mode: "date" | "time";
  value: string;
  disabled: boolean;
  onChange: (value: string) => void;
  onBlur: () => void;
};

function pickerDate(mode: "date" | "time", value: string) {
  const date = new Date();
  if (value && mode === "date") {
    const [year, month, day] = value.split("-").map(Number);
    date.setFullYear(year, month - 1, day);
  } else if (value) {
    const [hours, minutes] = value.split(":").map(Number);
    date.setHours(hours, minutes, 0, 0);
  }
  return date;
}

export default function EventDateTimeInput({ mode, value, disabled, onChange, onBlur }: EventDateTimeInputProps) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(new Date());
  const close = () => { setOpen(false); onBlur(); };
  const confirm = (date: Date) => {
    const pad = (n: number) => String(n).padStart(2, "0");
    onChange(mode === "date"
      ? `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
      : `${pad(date.getHours())}:${pad(date.getMinutes())}`);
    close();
  };
  const formatted = value ? (mode === "date"
    ? pickerDate(mode, value).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })
    : pickerDate(mode, value).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })) : `Select ${mode}`;

  return <View style={styles.flex}>
    <Pressable accessibilityRole="button" accessibilityLabel={`${mode === "date" ? "Date" : "Time"}: ${formatted}`} disabled={disabled} onPress={() => {
      Keyboard.dismiss();
      setDraft(pickerDate(mode, value));
      setOpen(true);
    }} style={styles.trigger}>
      <Text style={[styles.value, !value && styles.placeholder]}>{formatted}</Text>
    </Pressable>
    {open && Platform.OS === "android" && <DateTimePicker value={draft} mode={mode} onValueChange={(_, date) => confirm(date)} onDismiss={close} />}
    {Platform.OS === "ios" && <Modal visible={open} transparent animationType="slide" onRequestClose={close}>
      <View style={styles.backdrop}>
        <Pressable style={StyleSheet.absoluteFill} accessibilityLabel="Dismiss picker" accessibilityRole="button" onPress={close} />
        <View style={styles.sheet} accessibilityViewIsModal>
          <View style={styles.toolbar}>
            <Pressable accessibilityRole="button" onPress={close} style={styles.action}><Text>Cancel</Text></Pressable>
            <Text style={styles.heading}>Select {mode}</Text>
            <Pressable accessibilityRole="button" onPress={() => confirm(draft)} style={styles.action}><Text style={styles.done}>Done</Text></Pressable>
          </View>
          <DateTimePicker value={draft} mode={mode} display={mode === "date" ? "inline" : "spinner"} themeVariant="light" onValueChange={(_, date) => setDraft(date)} />
        </View>
      </View>
    </Modal>}
  </View>;
}

const styles = StyleSheet.create({
  flex: { flex: 1, minWidth: 0 },
  trigger: { minHeight: 54, justifyContent: "center" },
  value: { fontSize: 16, color: "#302823" },
  placeholder: { color: "#A89D97" },
  backdrop: { flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,0.35)" },
  sheet: { backgroundColor: "white", borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 16, paddingBottom: 36 },
  toolbar: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  action: { padding: 12 },
  heading: { fontWeight: "600", color: "#302823" },
  done: { color: "#E8503C", fontWeight: "600" },
});

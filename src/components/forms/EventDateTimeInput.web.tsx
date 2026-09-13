import type { EventDateTimeInputProps } from "./EventDateTimeInput";

export default function EventDateTimeInput({ mode, value, disabled, onChange, onBlur }: EventDateTimeInputProps) {
  return <input
    type={mode}
    aria-label={mode === "date" ? "Date" : "Time"}
    value={value}
    disabled={disabled}
    onChange={event => onChange(event.currentTarget.value)}
    onBlur={onBlur}
    onClick={event => {
      // Browsers without showPicker still expose the native input control.
      try { event.currentTarget.showPicker?.(); } catch { /* Use the input's built-in picker button. */ }
    }}
    style={{ flex: 1, minWidth: 0, width: "100%", minHeight: 54, border: 0, background: "transparent", color: "#302823", font: "inherit", fontSize: 16 }}
  />;
}

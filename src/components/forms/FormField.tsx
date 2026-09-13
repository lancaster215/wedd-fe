import { Colors } from "@/constants/theme";
import {
  Controller,
  type Control,
  type FieldPath,
  type FieldValues,
} from "react-hook-form";
import {
  StyleSheet,
  Text,
  TextInput,
  View,
  type TextInputProps,
} from "react-native";

type FormFieldProps<TFieldValues extends FieldValues> = Pick<
  TextInputProps,
  "autoCapitalize" | "keyboardType"
> & {
  control: Control<TFieldValues>;
  error?: string;
  label: string;
  name: FieldPath<TFieldValues>;
  placeholder: string;
};

function FormField<TFieldValues extends FieldValues>({
  control,
  error,
  label,
  name,
  ...inputProps
}: FormFieldProps<TFieldValues>) {
  return (
    <View>
      <Text style={styles.label}>{label}</Text>
      <Controller
        control={control}
        name={name}
        render={({ field: { onBlur, onChange, value } }) => (
          <TextInput
            {...inputProps}
            onBlur={onBlur}
            onChangeText={onChange}
            placeholderTextColor="#a1a1a1"
            style={[styles.input, error && styles.inputError]}
            value={typeof value === "string" ? value : ""}
          />
        )}
      />
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  input: {
    height: 50,
    borderColor: "#E9E2DD",
    borderRadius: 12,
    borderWidth: 1,
    backgroundColor: "#FFFFFF",
    color: "#332E2B",
    fontSize: 15,
    paddingHorizontal: 15,
  },
  inputError: { borderColor: Colors.colors.CORAL },
  label: { color: "#625A56", fontSize: 14, lineHeight: 20, marginBottom: 7 },
  errorText: { color: Colors.colors.CORAL, fontSize: 12, marginTop: 5 },
});

export default FormField;

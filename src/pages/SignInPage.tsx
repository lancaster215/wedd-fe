import { Colors } from "@/constants/theme";
import { zodResolver } from "@hookform/resolvers/zod";
import { Image } from "expo-image";
import { Redirect } from "expo-router";
import { useState } from "react";
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
import * as z from "zod";

import ModeButton from "@/components/buttons/ModeButton";
import FormField from "@/components/forms/FormField";
import { useAuth } from "@/context/auth-context";
import loginAPI from "@/hooks/api/loginAPI";

type AuthMode = "login" | "signup";
type Role = "User" | "Vendor";

const formSchema = z.object({
  firstName: z.string(),
  lastName: z.string(),
  email: z.string().email("Enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type FormData = z.infer<typeof formSchema>;

export default function SignInPage() {
  const { isAuthenticated, isInitializing, signIn } = useAuth();
  const [mode, setMode] = useState<AuthMode>("login");
  const [role, setRole] = useState<Role>("User");
  const [passwordVisible, setPasswordVisible] = useState(false);
  const {
    control,
    handleSubmit,
    clearErrors,
    setError,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: { firstName: "", lastName: "", email: "", password: "" },
  });

  const changeMode = (nextMode: AuthMode) => {
    setMode(nextMode);
    clearErrors();
    reset();
  };

  const onSubmit = async (data: FormData) => {
    if (mode === "login") {
      const loginRes = await loginAPI(data);
      await signIn(loginRes.data);
      return;
    } else {
      if (!data.firstName.trim() && !data.lastName.trim()) {
        setError("firstName", { message: "Enter your first name" });
        return;
      }
      if (!data.lastName.trim()) {
        setError("lastName", { message: "Enter your last name" });
        return;
      }
    }
  };

  if (isInitializing) {
    return (
      <SafeAreaView style={styles.home}>
        <ActivityIndicator color={Colors.colors.CORAL} />
      </SafeAreaView>
    );
  }

  if (isAuthenticated) {
    return <Redirect href="/events" />;
  }

  return (
    <SafeAreaView style={styles.screen}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.flex}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.card}>
            <View style={styles.modeRow}>
              <ModeButton
                active={mode === "login"}
                label="Log In"
                onPress={() => changeMode("login")}
              />
              <ModeButton
                active={mode === "signup"}
                label="Sign Up"
                onPress={() => changeMode("signup")}
              />
            </View>

            <View style={styles.form}>
              {mode === "signup" && (
                <>
                  <FormField
                    control={control}
                    error={errors.firstName?.message}
                    label="First Name"
                    name="firstName"
                    placeholder="John"
                  />
                  <FormField
                    control={control}
                    error={errors.lastName?.message}
                    label="Last Name"
                    name="lastName"
                    placeholder="Does"
                  />
                </>
              )}

              <FormField
                autoCapitalize="none"
                control={control}
                error={errors.email?.message}
                keyboardType="email-address"
                label="Email Address"
                name="email"
                placeholder="john.d@example.com"
              />

              <View>
                <Text style={styles.label}>Password</Text>
                <Controller
                  control={control}
                  name="password"
                  render={({ field: { onBlur, onChange, value } }) => (
                    <View
                      style={[
                        styles.passwordInput,
                        errors.password && styles.inputError,
                      ]}
                    >
                      <TextInput
                        autoCapitalize="none"
                        onBlur={onBlur}
                        onChangeText={onChange}
                        placeholderTextColor="#403936"
                        secureTextEntry={!passwordVisible}
                        style={styles.passwordText}
                        value={value}
                      />
                      <Pressable
                        accessibilityLabel={
                          !passwordVisible ? "Hide password" : "Show password"
                        }
                        hitSlop={10}
                        onPress={() =>
                          setPasswordVisible((visible) => !visible)
                        }
                      >
                        {!passwordVisible ? (
                          <Image
                            source={require("@/assets/images/forms/password_hide.svg")}
                            style={styles.passwordIcon}
                          />
                        ) : (
                          <Image
                            source={require("@/assets/images/forms/password_show.svg")}
                            style={styles.passwordIcon}
                          />
                        )}
                      </Pressable>
                    </View>
                  )}
                />
                {errors.password && (
                  <Text style={styles.errorText}>
                    {errors.password.message}
                  </Text>
                )}
              </View>

              {mode === "signup" && (
                <View>
                  <Text style={styles.roleLabel}>I want to register as an</Text>
                  <View style={styles.roleRow}>
                    {(["User", "Vendor"] as Role[]).map((option) => (
                      <Pressable
                        accessibilityRole="radio"
                        accessibilityState={{ checked: role === option }}
                        key={option}
                        onPress={() => setRole(option)}
                        style={[
                          styles.roleButton,
                          role === option && styles.roleButtonActive,
                        ]}
                      >
                        <Text
                          style={[
                            styles.roleText,
                            role === option && styles.roleTextActive,
                          ]}
                        >
                          {option}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                </View>
              )}

              <Pressable
                accessibilityRole="button"
                onPress={handleSubmit(onSubmit)}
                style={({ pressed }) => [
                  styles.submitButton,
                  pressed && styles.pressed,
                ]}
              >
                <Text style={styles.submitText}>
                  {mode === "login" ? "Log In" : "Create Account"}
                </Text>
              </Pressable>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  screen: { flex: 1, backgroundColor: "#FCF9F6" },
  scrollContent: { flexGrow: 1, alignItems: "center" },
  card: {
    width: "100%",
    maxWidth: 480,
    paddingHorizontal: 28,
    paddingBottom: 36,
  },
  modeRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 96,
    marginBottom: 36,
  },

  form: { gap: 18 },
  label: { color: "#625A56", fontSize: 14, lineHeight: 20, marginBottom: 7 },
  passwordInput: {
    height: 50,
    borderColor: Colors.colors.OFFWHITE,
    borderRadius: 12,
    borderWidth: 1,
    backgroundColor: "Colors.colors.WHITE",
    flexDirection: "row",
    alignItems: "center",
    paddingLeft: 15,
    paddingRight: 14,
  },
  passwordText: { flex: 1, color: "#332E2B", fontSize: 15, paddingVertical: 0 },
  passwordIcon: { width: 19, height: 14 },
  inputError: { borderColor: Colors.colors.CORAL },
  errorText: { color: Colors.colors.CORAL, fontSize: 12, marginTop: 5 },
  roleLabel: { color: "#625A56", fontSize: 14, marginBottom: 9 },
  roleRow: { flexDirection: "row", gap: 9 },
  roleButton: {
    flex: 1,
    height: 42,
    alignItems: "center",
    justifyContent: "center",
    borderColor: Colors.colors.OFFWHITE,
    borderRadius: 10,
    borderWidth: 1,
    backgroundColor: "Colors.colors.WHITE",
  },
  roleButtonActive: {
    borderColor: Colors.colors.CORAL,
    borderWidth: 1.5,
    backgroundColor: "#FFF7F5",
  },
  roleText: { color: "#716864", fontSize: 14 },
  roleTextActive: { color: Colors.colors.CORAL, fontWeight: "600" },
  submitButton: {
    height: 54,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
    backgroundColor: Colors.colors.CORAL,
    marginTop: 1,
  },
  submitText: { color: Colors.colors.WHITE, fontSize: 16, fontWeight: "700" },
  pressed: { opacity: 0.82 },
  home: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FCF9F6",
    padding: 28,
  },
});

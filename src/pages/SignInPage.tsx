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

const loginSchema = z.object({
  firstName: z.string(),
  lastName: z.string(),
  email: z.string({ required_error: "Email is required" })
    .trim()
    .min(1, "Email cannot be empty")
    .email("Please provide a valid email address"),
  password: z.string({ required_error: "Password is required" })
    .min(1, "Password cannot be empty"),
  confirmPassword: z.string(),
});

const passwordRequirements = [
  { text: "At least 8 characters", test: (value: string) => value.length >= 8 },
  { text: "No more than 20 characters", test: (value: string) => value.length <= 20 },
  { text: "At least one uppercase letter", test: (value: string) => /[A-Z]/.test(value) },
  { text: "At least one lowercase letter", test: (value: string) => /[a-z]/.test(value) },
  { text: "At least one number", test: (value: string) => /[0-9]/.test(value) },
  { text: "At least one special character", test: (value: string) => /[^A-Za-z0-9]/.test(value) },
];

const signupSchema = loginSchema.extend({
  firstName: z.string().trim().min(1, "Enter your first name"),
  lastName: z.string().trim().min(1, "Enter your last name"),
  password: loginSchema.shape.password.superRefine((value, context) => {
    passwordRequirements.forEach((requirement) => {
      if (!requirement.test(value)) {
        context.addIssue({ code: z.ZodIssueCode.custom, message: requirement.text });
      }
    });
  }),
  confirmPassword: z.string().min(1, "Please confirm your password"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

type FormData = z.infer<typeof loginSchema>;

export default function SignInPage() {
  const { isAuthenticated, isInitializing, signIn, user } = useAuth();
  const [mode, setMode] = useState<AuthMode>("login");
  const [role, setRole] = useState<Role>("User");
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [loginErrorText, setLoginErrorText] = useState("");
  const formSchema = mode === "login" ? loginSchema : signupSchema;
  const {
    control,
    handleSubmit,
    clearErrors,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    mode: "onTouched",
    defaultValues: { firstName: "", lastName: "", email: "", password: "", confirmPassword: "" },
  });

  const values = watch();
  const submitDisabled = isSubmitting;

  const changeMode = (nextMode: AuthMode) => {
    setPasswordVisible(false);
    setRole("User");
    setPasswordFocused(false);
    setLoginErrorText("");
    setMode(nextMode);
    clearErrors();
    reset();
  };

  const onSubmit = async (data: FormData) => {
    setLoginErrorText("");
    if (mode === "login") {
      try {
        const loginRes = await loginAPI(data);

        //Save session
        await signIn(loginRes.data);
      } catch (e) {
        setLoginErrorText(
          e instanceof Error ? e.message : "Couldn’t log in. Please try again.",
        );
      }

      return;
    }
  };

  const submitAndClear = async () => {
    try {
      await handleSubmit(onSubmit)();
    } finally {
      // Clear inputs after every attempt while keeping validation/API feedback visible.
      reset(undefined, { keepErrors: true });
      setPasswordVisible(false);
      setPasswordFocused(false);
      setRole("User");
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
    return <Redirect href={user?.role === "VENDOR" ? "/dashboard" : "/events"} />;
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
            <View style={styles.branding}>
              <Image
                source={require("@/assets/images/logo-mark.svg")}
                style={styles.brandLogo}
                contentFit="contain"
                accessible={false}
              />
              <Text accessibilityRole="header" style={styles.brandName}>ganap</Text>
              <Text style={styles.brandTagline}>Where word-of-mouth expedite.</Text>
            </View>
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
                        onFocus={() => setPasswordFocused(true)}
                        onBlur={() => {
                          setPasswordFocused(false);
                          onBlur();
                        }}
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
                <>
                  {mode === "login" && errors.password && (
                    <Text style={styles.errorText}>
                      {errors.password.message}
                    </Text>
                  )}
                  {mode === "login" && loginErrorText !== "" && (
                    <Text
                      accessibilityRole="alert"
                      accessibilityLiveRegion="polite"
                      style={styles.errorText}
                    >
                      {loginErrorText}
                    </Text>
                  )}
                </>
                {mode === "signup" && (
                  <>
                    {passwordFocused && <View style={styles.passwordRequirements}>
                      {passwordRequirements.map((requirement) => {
                        const passed = values.password.length > 0 && requirement.test(values.password);
                        return (
                          <Text
                            key={requirement.text}
                            accessibilityLabel={`${requirement.text}: ${passed ? "met" : "not met"}`}
                            style={[styles.passwordRequirement, passed ? styles.requirementMet : styles.requirementUnmet]}
                          >
                            {passed ? "✓" : "•"} {requirement.text}
                          </Text>
                        );
                      })}
                    </View>}
                    <Text style={styles.label}>Confirm Password</Text>
                    <Controller
                      control={control}
                      name="confirmPassword"
                      render={({ field: { onBlur, onChange, value } }) => (
                        <View
                          style={[
                            styles.passwordInput,
                            errors.confirmPassword && styles.inputError,
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
                              !passwordVisible
                                ? "Hide password"
                                : "Show password"
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
                    {errors.confirmPassword && (
                      <Text style={styles.errorText}>{errors.confirmPassword.message}</Text>
                    )}
                  </>
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
                onPress={() => void submitAndClear()}
                disabled={submitDisabled}
                accessibilityState={{
                  disabled: submitDisabled,
                  busy: isSubmitting,
                }}
                style={({ pressed }) => [
                  styles.submitButton,
                  pressed && styles.pressed,
                  submitDisabled && styles.submitDisabled,
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
  branding: {
    alignItems: "center",
    paddingTop: 20,
    marginBottom: 16,
  },
  brandLogo: { width: 48, height: 48 },
  brandName: {
    fontFamily: Platform.select({ ios: "Georgia", android: "serif", default: "Georgia" }),
    fontSize: 34,
    fontWeight: "700",
    color: "#302823",
    marginTop: 8,
  },
  brandTagline: {
    fontSize: 14,
    lineHeight: 20,
    color: "#716761",
    textAlign: "center",
    marginTop: 4,
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
  passwordRequirements: { gap: 4, marginTop: 8, marginBottom: 16 },
  passwordRequirement: { fontSize: 12, lineHeight: 18 },
  requirementMet: { color: "#287A45" },
  requirementUnmet: { color: "#B42318" },
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
  submitDisabled: { opacity: 0.45 },
  home: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FCF9F6",
    padding: 28,
  },
});

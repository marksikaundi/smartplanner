import { account } from "@/lib/appwrite";
import { Feather } from "@expo/vector-icons";
import * as Linking from "expo-linking";
import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import {
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function LoginScreen() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>(
    {},
  );
  const gridLines = useMemo(
    () => Array.from({ length: 6 }, (_, index) => index),
    [],
  );

  const validateEmail = (value: string) => /\S+@\S+\.\S+/.test(value.trim());

  const validateForm = () => {
    const nextErrors: { email?: string; password?: string } = {};

    if (!email.trim()) {
      nextErrors.email = "Email is required.";
    } else if (!validateEmail(email)) {
      nextErrors.email = "Enter a valid email address.";
    }

    if (!password) {
      nextErrors.password = "Password is required.";
    } else if (password.length < 6) {
      nextErrors.password = "Password must be at least 6 characters.";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleLogin = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      setIsSubmitting(true);
      try {
        await account.getSession("current");
        router.replace("/(tabs)");
        return;
      } catch {
        // No active session yet.
      }
      await account.createEmailPasswordSession(email.trim(), password);
      router.replace("/(tabs)");
    } catch (error) {
      const message =
        typeof error === "object" && error && "message" in error
          ? String(error.message)
          : "Unable to log in right now.";
      Alert.alert("Login failed", message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email.trim()) {
      setErrors((current) => ({
        ...current,
        email: "Enter your email to reset your password.",
      }));
      return;
    }

    if (!validateEmail(email)) {
      setErrors((current) => ({
        ...current,
        email: "Enter a valid email address.",
      }));
      return;
    }

    try {
      setIsSubmitting(true);
      const recoveryUrl = Linking.createURL("/reset-password");
      await account.createRecovery(email.trim(), recoveryUrl);
      Alert.alert("Check your inbox", "We sent a recovery link to your email.");
    } catch (error) {
      const message =
        typeof error === "object" && error && "message" in error
          ? String(error.message)
          : "Unable to send recovery email.";
      Alert.alert("Reset failed", message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.headerBackground}>
        <View pointerEvents="none" style={styles.grid}>
          {gridLines.map((line) => (
            <View
              key={`v-${line}`}
              style={[styles.gridLineVertical, { left: `${(line + 1) * 14}%` }]}
            />
          ))}
          {gridLines.map((line) => (
            <View
              key={`h-${line}`}
              style={[
                styles.gridLineHorizontal,
                { top: `${(line + 1) * 12}%` },
              ]}
            />
          ))}
        </View>
      </View>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View style={styles.logoWrap}>
            <Image
              source={require("@/assets/images/icon.png")}
              style={styles.logoImage}
              resizeMode="contain"
              accessibilityLabel="ICU Study logo"
            />
          </View>
          <Text style={styles.headerSubtitle}>
            Create your account and simplify your workflow instantly.
          </Text>
        </View>

        <View style={styles.card}>
          <View style={styles.segment}>
            <Pressable style={[styles.segmentButton, styles.segmentActive]}>
              <Text style={[styles.segmentText, styles.segmentActiveText]}>
                Login
              </Text>
            </Pressable>
            <Pressable
              style={styles.segmentButton}
              onPress={() => router.push("/sign-up")}
            >
              <Text style={styles.segmentText}>Sign Up</Text>
            </Pressable>
          </View>

          <Text style={styles.label}>Email</Text>
          <TextInput
            placeholder="wadewarren@gmail.com"
            placeholderTextColor="#96A6AA"
            style={[styles.input, errors.email ? styles.inputError : null]}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            value={email}
            onChangeText={(value) => {
              setEmail(value);
              if (errors.email) {
                setErrors((current) => ({ ...current, email: undefined }));
              }
            }}
            onBlur={() => {
              if (email && !validateEmail(email)) {
                setErrors((current) => ({
                  ...current,
                  email: "Enter a valid email address.",
                }));
              }
            }}
          />
          {errors.email ? (
            <Text style={styles.errorText}>{errors.email}</Text>
          ) : null}

          <Text style={styles.label}>Password</Text>
          <View style={styles.inputRow}>
            <TextInput
              placeholder="xxxxxxxx"
              placeholderTextColor="#96A6AA"
              style={[
                styles.input,
                styles.inputWithIcon,
                errors.password ? styles.inputError : null,
              ]}
              secureTextEntry={!showPassword}
              value={password}
              onChangeText={(value) => {
                setPassword(value);
                if (errors.password) {
                  setErrors((current) => ({ ...current, password: undefined }));
                }
              }}
            />
            <Pressable
              onPress={() => setShowPassword((value) => !value)}
              style={styles.iconButton}
              accessibilityLabel={
                showPassword ? "Hide password" : "Show password"
              }
            >
              <Feather
                name={showPassword ? "eye" : "eye-off"}
                size={18}
                color="#7D8C90"
              />
            </Pressable>
          </View>
          {errors.password ? (
            <Text style={styles.errorText}>{errors.password}</Text>
          ) : null}

          <View style={styles.rememberRow}>
            <Pressable
              style={styles.checkboxWrap}
              onPress={() => setRememberMe((value) => !value)}
              accessibilityLabel="Remember me"
              accessibilityRole="checkbox"
              accessibilityState={{ checked: rememberMe }}
            >
              <View
                style={[
                  styles.checkbox,
                  rememberMe ? styles.checkboxChecked : null,
                ]}
              >
                {rememberMe ? (
                  <Feather name="check" size={12} color="#0F2D33" />
                ) : null}
              </View>
              <Text style={styles.rememberText}>Remember Me</Text>
            </Pressable>
            <Pressable onPress={handleForgotPassword}>
              <Text style={styles.forgotText}>Forgot Password?</Text>
            </Pressable>
          </View>

          <Pressable
            style={[
              styles.primaryButton,
              isSubmitting ? styles.primaryButtonDisabled : null,
            ]}
            onPress={handleLogin}
            disabled={isSubmitting}
          >
            <Text style={styles.primaryButtonText}>Login</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#1A4650",
  },
  headerBackground: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#1A4650",
  },
  grid: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.14,
  },
  gridLineVertical: {
    position: "absolute",
    width: 1,
    height: "100%",
    backgroundColor: "#9BC1C7",
  },
  gridLineHorizontal: {
    position: "absolute",
    height: 1,
    width: "100%",
    backgroundColor: "#9BC1C7",
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 36,
    paddingBottom: 40,
  },
  header: {
    paddingTop: 8,
    paddingBottom: 24,
  },
  logoWrap: {
    alignItems: "center",
    width: "100%",
    marginBottom: 18,
  },
  logoImage: {
    width: 72,
    height: 72,
  },
  headerTitle: {
    color: "#F3FAFB",
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 10,
  },
  headerSubtitle: {
    color: "rgba(255, 255, 255, 0.72)",
    fontSize: 14,
    lineHeight: 20,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 22,
    padding: 20,
    shadowColor: "#0F2D33",
    shadowOpacity: 0.12,
    shadowOffset: { width: 0, height: 10 },
    shadowRadius: 18,
    elevation: 6,
  },
  segment: {
    flexDirection: "row",
    backgroundColor: "#F1F4F5",
    borderRadius: 16,
    padding: 4,
    marginBottom: 18,
  },
  segmentButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 14,
    alignItems: "center",
  },
  segmentText: {
    color: "#9AA8AC",
    fontSize: 14,
    fontWeight: "600",
  },
  segmentActive: {
    backgroundColor: "#FFFFFF",
  },
  segmentActiveText: {
    color: "#1C3E45",
  },
  label: {
    color: "#829497",
    fontSize: 12,
    fontWeight: "600",
    marginBottom: 6,
  },
  inputRow: {
    position: "relative",
  },
  input: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E6ECEE",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: "#1F2D32",
    marginBottom: 14,
  },
  inputError: {
    borderColor: "#E38B8B",
  },
  errorText: {
    color: "#C94C4C",
    fontSize: 12,
    marginBottom: 10,
  },
  inputWithIcon: {
    paddingRight: 44,
  },
  iconButton: {
    position: "absolute",
    right: 12,
    top: 12,
  },
  rememberRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 18,
  },
  checkboxWrap: {
    flexDirection: "row",
    alignItems: "center",
  },
  checkbox: {
    width: 18,
    height: 18,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: "#CBD5D8",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 8,
    backgroundColor: "#FFFFFF",
  },
  checkboxChecked: {
    backgroundColor: "#E3F1F3",
    borderColor: "#B3D3D8",
  },
  rememberText: {
    color: "#8B9A9D",
    fontSize: 12,
  },
  forgotText: {
    color: "#1C3E45",
    fontSize: 12,
    fontWeight: "600",
  },
  primaryButton: {
    backgroundColor: "#1A4650",
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
    marginBottom: 18,
  },
  primaryButtonDisabled: {
    opacity: 0.6,
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
  },
});

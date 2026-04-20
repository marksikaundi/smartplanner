import HugeiconsIcon from "@/components/hugeicons-icon";
import { account } from "@/lib/appwrite";
import {
  ArrowLeft01Icon,
  EyeIcon,
  ViewOffIcon,
} from "@hugeicons/core-free-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useMemo, useState } from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function ResetPasswordScreen() {
  const router = useRouter();
  const { userId, secret } = useLocalSearchParams<{
    userId?: string;
    secret?: string;
  }>();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<{ password?: string; confirm?: string }>(
    {},
  );
  const gridLines = useMemo(
    () => Array.from({ length: 6 }, (_, index) => index),
    [],
  );

  const validateForm = () => {
    const nextErrors: { password?: string; confirm?: string } = {};

    if (!password) {
      nextErrors.password = "Password is required.";
    } else if (password.length < 6) {
      nextErrors.password = "Password must be at least 6 characters.";
    }

    if (!confirmPassword) {
      nextErrors.confirm = "Confirm your password.";
    } else if (confirmPassword !== password) {
      nextErrors.confirm = "Passwords do not match.";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleReset = async () => {
    if (!validateForm()) {
      return;
    }

    if (!userId || !secret) {
      Alert.alert("Invalid link", "This recovery link is missing information.");
      return;
    }

    try {
      setIsSubmitting(true);
      await account.updateRecovery(userId, secret, password, confirmPassword);
      Alert.alert("Success", "Password updated. Please log in.", [
        {
          text: "OK",
          onPress: () => router.replace("/"),
        },
      ]);
    } catch (error) {
      const message =
        typeof error === "object" && error && "message" in error
          ? String(error.message)
          : "Unable to reset your password.";
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
          <Pressable
            style={styles.backButton}
            accessibilityLabel="Go back"
            onPress={() => router.back()}
          >
            <HugeiconsIcon icon={ArrowLeft01Icon} size={18} color="#D8E6E9" />
          </Pressable>
          <Text style={styles.headerTitle}>Reset your password</Text>
          <Text style={styles.headerSubtitle}>
            Enter a new password to regain access to your account.
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.label}>New Password</Text>
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
              <HugeiconsIcon
                icon={showPassword ? EyeIcon : ViewOffIcon}
                size={18}
                color="#7D8C90"
              />
            </Pressable>
          </View>
          {errors.password ? (
            <Text style={styles.errorText}>{errors.password}</Text>
          ) : null}

          <Text style={styles.label}>Confirm Password</Text>
          <View style={styles.inputRow}>
            <TextInput
              placeholder="xxxxxxxx"
              placeholderTextColor="#96A6AA"
              style={[
                styles.input,
                styles.inputWithIcon,
                errors.confirm ? styles.inputError : null,
              ]}
              secureTextEntry={!showConfirm}
              value={confirmPassword}
              onChangeText={(value) => {
                setConfirmPassword(value);
                if (errors.confirm) {
                  setErrors((current) => ({ ...current, confirm: undefined }));
                }
              }}
            />
            <Pressable
              onPress={() => setShowConfirm((value) => !value)}
              style={styles.iconButton}
              accessibilityLabel={
                showConfirm ? "Hide password" : "Show password"
              }
            >
              <HugeiconsIcon
                icon={showConfirm ? EyeIcon : ViewOffIcon}
                size={18}
                color="#7D8C90"
              />
            </Pressable>
          </View>
          {errors.confirm ? (
            <Text style={styles.errorText}>{errors.confirm}</Text>
          ) : null}

          <Pressable
            style={[
              styles.primaryButton,
              isSubmitting ? styles.primaryButtonDisabled : null,
            ]}
            onPress={handleReset}
            disabled={isSubmitting}
          >
            <Text style={styles.primaryButtonText}>Update Password</Text>
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
    paddingBottom: 40,
  },
  header: {
    paddingTop: 12,
    paddingBottom: 24,
  },
  backButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 18,
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
  inputWithIcon: {
    paddingRight: 44,
  },
  inputError: {
    borderColor: "#E38B8B",
  },
  errorText: {
    color: "#C94C4C",
    fontSize: 12,
    marginBottom: 10,
  },
  iconButton: {
    position: "absolute",
    right: 12,
    top: 12,
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

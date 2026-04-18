import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import {
  Alert,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { account, ID } from "@/lib/appwrite";

export default function SignUpScreen() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<{
    firstName?: string;
    lastName?: string;
    email?: string;
    password?: string;
    confirmPassword?: string;
  }>({});
  const gridLines = useMemo(
    () => Array.from({ length: 6 }, (_, index) => index),
    [],
  );

  const validateEmail = (value: string) => /\S+@\S+\.\S+/.test(value.trim());

  const validateForm = () => {
    const nextErrors: {
      firstName?: string;
      lastName?: string;
      email?: string;
      password?: string;
      confirmPassword?: string;
    } = {};

    if (!firstName.trim()) {
      nextErrors.firstName = "First name is required.";
    }

    if (!lastName.trim()) {
      nextErrors.lastName = "Last name is required.";
    }

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

    if (!confirmPassword) {
      nextErrors.confirmPassword = "Confirm your password.";
    } else if (confirmPassword !== password) {
      nextErrors.confirmPassword = "Passwords do not match.";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSignUp = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      setIsSubmitting(true);
      const fullName = `${firstName.trim()} ${lastName.trim()}`.trim();
      await account.create(ID.unique(), email.trim(), password, fullName);
      await account.createEmailPasswordSession(email.trim(), password);
      Alert.alert("Success", "Account created successfully.");
    } catch (error) {
      const message =
        typeof error === "object" && error && "message" in error
          ? String(error.message)
          : "Unable to create your account right now.";
      Alert.alert("Sign up failed", message);
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
            <Feather name="arrow-left" size={18} color="#D8E6E9" />
          </Pressable>
          <Text style={styles.headerTitle}>
            Sign up now to access your personal account
          </Text>
          <Text style={styles.headerSubtitle}>
            Sign up to access your account and exclusive features.
          </Text>
        </View>

        <View style={styles.card}>
          <View style={styles.segment}>
            <Pressable
              style={styles.segmentButton}
              onPress={() => router.replace("/")}
            >
              <Text style={styles.segmentText}>Log In</Text>
            </Pressable>
            <Pressable style={[styles.segmentButton, styles.segmentActive]}>
              <Text style={[styles.segmentText, styles.segmentActiveText]}>
                Sign Up
              </Text>
            </Pressable>
          </View>

          <View style={styles.nameRow}>
            <View style={styles.nameField}>
              <Text style={styles.label}>First Name</Text>
              <TextInput
                placeholder="Wade"
                placeholderTextColor="#96A6AA"
                style={[
                  styles.input,
                  errors.firstName ? styles.inputError : null,
                ]}
                value={firstName}
                onChangeText={(value) => {
                  setFirstName(value);
                  if (errors.firstName) {
                    setErrors((current) => ({
                      ...current,
                      firstName: undefined,
                    }));
                  }
                }}
              />
              {errors.firstName ? (
                <Text style={styles.errorText}>{errors.firstName}</Text>
              ) : null}
            </View>
            <View style={styles.nameField}>
              <Text style={styles.label}>Last Name</Text>
              <TextInput
                placeholder="Warren"
                placeholderTextColor="#96A6AA"
                style={[
                  styles.input,
                  errors.lastName ? styles.inputError : null,
                ]}
                value={lastName}
                onChangeText={(value) => {
                  setLastName(value);
                  if (errors.lastName) {
                    setErrors((current) => ({
                      ...current,
                      lastName: undefined,
                    }));
                  }
                }}
              />
              {errors.lastName ? (
                <Text style={styles.errorText}>{errors.lastName}</Text>
              ) : null}
            </View>
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

          <Text style={styles.label}>Confirm Password</Text>
          <View style={styles.inputRow}>
            <TextInput
              placeholder="xxxxxxxx"
              placeholderTextColor="#96A6AA"
              style={[
                styles.input,
                styles.inputWithIcon,
                errors.confirmPassword ? styles.inputError : null,
              ]}
              secureTextEntry={!showConfirm}
              value={confirmPassword}
              onChangeText={(value) => {
                setConfirmPassword(value);
                if (errors.confirmPassword) {
                  setErrors((current) => ({
                    ...current,
                    confirmPassword: undefined,
                  }));
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
              <Feather
                name={showConfirm ? "eye" : "eye-off"}
                size={18}
                color="#7D8C90"
              />
            </Pressable>
          </View>
          {errors.confirmPassword ? (
            <Text style={styles.errorText}>{errors.confirmPassword}</Text>
          ) : null}

          <Pressable
            style={[
              styles.primaryButton,
              isSubmitting ? styles.primaryButtonDisabled : null,
            ]}
            onPress={handleSignUp}
            disabled={isSubmitting}
          >
            <Text style={styles.primaryButtonText}>Register</Text>
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
  nameRow: {
    flexDirection: "row",
    gap: 12,
  },
  nameField: {
    flex: 1,
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
  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
  },
});

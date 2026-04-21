import HugeiconsIcon from "@/components/hugeicons-icon";
import { account } from "@/lib/appwrite";
import { EyeIcon, Tick01Icon, ViewOffIcon } from "@hugeicons/core-free-icons";
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
    import { Redirect } from "expo-router";

    export default function Index() {
      return <Redirect href="/(tabs)" />;
    }
      Alert.alert("Login failed", message);

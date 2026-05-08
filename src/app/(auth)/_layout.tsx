import { Redirect, Stack } from "expo-router";
import { useAuthStore } from "@/state/auth-store";

export default function AuthLayout() {
  const { userId, isGuest, onboardingDone } = useAuthStore();

  if (userId || isGuest) {
    if (!onboardingDone) return <Redirect href="/(onboarding)" />;
    return <Redirect href="/(tabs)" />;
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}

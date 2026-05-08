import { Redirect, Stack } from "expo-router";
import { useAuthStore } from "@/state/auth-store";

export default function OnboardingLayout() {
  const { userId, isGuest, onboardingDone } = useAuthStore();

  if (!userId && !isGuest) return <Redirect href="/(auth)/sign-in" />;
  if (onboardingDone) return <Redirect href="/(tabs)" />;

  return <Stack screenOptions={{ headerShown: false }} />;
}

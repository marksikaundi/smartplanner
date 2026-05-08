import { Redirect, Slot } from "expo-router";
import { useAuthStore } from "@/state/auth-store";

export default function ChatLayout() {
  const { userId, isGuest, onboardingDone } = useAuthStore();

  if (!userId && !isGuest) return <Redirect href="/(auth)/sign-in" />;
  if (!onboardingDone) return <Redirect href="/(onboarding)" />;

  return <Slot />;
}

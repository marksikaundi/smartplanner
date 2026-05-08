import { useRootNavigationState, useRouter, useSegments } from "expo-router";
import { useEffect } from "react";
import { useAuthStore } from "@/src/state/auth-store";

export const useAuthRedirect = () => {
  const router = useRouter();
  const segments = useSegments();
  const navigationState = useRootNavigationState();
  const { userId, isGuest, onboardingDone } = useAuthStore();

  useEffect(() => {
    // Avoid router.replace before the root Stack has mounted (Expo Router requirement).
    if (!navigationState?.key) return;

    const root = segments[0];
    const inAuth = root === "(auth)";
    const inOnboarding = root === "(onboarding)";

    if (!userId && !isGuest && !inAuth) {
      router.replace("/(auth)/sign-in");
      return;
    }

    if ((userId || isGuest) && !onboardingDone && !inOnboarding) {
      router.replace("/(onboarding)");
      return;
    }

    if ((userId || isGuest) && onboardingDone && (inAuth || inOnboarding)) {
      router.replace("/(tabs)");
    }
  }, [userId, isGuest, onboardingDone, segments, router, navigationState?.key]);
};

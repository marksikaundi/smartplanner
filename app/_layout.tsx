import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { Stack, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import "react-native-reanimated";

import { account } from "@/lib/appwrite";
import { useColorScheme } from "@/hooks/use-color-scheme";

export const unstable_settings = {
  anchor: "(tabs)",
};

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const router = useRouter();
  const segments = useSegments();
  const [isChecking, setIsChecking] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    let isActive = true;

    const checkSession = async () => {
      try {
        await account.get();
        if (isActive) {
          setIsAuthenticated(true);
        }
      } catch {
        if (isActive) {
          setIsAuthenticated(false);
        }
      } finally {
        if (isActive) {
          setIsChecking(false);
        }
      }
    };

    checkSession();

    return () => {
      isActive = false;
    };
  }, []);

  useEffect(() => {
    if (isChecking) {
      return;
    }

    const inTabs = segments[0] === "(tabs)";
    const inAuthScreens =
      segments.length === 0 ||
      segments[0] === "sign-up" ||
      segments[0] === "reset-password";

    if (!isAuthenticated && inTabs) {
      router.replace("/");
      return;
    }

    if (isAuthenticated && inAuthScreens) {
      router.replace("/(tabs)");
    }
  }, [isAuthenticated, isChecking, router, segments]);

  if (isChecking) {
    return null;
  }

  return (
    <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="sign-up" options={{ headerShown: false }} />
        <Stack.Screen name="reset-password" options={{ headerShown: false }} />
        <Stack.Screen
          name="modal"
          options={{ presentation: "modal", title: "Modal" }}
        />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}

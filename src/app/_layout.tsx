import { DarkTheme, DefaultTheme, ThemeProvider } from "@react-navigation/native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import "react-native-reanimated";
import "../../global.css";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { AppProvider } from "@/providers/app-provider";
import { useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/state/auth-store";

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const { setAuth, signOut, hydrateFromSession } = useAuthStore();

  useEffect(() => {
    hydrateFromSession();
    const sub = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setAuth({
          userId: session.user.id,
          username: session.user.user_metadata?.username ?? session.user.email?.split("@")[0] ?? "student",
        });
      } else {
        signOut();
      }
    });
    return () => {
      sub.data.subscription.unsubscribe();
    };
  }, [hydrateFromSession, setAuth, signOut]);

  return (
    <AppProvider>
      <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="(auth)" />
          <Stack.Screen name="(onboarding)" />
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="listing/[id]" options={{ presentation: "card" }} />
          <Stack.Screen name="chat/[id]" options={{ presentation: "card" }} />
        </Stack>
        <StatusBar style={colorScheme === "dark" ? "light" : "dark"} />
      </ThemeProvider>
    </AppProvider>
  );
}

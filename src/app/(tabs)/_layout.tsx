import { Ionicons } from "@expo/vector-icons";
import { Redirect, Tabs } from "expo-router";
import { useAuthStore } from "@/state/auth-store";

export default function TabsLayout() {
  const { userId, isGuest, onboardingDone } = useAuthStore();

  if (!userId && !isGuest) return <Redirect href="/(auth)/sign-in" />;
  if (!onboardingDone) return <Redirect href="/(onboarding)" />;

  return (
    <Tabs screenOptions={{ headerShown: false, tabBarStyle: { height: 66, paddingTop: 8 } }}>
      <Tabs.Screen name="index" options={{ title: "Home", tabBarIcon: ({ color }) => <Ionicons name="home" size={20} color={color} /> }} />
      <Tabs.Screen name="search" options={{ title: "Search", tabBarIcon: ({ color }) => <Ionicons name="search" size={20} color={color} /> }} />
      <Tabs.Screen name="sell" options={{ title: "Sell", tabBarIcon: ({ color }) => <Ionicons name="add-circle" size={20} color={color} /> }} />
      <Tabs.Screen name="messages" options={{ title: "Messages", tabBarIcon: ({ color }) => <Ionicons name="chatbubble" size={20} color={color} /> }} />
      <Tabs.Screen name="profile" options={{ title: "Profile", tabBarIcon: ({ color }) => <Ionicons name="person" size={20} color={color} /> }} />
      <Tabs.Screen name="explore" options={{ href: null }} />
    </Tabs>
  );
}

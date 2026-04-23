import { account } from "@/lib/appwrite";
import { Tabs, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";

import { CustomTabBar } from "@/components/custom-tab-bar";

export default function TabLayout() {
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    let isActive = true;

    const confirmSession = async () => {
      try {
        await account.get();
      } catch {
        if (isActive) {
          router.replace("/auth/sign-in");
        }
      } finally {
        if (isActive) {
          setIsChecking(false);
        }
      }
    };

    confirmSession();

    return () => {
      isActive = false;
    };
  }, [router]);

  if (isChecking) {
    return (
      <View style={styles.screen}>
        <ActivityIndicator size="small" color="#2D2E3A" />
      </View>
    );
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
      }}
      tabBar={(props) => <CustomTabBar {...props} />}
    >
      <Tabs.Screen name="index" options={{ title: "Home" }} />
      <Tabs.Screen name="explore" options={{ title: "Explore" }} />
      <Tabs.Screen name="journey" options={{ title: "Chat" }} />
      <Tabs.Screen name="stats" options={{ title: "Stats" }} />
      <Tabs.Screen name="profile" options={{ href: null }} />
      <Tabs.Screen name="materials" options={{ href: null }} />
      <Tabs.Screen name="resources" options={{ href: null }} />
      <Tabs.Screen name="assignments" options={{ href: null }} />
      <Tabs.Screen name="notes" options={{ href: null }} />
      <Tabs.Screen name="notes-editor" options={{ href: null }} />
      <Tabs.Screen name="upload-content" options={{ href: null }} />
      <Tabs.Screen name="recent-uploads" options={{ href: null }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F4F3F9",
  },
});

import { Tabs } from "expo-router";
import React from "react";

import { CustomTabBar } from "@/components/custom-tab-bar";

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
      }}
      tabBar={(props) => <CustomTabBar {...props} />}
    >
      <Tabs.Screen name="index" options={{ title: "Home" }} />
      <Tabs.Screen name="explore" options={{ title: "Explore" }} />
      <Tabs.Screen name="journey" options={{ title: "Journey" }} />
      <Tabs.Screen name="stats" options={{ title: "Stats" }} />
      <Tabs.Screen name="profile" options={{ title: "Profile" }} />
      <Tabs.Screen name="materials" options={{ href: null }} />
      <Tabs.Screen name="resources" options={{ href: null }} />
      <Tabs.Screen name="assignments" options={{ href: null }} />
      <Tabs.Screen name="notes" options={{ href: null }} />
      <Tabs.Screen name="notes-editor" options={{ href: null }} />
    </Tabs>
  );
}

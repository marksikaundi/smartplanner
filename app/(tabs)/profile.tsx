import { Alert, Text, View } from "react-native";
import { Link } from "expo-router";
import { AppButton } from "@/src/components/ui/button";
import { isExpoGo } from "@/src/lib/expo-environment";
import { registerPushToken, computeTrustScore } from "@/src/services/marketplace";
import { signOut as supabaseSignOut } from "@/src/services/auth";
import { useAuthStore } from "@/src/state/auth-store";

export default function ProfileScreen() {
  const { username, signOut, userId } = useAuthStore();
  const trustScore = computeTrustScore({
    avgRating: 4.8,
    completedSales: 26,
    reportCount: 1,
    verificationBonus: true,
  });
  return (
    <View className="flex-1 bg-zinc-50 px-4 pt-14 dark:bg-black">
      <Text className="text-2xl font-bold text-zinc-950 dark:text-zinc-100">@{username ?? "student"}</Text>
      <Text className="mt-1 text-zinc-500">Verified seller • 4.8 rating</Text>
      <View className="mt-5 gap-3">
        <View className="rounded-2xl bg-white p-4 dark:bg-zinc-900">
          <Text className="text-zinc-950 dark:text-zinc-100">Listings posted: 12</Text>
        </View>
        <View className="rounded-2xl bg-white p-4 dark:bg-zinc-900">
          <Text className="text-zinc-950 dark:text-zinc-100">Saved items: 24</Text>
        </View>
        <View className="rounded-2xl bg-white p-4 dark:bg-zinc-900">
          <Text className="text-zinc-950 dark:text-zinc-100">Trust score: {trustScore}/100</Text>
        </View>
        <AppButton
          label="Enable push notifications"
          variant="secondary"
          onPress={async () => {
            if (!userId) return;
            if (isExpoGo()) {
              Alert.alert(
                "Push not available in Expo Go",
                "Remote push was removed from Expo Go (SDK 53+). Create a development build to register a device token.",
              );
              return;
            }
            const token = await registerPushToken(userId);
            if (token) {
              Alert.alert("Notifications", "Push token saved.");
            } else {
              Alert.alert("Notifications", "Permission was not granted or token could not be obtained.");
            }
          }}
        />
        <Link href="/subscription" className="text-sm text-zinc-700 dark:text-zinc-200">
          Manage subscription and boosts
        </Link>
        <Link href="/admin/moderation" className="text-sm text-zinc-700 dark:text-zinc-200">
          Open admin moderation
        </Link>
        <AppButton
          label="Sign out"
          variant="secondary"
          onPress={async () => {
            await supabaseSignOut();
            signOut();
          }}
        />
      </View>
    </View>
  );
}

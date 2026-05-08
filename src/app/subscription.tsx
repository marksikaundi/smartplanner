import { Redirect } from "expo-router";
import { useState } from "react";
import { Text, View } from "react-native";
import { AppButton } from "@/components/ui/button";
import { createFeaturedListingPayment, subscribeSellerPlan } from "@/services/billing";
import { useAuthStore } from "@/state/auth-store";

export default function SubscriptionScreen() {
  const { userId, isGuest, onboardingDone } = useAuthStore();
  const [status, setStatus] = useState<string | null>(null);

  if (!userId && !isGuest) return <Redirect href="/(auth)/sign-in" />;
  if (!onboardingDone) return <Redirect href="/(onboarding)" />;

  return (
    <View className="flex-1 gap-3 bg-zinc-50 px-4 pt-16 dark:bg-black">
      <Text className="text-2xl font-bold text-zinc-950 dark:text-zinc-100">Seller Growth</Text>
      <Text className="text-zinc-500">Boost listings and unlock premium seller analytics.</Text>
      <AppButton
        label="Subscribe to Premium Seller"
        onPress={async () => {
          if (!userId) return;
          await subscribeSellerPlan(userId, "premium");
          setStatus("Premium subscription activated.");
        }}
      />
      <AppButton
        label="Boost a Listing ($4.99)"
        variant="secondary"
        onPress={async () => {
          if (!userId) return;
          await createFeaturedListingPayment({ userId, listingId: "l-1", amount: 4.99 });
          setStatus("Boost payment created (pending checkout callback).");
        }}
      />
      {status ? <Text className="text-sm text-zinc-500">{status}</Text> : null}
    </View>
  );
}

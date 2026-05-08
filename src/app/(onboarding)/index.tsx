import { useRouter } from "expo-router";
import { MotiView } from "moti";
import { Text, View } from "react-native";
import { AppButton } from "@/components/ui/button";
import { useAuthStore } from "@/state/auth-store";

export default function OnboardingScreen() {
  const router = useRouter();
  const { finishOnboarding } = useAuthStore();

  return (
    <View className="flex-1 justify-between bg-white px-5 pb-10 pt-20 dark:bg-black">
      <View className="gap-4">
        <MotiView from={{ opacity: 0, translateY: 20 }} animate={{ opacity: 1, translateY: 0 }}>
          <Text className="text-4xl font-bold text-zinc-950 dark:text-zinc-100">Find your campus deals</Text>
        </MotiView>
        <Text className="text-zinc-500">Select your campus, interests, and enable notifications for hot listings.</Text>
      </View>
      <View className="gap-3">
        <AppButton
          label="Complete onboarding"
          onPress={() => {
            finishOnboarding();
            router.replace("/(tabs)");
          }}
        />
      </View>
    </View>
  );
}

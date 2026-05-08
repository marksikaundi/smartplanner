import { useQuery } from "@tanstack/react-query";
import { Redirect } from "expo-router";
import { ScrollView, Text, View } from "react-native";
import { AppButton } from "@/components/ui/button";
import { fetchOpenReports, moderateReport } from "@/services/admin";
import { useAuthStore } from "@/state/auth-store";

export default function AdminModerationScreen() {
  const { userId, isGuest, onboardingDone } = useAuthStore();
  const { data, refetch } = useQuery({ queryKey: ["admin-reports"], queryFn: fetchOpenReports });

  if (!userId && !isGuest) return <Redirect href="/(auth)/sign-in" />;
  if (!onboardingDone) return <Redirect href="/(onboarding)" />;

  return (
    <ScrollView className="flex-1 bg-zinc-50 px-4 pt-16 dark:bg-black">
      <Text className="text-2xl font-bold text-zinc-950 dark:text-zinc-100">Moderation Queue</Text>
      <View className="mt-4 gap-3 pb-10">
        {(data ?? []).map((report) => (
          <View key={report.id} className="gap-2 rounded-2xl bg-white p-4 dark:bg-zinc-900">
            <Text className="font-semibold text-zinc-950 dark:text-zinc-100">{report.reason}</Text>
            <Text className="text-sm text-zinc-500">{report.notes ?? "No notes provided."}</Text>
            <AppButton
              label="Resolve"
              onPress={async () => {
                await moderateReport(report.id, "resolved");
                refetch();
              }}
            />
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

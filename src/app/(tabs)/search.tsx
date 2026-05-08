import { useQuery } from "@tanstack/react-query";
import { router } from "expo-router";
import { useState } from "react";
import { ScrollView, Text, View } from "react-native";
import { AppButton } from "@/components/ui/button";
import { AppInput } from "@/components/ui/input";
import { ListingCard } from "@/components/ui/listing-card";
import { fetchListings } from "@/services/listings";
import { saveSearch } from "@/services/marketplace";
import { useAuthStore } from "@/state/auth-store";

export default function SearchScreen() {
  const [q, setQ] = useState("");
  const [statusText, setStatusText] = useState<string | null>(null);
  const { userId } = useAuthStore();
  const { data } = useQuery({ queryKey: ["listings-search", q], queryFn: () => fetchListings(q) });

  return (
    <ScrollView className="flex-1 bg-zinc-50 px-4 pt-14 dark:bg-black">
      <Text className="text-2xl font-bold text-zinc-950 dark:text-zinc-100">Search</Text>
      <View className="mt-3">
        <AppInput placeholder="Search phones, books, furniture..." value={q} onChangeText={setQ} />
      </View>
      <View className="mt-2">
        <AppButton
          label="Save this search"
          variant="secondary"
          onPress={async () => {
            if (!userId || !q.trim()) return;
            await saveSearch(userId, q.trim());
            setStatusText("Search saved.");
          }}
        />
      </View>
      {statusText ? <Text className="mt-2 text-xs text-zinc-500">{statusText}</Text> : null}
      <View className="mt-4 gap-3 pb-12">
        {data?.map((item) => (
          <ListingCard key={item.id} listing={item} onPress={() => router.push(`/listing/${item.id}`)} />
        ))}
      </View>
    </ScrollView>
  );
}

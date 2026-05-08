import { useQuery } from "@tanstack/react-query";
import { router } from "expo-router";
import { FlashList } from "@shopify/flash-list";
import { ScrollView, Text, View } from "react-native";
import { ListingCard } from "@/components/ui/listing-card";
import { SkeletonCard } from "@/components/ui/skeleton-card";
import { categories } from "@/services/mock";
import { fetchListings } from "@/services/listings";

export default function HomeScreen() {
  const { data, isLoading } = useQuery({ queryKey: ["listings"], queryFn: () => fetchListings() });

  return (
    <ScrollView className="flex-1 bg-zinc-50 px-4 pt-14 dark:bg-black">
      <Text className="text-3xl font-bold text-zinc-950 dark:text-zinc-100">Campus Market</Text>
      <Text className="mt-1 text-zinc-500">Featured listings near your campus</Text>

      <View className="mt-5">
        <FlashList
          horizontal
          data={isLoading ? Array.from({ length: 4 }).map((_, i) => i) : (data ?? [])}
          estimatedItemSize={220}
          renderItem={({ item }) =>
            isLoading ? (
              <SkeletonCard />
            ) : (
              <ListingCard listing={item} onPress={() => router.push(`/listing/${item.id}`)} />
            )
          }
        />
      </View>

      <Text className="mt-6 text-lg font-semibold text-zinc-900 dark:text-zinc-100">Popular categories</Text>
      <View className="mb-10 mt-3 flex-row flex-wrap gap-2">
        {categories.map((cat) => (
          <View key={cat} className="rounded-full bg-white px-3 py-2 dark:bg-zinc-900">
            <Text className="text-xs font-medium text-zinc-700 dark:text-zinc-300">{cat}</Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

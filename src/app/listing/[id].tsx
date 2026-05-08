import { useQuery } from "@tanstack/react-query";
import { Image } from "expo-image";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ScrollView, Text, View } from "react-native";
import { AppButton } from "@/components/ui/button";
import { fetchListingById } from "@/services/listings";

export default function ListingDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { data } = useQuery({ queryKey: ["listing", id], queryFn: () => fetchListingById(id) });

  if (!data) return <View className="flex-1 items-center justify-center bg-black"><Text className="text-white">Listing not found</Text></View>;

  return (
    <ScrollView className="flex-1 bg-white dark:bg-black">
      <Image source={{ uri: data.images[0] }} style={{ width: "100%", height: 280 }} />
      <View className="gap-2 p-4">
        <Text className="text-2xl font-bold text-zinc-950 dark:text-zinc-100">{data.title}</Text>
        <Text className="text-zinc-500">{data.location}</Text>
        <Text className="text-3xl font-bold text-zinc-950 dark:text-zinc-100">${data.price}</Text>
        <Text className="text-zinc-700 dark:text-zinc-300">{data.description}</Text>
        <View className="mt-4 gap-2">
          <AppButton label="Chat seller" onPress={() => router.push("/chat/c1")} />
          <AppButton label="Make offer" variant="secondary" />
          <AppButton label="Call seller" variant="secondary" />
        </View>
      </View>
    </ScrollView>
  );
}

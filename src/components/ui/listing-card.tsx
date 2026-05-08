import { Image } from "expo-image";
import { Pressable, Text, View } from "react-native";
import { Listing } from "@/types/models";

type Props = {
  listing: Listing;
  onPress?: () => void;
};

export const ListingCard = ({ listing, onPress }: Props) => (
  <Pressable onPress={onPress} className="mr-3 w-56 overflow-hidden rounded-3xl bg-white dark:bg-zinc-900">
    <Image source={{ uri: listing.images[0] }} style={{ width: "100%", height: 140 }} contentFit="cover" />
    <View className="gap-1 p-3">
      <Text numberOfLines={1} className="font-semibold text-zinc-950 dark:text-zinc-100">
        {listing.title}
      </Text>
      <Text className="text-xs text-zinc-500">{listing.location}</Text>
      <Text className="text-lg font-bold text-zinc-950 dark:text-zinc-100">${listing.price}</Text>
    </View>
  </Pressable>
);

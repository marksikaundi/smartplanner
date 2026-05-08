import { router } from "expo-router";
import { Pressable, ScrollView, Text, View } from "react-native";

const conversations = [
  { id: "c1", name: "Ari.n", preview: "Can you do $580?", unread: 2 },
  { id: "c2", name: "Brian K", preview: "Still available?", unread: 0 },
];

export default function MessagesScreen() {
  return (
    <ScrollView className="flex-1 bg-zinc-50 px-4 pt-14 dark:bg-black">
      <Text className="text-2xl font-bold text-zinc-950 dark:text-zinc-100">Messages</Text>
      <View className="mt-4 gap-3">
        {conversations.map((item) => (
          <Pressable key={item.id} onPress={() => router.push(`/chat/${item.id}`)} className="rounded-2xl bg-white p-4 dark:bg-zinc-900">
            <Text className="font-semibold text-zinc-950 dark:text-zinc-100">{item.name}</Text>
            <Text className="text-sm text-zinc-500">{item.preview}</Text>
          </Pressable>
        ))}
      </View>
    </ScrollView>
  );
}

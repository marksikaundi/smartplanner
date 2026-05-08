import { FlashList } from "@shopify/flash-list";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, Text, View } from "react-native";
import { AppInput } from "@/components/ui/input";
import {
  fetchMessages,
  markConversationSeen,
  sendMessage,
  setTyping,
  subscribeToConversation,
  subscribeToTyping,
} from "@/services/chat";
import { useAuthStore } from "@/state/auth-store";

export default function ChatScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [value, setValue] = useState("");
  const [isPeerTyping, setIsPeerTyping] = useState(false);
  const queryClient = useQueryClient();
  const { userId } = useAuthStore();
  const { data } = useQuery({ queryKey: ["messages", id], queryFn: () => fetchMessages(id) });

  const sendMutation = useMutation({
    mutationFn: (body: string) => sendMessage({ conversationId: id, senderId: userId ?? "", body }),
    onSuccess: () => {
      setValue("");
      queryClient.invalidateQueries({ queryKey: ["messages", id] });
    },
  });

  useEffect(() => {
    const channel = subscribeToConversation(id, () => {
      queryClient.invalidateQueries({ queryKey: ["messages", id] });
    });
    const typingChannel = subscribeToTyping(id, (payload: unknown) => {
      const next = payload as { new?: { is_typing?: boolean; user_id?: string } };
      if (next.new?.user_id && next.new.user_id !== userId) {
        setIsPeerTyping(Boolean(next.new.is_typing));
      }
    });
    return () => {
      channel.unsubscribe();
      typingChannel.unsubscribe();
    };
  }, [id, queryClient, userId]);

  useEffect(() => {
    if (!userId) return;
    markConversationSeen(id, userId);
  }, [id, userId, data]);

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} className="flex-1 bg-zinc-50 dark:bg-black">
      <FlashList
        data={data ?? []}
        estimatedItemSize={70}
        contentContainerStyle={{ padding: 16 }}
        renderItem={({ item }) => (
          <View className={`mb-2 max-w-[80%] rounded-2xl p-3 ${item.sender_id === userId ? "self-end bg-black dark:bg-white" : "self-start bg-white dark:bg-zinc-900"}`}>
            <Text className={item.sender_id === userId ? "text-white dark:text-black" : "text-zinc-900 dark:text-zinc-100"}>{item.body}</Text>
            {item.seen_at && item.sender_id === userId ? <Text className="mt-1 text-[10px] text-zinc-300 dark:text-zinc-600">Seen</Text> : null}
          </View>
        )}
      />
      {isPeerTyping ? <Text className="px-4 pb-1 text-xs text-zinc-500">Typing...</Text> : null}
      <View className="border-t border-zinc-200 p-3 dark:border-zinc-800">
        <View className="flex-row items-center gap-2">
          <View className="flex-1">
            <AppInput
              placeholder="Write a message..."
              value={value}
              onChangeText={(text) => {
                setValue(text);
                if (userId) setTyping(id, userId, text.length > 0);
              }}
            />
          </View>
          <Pressable
            onPress={() => {
              if (value.trim() && userId) sendMutation.mutate(value.trim());
            }}
            className="rounded-xl bg-black px-4 py-3 dark:bg-white"
          >
            <Text className="font-semibold text-white dark:text-black">Send</Text>
          </Pressable>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

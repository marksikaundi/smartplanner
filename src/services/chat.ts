import { supabase } from "@/lib/supabase";

export type ChatMessage = {
  id: string;
  conversation_id: string;
  sender_id: string;
  body: string | null;
  created_at: string;
  seen_at: string | null;
};

export const fetchMessages = async (conversationId: string) => {
  const { data, error } = await supabase
    .from("messages")
    .select("*")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data ?? []) as ChatMessage[];
};

export const sendMessage = async ({
  conversationId,
  senderId,
  body,
}: {
  conversationId: string;
  senderId: string;
  body: string;
}) => {
  const { error } = await supabase.from("messages").insert({
    conversation_id: conversationId,
    sender_id: senderId,
    body,
    message_type: "text",
  });
  if (error) throw error;
};

export const markConversationSeen = async (conversationId: string, viewerId: string) => {
  const { error } = await supabase
    .from("messages")
    .update({ seen_at: new Date().toISOString() })
    .eq("conversation_id", conversationId)
    .neq("sender_id", viewerId)
    .is("seen_at", null);
  if (error) throw error;
};

export const setTyping = async (conversationId: string, userId: string, isTyping: boolean) => {
  const { error } = await supabase.from("typing_status").upsert({
    conversation_id: conversationId,
    user_id: userId,
    is_typing: isTyping,
    updated_at: new Date().toISOString(),
  });
  if (error) throw error;
};

export const subscribeToConversation = (
  conversationId: string,
  onMessage: (payload: unknown) => void,
) =>
  supabase
    .channel(`conversation:${conversationId}`)
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "messages",
        filter: `conversation_id=eq.${conversationId}`,
      },
      onMessage,
    )
    .subscribe();

export const subscribeToTyping = (conversationId: string, onTyping: (payload: unknown) => void) =>
  supabase
    .channel(`typing:${conversationId}`)
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "typing_status",
        filter: `conversation_id=eq.${conversationId}`,
      },
      onTyping,
    )
    .subscribe();

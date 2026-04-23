import HugeiconsIcon from "@/components/hugeicons-icon";
import { account, client, databases, ID, Query } from "@/lib/appwrite";
import { APPWRITE_IDS, isConfigured } from "@/lib/appwrite-ids";
import {
  Add01Icon,
  AiMicIcon,
  AiPhone01Icon,
  AiVideoIcon,
  ArrowLeft01Icon,
  Camera01Icon,
} from "@hugeicons/core-free-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type ChannelDetail = {
  id: string;
  name: string;
  description: string;
  members: number;
};

type ChannelMessage = {
  id: string;
  text: string;
  createdAt: string;
  senderName: string;
  senderId: string | null;
};

type ChannelMember = {
  id: string;
  lastReadAt: string | null;
  unreadCount: number;
};

export default function ChannelDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const [channel, setChannel] = useState<ChannelDetail | null>(null);
  const [messages, setMessages] = useState<ChannelMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [messageText, setMessageText] = useState("");
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [memberRecord, setMemberRecord] = useState<ChannelMember | null>(null);

  const channelName = channel?.name ?? "Chat";
  const channelInitials = channelName
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();

  const formatTime = (value: string) => {
    if (!value) {
      return "";
    }
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return "";
    }
    return date.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatDayLabel = (value: string) => {
    if (!value) {
      return "";
    }
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return "";
    }
    const today = new Date();
    const diff = today.setHours(0, 0, 0, 0) - date.setHours(0, 0, 0, 0);
    if (diff === 0) {
      return "Today";
    }
    if (diff === 24 * 60 * 60 * 1000) {
      return "Yesterday";
    }
    return date.toLocaleDateString([], { month: "short", day: "numeric" });
  };

  useEffect(() => {
    let isActive = true;

    const loadCurrentUser = async () => {
      try {
        const user = await account.get();
        if (isActive) {
          setCurrentUserId(String(user.$id));
        }
      } catch {
        if (isActive) {
          setCurrentUserId(null);
        }
      }
    };

    loadCurrentUser();

    return () => {
      isActive = false;
    };
  }, []);

  useEffect(() => {
    let isActive = true;

    const loadChannel = async () => {
      if (!id) {
        if (isActive) {
          setLoadError("Channel not found.");
        }
        return;
      }

      if (!isConfigured(APPWRITE_IDS.collections.channels)) {
        if (isActive) {
          setLoadError("Channels collection is not configured.");
        }
        return;
      }

      try {
        setIsLoading(true);
        setLoadError(null);
        const response = await databases.getDocument(
          APPWRITE_IDS.databaseId,
          APPWRITE_IDS.collections.channels,
          String(id),
        );
        if (isActive) {
          const memberCountRaw =
            response.membersCount ??
            response.memberCount ??
            (Array.isArray(response.members) ? response.members.length : 0);
          const members = Number(memberCountRaw);

          setChannel({
            id: String(response.$id),
            name: String(response.name ?? response.title ?? "Channel"),
            description: String(response.description ?? ""),
            members: Number.isFinite(members) ? members : 0,
          });
        }

        if (isConfigured(APPWRITE_IDS.collections.channelMessages)) {
          const messagesResponse = await databases.listDocuments(
            APPWRITE_IDS.databaseId,
            APPWRITE_IDS.collections.channelMessages,
            [
              Query.equal("channelId", String(id)),
              Query.orderDesc("$createdAt"),
              Query.limit(60),
            ],
          );
          if (isActive) {
            const mapped = messagesResponse.documents
              .map((doc) => ({
                id: String(doc.$id),
                text: String(doc.text ?? doc.message ?? doc.body ?? ""),
                createdAt: String(doc.$createdAt ?? ""),
                senderName: String(doc.senderName ?? doc.sender ?? "You"),
                senderId: doc.senderId ? String(doc.senderId) : null,
              }))
              .reverse();
            setMessages(mapped);
          }
        }

        if (
          currentUserId &&
          isConfigured(APPWRITE_IDS.collections.channelMembers)
        ) {
          const memberResponse = await databases.listDocuments(
            APPWRITE_IDS.databaseId,
            APPWRITE_IDS.collections.channelMembers,
            [
              Query.equal("channelId", String(id)),
              Query.equal("userId", currentUserId),
              Query.limit(1),
            ],
          );
          let memberDoc = memberResponse.documents[0];
          if (!memberDoc) {
            memberDoc = await databases.createDocument(
              APPWRITE_IDS.databaseId,
              APPWRITE_IDS.collections.channelMembers,
              ID.unique(),
              {
                channelId: String(id),
                userId: currentUserId,
                unreadCount: 0,
                lastReadAt: new Date().toISOString(),
              },
            );
          }

          const member: ChannelMember = {
            id: String(memberDoc.$id),
            lastReadAt: memberDoc.lastReadAt
              ? String(memberDoc.lastReadAt)
              : null,
            unreadCount: Number(memberDoc.unreadCount ?? 0) || 0,
          };
          if (isActive) {
            setMemberRecord(member);
          }

          await databases.updateDocument(
            APPWRITE_IDS.databaseId,
            APPWRITE_IDS.collections.channelMembers,
            member.id,
            { unreadCount: 0, lastReadAt: new Date().toISOString() },
          );
          if (isActive) {
            setMemberRecord({ ...member, unreadCount: 0 });
          }
        }
      } catch {
        if (isActive) {
          setLoadError("Unable to load channel details right now.");
        }
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    };

    loadChannel();

    return () => {
      isActive = false;
    };
  }, [currentUserId, id]);

  const handleSend = async () => {
    const trimmed = messageText.trim();
    if (!trimmed || !id || !channel) {
      return;
    }

    if (!isConfigured(APPWRITE_IDS.collections.channelMessages)) {
      setLoadError("Channel messages collection is not configured.");
      return;
    }

    try {
      setIsSending(true);
      const created = await databases.createDocument(
        APPWRITE_IDS.databaseId,
        APPWRITE_IDS.collections.channelMessages,
        ID.unique(),
        {
          channelId: String(id),
          text: trimmed,
          senderName: "You",
          senderId: currentUserId,
        },
      );
      setMessages((current) => [
        ...current,
        {
          id: String(created.$id),
          text: trimmed,
          createdAt: String(created.$createdAt ?? new Date().toISOString()),
          senderName: "You",
          senderId: currentUserId,
        },
      ]);
      setMessageText("");

      await databases.updateDocument(
        APPWRITE_IDS.databaseId,
        APPWRITE_IDS.collections.channels,
        String(id),
        {
          lastMessage: trimmed,
          lastMessageAt: created.$createdAt,
        },
      );

      if (
        memberRecord &&
        isConfigured(APPWRITE_IDS.collections.channelMembers)
      ) {
        await databases.updateDocument(
          APPWRITE_IDS.databaseId,
          APPWRITE_IDS.collections.channelMembers,
          memberRecord.id,
          {
            unreadCount: 0,
            lastReadAt: new Date().toISOString(),
          },
        );
        setMemberRecord({
          ...memberRecord,
          unreadCount: 0,
          lastReadAt: new Date().toISOString(),
        });
      }
    } catch {
      setLoadError("Unable to send message right now.");
    } finally {
      setIsSending(false);
    }
  };

  useEffect(() => {
    if (!id || !isConfigured(APPWRITE_IDS.collections.channelMessages)) {
      return;
    }

    const subscription = client.subscribe(
      `databases.${APPWRITE_IDS.databaseId}.collections.${APPWRITE_IDS.collections.channelMessages}.documents`,
      async (event) => {
        if (!event.events.some((item) => item.includes(".create"))) {
          return;
        }

        const payload = event.payload as {
          channelId?: string;
          text?: string;
          senderName?: string;
          senderId?: string;
          $id?: string;
          $createdAt?: string;
        };
        if (String(payload.channelId ?? "") !== String(id)) {
          return;
        }

        if (payload.senderId && payload.senderId === currentUserId) {
          return;
        }

        const messageId = String(payload.$id ?? "");
        if (!messageId) {
          return;
        }

        const message: ChannelMessage = {
          id: messageId,
          text: String(payload.text ?? ""),
          createdAt: String(payload.$createdAt ?? new Date().toISOString()),
          senderName: String(payload.senderName ?? ""),
          senderId: payload.senderId ? String(payload.senderId) : null,
        };
        setMessages((current) => [...current, message]);

        if (
          memberRecord &&
          isConfigured(APPWRITE_IDS.collections.channelMembers)
        ) {
          await databases.updateDocument(
            APPWRITE_IDS.databaseId,
            APPWRITE_IDS.collections.channelMembers,
            memberRecord.id,
            {
              unreadCount: 0,
              lastReadAt: message.createdAt,
            },
          );
          setMemberRecord({
            ...memberRecord,
            unreadCount: 0,
            lastReadAt: message.createdAt,
          });
        }
      },
    );

    return () => {
      subscription();
    };
  }, [currentUserId, id, memberRecord]);

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.header}>
        <Pressable style={styles.headerButton} onPress={() => router.back()}>
          <HugeiconsIcon icon={ArrowLeft01Icon} size={18} color="#1F2937" />
        </Pressable>
        <View style={styles.headerInfo}>
          <View style={styles.headerAvatar}>
            <Text style={styles.headerInitials}>{channelInitials}</Text>
            <View style={styles.statusDot} />
          </View>
          <View style={styles.headerTextWrap}>
            <Text style={styles.headerTitle}>{channelName}</Text>
            <Text style={styles.headerSubtitle}>Online</Text>
          </View>
        </View>
        <View style={styles.headerActions}>
          <Pressable style={styles.headerActionButton}>
            <HugeiconsIcon icon={AiVideoIcon} size={16} color="#1FAF75" />
          </Pressable>
          <Pressable style={styles.headerActionButton}>
            <HugeiconsIcon icon={AiPhone01Icon} size={16} color="#1FAF75" />
          </Pressable>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.messagesContent}
        showsVerticalScrollIndicator={false}
      >
        {isLoading ? <ActivityIndicator size="small" color="#1FAF75" /> : null}
        {!isLoading && loadError ? (
          <Text style={styles.helperText}>{loadError}</Text>
        ) : null}
        {messages.length === 0 ? (
          <Text style={styles.helperText}>
            No messages yet. Start the conversation.
          </Text>
        ) : null}
        {(() => {
          let lastLabel = "";
          return messages.map((message) => {
            const isMine = message.senderId && message.senderId === currentUserId;
            const dayLabel = formatDayLabel(message.createdAt);
            const showLabel = dayLabel && dayLabel !== lastLabel;
            if (showLabel) {
              lastLabel = dayLabel;
            }

            return (
              <View key={message.id} style={styles.messageBlock}>
                {showLabel ? (
                  <View style={styles.daySeparator}>
                    <Text style={styles.daySeparatorText}>{dayLabel}</Text>
                  </View>
                ) : null}
                <View
                  style={[
                    styles.messageRow,
                    isMine ? styles.messageRowRight : styles.messageRowLeft,
                  ]}
                >
                  {!isMine ? (
                    <View style={styles.smallAvatar}>
                      <Text style={styles.smallAvatarText}>
                        {message.senderName.slice(0, 1).toUpperCase()}
                      </Text>
                    </View>
                  ) : null}
                  <View
                    style={[
                      styles.messageBubble,
                      isMine ? styles.messageBubbleMine : null,
                    ]}
                  >
                    {!isMine ? (
                      <Text style={styles.messageSender}>{message.senderName}</Text>
                    ) : null}
                    <Text
                      style={[
                        styles.messageText,
                        isMine ? styles.messageTextMine : null,
                      ]}
                    >
                      {message.text}
                    </Text>
                    <Text
                      style={[
                        styles.messageTime,
                        isMine ? styles.messageTimeMine : null,
                      ]}
                    >
                      {formatTime(message.createdAt)}
                    </Text>
                  </View>
                </View>
              </View>
            );
          });
        })()}
      </ScrollView>

      <View style={styles.composer}>
        <Pressable style={styles.plusButton}>
          <HugeiconsIcon icon={Add01Icon} size={16} color="#FFFFFF" />
        </Pressable>
        <View style={styles.inputWrap}>
          <TextInput
            value={messageText}
            onChangeText={setMessageText}
            placeholder="Type here..."
            placeholderTextColor="#9AA0B6"
            style={styles.input}
          />
        </View>
        <Pressable style={styles.iconButton}>
          <HugeiconsIcon icon={Camera01Icon} size={16} color="#1FAF75" />
        </Pressable>
        <Pressable style={styles.iconButton} onPress={handleSend}>
          {isSending ? (
            <ActivityIndicator size="small" color="#1FAF75" />
          ) : (
            <HugeiconsIcon icon={AiMicIcon} size={16} color="#1FAF75" />
          )}
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#F7F7FA",
  },
  header: {
    paddingHorizontal: 18,
    paddingTop: 10,
    paddingBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#ECECF2",
    backgroundColor: "#FFFFFF",
  },
  headerButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#F4F5F8",
    alignItems: "center",
    justifyContent: "center",
  },
  headerInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flex: 1,
  },
  headerAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#F1E9FF",
    alignItems: "center",
    justifyContent: "center",
  },
  headerInitials: {
    fontSize: 13,
    fontWeight: "700",
    color: "#1F2937",
  },
  statusDot: {
    position: "absolute",
    bottom: 2,
    right: 2,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#22C55E",
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },
  headerTextWrap: {
    gap: 2,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1F2937",
  },
  headerSubtitle: {
    fontSize: 11,
    color: "#7A7D92",
  },
  headerActions: {
    flexDirection: "row",
    gap: 8,
  },
  headerActionButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: "#1FAF75",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F6FFFA",
  },
  messagesContent: {
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 20,
    gap: 16,
  },
  daySeparator: {
    alignItems: "center",
    marginBottom: 6,
  },
  daySeparatorText: {
    fontSize: 11,
    color: "#98A2B3",
    backgroundColor: "#F3F4F6",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  messageBlock: {
    gap: 8,
  },
  messageRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 8,
  },
  messageRowLeft: {
    justifyContent: "flex-start",
  },
  messageRowRight: {
    justifyContent: "flex-end",
  },
  smallAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#F0F2F5",
    alignItems: "center",
    justifyContent: "center",
  },
  smallAvatarText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#1F2937",
  },
  messageBubble: {
    backgroundColor: "#F3F4F6",
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
    maxWidth: "78%",
    gap: 4,
  },
  messageBubbleMine: {
    backgroundColor: "#E9E3FF",
  },
  messageSender: {
    fontSize: 10,
    color: "#667085",
    fontWeight: "600",
  },
  messageText: {
    fontSize: 13,
    color: "#1F2937",
  },
  messageTextMine: {
    color: "#1F1B2E",
  },
  messageTime: {
    fontSize: 10,
    color: "#98A2B3",
    alignSelf: "flex-end",
  },
  messageTimeMine: {
    color: "#7A5AF8",
  },
  composer: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: "#ECECF2",
    backgroundColor: "#FFFFFF",
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  plusButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#1FAF75",
    alignItems: "center",
    justifyContent: "center",
  },
  inputWrap: {
    flex: 1,
    backgroundColor: "#F3F4F6",
    borderRadius: 20,
    paddingHorizontal: 12,
  },
  input: {
    height: 40,
    fontSize: 13,
    color: "#1F2937",
  },
  iconButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#E9F7F0",
    alignItems: "center",
    justifyContent: "center",
  },
  helperText: {
    fontSize: 12,
    color: "#7A7D92",
  },
});

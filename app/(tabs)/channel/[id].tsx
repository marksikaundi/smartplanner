import HugeiconsIcon from "@/components/hugeicons-icon";
import { account, client, databases, ID, Query } from "@/lib/appwrite";
import { APPWRITE_IDS, isConfigured } from "@/lib/appwrite-ids";
import { UserGroupIcon, UserSharingIcon } from "@hugeicons/core-free-icons";
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
      <ScrollView contentContainerStyle={styles.content}>
        {isLoading ? <ActivityIndicator size="small" color="#1FAF75" /> : null}
        {!isLoading && loadError ? (
          <Text style={styles.helperText}>{loadError}</Text>
        ) : null}
        {channel ? (
          <View style={styles.card}>
            <View style={styles.iconWrap}>
              <HugeiconsIcon icon={UserGroupIcon} size={18} color="#1F2937" />
            </View>
            <Text style={styles.title}>{channel.name}</Text>
            <Text style={styles.subtitle}>{channel.members} members</Text>
            {channel.description ? (
              <Text style={styles.description}>{channel.description}</Text>
            ) : null}
            <Pressable
              style={styles.inviteButton}
              onPress={() =>
                router.push({
                  pathname: "/(tabs)/channel-invite",
                  params: { channelId: channel.id },
                })
              }
            >
              <HugeiconsIcon icon={UserSharingIcon} size={14} color="#FFFFFF" />
              <Text style={styles.inviteText}>Invite members</Text>
            </Pressable>
          </View>
        ) : null}

        <View style={styles.messagesCard}>
          <Text style={styles.sectionTitle}>Messages</Text>
          {messages.length === 0 ? (
            <Text style={styles.helperText}>
              No messages yet. Start the conversation.
            </Text>
          ) : null}
          {messages.map((message) => (
            <View key={message.id} style={styles.messageRow}>
              <View style={styles.messageBubble}>
                <Text style={styles.messageSender}>{message.senderName}</Text>
                <Text style={styles.messageText}>{message.text}</Text>
              </View>
            </View>
          ))}
        </View>

        <View style={styles.composerCard}>
          <TextInput
            value={messageText}
            onChangeText={setMessageText}
            placeholder="Write a message"
            placeholderTextColor="#9AA0B6"
            style={styles.input}
          />
          <Pressable
            style={[
              styles.sendButton,
              isSending ? styles.sendButtonBusy : null,
            ]}
            onPress={handleSend}
          >
            {isSending ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={styles.sendText}>Send</Text>
            )}
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#F7F7FA",
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 32,
    gap: 16,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 18,
    gap: 10,
  },
  messagesCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 18,
    gap: 10,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: "#E6EDFF",
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1F2937",
  },
  subtitle: {
    fontSize: 12,
    color: "#7A7D92",
  },
  description: {
    fontSize: 13,
    color: "#2D2E3A",
  },
  inviteButton: {
    marginTop: 4,
    backgroundColor: "#1FAF75",
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    gap: 6,
  },
  inviteText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "700",
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#1F2937",
  },
  messageRow: {
    flexDirection: "row",
  },
  messageBubble: {
    backgroundColor: "#F4F5F8",
    borderRadius: 14,
    padding: 12,
    maxWidth: "85%",
    gap: 4,
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
  composerCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 14,
    gap: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: "#E6E4EF",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 14,
    color: "#2D2E3A",
    backgroundColor: "#F9F8FD",
  },
  sendButton: {
    backgroundColor: "#1FAF75",
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: "center",
  },
  sendButtonBusy: {
    opacity: 0.7,
  },
  sendText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "700",
  },
  helperText: {
    fontSize: 12,
    color: "#7A7D92",
  },
});

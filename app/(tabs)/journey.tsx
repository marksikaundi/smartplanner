import HugeiconsIcon from "@/components/hugeicons-icon";
import { account, client, databases, ID, Query } from "@/lib/appwrite";
import { APPWRITE_IDS, isConfigured } from "@/lib/appwrite-ids";
import {
  Add01Icon,
  AiMicIcon,
  BellDotIcon,
  BubbleChatIcon,
  More01Icon,
  PlayIcon,
  Sun01Icon,
  UserGroupIcon,
  UserSharingIcon,
} from "@hugeicons/core-free-icons";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type ChannelItem = {
  id: string;
  name: string;
  members: number;
  lastMessage: string;
  unread: number;
  color: string;
};

type ChannelMessage = {
  channelId: string;
  text: string;
};

type ChannelMember = {
  id: string;
  channelId: string;
  unreadCount: number;
  lastReadAt: string | null;
};

const CHANNEL_COLORS = ["#E6EDFF", "#E7F8E9", "#FFF1D6", "#F4E7FF", "#FCE7F6"];

export default function JourneyScreen() {
  const router = useRouter();
  const filters = ["All", "Unread", "Groups", "Favorite", "Others"];
  const waveBars = [6, 14, 10, 18, 12, 20, 14, 22, 16, 24, 18, 14, 20, 12];
  const avatars = [
    { name: "Emery Saris", initials: "ES", color: "#F6B97B", badge: 5 },
    { name: "Justin Dokidis", initials: "JD", color: "#C9C1F6" },
    { name: "Erin Arcand", initials: "EA", color: "#9AE7C1" },
    {
      name: "Aspen Botosh",
      initials: "AB",
      color: "#E7C3A4",
      status: "Typing",
    },
    { name: "Zaire Workman", initials: "ZW", color: "#F1A9B6" },
  ];
  const [channels, setChannels] = useState<ChannelItem[]>([]);
  const [isLoadingChannels, setIsLoadingChannels] = useState(false);
  const [channelError, setChannelError] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [membersByChannel, setMembersByChannel] = useState<
    Record<string, ChannelMember>
  >({});

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

    const loadChannels = async () => {
      if (!isConfigured(APPWRITE_IDS.collections.channels)) {
        if (isActive) {
          setChannelError("Channels collection is not configured.");
        }
        return;
      }

      try {
        setIsLoadingChannels(true);
        setChannelError(null);
        const response = await databases.listDocuments(
          APPWRITE_IDS.databaseId,
          APPWRITE_IDS.collections.channels,
          [Query.orderDesc("$createdAt"), Query.limit(20)],
        );

        if (isActive) {
          const mapped = response.documents.map((doc, index) => {
            const memberCountRaw =
              doc.membersCount ??
              doc.memberCount ??
              (Array.isArray(doc.members) ? doc.members.length : 0);
            const unreadCountRaw = doc.unreadCount ?? doc.unread ?? 0;
            const members = Number(memberCountRaw);
            const unread = Number(unreadCountRaw);

            return {
              id: String(doc.$id),
              name: String(doc.name ?? doc.title ?? "Channel"),
              members: Number.isFinite(members) ? members : 0,
              lastMessage: String(
                doc.lastMessage ?? doc.lastMessageText ?? doc.description ?? "",
              ),
              unread: Number.isFinite(unread) ? unread : 0,
              color: String(
                doc.color ?? CHANNEL_COLORS[index % CHANNEL_COLORS.length],
              ),
            } satisfies ChannelItem;
          });
          let merged = mapped;

          if (
            currentUserId &&
            isConfigured(APPWRITE_IDS.collections.channelMembers) &&
            mapped.length > 0
          ) {
            const channelIds = mapped.map((channel) => channel.id);
            const membersResponse = await databases.listDocuments(
              APPWRITE_IDS.databaseId,
              APPWRITE_IDS.collections.channelMembers,
              [
                Query.equal("userId", currentUserId),
                Query.equal("channelId", channelIds),
                Query.limit(80),
              ],
            );
            const membersMap: Record<string, ChannelMember> = {};
            membersResponse.documents.forEach((doc) => {
              const channelId = String(doc.channelId ?? "");
              if (!channelId) {
                return;
              }
              const unreadCount = Number(doc.unreadCount ?? doc.unread ?? 0);
              membersMap[channelId] = {
                id: String(doc.$id),
                channelId,
                unreadCount: Number.isFinite(unreadCount) ? unreadCount : 0,
                lastReadAt: doc.lastReadAt
                  ? String(doc.lastReadAt)
                  : null,
              };
            });
            setMembersByChannel(membersMap);
            merged = merged.map((channel) => {
              const member = membersMap[channel.id];
              if (!member) {
                return channel;
              }
              return { ...channel, unread: member.unreadCount };
            });
          }

          if (
            isConfigured(APPWRITE_IDS.collections.channelMessages) &&
            mapped.length > 0
          ) {
            const channelIds = mapped.map((channel) => channel.id);
            const messagesResponse = await databases.listDocuments(
              APPWRITE_IDS.databaseId,
              APPWRITE_IDS.collections.channelMessages,
              [
                Query.equal("channelId", channelIds),
                Query.orderDesc("$createdAt"),
                Query.limit(80),
              ],
            );
            const latestByChannel = new Map<string, ChannelMessage>();
            messagesResponse.documents.forEach((doc) => {
              const channelId = String(doc.channelId ?? "");
              if (!channelId || latestByChannel.has(channelId)) {
                return;
              }
              const text = String(doc.text ?? doc.message ?? doc.body ?? "");
              latestByChannel.set(channelId, { channelId, text });
            });

            merged = mapped.map((channel) => {
              const latest = latestByChannel.get(channel.id);
              if (!latest?.text) {
                return channel;
              }
              return { ...channel, lastMessage: latest.text };
            });
          }

          setChannels(merged);
        }
      } catch {
        if (isActive) {
          setChannelError("Unable to load channels right now.");
        }
      } finally {
        if (isActive) {
          setIsLoadingChannels(false);
        }
      }
    };

    loadChannels();

    return () => {
      isActive = false;
    };
  }, [currentUserId]);

  useEffect(() => {
    if (!currentUserId || !isConfigured(APPWRITE_IDS.collections.channelMessages)) {
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
          senderId?: string;
        };
        const channelId = String(payload?.channelId ?? "");
        if (!channelId) {
          return;
        }

        if (payload?.senderId && payload.senderId !== currentUserId) {
          const member = membersByChannel[channelId];
          if (
            member &&
            isConfigured(APPWRITE_IDS.collections.channelMembers)
          ) {
            const updatedUnread = member.unreadCount + 1;
            setMembersByChannel((current) => ({
              ...current,
              [channelId]: { ...member, unreadCount: updatedUnread },
            }));
            await databases.updateDocument(
              APPWRITE_IDS.databaseId,
              APPWRITE_IDS.collections.channelMembers,
              member.id,
              { unreadCount: updatedUnread },
            );
          } else if (isConfigured(APPWRITE_IDS.collections.channelMembers)) {
            const created = await databases.createDocument(
              APPWRITE_IDS.databaseId,
              APPWRITE_IDS.collections.channelMembers,
              ID.unique(),
              {
                channelId,
                userId: currentUserId,
                unreadCount: 1,
              },
            );
            setMembersByChannel((current) => ({
              ...current,
              [channelId]: {
                id: String(created.$id),
                channelId,
                unreadCount: 1,
                lastReadAt: null,
              },
            }));
          }
        }

        const channelIds = channels.map((channel) => channel.id);
        if (channelIds.includes(channelId)) {
          await new Promise((resolve) => setTimeout(resolve, 0));
          const response = await databases.listDocuments(
            APPWRITE_IDS.databaseId,
            APPWRITE_IDS.collections.channels,
            [Query.orderDesc("$createdAt"), Query.limit(20)],
          );
          const mapped = response.documents.map((doc, index) => {
            const memberCountRaw =
              doc.membersCount ??
              doc.memberCount ??
              (Array.isArray(doc.members) ? doc.members.length : 0);
            const members = Number(memberCountRaw);
            return {
              id: String(doc.$id),
              name: String(doc.name ?? doc.title ?? "Channel"),
              members: Number.isFinite(members) ? members : 0,
              lastMessage: String(
                doc.lastMessage ?? doc.lastMessageText ?? doc.description ?? "",
              ),
              unread: 0,
              color: String(
                doc.color ?? CHANNEL_COLORS[index % CHANNEL_COLORS.length],
              ),
            } satisfies ChannelItem;
          });

          setChannels((current) =>
            mapped.map((channel) => {
              const member = membersByChannel[channel.id];
              if (!member) {
                return channel;
              }
              return { ...channel, unread: member.unreadCount };
            }),
          );
        }
      },
    );

    return () => {
      subscription();
    };
  }, [channels, currentUserId, membersByChannel]);

  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.backgroundGlowTop} />
        <View style={styles.backgroundGlowBottom} />

        <View style={styles.topBar}>
          <View style={styles.brandMark}>
            <View style={styles.brandDot} />
            <HugeiconsIcon icon={BubbleChatIcon} size={18} color="#1FAF75" />
          </View>
          <View style={styles.topBarRight}>
            <View style={styles.notificationButton}>
              <HugeiconsIcon icon={BellDotIcon} size={18} color="#1F2937" />
            </View>
            <View style={styles.profileAvatar}>
              <Text style={styles.profileInitials}>J</Text>
            </View>
          </View>
        </View>

        <View style={styles.greetingRow}>
          <Text style={styles.greetingText}>Good Afternoon</Text>
          <View style={styles.greetingAccent}>
            <Text style={styles.greetingName}>Jane</Text>
            <HugeiconsIcon icon={Sun01Icon} size={18} color="#F5B647" />
          </View>
        </View>

        <View style={styles.filterRow}>
          {filters.map((label, index) => {
            const isActive = index === 0;
            return (
              <View
                key={label}
                style={[
                  styles.filterChip,
                  isActive ? styles.filterChipActive : null,
                ]}
              >
                <Text
                  style={[
                    styles.filterText,
                    isActive ? styles.filterTextActive : null,
                  ]}
                >
                  {label}
                </Text>
              </View>
            );
          })}
        </View>

        <View style={styles.voiceCard}>
          <View style={styles.voiceHeader}>
            <View style={styles.voiceAvatar}>
              <Text style={styles.voiceAvatarText}>RM</Text>
            </View>
            <Text style={styles.voiceName}>Randy Mango</Text>
            <View style={styles.voiceMenu}>
              <HugeiconsIcon icon={More01Icon} size={16} color="#FFFFFF" />
            </View>
          </View>
          <View style={styles.voiceBody}>
            <View style={styles.playButton}>
              <HugeiconsIcon icon={PlayIcon} size={16} color="#1FAF75" />
            </View>
            <View style={styles.waveform}>
              {waveBars.map((height, index) => (
                <View
                  key={`${height}-${index}`}
                  style={[
                    styles.waveBar,
                    { height, opacity: index > 8 ? 0.35 : 1 },
                  ]}
                />
              ))}
            </View>
            <Text style={styles.voiceTime}>7:18</Text>
          </View>
          <View style={styles.voiceFooter}>
            <View style={styles.voiceIconCircle}>
              <HugeiconsIcon icon={AiMicIcon} size={14} color="#8A8DA2" />
            </View>
            <View style={styles.voiceIconCircle}>
              <HugeiconsIcon icon={BubbleChatIcon} size={14} color="#8A8DA2" />
            </View>
          </View>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Direct Message</Text>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.avatarRow}
        >
          {avatars.map((person) => (
            <View key={person.name} style={styles.avatarItem}>
              <View
                style={[styles.avatarCircle, { backgroundColor: person.color }]}
              >
                <Text style={styles.avatarInitials}>{person.initials}</Text>
                {person.badge ? (
                  <View style={styles.avatarBadge}>
                    <Text style={styles.avatarBadgeText}>{person.badge}</Text>
                  </View>
                ) : null}
              </View>
              {person.status ? (
                <View style={styles.typingPill}>
                  <Text style={styles.typingText}>{person.status}...</Text>
                </View>
              ) : null}
              <Text style={styles.avatarName} numberOfLines={2}>
                {person.name}
              </Text>
            </View>
          ))}
        </ScrollView>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Channels</Text>
        </View>

        <View style={styles.channelActions}>
          <Pressable
            style={[styles.channelActionButton, styles.channelPrimary]}
            onPress={() => router.push("/(tabs)/channel-create")}
          >
            <HugeiconsIcon icon={Add01Icon} size={14} color="#FFFFFF" />
            <Text style={styles.channelPrimaryText}>Create</Text>
          </Pressable>
          <Pressable
            style={styles.channelActionButton}
            onPress={() => router.push("/(tabs)/channel-invite")}
          >
            <HugeiconsIcon icon={UserSharingIcon} size={14} color="#1FAF75" />
            <Text style={styles.channelActionText}>Invite</Text>
          </Pressable>
        </View>

        <View style={styles.channelList}>
          {channels.map((channel) => (
            <Pressable
              key={channel.id}
              style={styles.channelCard}
              onPress={() =>
                router.push({
                  pathname: "/(tabs)/channel/[id]",
                  params: { id: channel.id },
                })
              }
            >
              <View
                style={[styles.channelIcon, { backgroundColor: channel.color }]}
              >
                <HugeiconsIcon icon={UserGroupIcon} size={16} color="#1F2937" />
              </View>
              <View style={styles.channelInfo}>
                <Text style={styles.channelName}>{channel.name}</Text>
                <Text style={styles.channelMeta}>
                  {channel.members} members
                  {channel.lastMessage ? ` · ${channel.lastMessage}` : ""}
                </Text>
              </View>
              {channel.unread ? (
                <View style={styles.channelBadge}>
                  <Text style={styles.channelBadgeText}>{channel.unread}</Text>
                </View>
              ) : null}
            </Pressable>
          ))}
        </View>
        {isLoadingChannels ? (
          <Text style={styles.loadingText}>Loading channels...</Text>
        ) : null}
        {!isLoadingChannels && channelError ? (
          <Text style={styles.emptyText}>{channelError}</Text>
        ) : null}
        {!isLoadingChannels && !channelError && channels.length === 0 ? (
          <View style={styles.emptyStateCard}>
            <Text style={styles.emptyTitle}>No channels yet</Text>
            <Text style={styles.emptySubtitle}>
              Create your first channel or invite classmates to get started.
            </Text>
            <View style={styles.emptyActions}>
              <Pressable
                style={[styles.channelActionButton, styles.channelPrimary]}
                onPress={() => router.push("/(tabs)/channel-create")}
              >
                <HugeiconsIcon icon={Add01Icon} size={14} color="#FFFFFF" />
                <Text style={styles.channelPrimaryText}>Create</Text>
              </Pressable>
              <Pressable
                style={styles.channelActionButton}
                onPress={() => router.push("/(tabs)/channel-invite")}
              >
                <HugeiconsIcon
                  icon={UserSharingIcon}
                  size={14}
                  color="#1FAF75"
                />
                <Text style={styles.channelActionText}>Invite</Text>
              </Pressable>
            </View>
          </View>
        ) : null}
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
    paddingBottom: 32,
    paddingTop: 18,
    gap: 18,
  },
  backgroundGlowTop: {
    position: "absolute",
    top: -120,
    right: -80,
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: "#E6F5EE",
  },
  backgroundGlowBottom: {
    position: "absolute",
    bottom: -180,
    left: -120,
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: "#EEF2FF",
  },
  topBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  brandMark: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  brandDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#1FAF75",
  },
  topBarRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  notificationButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 16,
    elevation: 4,
  },
  profileAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#E9E3FF",
    alignItems: "center",
    justifyContent: "center",
  },
  profileInitials: {
    fontSize: 14,
    fontWeight: "700",
    color: "#2D2E3A",
  },
  greetingRow: {
    gap: 6,
  },
  greetingText: {
    fontSize: 32,
    fontWeight: "700",
    color: "#1F2937",
    letterSpacing: -0.5,
  },
  greetingAccent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  greetingName: {
    fontSize: 32,
    fontWeight: "700",
    color: "#1F2937",
  },
  filterRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E6E7EE",
  },
  filterChipActive: {
    backgroundColor: "#1FAF75",
    borderColor: "#1FAF75",
  },
  filterText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#5A6072",
  },
  filterTextActive: {
    color: "#FFFFFF",
  },
  voiceCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 16,
    gap: 14,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 10 },
    shadowRadius: 20,
    elevation: 5,
  },
  voiceHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  voiceAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#E5ECFF",
    alignItems: "center",
    justifyContent: "center",
  },
  voiceAvatarText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#1F2937",
  },
  voiceName: {
    flex: 1,
    marginLeft: 10,
    fontSize: 14,
    fontWeight: "600",
    color: "#1F2937",
  },
  voiceMenu: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#7A5AF8",
    alignItems: "center",
    justifyContent: "center",
  },
  voiceBody: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  playButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#E9F7F0",
    alignItems: "center",
    justifyContent: "center",
  },
  waveform: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  waveBar: {
    width: 3,
    borderRadius: 2,
    backgroundColor: "#1FAF75",
  },
  voiceTime: {
    fontSize: 12,
    fontWeight: "600",
    color: "#1F2937",
  },
  voiceFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  voiceIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#F4F5F8",
    alignItems: "center",
    justifyContent: "center",
  },
  sectionHeader: {
    paddingTop: 6,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#1F2937",
  },
  avatarRow: {
    paddingVertical: 8,
    gap: 16,
  },
  avatarItem: {
    width: 70,
    alignItems: "center",
    gap: 6,
  },
  avatarCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarInitials: {
    fontSize: 12,
    fontWeight: "700",
    color: "#1F2937",
  },
  avatarBadge: {
    position: "absolute",
    top: -4,
    right: -4,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#F04438",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarBadgeText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  typingPill: {
    backgroundColor: "#F5A623",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  typingText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  avatarName: {
    fontSize: 11,
    fontWeight: "600",
    color: "#2D2E3A",
    textAlign: "center",
  },
  channelActions: {
    flexDirection: "row",
    gap: 10,
  },
  channelActionButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 16,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E6E7EE",
  },
  channelPrimary: {
    backgroundColor: "#1FAF75",
    borderColor: "#1FAF75",
  },
  channelPrimaryText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  channelActionText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#1FAF75",
  },
  channelList: {
    gap: 12,
  },
  channelCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    borderRadius: 18,
    backgroundColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 16,
    elevation: 3,
  },
  channelIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  channelInfo: {
    flex: 1,
    gap: 4,
  },
  channelName: {
    fontSize: 14,
    fontWeight: "700",
    color: "#1F2937",
  },
  channelMeta: {
    fontSize: 11,
    color: "#667085",
  },
  channelBadge: {
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "#F04438",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 6,
  },
  channelBadgeText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  loadingText: {
    fontSize: 12,
    color: "#7A7D92",
    textAlign: "center",
    marginTop: 6,
  },
  emptyText: {
    fontSize: 12,
    color: "#7A7D92",
    textAlign: "center",
    marginTop: 12,
  },
  emptyStateCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 18,
    gap: 8,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 16,
    elevation: 3,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1F2937",
  },
  emptySubtitle: {
    fontSize: 12,
    color: "#7A7D92",
  },
  emptyActions: {
    flexDirection: "row",
    gap: 10,
    paddingTop: 6,
  },
});

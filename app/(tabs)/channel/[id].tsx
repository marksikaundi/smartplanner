import HugeiconsIcon from "@/components/hugeicons-icon";
import { databases } from "@/lib/appwrite";
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
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type ChannelDetail = {
  id: string;
  name: string;
  description: string;
  members: number;
};

export default function ChannelDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const [channel, setChannel] = useState<ChannelDetail | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

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
  }, [id]);

  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content}>
        {isLoading ? (
          <ActivityIndicator size="small" color="#1FAF75" />
        ) : null}
        {!isLoading && loadError ? (
          <Text style={styles.helperText}>{loadError}</Text>
        ) : null}
        {channel ? (
          <View style={styles.card}>
            <View style={styles.iconWrap}>
              <HugeiconsIcon icon={UserGroupIcon} size={18} color="#1F2937" />
            </View>
            <Text style={styles.title}>{channel.name}</Text>
            <Text style={styles.subtitle}>
              {channel.members} members
            </Text>
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
  helperText: {
    fontSize: 12,
    color: "#7A7D92",
  },
});

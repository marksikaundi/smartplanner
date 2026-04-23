import { databases, Query } from "@/lib/appwrite";
import { APPWRITE_IDS, isConfigured } from "@/lib/appwrite-ids";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type ChannelOption = {
  id: string;
  name: string;
};

export default function ChannelInviteScreen() {
  const router = useRouter();
  const { channelId } = useLocalSearchParams<{ channelId?: string }>();
  const [channels, setChannels] = useState<ChannelOption[]>([]);
  const [selectedChannelId, setSelectedChannelId] = useState<string | null>(
    channelId ?? null,
  );
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let isActive = true;

    const loadChannels = async () => {
      if (!isConfigured(APPWRITE_IDS.collections.channels)) {
        if (isActive) {
          setLoadError("Channels collection is not configured.");
        }
        return;
      }

      try {
        setIsLoading(true);
        setLoadError(null);
        const response = await databases.listDocuments(
          APPWRITE_IDS.databaseId,
          APPWRITE_IDS.collections.channels,
          [Query.orderAsc("name"), Query.limit(50)],
        );
        if (isActive) {
          const mapped = response.documents.map((doc) => ({
            id: String(doc.$id),
            name: String(doc.name ?? doc.title ?? "Channel"),
          }));
          setChannels(mapped);
          if (!selectedChannelId && mapped[0]) {
            setSelectedChannelId(mapped[0].id);
          }
        }
      } catch {
        if (isActive) {
          setLoadError("Unable to load channels right now.");
        }
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    };

    loadChannels();

    return () => {
      isActive = false;
    };
  }, [selectedChannelId]);

  const handleInvite = async () => {
    const trimmedEmail = email.trim().toLowerCase();

    if (!isConfigured(APPWRITE_IDS.collections.channelInvites)) {
      Alert.alert("Not ready", "Channel invites collection is not configured.");
      return;
    }

    if (!selectedChannelId) {
      Alert.alert("Select channel", "Choose a channel to invite someone.");
      return;
    }

    if (!trimmedEmail) {
      Alert.alert("Missing email", "Enter an email address to invite.");
      return;
    }

    try {
      setIsSubmitting(true);
      await databases.createDocument(
        APPWRITE_IDS.databaseId,
        APPWRITE_IDS.collections.channelInvites,
        "unique()",
        {
          channelId: selectedChannelId,
          email: trimmedEmail,
          status: "pending",
        },
      );
      Alert.alert("Invite sent", "We will notify them to join the channel.");
      router.back();
    } catch (error) {
      const message =
        typeof error === "object" && error && "message" in error
          ? String(error.message)
          : "Unable to send invite right now.";
      Alert.alert("Invite failed", message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Invite to channel</Text>
          <Text style={styles.subtitle}>
            Send an email invite to join a study channel.
          </Text>
        </View>

        <View style={styles.formCard}>
          <Text style={styles.label}>Select channel</Text>
          {channels.map((channel) => {
            const isSelected = channel.id === selectedChannelId;
            return (
              <Pressable
                key={channel.id}
                style={[
                  styles.channelOption,
                  isSelected ? styles.channelOptionActive : null,
                ]}
                onPress={() => setSelectedChannelId(channel.id)}
              >
                <Text
                  style={[
                    styles.channelOptionText,
                    isSelected ? styles.channelOptionTextActive : null,
                  ]}
                >
                  {channel.name}
                </Text>
              </Pressable>
            );
          })}
          {isLoading ? (
            <Text style={styles.helperText}>Loading channels...</Text>
          ) : null}
          {!isLoading && loadError ? (
            <Text style={styles.helperText}>{loadError}</Text>
          ) : null}

          <Text style={styles.label}>Email address</Text>
          <TextInput
            value={email}
            onChangeText={setEmail}
            placeholder="learner@example.com"
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            style={styles.input}
            placeholderTextColor="#9AA0B6"
          />

          <Pressable style={styles.submitButton} onPress={handleInvite}>
            {isSubmitting ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={styles.submitText}>Send invite</Text>
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
    gap: 18,
  },
  header: {
    gap: 6,
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: "#1F2937",
  },
  subtitle: {
    fontSize: 12,
    color: "#7A7D92",
  },
  formCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 18,
    gap: 12,
  },
  label: {
    fontSize: 12,
    color: "#5A5F76",
    fontWeight: "600",
  },
  channelOption: {
    borderWidth: 1,
    borderColor: "#E6E4EF",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  channelOptionActive: {
    borderColor: "#1FAF75",
    backgroundColor: "#E9F7F0",
  },
  channelOptionText: {
    fontSize: 13,
    color: "#2D2E3A",
    fontWeight: "600",
  },
  channelOptionTextActive: {
    color: "#1FAF75",
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
  submitButton: {
    marginTop: 6,
    backgroundColor: "#1FAF75",
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
  },
  submitText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },
  helperText: {
    fontSize: 12,
    color: "#7A7D92",
  },
});

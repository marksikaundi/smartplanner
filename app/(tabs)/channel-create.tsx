import { databases, ID } from "@/lib/appwrite";
import { APPWRITE_IDS, isConfigured } from "@/lib/appwrite-ids";
import { useRouter } from "expo-router";
import { useState } from "react";
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

export default function ChannelCreateScreen() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCreate = async () => {
    const trimmedName = name.trim();
    const trimmedDescription = description.trim();

    if (!isConfigured(APPWRITE_IDS.collections.channels)) {
      Alert.alert("Not ready", "Channels collection is not configured yet.");
      return;
    }

    if (!trimmedName) {
      Alert.alert("Missing name", "Add a channel name to continue.");
      return;
    }

    try {
      setIsSubmitting(true);
      await databases.createDocument(
        APPWRITE_IDS.databaseId,
        APPWRITE_IDS.collections.channels,
        ID.unique(),
        {
          name: trimmedName,
          description: trimmedDescription,
          membersCount: 1,
          lastMessage: "",
          unreadCount: 0,
        },
      );
      router.back();
    } catch (error) {
      const message =
        typeof error === "object" && error && "message" in error
          ? String(error.message)
          : "Unable to create the channel right now.";
      Alert.alert("Create failed", message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Create channel</Text>
          <Text style={styles.subtitle}>
            Set up a space for group study and collaboration.
          </Text>
        </View>

        <View style={styles.formCard}>
          <Text style={styles.label}>Channel name</Text>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="Clinical cases"
            style={styles.input}
            placeholderTextColor="#9AA0B6"
          />

          <Text style={styles.label}>Description</Text>
          <TextInput
            value={description}
            onChangeText={setDescription}
            placeholder="Share notes and discuss cases"
            style={[styles.input, styles.multiline]}
            placeholderTextColor="#9AA0B6"
            multiline
          />

          <Pressable style={styles.submitButton} onPress={handleCreate}>
            {isSubmitting ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={styles.submitText}>Create channel</Text>
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
  multiline: {
    minHeight: 90,
    textAlignVertical: "top",
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
});

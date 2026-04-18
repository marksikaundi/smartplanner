import {
  databases,
  ID,
  InputFile,
  Permission,
  Role,
  storage,
} from "@/lib/appwrite";
import { APPWRITE_IDS, isConfigured } from "@/lib/appwrite-ids";
import { Feather } from "@expo/vector-icons";
import * as DocumentPicker from "expo-document-picker";
import { useState } from "react";
import {
  Alert,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

export default function UploadContentScreen() {
  const categories = ["Materials", "Resources", "Assignments", "Notes"];
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState(categories[0]);
  const [description, setDescription] = useState("");
  const [file, setFile] = useState<
    | {
        uri: string;
        name: string;
        type?: string;
      }
    | undefined
  >();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handlePickFile = async () => {
    const result = await DocumentPicker.getDocumentAsync({
      type: "*/*",
      copyToCacheDirectory: true,
    });

    if (result.canceled) {
      return;
    }

    const picked = result.assets?.[0];
    if (!picked) {
      return;
    }

    setFile({
      uri: picked.uri,
      name: picked.name ?? "upload",
      type: picked.mimeType ?? undefined,
    });
  };

  const handleSubmit = () => {
    if (!title.trim()) {
      Alert.alert("Missing title", "Add a title before uploading.");
      return;
    }

    if (!file) {
      Alert.alert("Missing file", "Pick a file to upload.");
      return;
    }

    if (!category.trim()) {
      Alert.alert("Missing category", "Select a category for this content.");
      return;
    }

    if (!isConfigured(APPWRITE_IDS.collections.materials)) {
      Alert.alert(
        "Not configured",
        "Set the materials collection ID in lib/appwrite-ids.ts",
      );
      return;
    }

    if (!APPWRITE_IDS.storageBucketId) {
      Alert.alert(
        "Not configured",
        "Set the storage bucket ID in lib/appwrite-ids.ts",
      );
      return;
    }

    setIsSubmitting(true);
    const upload = async () => {
      try {
        const fileInput = InputFile.fromPath(file.uri, file.name);
        const permissions = [
          Permission.read(Role.users()),
          Permission.write(Role.users()),
        ];
        const created = await storage.createFile(
          APPWRITE_IDS.storageBucketId,
          ID.unique(),
          fileInput,
          permissions,
        );

        await databases.createDocument(
          APPWRITE_IDS.databaseId,
          APPWRITE_IDS.collections.materials,
          ID.unique(),
          {
            title: title.trim(),
            description: description.trim(),
            categories: category.trim(),
            fileId: created.$id,
            fileName: created.name,
            type: file.type ?? "File",
          },
          permissions,
        );

        Alert.alert("Uploaded", "Your content has been submitted.");
        setTitle("");
        setCategory("");
        setDescription("");
        setFile(undefined);
      } catch (error) {
        const message =
          typeof error === "object" && error && "message" in error
            ? String(error.message)
            : "Unable to upload your content.";
        Alert.alert("Upload failed", message);
      } finally {
        setIsSubmitting(false);
      }
    };

    void upload();
  };

  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Upload Content</Text>
          <Text style={styles.subtitle}>
            Add new materials or resources for learners.
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.label}>Title</Text>
          <TextInput
            value={title}
            onChangeText={setTitle}
            placeholder="Organic chemistry notes"
            placeholderTextColor="#9AA0B4"
            style={styles.input}
          />

          <Text style={styles.label}>Category</Text>
          <View style={styles.categoryRow}>
            {categories.map((item) => (
              <Pressable
                key={item}
                onPress={() => setCategory(item)}
                style={[
                  styles.categoryChip,
                  category === item ? styles.categoryChipActive : null,
                ]}
              >
                <Text
                  style={[
                    styles.categoryText,
                    category === item ? styles.categoryTextActive : null,
                  ]}
                >
                  {item}
                </Text>
              </Pressable>
            ))}
          </View>

          <Text style={styles.label}>Description</Text>
          <TextInput
            value={description}
            onChangeText={setDescription}
            placeholder="Brief summary of the content"
            placeholderTextColor="#9AA0B4"
            style={[styles.input, styles.textarea]}
            multiline
          />

          <Pressable style={styles.fileButton} onPress={handlePickFile}>
            <Feather name="paperclip" size={16} color="#2D2E3A" />
            <Text style={styles.fileButtonText}>
              {file ? file.name : "Attach file"}
            </Text>
          </Pressable>

          <Pressable
            style={[
              styles.submitButton,
              isSubmitting ? styles.submitDisabled : null,
            ]}
            onPress={handleSubmit}
            disabled={isSubmitting}
          >
            <Feather name="upload" size={16} color="#FFFFFF" />
            <Text style={styles.submitText}>
              {isSubmitting ? "Uploading" : "Upload"}
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#F4F3F9",
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 40,
    gap: 16,
  },
  header: {
    gap: 6,
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: "#2D2E3A",
  },
  subtitle: {
    fontSize: 13,
    color: "#7A7D92",
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 16,
    gap: 12,
  },
  label: {
    fontSize: 12,
    fontWeight: "600",
    color: "#7A7D92",
  },
  input: {
    backgroundColor: "#F7F8FC",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: "#2D2E3A",
  },
  textarea: {
    minHeight: 120,
    textAlignVertical: "top",
  },
  submitButton: {
    marginTop: 6,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#34356E",
    paddingVertical: 12,
    borderRadius: 12,
  },
  submitDisabled: {
    opacity: 0.6,
  },
  submitText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "700",
  },
  categoryRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  categoryChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: "#F1F2F6",
  },
  categoryChipActive: {
    backgroundColor: "#34356E",
  },
  categoryText: {
    fontSize: 12,
    color: "#2D2E3A",
    fontWeight: "600",
  },
  categoryTextActive: {
    color: "#FFFFFF",
  },
  fileButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#F1F2F6",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
  },
  fileButtonText: {
    fontSize: 12,
    color: "#2D2E3A",
  },
});

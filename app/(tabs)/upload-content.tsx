import {
  account,
  databases,
  ID,
  Permission,
  Role,
  storage,
} from "@/lib/appwrite";
import { APPWRITE_IDS, isConfigured } from "@/lib/appwrite-ids";
import { Feather } from "@expo/vector-icons";
import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system";
import { useMemo, useState } from "react";
import {
  ActivityIndicator,
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
  const chunkSize = 5 * 1024 * 1024;
  const categories = ["Materials", "Resources", "Assignments", "Notes"];
  const tags = useMemo(() => ["Engineering", "Humanities", "Education"], []);
  const [title, setTitle] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([
    categories[0],
  ]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
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
  const [uploadProgress, setUploadProgress] = useState(0);

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

    if (!selectedCategories.length) {
      Alert.alert("Missing category", "Select at least one category.");
      return;
    }

    const primaryCategory = selectedCategories[0];
    const collectionKey = primaryCategory.toLowerCase();
    const collectionId =
      APPWRITE_IDS.collections[
        collectionKey as keyof typeof APPWRITE_IDS.collections
      ];

    if (!collectionId || !isConfigured(collectionId)) {
      Alert.alert(
        "Not configured",
        `Set the ${primaryCategory.toLowerCase()} collection ID in lib/appwrite-ids.ts`,
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
        const permissions = [
          Permission.read(Role.users()),
          Permission.write(Role.users()),
        ];
        setUploadProgress(5);
        const jwt = await account.createJWT();
        const fileInfo = await FileSystem.getInfoAsync(file.uri, {
          size: true,
        });

        if (!fileInfo.exists || !fileInfo.size) {
          throw new Error("Unable to read the selected file.");
        }

        const totalBytes = fileInfo.size;
        const fileId = ID.unique();
        let uploadId: string | null = null;
        let created: any = null;

        for (let start = 0; start < totalBytes; start += chunkSize) {
          const end = Math.min(start + chunkSize, totalBytes) - 1;
          const length = end - start + 1;
          const chunkBase64 = await FileSystem.readAsStringAsync(file.uri, {
            encoding: FileSystem.EncodingType.Base64,
            position: start,
            length,
          });

          const chunkUri = `${FileSystem.cacheDirectory}upload-${fileId}-${start}.chunk`;
          await FileSystem.writeAsStringAsync(chunkUri, chunkBase64, {
            encoding: FileSystem.EncodingType.Base64,
          });

          const headers: Record<string, string> = {
            "X-Appwrite-Project": APPWRITE_IDS.projectId,
            "X-Appwrite-JWT": jwt.jwt,
            "Content-Range": `bytes ${start}-${end}/${totalBytes}`,
          };

          if (uploadId) {
            headers["X-Appwrite-Id"] = uploadId;
          }

          const result = await FileSystem.uploadAsync(
            `${APPWRITE_IDS.endpoint}/storage/buckets/${
              APPWRITE_IDS.storageBucketId
            }/files`,
            chunkUri,
            {
              httpMethod: "POST",
              headers,
              uploadType: FileSystem.FileSystemUploadType.MULTIPART,
              fieldName: "file",
              parameters: {
                fileId,
              },
            },
          );

          await FileSystem.deleteAsync(chunkUri, { idempotent: true });

          if (result.status < 200 || result.status >= 300) {
            throw new Error(result.body || "Upload failed");
          }

          if (!created) {
            created = JSON.parse(result.body);
            uploadId = created.$id;
          }

          const percent = Math.min(
            70,
            Math.round(((end + 1) / totalBytes) * 70),
          );
          setUploadProgress(percent);
        }

        if (!created) {
          throw new Error("Upload did not return a file response.");
        }

        await storage.updateFile(
          APPWRITE_IDS.storageBucketId,
          created.$id,
          created.name,
          permissions,
        );

        setUploadProgress(80);

        const payload: Record<string, string | string[]> = {
          title: title.trim(),
          description: description.trim(),
          categories: selectedCategories,
          tags: selectedTags,
          fileId: created.$id,
          fileName: created.name,
          type: file.type ?? "File",
        };

        if (collectionKey === "notes") {
          payload.body = description.trim();
        }

        await databases.createDocument(
          APPWRITE_IDS.databaseId,
          collectionId,
          ID.unique(),
          payload,
          permissions,
        );

        setUploadProgress(100);
        Alert.alert("Uploaded", "Your content has been submitted.");
        setTitle("");
        setSelectedCategories([categories[0]]);
        setSelectedTags([]);
        setDescription("");
        setFile(undefined);
        setUploadProgress(0);
      } catch (error) {
        let message =
          typeof error === "object" && error && "message" in error
            ? String(error.message)
            : "Unable to upload your content.";
        const normalized = message.toLowerCase();
        if (
          normalized.includes("backend write error") ||
          normalized.includes("503")
        ) {
          message =
            "Appwrite returned a 503 while writing the file. Try again in a moment or upload a smaller file.";
        } else if (
          normalized.includes("network") ||
          normalized.includes("offline")
        ) {
          message =
            "The upload could not reach Appwrite. Please confirm your connection and retry.";
        } else if (normalized.includes("<html")) {
          message = "The server returned an unexpected response. Please retry.";
        }
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
                onPress={() => {
                  setSelectedCategories((current) =>
                    current.includes(item)
                      ? current.filter((value) => value !== item)
                      : [...current, item],
                  );
                }}
                style={[
                  styles.categoryChip,
                  selectedCategories.includes(item)
                    ? styles.categoryChipActive
                    : null,
                ]}
              >
                <Text
                  style={[
                    styles.categoryText,
                    selectedCategories.includes(item)
                      ? styles.categoryTextActive
                      : null,
                  ]}
                >
                  {item}
                </Text>
              </Pressable>
            ))}
          </View>

          <Text style={styles.label}>Tags</Text>
          <View style={styles.categoryRow}>
            {tags.map((item) => (
              <Pressable
                key={item}
                onPress={() => {
                  setSelectedTags((current) =>
                    current.includes(item)
                      ? current.filter((value) => value !== item)
                      : [...current, item],
                  );
                }}
                style={[
                  styles.tagChip,
                  selectedTags.includes(item) ? styles.tagChipActive : null,
                ]}
              >
                <Text
                  style={[
                    styles.tagText,
                    selectedTags.includes(item) ? styles.tagTextActive : null,
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
            {isSubmitting ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <Feather name="upload" size={16} color="#FFFFFF" />
            )}
            <Text style={styles.submitText}>
              {isSubmitting ? "Uploading" : "Upload"}
            </Text>
          </Pressable>
          {isSubmitting ? (
            <View style={styles.progressRow}>
              <View style={styles.progressTrack}>
                <View
                  style={[styles.progressFill, { width: `${uploadProgress}%` }]}
                />
              </View>
              <Text style={styles.progressText}>{uploadProgress}%</Text>
            </View>
          ) : null}
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
  progressRow: {
    marginTop: 10,
    gap: 6,
  },
  progressTrack: {
    height: 6,
    backgroundColor: "#E1E3EE",
    borderRadius: 999,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#34356E",
  },
  progressText: {
    fontSize: 11,
    color: "#7A7D92",
    textAlign: "right",
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
  tagChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: "#E8ECFF",
  },
  tagChipActive: {
    backgroundColor: "#34356E",
  },
  tagText: {
    fontSize: 12,
    color: "#2D2E3A",
    fontWeight: "600",
  },
  tagTextActive: {
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

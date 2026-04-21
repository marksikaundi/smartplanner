import HugeiconsIcon from "@/components/hugeicons-icon";
import {
  account,
  databases,
  ID,
  Permission,
  Role,
  storage,
} from "@/lib/appwrite";
import { APPWRITE_IDS, isConfigured } from "@/lib/appwrite-ids";
import { AttachmentIcon, CloudUploadIcon } from "@hugeicons/core-free-icons";
import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system";
import { useEffect, useMemo, useState } from "react";
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
import { Fonts } from "@/constants/theme";

export default function UploadContentScreen() {
  const chunkSize = 5 * 1024 * 1024;
  const categories = ["Materials", "Resources", "Assignments", "Notes"];
  const tags = useMemo(() => ["Engineering", "Humanities", "Education"], []);
  const defaultPrograms = useMemo(
    () => [
      "Electronic Computing",
      "Engineering Drawing",
      "Advanced Math",
      "Theory Of Electrical",
      "Interactive Web",
      "Programming",
      "Advanced Physics",
      "Advanced Chemistry",
      "Other",
    ],
    [],
  );
  const [title, setTitle] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([
    categories[0],
  ]);
  const [programs, setPrograms] = useState<string[]>(defaultPrograms);
  const [selectedProgram, setSelectedProgram] = useState(defaultPrograms[0]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [description, setDescription] = useState("");
  const [file, setFile] = useState<
    | {
        uri: string;
        name: string;
        type?: string;
        size?: number;
      }
    | undefined
  >();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const formatBytes = (bytes?: number) => {
    if (!bytes) {
      return "";
    }
    const units = ["B", "KB", "MB", "GB"];
    const exponent = Math.min(
      Math.floor(Math.log(bytes) / Math.log(1024)),
      units.length - 1,
    );
    const value = bytes / 1024 ** exponent;
    return `${value.toFixed(value >= 10 || exponent === 0 ? 0 : 1)} ${
      units[exponent]
    }`;
  };

  useEffect(() => {
    let isActive = true;

    const loadPrograms = async () => {
      if (!isConfigured(APPWRITE_IDS.collections.programs)) {
        return;
      }

      try {
        const response = await databases.listDocuments(
          APPWRITE_IDS.databaseId,
          APPWRITE_IDS.collections.programs,
        );
        if (!isActive) {
          return;
        }
        const mapped = response.documents
          .map((doc) => String(doc.title ?? doc.name ?? ""))
          .filter((value) => Boolean(value));
        if (mapped.length > 0) {
          setPrograms(mapped);
          if (!mapped.includes(selectedProgram)) {
            setSelectedProgram(mapped[0]);
          }
        }
      } catch {
        if (isActive) {
          setPrograms(defaultPrograms);
        }
      }
    };

    loadPrograms();

    return () => {
      isActive = false;
    };
  }, [defaultPrograms, selectedProgram]);

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

    const info = await FileSystem.getInfoAsync(picked.uri);

    setFile({
      uri: picked.uri,
      name: picked.name ?? "upload",
      type: picked.mimeType ?? undefined,
      size: info.exists && "size" in info ? Number(info.size ?? 0) : undefined,
    });
  };

  const handleSubmit = () => {
    if (!title.trim()) {
      Alert.alert("Missing title", "Add a title before uploading.");
      return;
    return (
      <SafeAreaView style={styles.screen}>
        <View style={styles.heroBackdrop}>
          <View style={styles.heroGlowOne} />
          <View style={styles.heroGlowTwo} />
        </View>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>Upload flow</Text>
            </View>
            <Text style={styles.title}>Share learning content</Text>
            <Text style={styles.subtitle}>
              Make files easier to find for students and teammates.
            </Text>
            <View style={styles.stepsRow}>
              {[
                "Pick file",
                "Add details",
                "Publish",
              ].map((step) => (
                <View key={step} style={styles.stepChip}>
                  <Text style={styles.stepText}>{step}</Text>
                </View>
              ))}
            </View>
          </View>

          <View style={styles.panel}>
            <Text style={styles.sectionTitle}>File upload</Text>
            <Text style={styles.sectionSubtitle}>
              Choose a file. We support PDFs, slides, archives, and more.
            </Text>

            <Pressable style={styles.dropzone} onPress={handlePickFile}>
              <View style={styles.dropzoneIcon}>
                <HugeiconsIcon icon={CloudUploadIcon} size={22} color="#0E7490" />
              </View>
              <View style={styles.dropzoneText}>
                <Text style={styles.dropzoneTitle}>
                  {file ? "Replace your file" : "Tap to choose a file"}
                </Text>
                <Text style={styles.dropzoneSubtitle}>
                  {file
                    ? "Keep the latest version uploaded"
                    : "Max 200MB recommended"}
                </Text>
              </View>
            </Pressable>

            {file ? (
              <View style={styles.fileCard}>
                <View style={styles.fileIconWrapper}>
                  <HugeiconsIcon icon={AttachmentIcon} size={18} color="#1F2A44" />
                </View>
                <View style={styles.fileMeta}>
                  <Text style={styles.fileName}>{file.name}</Text>
                  <Text style={styles.fileInfo}>
                    {file.type ?? "File"}
                    {file.size ? ` • ${formatBytes(file.size)}` : ""}
                  </Text>
                </View>
                <Pressable onPress={() => setFile(undefined)}>
                  <Text style={styles.removeFile}>Remove</Text>
                </Pressable>
              </View>
            ) : null}
          </View>

          <View style={styles.panel}>
            <Text style={styles.sectionTitle}>Details</Text>
            <Text style={styles.sectionSubtitle}>
              The more context you add, the easier it is to discover.
            </Text>

            <Text style={styles.label}>Title</Text>
            <TextInput
              value={title}
              onChangeText={setTitle}
              placeholder="Organic chemistry notes"
              placeholderTextColor="#9AA0B4"
              style={styles.input}
            />

            <Text style={styles.label}>Category</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.chipRow}
            >
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
                    styles.chip,
                    selectedCategories.includes(item) ? styles.chipActive : null,
                  ]}
                >
                  <Text
                    style={[
                      styles.chipText,
                      selectedCategories.includes(item)
                        ? styles.chipTextActive
                        : null,
                    ]}
                  >
                    {item}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>

            <Text style={styles.label}>Program</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.chipRow}
            >
              {programs.map((item) => (
                <Pressable
                  key={item}
                  onPress={() => setSelectedProgram(item)}
                  style={[
                    styles.chip,
                    selectedProgram === item ? styles.chipActive : null,
                  ]}
                >
                  <Text
                    style={[
                      styles.chipText,
                      selectedProgram === item ? styles.chipTextActive : null,
                    ]}
                  >
                    {item}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>

            <Text style={styles.label}>Tags</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.chipRow}
            >
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
                    styles.chip,
                    selectedTags.includes(item) ? styles.chipActive : null,
                  ]}
                >
                  <Text
                    style={[
                      styles.chipText,
                      selectedTags.includes(item) ? styles.chipTextActive : null,
                    ]}
                  >
                    {item}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>

            <Text style={styles.label}>Description</Text>
            <TextInput
              value={description}
              onChangeText={setDescription}
              placeholder="What is inside and who is it for?"
              placeholderTextColor="#9AA0B4"
              style={[styles.input, styles.textarea]}
              multiline
            />
          </View>

          {isSubmitting ? (
            <View style={styles.progressWrap}>
              <ActivityIndicator size="small" color="#0E7490" />
              <View style={styles.progressTrack}>
                <View
                  style={[
                    styles.progressFill,
                    { width: `${uploadProgress}%` },
                  ]}
                />
              </View>
              <Text style={styles.progressText}>
                Uploading {uploadProgress}%
              </Text>
            </View>
          ) : null}

          <Pressable
            style={[
              styles.submitButton,
              isSubmitting ? styles.submitButtonDisabled : null,
            ]}
            onPress={handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <HugeiconsIcon icon={CloudUploadIcon} size={20} color="#fff" />
            )}
            <Text style={styles.submitText}>
              {isSubmitting ? "Uploading..." : "Publish upload"}
            </Text>
          </Pressable>
        </ScrollView>
      </SafeAreaView>
    );
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
              flex: 1,
              backgroundColor: "#F8FAFC",
        } else if (
          normalized.includes("network") ||
              padding: 20,
              paddingBottom: 44,
            },
            heroBackdrop: {
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              height: 280,
              overflow: "hidden",
            },
            heroGlowOne: {
              position: "absolute",
              width: 280,
              height: 280,
              borderRadius: 140,
              backgroundColor: "#D1FAE5",
              top: -120,
              right: -80,
              opacity: 0.6,
            },
            heroGlowTwo: {
              position: "absolute",
              width: 220,
              height: 220,
              borderRadius: 110,
              backgroundColor: "#DBEAFE",
              top: -60,
              left: -40,
              opacity: 0.7,
          message =
            "The upload could not reach Appwrite. Please confirm your connection and retry.";
              marginBottom: 24,
          message = "The server returned an unexpected response. Please retry.";
        }
              fontSize: 30,
              fontWeight: "700",
              color: "#0F172A",
              fontFamily: Fonts.serif,
              marginBottom: 6,
      }
    };
              fontSize: 15,
              color: "#475569",
              lineHeight: 22,

            badge: {
              alignSelf: "flex-start",
              backgroundColor: "#E2E8F0",
              paddingHorizontal: 12,
              paddingVertical: 6,
              borderRadius: 999,
              marginBottom: 12,
            },
            badgeText: {
              fontSize: 12,
              fontWeight: "600",
              color: "#0F172A",
              letterSpacing: 0.3,
              textTransform: "uppercase",
            },
            stepsRow: {
              flexDirection: "row",
              flexWrap: "wrap",
              gap: 8,
              marginTop: 16,
            },
            stepChip: {
              backgroundColor: "#F1F5F9",
              borderRadius: 14,
              paddingHorizontal: 12,
              paddingVertical: 6,
            },
            stepText: {
              fontSize: 12,
              fontWeight: "600",
              color: "#1E293B",
            },
            panel: {
              backgroundColor: "#FFFFFF",
              borderRadius: 22,
              padding: 18,
              marginBottom: 18,
              shadowColor: "#0F172A",
              shadowOpacity: 0.05,
              shadowOffset: { width: 0, height: 10 },
              shadowRadius: 18,
              elevation: 2,
              borderWidth: 1,
              borderColor: "#E2E8F0",
            },
            sectionTitle: {
              fontSize: 18,
              fontWeight: "700",
              color: "#0F172A",
              marginBottom: 6,
            },
            sectionSubtitle: {
              fontSize: 13,
              color: "#64748B",
              marginBottom: 16,
          </Text>
        </View>
              fontSize: 12,
              textTransform: "uppercase",
              letterSpacing: 0.8,
              color: "#64748B",
              fontWeight: "600",
              marginBottom: 8,
              marginTop: 8,
            onChangeText={setTitle}
            placeholder="Organic chemistry notes"
              backgroundColor: "#F8FAFC",
              borderRadius: 16,
              paddingHorizontal: 14,
              paddingVertical: 12,
              fontSize: 15,
              color: "#0F172A",
              borderWidth: 1,
              borderColor: "#E2E8F0",
                key={item}
                onPress={() => {
                  setSelectedCategories((current) =>
                    current.includes(item)
                      ? current.filter((value) => value !== item)
            chipRow: {
              paddingBottom: 6,
              gap: 10,
            },
            chip: {
              backgroundColor: "#F8FAFC",
              paddingHorizontal: 14,
              paddingVertical: 8,
              borderRadius: 999,
              borderWidth: 1,
              borderColor: "#E2E8F0",
            },
            chipActive: {
              backgroundColor: "#0E7490",
              borderColor: "#0E7490",
            },
            chipText: {
              fontSize: 13,
              color: "#475569",
              fontWeight: "600",
            },
            chipTextActive: {
              color: "#fff",
            },
            dropzone: {
              flexDirection: "row",
              alignItems: "center",
              padding: 16,
              borderRadius: 18,
              borderWidth: 1,
              borderColor: "#BFDBFE",
              backgroundColor: "#EFF6FF",
            },
            dropzoneIcon: {
              width: 44,
              height: 44,
              borderRadius: 16,
              backgroundColor: "#E0F2FE",
              alignItems: "center",
              justifyContent: "center",
            },
            dropzoneText: {
              marginLeft: 12,
              flex: 1,
            },
            dropzoneTitle: {
              fontSize: 15,
              fontWeight: "600",
              color: "#0F172A",
            },
            dropzoneSubtitle: {
              fontSize: 12,
              color: "#475569",
              marginTop: 4,
            },
            fileCard: {
              marginTop: 14,
              flexDirection: "row",
              alignItems: "center",
              padding: 12,
              borderRadius: 16,
              backgroundColor: "#F8FAFC",
              borderWidth: 1,
              borderColor: "#E2E8F0",
            },
            fileIconWrapper: {
              width: 36,
              height: 36,
              borderRadius: 12,
              backgroundColor: "#E2E8F0",
              alignItems: "center",
              justifyContent: "center",
            },
            fileMeta: {
              flex: 1,
              marginLeft: 10,
            },
            fileName: {
              fontSize: 14,
              fontWeight: "600",
              color: "#0F172A",
            },
            fileInfo: {
              fontSize: 12,
              color: "#64748B",
              marginTop: 2,
            },
            removeFile: {
              fontSize: 12,
              fontWeight: "600",
              color: "#DC2626",
            },
            progressWrap: {
              backgroundColor: "#FFFFFF",
              borderRadius: 18,
              padding: 14,
              borderWidth: 1,
              borderColor: "#E2E8F0",
              marginBottom: 16,
            },
            progressTrack: {
              height: 8,
              borderRadius: 999,
              backgroundColor: "#E2E8F0",
              marginTop: 10,
              overflow: "hidden",
            },
            progressFill: {
              height: "100%",
              backgroundColor: "#0E7490",
            },
            progressText: {
              marginTop: 8,
              fontSize: 12,
              color: "#475569",
            },
            submitButton: {
              backgroundColor: "#0F766E",
              borderRadius: 18,
              paddingVertical: 16,
              alignItems: "center",
              flexDirection: "row",
              justifyContent: "center",
              gap: 10,
            },
            submitButtonDisabled: {
              opacity: 0.7,
            },
            submitText: {
              fontSize: 16,
              fontWeight: "600",
              color: "#fff",
            },
            style={[styles.input, styles.textarea]}
            multiline
          />

          <Pressable style={styles.fileButton} onPress={handlePickFile}>
            <HugeiconsIcon icon={AttachmentIcon} size={16} color="#2D2E3A" />
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
              <HugeiconsIcon icon={CloudUploadIcon} size={16} color="#FFFFFF" />
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

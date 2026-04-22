import HugeiconsIcon from "@/components/hugeicons-icon";
import { Fonts } from "@/constants/theme";
import { databases, ID, Permission, Role } from "@/lib/appwrite";
import { APPWRITE_IDS, isConfigured } from "@/lib/appwrite-ids";
import {
  addRecentUpload,
  getRecentUploads,
  type RecentUploadItem,
} from "@/lib/recent-uploads";
import {
  AttachmentIcon,
  CloudUploadIcon,
  File02Icon,
} from "@hugeicons/core-free-icons";
import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system";
import { useRouter } from "expo-router";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type SelectedFile = {
  uri?: string;
  name: string;
  type?: string;
  size?: number;
  webFile?: Blob & { name?: string; size?: number; type?: string };
};

export default function UploadContentScreen() {
  const router = useRouter();
  const maxFileBytes = 200 * 1024 * 1024;
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
  const [file, setFile] = useState<SelectedFile | undefined>();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadEtaSeconds, setUploadEtaSeconds] = useState<number | null>(null);
  const [uploadSpeed, setUploadSpeed] = useState<number | null>(null);
  const [isDragActive, setIsDragActive] = useState(false);
  const [recentUploads, setRecentUploads] = useState<RecentUploadItem[]>([]);
  const [previewUri, setPreviewUri] = useState<string | null>(null);
  const uploadStartRef = useRef<number | null>(null);

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

  const formatDuration = (seconds?: number | null) => {
    if (!seconds || !Number.isFinite(seconds)) {
      return "";
    }
    const rounded = Math.max(0, Math.round(seconds));
    const mins = Math.floor(rounded / 60);
    const secs = rounded % 60;
    if (mins <= 0) {
      return `${secs}s`;
    }
    return `${mins}m ${secs.toString().padStart(2, "0")}s`;
  };

  const formatRelativeTime = (value: string) => {
    const timestamp = new Date(value).getTime();
    if (!Number.isFinite(timestamp)) {
      return "";
    }
    const now = Date.now();
    const diffMinutes = Math.max(0, Math.round((now - timestamp) / 60000));
    if (diffMinutes < 1) {
      return "Just now";
    }
    if (diffMinutes < 60) {
      return `${diffMinutes}m ago`;
    }
    const hours = Math.round(diffMinutes / 60);
    if (hours < 24) {
      return `${hours}h ago`;
    }
    const days = Math.round(hours / 24);
    return `${days}d ago`;
  };

  const resolveFileKind = (mimeType?: string, fileName?: string) => {
    const lowerMime = (mimeType ?? "").toLowerCase();
    const lowerName = (fileName ?? "").toLowerCase();
    if (lowerMime.includes("pdf") || lowerName.endsWith(".pdf")) {
      return "pdf";
    }
    if (
      lowerMime.startsWith("image/") ||
      [".png", ".jpg", ".jpeg", ".gif", ".webp"].some((ext) =>
        lowerName.endsWith(ext),
      )
    ) {
      return "image";
    }
    return "file";
  };

  const buildUploadFile = async (selected: SelectedFile) => {
    if (Platform.OS === "web") {
      if (!selected.webFile) {
        throw new Error("Web upload requires a browser file.");
      }
      return selected.webFile;
    }

    if (!selected.uri) {
      throw new Error("Missing file URI for upload.");
    }

    const response = await fetch(selected.uri);
    const blob = await response.blob();
    const file = new File([blob], selected.name || "upload", {
      type: selected.type ?? blob.type ?? "application/octet-stream",
    });
    return Object.assign(file, { uri: selected.uri });
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

  useEffect(() => {
    let isActive = true;

    const loadRecentUploads = async () => {
      const items = await getRecentUploads();
      if (isActive) {
        setRecentUploads(items);
      }
    };

    loadRecentUploads();

    return () => {
      isActive = false;
    };
  }, []);

  useEffect(() => {
    if (Platform.OS !== "web") {
      setPreviewUri(null);
      return;
    }

    if (!file?.webFile || resolveFileKind(file.type, file.name) !== "image") {
      setPreviewUri(null);
      return;
    }

    const url = URL.createObjectURL(file.webFile);
    setPreviewUri(url);
    return () => {
      URL.revokeObjectURL(url);
    };
  }, [file?.name, file?.type, file?.webFile]);

  const rejectOversizedFile = (size?: number) => {
    if (size && size > maxFileBytes) {
      Alert.alert(
        "File too large",
        `Pick a file under ${formatBytes(maxFileBytes)}.`,
      );
      return true;
    }
    return false;
  };

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

    if (Platform.OS === "web") {
      const webFile = "file" in picked ? picked.file : undefined;
      const webSize =
        typeof picked.size === "number" ? picked.size : webFile?.size;
      if (rejectOversizedFile(webSize)) {
        return;
      }
      setFile({
        uri: picked.uri,
        name: picked.name ?? webFile?.name ?? "upload",
        type: picked.mimeType ?? webFile?.type,
        size:
          typeof picked.size === "number" ? picked.size : (webFile?.size ?? 0),
        webFile: webFile ?? undefined,
      });
      return;
    }

    const info = await FileSystem.getInfoAsync(picked.uri);
    if (info.exists && "size" in info && rejectOversizedFile(info.size)) {
      return;
    }

    setFile({
      uri: picked.uri,
      name: picked.name ?? "upload",
      type: picked.mimeType ?? undefined,
      size: info.exists && "size" in info ? Number(info.size ?? 0) : undefined,
    });
  };

  const handleDragOver = (event: any) => {
    if (Platform.OS !== "web") {
      return;
    }
    event.preventDefault();
    event.stopPropagation();
    setIsDragActive(true);
  };

  const handleDragLeave = (event: any) => {
    if (Platform.OS !== "web") {
      return;
    }
    event.preventDefault();
    event.stopPropagation();
    setIsDragActive(false);
  };

  const handleDrop = (event: any) => {
    if (Platform.OS !== "web") {
      return;
    }
    event.preventDefault();
    event.stopPropagation();
    setIsDragActive(false);

    const dropped = event?.nativeEvent?.dataTransfer?.files?.[0];
    if (!dropped) {
      return;
    }

    if (rejectOversizedFile(dropped.size)) {
      return;
    }

    setFile({
      name: dropped.name ?? "upload",
      type: dropped.type ?? undefined,
      size: dropped.size ?? undefined,
      webFile: dropped,
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

    if (file.size && file.size > maxFileBytes) {
      Alert.alert(
        "File too large",
        `Pick a file under ${formatBytes(maxFileBytes)}.`,
      );
      return;
    }

    if (!selectedCategories.length) {
      Alert.alert("Missing category", "Select at least one category.");
      return;
    }

    if (!selectedProgram) {
      Alert.alert("Missing program", "Select a program for this upload.");
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

    setIsSubmitting(true);
    setUploadProgress(0);
    setUploadEtaSeconds(null);
    setUploadSpeed(null);
    uploadStartRef.current = Date.now();

    const upload = async () => {
      try {
        const permissions = [
          Permission.read(Role.users()),
          Permission.write(Role.users()),
        ];
        setUploadProgress(5);
        const uploadFile = await buildUploadFile(file);
        const totalBytes = uploadFile.size ?? file.size ?? 0;
        if (!totalBytes) {
          throw new Error("Unable to read the selected file.");
        }

        const uploadedFiles = await uploadFiles("documents", {
          files: [uploadFile],
          onUploadProgress: (progress) => {
            setUploadProgress(Math.min(90, Math.round(progress.totalProgress)));
            if (uploadStartRef.current) {
              const elapsedSeconds =
                (Date.now() - uploadStartRef.current) / 1000;
              if (elapsedSeconds > 0) {
                const speed = progress.totalLoaded / elapsedSeconds;
                const remaining = Math.max(totalBytes - progress.totalLoaded, 0);
                setUploadSpeed(speed);
                setUploadEtaSeconds(remaining / speed);
              }
            }
          },
        });

        const uploaded = uploadedFiles[0];
        if (!uploaded) {
          throw new Error("UploadThing did not return a file response.");
        }

        setUploadProgress(95);
        const fileUrl = uploaded.ufsUrl || uploaded.url;

        const payload: Record<string, string | string[]> = {
          title: title.trim(),
          description: description.trim(),
          categories: selectedCategories,
          tags: selectedTags,
          programName: selectedProgram,
          fileUrl,
          fileKey: uploaded.key,
          fileName: file.name,
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

        const updatedRecents = await addRecentUpload({
          id: uploaded.key,
          title: title.trim(),
          category: primaryCategory,
          program: selectedProgram,
          fileName: file.name,
          fileUrl,
          fileKey: uploaded.key,
          mimeType: file.type ?? "",
        });
        setRecentUploads(updatedRecents);

        setUploadProgress(100);
        setUploadEtaSeconds(null);
        setUploadSpeed(null);
        Alert.alert("Uploaded", "Your content has been submitted.");
        setTitle("");
        setSelectedCategories([categories[0]]);
        setSelectedProgram(programs[0] ?? "");
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
            "UploadThing returned a 503 while writing the file. Try again in a moment or upload a smaller file.";
        } else if (
          normalized.includes("network") ||
          normalized.includes("offline")
        ) {
          message =
            "The upload could not reach UploadThing. Please confirm your connection and retry.";
        } else if (normalized.includes("<html")) {
          message = "The server returned an unexpected response. Please retry.";
        }
        Alert.alert("Upload failed", message);
      } finally {
        setIsSubmitting(false);
        uploadStartRef.current = null;
      }
    };

    void upload();
  };

  const sizeLabel = file?.size
    ? `${formatBytes(file.size)} of ${formatBytes(maxFileBytes)}`
    : `Up to ${formatBytes(maxFileBytes)}`;
  const etaLabel = formatDuration(uploadEtaSeconds);
  const fileKind = file ? resolveFileKind(file.type, file.name) : "file";
  const isImageFile = fileKind === "image";
  const isPdfFile = fileKind === "pdf";
  const previewSourceUri =
    Platform.OS === "web" ? previewUri : (file?.uri ?? null);
  const webDropProps =
    Platform.OS === "web"
      ? ({
          onDragOver: handleDragOver,
          onDragLeave: handleDragLeave,
          onDrop: handleDrop,
        } as Record<string, unknown>)
      : {};

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
            {["Pick file", "Add details", "Publish"].map((step) => (
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

          <Pressable
            style={[
              styles.dropzone,
              isDragActive ? styles.dropzoneActive : null,
            ]}
            onPress={handlePickFile}
            {...webDropProps}
          >
            <View style={styles.dropzoneIcon}>
              <HugeiconsIcon icon={CloudUploadIcon} size={22} color="#0E7490" />
            </View>
            <View style={styles.dropzoneText}>
              <Text style={styles.dropzoneTitle}>
                {file ? "Replace your file" : "Tap or drop a file"}
              </Text>
              <Text style={styles.dropzoneSubtitle}>
                {file
                  ? "Keep the latest version uploaded"
                  : Platform.OS === "web"
                    ? "Drag and drop supported on web"
                    : "Max 200MB recommended"}
              </Text>
            </View>
          </Pressable>

          <View style={styles.sizeRow}>
            <Text
              style={[
                styles.sizeHint,
                file?.size && file.size > maxFileBytes
                  ? styles.sizeHintError
                  : null,
              ]}
            >
              Size limit: {sizeLabel}
            </Text>
            <View style={styles.sizePill}>
              <Text style={styles.sizePillText}>Hard cap</Text>
            </View>
          </View>

          {file ? (
            <View style={styles.fileCard}>
              <View style={styles.fileIconWrapper}>
                {isImageFile && previewSourceUri ? (
                  <Image
                    source={{ uri: previewSourceUri }}
                    style={styles.fileThumbnail}
                  />
                ) : (
                  <HugeiconsIcon
                    icon={isPdfFile ? File02Icon : AttachmentIcon}
                    size={18}
                    color="#1F2A44"
                  />
                )}
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
                style={[styles.progressFill, { width: `${uploadProgress}%` }]}
              />
            </View>
            <Text style={styles.progressText}>
              Uploading {uploadProgress}%{etaLabel ? ` • ETA ${etaLabel}` : ""}
              {uploadSpeed ? ` • ${formatBytes(uploadSpeed)}/s` : ""}
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

        <View style={styles.panel}>
          <View style={styles.recentHeader}>
            <Text style={styles.sectionTitle}>Recent uploads</Text>
            <Text style={styles.recentCount}>{recentUploads.length}</Text>
          </View>
          <Text style={styles.sectionSubtitle}>
            Quick access to your latest uploads.
          </Text>
          {recentUploads.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyTitle}>No uploads yet</Text>
              <Text style={styles.emptySubtitle}>
                Your latest uploads will appear here.
              </Text>
            </View>
          ) : (
            recentUploads.map((item) => {
              const kind = resolveFileKind(item.mimeType, item.fileName);
              const pillLabel =
                kind === "pdf" ? "PDF" : kind === "image" ? "IMG" : "";
              return (
                <Pressable
                  key={`${item.id}-${item.uploadedAt}`}
                  style={styles.recentRow}
                  onPress={() => {
                    if (!item.fileUrl) {
                      return;
                    }
                    router.push({
                      pathname: "/material-viewer",
                      params: {
                        fileUrl: item.fileUrl,
                        fileKey: item.fileKey,
                        title: item.title,
                        fileName: item.fileName,
                        mimeType: item.mimeType ?? "",
                      },
                    });
                  }}
                >
                  <View style={styles.recentIconWrap}>
                    <HugeiconsIcon
                      icon={kind === "pdf" ? File02Icon : AttachmentIcon}
                      size={16}
                      color={kind === "pdf" ? "#B91C1C" : "#1F2A44"}
                    />
                  </View>
                  <View style={styles.recentInfo}>
                    <Text style={styles.recentTitle}>{item.title}</Text>
                    <Text style={styles.recentMeta}>
                      {item.category} • {item.program}
                    </Text>
                  </View>
                  <View style={styles.recentMetaRight}>
                    {pillLabel ? (
                      <View
                        style={[
                          styles.recentPill,
                          kind === "image" ? styles.recentPillImage : null,
                        ]}
                      >
                        <Text
                          style={[
                            styles.recentPillText,
                            kind === "image"
                              ? styles.recentPillTextImage
                              : null,
                          ]}
                        >
                          {pillLabel}
                        </Text>
                      </View>
                    ) : null}
                    <Text style={styles.recentTime}>
                      {formatRelativeTime(item.uploadedAt)}
                    </Text>
                  </View>
                </Pressable>
              );
            })
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  scrollContent: {
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
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 30,
    fontWeight: "700",
    color: "#0F172A",
    fontFamily: Fonts.serif,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 15,
    color: "#475569",
    lineHeight: 22,
  },
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
  },
  label: {
    fontSize: 12,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    color: "#64748B",
    fontWeight: "600",
    marginBottom: 8,
    marginTop: 8,
  },
  input: {
    backgroundColor: "#F8FAFC",
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: "#0F172A",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  textarea: {
    minHeight: 110,
    textAlignVertical: "top",
  },
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
  dropzoneActive: {
    borderColor: "#38BDF8",
    backgroundColor: "#E0F2FE",
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
  sizeHint: {
    fontSize: 12,
    color: "#64748B",
  },
  sizeRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 10,
  },
  sizePill: {
    backgroundColor: "#FEE2E2",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  sizePillText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#B91C1C",
  },
  sizeHintError: {
    color: "#DC2626",
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
    overflow: "hidden",
  },
  fileThumbnail: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
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
  recentHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  recentCount: {
    backgroundColor: "#F1F5F9",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    fontSize: 12,
    fontWeight: "600",
    color: "#0F172A",
  },
  recentRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },
  recentIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 12,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  recentInfo: {
    flex: 1,
    marginRight: 12,
  },
  recentMetaRight: {
    alignItems: "flex-end",
    gap: 6,
  },
  recentPill: {
    backgroundColor: "#FEE2E2",
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  recentPillText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#B91C1C",
  },
  recentPillImage: {
    backgroundColor: "#DBEAFE",
  },
  recentPillTextImage: {
    color: "#1D4ED8",
  },
  recentTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#0F172A",
  },
  recentMeta: {
    marginTop: 4,
    fontSize: 12,
    color: "#64748B",
  },
  recentTime: {
    fontSize: 12,
    color: "#64748B",
  },
  emptyState: {
    paddingVertical: 12,
  },
  emptyTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#0F172A",
  },
  emptySubtitle: {
    marginTop: 4,
    fontSize: 12,
    color: "#64748B",
  },
});

import HugeiconsIcon from "@/components/hugeicons-icon";
import { File02Icon } from "@hugeicons/core-free-icons";
import * as FileSystem from "expo-file-system";
import * as Linking from "expo-linking";
import { useLocalSearchParams, useNavigation } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { WebView } from "react-native-webview";

export default function MaterialViewerScreen() {
  const navigation = useNavigation();
  const { fileUrl, fileKey, title, fileName, mimeType } =
    useLocalSearchParams<{
      fileUrl?: string | string[];
      fileKey?: string | string[];
      title?: string | string[];
      fileName?: string | string[];
      mimeType?: string | string[];
    }>();

  const resolvedTitle = useMemo(() => {
    if (Array.isArray(title)) {
      return title[0];
    }
    return title ?? "Material";
  }, [title]);

  const resolvedFileUrl = useMemo(() => {
    if (Array.isArray(fileUrl)) {
      return fileUrl[0];
    }
    return fileUrl;
  }, [fileUrl]);

  const resolvedFileKey = useMemo(() => {
    if (Array.isArray(fileKey)) {
      return fileKey[0];
    }
    return fileKey;
  }, [fileKey]);

  const resolvedFileName = useMemo(() => {
    if (Array.isArray(fileName)) {
      return fileName[0];
    }
    return fileName ?? "";
  }, [fileName]);

  const resolvedMimeType = useMemo(() => {
    if (Array.isArray(mimeType)) {
      return mimeType[0];
    }
    return mimeType ?? "";
  }, [mimeType]);

  const mimeExtension = useMemo(() => {
    const normalized = resolvedMimeType.toLowerCase();
    if (!normalized) {
      return "";
    }
    if (normalized.includes("pdf")) {
      return "pdf";
    }
    if (normalized.includes("word") || normalized.includes("docx")) {
      return "docx";
    }
    if (normalized.includes("msword")) {
      return "doc";
    }
    if (normalized.includes("presentation") || normalized.includes("pptx")) {
      return "pptx";
    }
    if (normalized.includes("powerpoint")) {
      return "ppt";
    }
    if (normalized.includes("spreadsheet") || normalized.includes("xlsx")) {
      return "xlsx";
    }
    if (normalized.includes("excel")) {
      return "xls";
    }
    if (normalized.includes("png")) {
      return "png";
    }
    if (normalized.includes("jpeg") || normalized.includes("jpg")) {
      return "jpg";
    }
    if (normalized.includes("gif")) {
      return "gif";
    }
    if (normalized.includes("webp")) {
      return "webp";
    }
    return "";
  }, [resolvedMimeType]);

  const fileExtension = useMemo(() => {
    const parts = resolvedFileName.split(".");
    if (parts.length < 2) {
      return mimeExtension;
    }
    const extension = parts[parts.length - 1]?.toLowerCase() ?? "";
    if (!extension || extension === "chunk") {
      return mimeExtension;
    }
    return extension;
  }, [mimeExtension, resolvedFileName]);

  const isImage = useMemo(
    () => ["jpg", "jpeg", "png", "gif", "webp"].includes(fileExtension),
    [fileExtension],
  );

  const isPdf = useMemo(() => fileExtension === "pdf", [fileExtension]);

  const isOfficeDoc = useMemo(
    () => ["doc", "docx", "ppt", "pptx", "xls", "xlsx"].includes(fileExtension),
    [fileExtension],
  );

  const viewerUrl = useMemo(
    () => resolvedFileUrl ?? undefined,
    [resolvedFileUrl],
  );

  const downloadUrl = useMemo(
    () => resolvedFileUrl ?? undefined,
    [resolvedFileUrl],
  );

  const localDirectory = useMemo(() => {
    const baseDirectory =
      FileSystem.documentDirectory ?? FileSystem.cacheDirectory ?? "";
    if (!baseDirectory) {
      return undefined;
    }
    return `${baseDirectory}materials/`;
  }, []);

  const localFileUri = useMemo(() => {
    if (!localDirectory || !resolvedFileKey) {
      return undefined;
    }
    const rawName = resolvedFileName.trim() || resolvedTitle.trim();
    const baseName = rawName
      ? rawName.replace(/[^a-zA-Z0-9._-]+/g, "-")
      : resolvedFileKey;
    const suffix = fileExtension ? `.${fileExtension}` : "";
    return `${localDirectory}${resolvedFileKey}-${baseName}${suffix}`;
  }, [
    fileExtension,
    localDirectory,
    resolvedFileKey,
    resolvedFileName,
    resolvedTitle,
  ]);

  const [localUri, setLocalUri] = useState<string | undefined>(undefined);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);

  useEffect(() => {
    let isActive = true;

    const checkLocalFile = async () => {
      if (!localFileUri) {
        if (isActive) {
          setLocalUri(undefined);
        }
        return;
      }

      try {
        const info = await FileSystem.getInfoAsync(localFileUri);
        if (isActive) {
          setLocalUri(info.exists ? info.uri : undefined);
        }
      } catch {
        if (isActive) {
          setLocalUri(undefined);
        }
      }
    };

    void checkLocalFile();

    return () => {
      isActive = false;
    };
  }, [localFileUri]);

  const openExternally = useCallback(async () => {
    if (!viewerUrl) {
      return;
    }
    await WebBrowser.openBrowserAsync(viewerUrl);
  }, [viewerUrl]);

  const openLocalFile = useCallback(async () => {
    if (!localUri) {
      return;
    }

    try {
      const openUri =
        Platform.OS === "android"
          ? await FileSystem.getContentUriAsync(localUri)
          : localUri;

      const canOpen = await Linking.canOpenURL(openUri);
      if (!canOpen) {
        setDownloadError("No app is available to open this file.");
        return;
      }

      await Linking.openURL(openUri);
    } catch {
      setDownloadError("Unable to open this file on your device.");
    }
  }, [localUri]);

  const downloadForOffline = useCallback(async () => {
    if (!downloadUrl || !localFileUri || !localDirectory) {
      return;
    }

    try {
      setIsDownloading(true);
      setDownloadError(null);
      await FileSystem.makeDirectoryAsync(localDirectory, {
        intermediates: true,
      });
      const result = await FileSystem.downloadAsync(downloadUrl, localFileUri);
      setLocalUri(result.uri);
    } catch {
      setDownloadError("Unable to download this file for offline use.");
    } finally {
      setIsDownloading(false);
    }
  }, [downloadUrl, localDirectory, localFileUri]);

  useEffect(() => {
    navigation.setOptions({
      title: resolvedTitle,
      headerRight: undefined,
    });
  }, [navigation, resolvedTitle]);

  if (!viewerUrl) {
    return (
      <SafeAreaView style={styles.screen}>
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>No file to preview</Text>
          <Text style={styles.emptySubtitle}>
            Please select a material with a valid file link.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.screen}>
      {isPdf ? (
        <View style={styles.pdfContainer}>
          <WebView
            source={{ uri: viewerUrl }}
            style={styles.pdf}
            startInLoadingState
            renderLoading={() => (
              <View style={styles.pdfLoading}>
                <ActivityIndicator size="large" color="#2D2E3A" />
              </View>
            )}
          />
          <View style={styles.pdfActionBar}>
            {localUri ? (
              <Pressable style={styles.primaryButton} onPress={openLocalFile}>
                <Text style={styles.primaryButtonText}>Open file</Text>
              </Pressable>
            ) : (
              <Pressable
                style={
                  isDownloading
                    ? [styles.primaryButton, styles.primaryButtonDisabled]
                    : styles.primaryButton
                }
                onPress={downloadForOffline}
                disabled={isDownloading}
              >
                {isDownloading ? (
                  <View style={styles.buttonLoading}>
                    <ActivityIndicator size="small" color="#FFFFFF" />
                    <Text style={styles.primaryButtonText}>Downloading...</Text>
                  </View>
                ) : (
                  <Text style={styles.primaryButtonText}>
                    Download for offline
                  </Text>
                )}
              </Pressable>
            )}
            <Pressable style={styles.secondaryButton} onPress={openExternally}>
              <Text style={styles.secondaryButtonText}>Open in browser</Text>
            </Pressable>
          </View>
        </View>
      ) : (
        <View style={styles.previewState}>
          <View style={styles.iconBubble}>
            <HugeiconsIcon icon={File02Icon} size={28} color="#2D2E3A" />
          </View>
          <Text style={styles.emptyTitle}>{resolvedTitle}</Text>
          <Text style={styles.emptySubtitle}>
            {resolvedFileName && !resolvedFileName.includes(".chunk")
              ? resolvedFileName
              : fileExtension
                ? fileExtension.toUpperCase()
                : "Document"}
          </Text>
          {localUri ? (
            <View style={styles.statusPill}>
              <Text style={styles.statusText}>Available offline</Text>
            </View>
          ) : null}
          {downloadError ? (
            <Text style={styles.errorText}>{downloadError}</Text>
          ) : null}
          <View style={styles.actionStack}>
            {localUri ? (
              <Pressable style={styles.primaryButton} onPress={openLocalFile}>
                <Text style={styles.primaryButtonText}>Open file</Text>
              </Pressable>
            ) : (
              <Pressable
                style={[
                  styles.primaryButton,
                  isDownloading ? styles.primaryButtonDisabled : null,
                ]}
                onPress={downloadForOffline}
                disabled={isDownloading}
              >
                {isDownloading ? (
                  <View style={styles.buttonLoading}>
                    <ActivityIndicator size="small" color="#FFFFFF" />
                    <Text style={styles.primaryButtonText}>Downloading...</Text>
                  </View>
                ) : (
                  <Text style={styles.primaryButtonText}>
                    Download for offline
                  </Text>
                )}
              </Pressable>
            )}
            <Pressable style={styles.secondaryButton} onPress={openExternally}>
              <Text style={styles.secondaryButtonText}>Open in browser</Text>
            </Pressable>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#F4F3F9",
  },
  previewState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
    gap: 10,
  },
  pdfContainer: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  pdf: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  pdfLoading: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
  },
  pdfActionBar: {
    padding: 16,
    gap: 10,
    backgroundColor: "#F4F3F9",
  },
  iconBubble: {
    width: 72,
    height: 72,
    borderRadius: 24,
    backgroundColor: "#E8ECFF",
    alignItems: "center",
    justifyContent: "center",
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#2D2E3A",
    textAlign: "center",
  },
  emptySubtitle: {
    fontSize: 12,
    color: "#7A7D92",
    textAlign: "center",
  },
  statusPill: {
    backgroundColor: "#E8ECFF",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
  },
  statusText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#2D2E3A",
  },
  errorText: {
    fontSize: 11,
    color: "#B14343",
    textAlign: "center",
  },
  actionStack: {
    width: "100%",
    gap: 10,
    marginTop: 6,
  },
  primaryButton: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: "#2D2E3A",
  },
  primaryButtonDisabled: {
    opacity: 0.7,
  },
  buttonLoading: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "600",
  },
  secondaryButton: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#D3D6E0",
    backgroundColor: "#FFFFFF",
  },
  secondaryButtonText: {
    color: "#2D2E3A",
    fontSize: 13,
    fontWeight: "600",
  },
});

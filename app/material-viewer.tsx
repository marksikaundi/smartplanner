import { storage } from "@/lib/appwrite";
import { APPWRITE_IDS } from "@/lib/appwrite-ids";
import { useLocalSearchParams, useNavigation } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { WebView } from "react-native-webview";

export default function MaterialViewerScreen() {
  const navigation = useNavigation();
  const { fileId, title } = useLocalSearchParams<{
    fileId?: string | string[];
    title?: string | string[];
    fileName?: string | string[];
  }>();

  const resolvedTitle = useMemo(() => {
    if (Array.isArray(title)) {
      return title[0];
    }
    return title ?? "Material";
  }, [title]);

  const resolvedFileId = useMemo(() => {
    if (Array.isArray(fileId)) {
      return fileId[0];
    }
    return fileId;
  }, [fileId]);

  const resolvedFileName = useMemo(() => {
    if (Array.isArray(fileName)) {
      return fileName[0];
    }
    return fileName ?? "";
  }, [fileName]);

  const fileExtension = useMemo(() => {
    const parts = resolvedFileName.split(".");
    if (parts.length < 2) {
      return "";
    }
    return parts[parts.length - 1]?.toLowerCase() ?? "";
  }, [resolvedFileName]);

  const isImage = useMemo(
    () => ["jpg", "jpeg", "png", "gif", "webp"].includes(fileExtension),
    [fileExtension],
  );

  const isPdf = useMemo(() => fileExtension === "pdf", [fileExtension]);

  const isOfficeDoc = useMemo(
    () => ["doc", "docx", "ppt", "pptx", "xls", "xlsx"].includes(fileExtension),
    [fileExtension],
  );

  const viewerUrl = useMemo(() => {
    if (!resolvedFileId || !APPWRITE_IDS.storageBucketId) {
      return undefined;
    }

    return storage.getFileView(APPWRITE_IDS.storageBucketId, resolvedFileId)
      .href;
  }, [resolvedFileId]);

  const embeddedViewerUrl = useMemo(() => {
    if (!viewerUrl) {
      return undefined;
    }
    if (isOfficeDoc) {
      return `https://docs.google.com/gview?embedded=true&url=${encodeURIComponent(
        viewerUrl,
      )}`;
    }
    return viewerUrl;
  }, [isOfficeDoc, viewerUrl]);

  const [hasLoadError, setHasLoadError] = useState(false);

  const openExternally = useCallback(async () => {
    if (!viewerUrl) {
      return;
    }
    await WebBrowser.openBrowserAsync(viewerUrl);
  }, [viewerUrl]);

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

  const canRenderInline = isPdf || isImage || isOfficeDoc || !fileExtension;

  if (!canRenderInline || hasLoadError) {
    return (
      <SafeAreaView style={styles.screen}>
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>Open document</Text>
          <Text style={styles.emptySubtitle}>
            This file type cannot be rendered here. Open it in your browser to
            view the full document.
          </Text>
          <Pressable style={styles.primaryButton} onPress={openExternally}>
            <Text style={styles.primaryButtonText}>Open in browser</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.screen}>
      <WebView
        source={{ uri: embeddedViewerUrl }}
        startInLoadingState
        renderLoading={() => (
          <View style={styles.loadingState}>
            <ActivityIndicator size="small" color="#2D2E3A" />
            <Text style={styles.loadingText}>Loading preview...</Text>
          </View>
        )}
        onError={() => setHasLoadError(true)}
        onHttpError={() => setHasLoadError(true)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#F4F3F9",
  },
  loadingState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  loadingText: {
    fontSize: 12,
    color: "#7A7D92",
  },
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
    gap: 8,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#2D2E3A",
  },
  emptySubtitle: {
    fontSize: 12,
    color: "#7A7D92",
    textAlign: "center",
  },
  primaryButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: "#2D2E3A",
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "600",
  },
});

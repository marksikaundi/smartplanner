import * as Linking from "expo-linking";
import { useLocalSearchParams, useNavigation } from "expo-router";
import { useEffect, useMemo } from "react";
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
  const { url, title, fileName, type } = useLocalSearchParams<{
    url?: string | string[];
    title?: string | string[];
    fileName?: string | string[];
    type?: string | string[];
  }>();

  const resolvedUrl = useMemo(() => {
    if (Array.isArray(url)) {
      return url[0];
    }
    return url;
  }, [url]);

  const resolvedTitle = useMemo(() => {
    if (Array.isArray(title)) {
      return title[0];
    }
    return title ?? "Material";
  }, [title]);

  const resolvedFileName = useMemo(() => {
    if (Array.isArray(fileName)) {
      return fileName[0];
    }
    return fileName ?? "";
  }, [fileName]);

  const resolvedType = useMemo(() => {
    if (Array.isArray(type)) {
      return type[0];
    }
    return type ?? "";
  }, [type]);

  const viewerUrl = useMemo(() => {
    if (!resolvedUrl) {
      return undefined;
    }

    const normalizedName = resolvedFileName.toLowerCase();
    const normalizedType = resolvedType.toLowerCase();
    const isOfficeDoc =
      normalizedType.includes("pdf") ||
      normalizedType.includes("officedocument") ||
      normalizedType.includes("msword") ||
      normalizedType.includes("powerpoint") ||
      normalizedType.includes("excel") ||
      /\.(pdf|doc|docx|ppt|pptx|xls|xlsx)$/.test(normalizedName);

    if (isOfficeDoc) {
      return `https://docs.google.com/gview?embedded=true&url=${encodeURIComponent(
        resolvedUrl,
      )}`;
    }

    return resolvedUrl;
  }, [resolvedFileName, resolvedType, resolvedUrl]);

  useEffect(() => {
    navigation.setOptions({
      title: resolvedTitle,
      headerRight: resolvedUrl
        ? () => (
            <Pressable
              onPress={() => {
                void Linking.openURL(resolvedUrl);
              }}
              style={styles.headerAction}
            >
              <Text style={styles.headerActionText}>Download</Text>
            </Pressable>
          )
        : undefined,
    });
  }, [navigation, resolvedTitle, resolvedUrl]);

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
      <WebView
        source={{ uri: viewerUrl }}
        startInLoadingState
        renderLoading={() => (
          <View style={styles.loadingState}>
            <ActivityIndicator size="small" color="#2D2E3A" />
            <Text style={styles.loadingText}>Loading preview...</Text>
          </View>
        )}
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
  headerAction: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: "#E8ECFF",
    marginRight: 12,
  },
  headerActionText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#2D2E3A",
  },
});

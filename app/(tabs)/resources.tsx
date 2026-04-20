import { databases, storage } from "@/lib/appwrite";
import { APPWRITE_IDS, isConfigured } from "@/lib/appwrite-ids";
import { Feather } from "@expo/vector-icons";
import * as Linking from "expo-linking";
import { useEffect, useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type ResourceItem = {
  title: string;
  subtitle: string;
  icon: string;
  fileId?: string;
  fileName?: string;
  type?: string;
};

export default function ResourcesScreen() {
  const resources = useMemo<ResourceItem[]>(
    () => [
      {
        title: "Reference Library",
        subtitle: "Curated textbooks",
        icon: "book",
      },
      {
        title: "Video Lessons",
        subtitle: "Short topic videos",
        icon: "play-circle",
      },
      {
        title: "Practice Bank",
        subtitle: "Past exam questions",
        icon: "clipboard",
      },
      {
        title: "Discussion Forum",
        subtitle: "Ask for help",
        icon: "message-circle",
      },
    ],
    [],
  );
  const [data, setData] = useState<ResourceItem[]>(resources);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    let isActive = true;

    const loadResources = async () => {
      if (!isConfigured(APPWRITE_IDS.collections.resources)) {
        return;
      }

      try {
        setIsLoading(true);
        const response = await databases.listDocuments(
          APPWRITE_IDS.databaseId,
          APPWRITE_IDS.collections.resources,
        );
        if (isActive) {
          const mapped = response.documents.map((doc) => ({
            title: String(doc.title ?? doc.name ?? "Resource"),
            subtitle: String(doc.subtitle ?? doc.summary ?? doc.description ?? ""),
            icon: String(doc.icon ?? "book"),
            fileId: doc.fileId as string | undefined,
            fileName: String(doc.fileName ?? ""),
            type: String(doc.type ?? ""),
          }));
          setData(mapped);
        }
      } catch {
        if (isActive) {
          setData(resources);
        }
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    };

    loadResources();

    return () => {
      isActive = false;
    };
  }, [resources]);

  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Resources</Text>
          <Text style={styles.subtitle}>
            Tools to support your study sessions
          </Text>
        </View>

        {data.map((item) => (
          <Pressable
            key={`${item.title}-${item.fileId ?? "default"}`}
            style={styles.card}
            onPress={() => {
              if (!item.fileId || !APPWRITE_IDS.storageBucketId) {
                return;
              }
              const url = storage.getFileView(
                APPWRITE_IDS.storageBucketId,
                item.fileId,
              ).href;
              void Linking.openURL(url);
            }}
          >
            <View style={styles.iconWrap}>
              <Feather name={item.icon} size={16} color="#2D2E3A" />
            </View>
            <View style={styles.info}>
              <Text style={styles.cardTitle}>{item.title}</Text>
              <Text style={styles.cardSubtitle}>{item.subtitle}</Text>
            </View>
            {item.type ? (
              <View style={styles.tag}>
                <Text style={styles.tagText}>{item.type}</Text>
              </View>
            ) : (
              <Feather name="chevron-right" size={16} color="#9AA0B4" />
            )}
          </Pressable>
        ))}
        {isLoading ? (
          <Text style={styles.loadingText}>Loading resources...</Text>
        ) : null}
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
    gap: 14,
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
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: "#F1F2F6",
    alignItems: "center",
    justifyContent: "center",
  },
  info: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#2D2E3A",
  },
  cardSubtitle: {
    fontSize: 11,
    color: "#6D6F7F",
    marginTop: 3,
  },
  tag: {
    backgroundColor: "#E8ECFF",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
  },
  tagText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#2D2E3A",
  },
  loadingText: {
    fontSize: 12,
    color: "#7A7D92",
    textAlign: "center",
    marginTop: 6,
  },
});

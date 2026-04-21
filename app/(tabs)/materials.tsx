import HugeiconsIcon from "@/components/hugeicons-icon";
import { databases } from "@/lib/appwrite";
import { APPWRITE_IDS, isConfigured } from "@/lib/appwrite-ids";
import { addRecentOpen } from "@/lib/recent-opens";
import { File02Icon } from "@hugeicons/core-free-icons";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function MaterialsScreen() {
  const router = useRouter();
  const [data, setData] = useState<
    {
      id: string;
      title: string;
      subtitle: string;
      type: string;
      fileId?: string;
      fileName?: string;
    }[]
  >([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let isActive = true;

    const loadMaterials = async () => {
      if (!isConfigured(APPWRITE_IDS.collections.materials)) {
        if (isActive) {
          setLoadError("Materials collection is not configured.");
        }
        return;
      }

      try {
        setIsLoading(true);
        setLoadError(null);
        const response = await databases.listDocuments(
          APPWRITE_IDS.databaseId,
          APPWRITE_IDS.collections.materials,
        );
        if (isActive) {
          const mapped = response.documents.map((doc) => ({
            id: doc.$id,
            title: String(doc.title ?? doc.name ?? "Material"),
            subtitle: String(doc.description ?? doc.subtitle ?? ""),
            type: String(doc.type ?? doc.format ?? "PDF"),
            fileId: doc.fileId as string | undefined,
            fileName: String(doc.fileName ?? ""),
          }));
          setData(mapped);
        }
      } catch {
        if (isActive) {
          setLoadError("Unable to load materials right now.");
        }
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    };

    loadMaterials();

    return () => {
      isActive = false;
    };
  }, []);

  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Materials</Text>
          <Text style={styles.subtitle}>
            Download and review your study assets
          </Text>
        </View>

        {data.map((item) => (
          <Pressable
            key={item.id ?? item.title}
            style={styles.card}
            onPress={() => {
              if (!item.fileId || !APPWRITE_IDS.storageBucketId) {
                return;
              }
              void addRecentOpen({
                id: item.id,
                title: item.title,
                subtitle: item.subtitle,
                category: "Materials",
              });
              router.push({
                pathname: "/material-viewer",
                params: {
                  fileId: item.fileId,
                  title: item.title,
                  fileName: item.fileName,
                },
              });
            }}
          >
            <View style={styles.iconWrap}>
              <HugeiconsIcon icon={File02Icon} size={16} color="#2D2E3A" />
            </View>
            <View style={styles.info}>
              <Text style={styles.cardTitle}>{item.title}</Text>
              <Text style={styles.cardSubtitle}>{item.subtitle}</Text>
            </View>
            <View style={styles.tag}>
              <Text style={styles.tagText}>{item.type}</Text>
            </View>
          </Pressable>
        ))}
        {isLoading ? (
          <Text style={styles.loadingText}>Loading materials...</Text>
        ) : null}
        {!isLoading && loadError ? (
          <Text style={styles.emptyText}>{loadError}</Text>
        ) : null}
        {!isLoading && !loadError && data.length === 0 ? (
          <Text style={styles.emptyText}>No materials uploaded yet.</Text>
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
  emptyText: {
    fontSize: 12,
    color: "#7A7D92",
    textAlign: "center",
    marginTop: 12,
  },
});

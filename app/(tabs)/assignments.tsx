import HugeiconsIcon from "@/components/hugeicons-icon";
import { databases } from "@/lib/appwrite";
import { APPWRITE_IDS, isConfigured } from "@/lib/appwrite-ids";
import { addRecentOpen } from "@/lib/recent-opens";
import { ClipboardIcon } from "@hugeicons/core-free-icons";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type AssignmentItem = {
  title: string;
  subtitle: string;
  status: string;
  fileId?: string;
  fileName?: string;
  type?: string;
};

export default function AssignmentsScreen() {
  const router = useRouter();
  const [data, setData] = useState<AssignmentItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let isActive = true;

    const loadAssignments = async () => {
      if (!isConfigured(APPWRITE_IDS.collections.assignments)) {
        if (isActive) {
          setLoadError("Assignments collection is not configured.");
        }
        return;
      }

      try {
        setIsLoading(true);
        setLoadError(null);
        const response = await databases.listDocuments(
          APPWRITE_IDS.databaseId,
          APPWRITE_IDS.collections.assignments,
        );
        if (isActive) {
          const mapped = response.documents.map((doc) => ({
            title: String(doc.title ?? doc.name ?? "Assignment"),
            subtitle: String(
              doc.subtitle ?? doc.details ?? doc.description ?? "",
            ),
            status: String(doc.status ?? "Pending"),
            fileId: doc.fileId as string | undefined,
            fileName: String(doc.fileName ?? ""),
            type: String(doc.type ?? ""),
          }));
          setData(mapped);
        }
      } catch {
        if (isActive) {
          setLoadError("Unable to load assignments right now.");
        }
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    };

    loadAssignments();

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
          <Text style={styles.title}>Past Assignments</Text>
          <Text style={styles.subtitle}>
            Review submissions and upcoming tasks
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
              void addRecentOpen({
                id: item.fileId ?? item.title,
                title: item.title,
                subtitle: item.subtitle,
                category: "Assignments",
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
              <HugeiconsIcon icon={ClipboardIcon} size={16} color="#2D2E3A" />
            </View>
            <View style={styles.info}>
              <Text style={styles.cardTitle}>{item.title}</Text>
              <Text style={styles.cardSubtitle}>{item.subtitle}</Text>
            </View>
            <Pressable style={styles.statusPill}>
              <Text style={styles.statusText}>
                {item.type ? item.type : item.status}
              </Text>
            </Pressable>
          </Pressable>
        ))}
        {isLoading ? (
          <Text style={styles.loadingText}>Loading assignments...</Text>
        ) : null}
        {!isLoading && loadError ? (
          <Text style={styles.emptyText}>{loadError}</Text>
        ) : null}
        {!isLoading && !loadError && data.length === 0 ? (
          <Text style={styles.emptyText}>No assignments uploaded yet.</Text>
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
  statusPill: {
    backgroundColor: "#E8ECFF",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
  },
  statusText: {
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

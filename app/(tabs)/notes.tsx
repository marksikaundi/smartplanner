import HugeiconsIcon from "@/components/hugeicons-icon";
import { databases } from "@/lib/appwrite";
import { APPWRITE_IDS, isConfigured } from "@/lib/appwrite-ids";
import { Add01Icon, Edit02Icon } from "@hugeicons/core-free-icons";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function NotesScreen() {
  const router = useRouter();
  const [data, setData] = useState<
    {
      id: string;
      title: string;
      subtitle: string;
      date: string;
    }[]
  >([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let isActive = true;

    const loadNotes = async () => {
      if (!isConfigured(APPWRITE_IDS.collections.notes)) {
        if (isActive) {
          setLoadError("Notes collection is not configured.");
        }
        return;
      }

      try {
        setIsLoading(true);
        setLoadError(null);
        const response = await databases.listDocuments(
          APPWRITE_IDS.databaseId,
          APPWRITE_IDS.collections.notes,
        );
        if (isActive) {
          const mapped = response.documents.map((doc) => ({
            id: doc.$id,
            title: String(doc.title ?? "Untitled"),
            subtitle: String(doc.body ?? ""),
            date: String(doc.updatedAt ?? doc.$updatedAt ?? ""),
          }));
          setData(mapped);
        }
      } catch {
        if (isActive) {
          setLoadError("Unable to load notes right now.");
        }
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    };

    loadNotes();

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
          <Text style={styles.title}>Notes</Text>
          <Pressable
            style={styles.addButton}
            onPress={() => router.push("/(tabs)/notes-editor")}
          >
            <HugeiconsIcon icon={Add01Icon} size={16} color="#FFFFFF" />
            <Text style={styles.addButtonText}>New</Text>
          </Pressable>
        </View>

        {data.map((item) => (
          <Pressable
            key={item.id}
            style={styles.card}
            onPress={() =>
              router.push({
                pathname: "/(tabs)/notes-editor",
                params: { noteId: item.id },
              })
            }
          >
            <View style={styles.iconWrap}>
              <HugeiconsIcon icon={Edit02Icon} size={16} color="#2D2E3A" />
            </View>
            <View style={styles.info}>
              <Text style={styles.cardTitle}>{item.title}</Text>
              <Text style={styles.cardSubtitle}>{item.subtitle}</Text>
            </View>
            <Text style={styles.dateText}>{item.date}</Text>
          </Pressable>
        ))}
        {isLoading ? (
          <Text style={styles.loadingText}>Loading notes...</Text>
        ) : null}
        {!isLoading && loadError ? (
          <Text style={styles.emptyText}>{loadError}</Text>
        ) : null}
        {!isLoading && !loadError && data.length === 0 ? (
          <Text style={styles.emptyText}>No notes created yet.</Text>
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
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: "#2D2E3A",
  },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#34356E",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
  },
  addButtonText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "700",
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
  dateText: {
    fontSize: 11,
    color: "#7A7D92",
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

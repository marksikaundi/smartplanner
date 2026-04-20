import HugeiconsIcon, {
  type HugeiconsIconData,
} from "@/components/hugeicons-icon";
import { databases, Query } from "@/lib/appwrite";
import { APPWRITE_IDS, isConfigured } from "@/lib/appwrite-ids";
import {
  ArchiveIcon,
  Edit03Icon,
  File02Icon,
  Folder01Icon,
} from "@hugeicons/core-free-icons";
import { useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type UploadItem = {
  id: string;
  title: string;
  subtitle: string;
  category: string;
  icon: HugeiconsIconData;
  route: string;
  createdAt: string;
};

export default function RecentUploadsScreen() {
  const router = useRouter();
  const sources = useMemo(
    () => [
      {
        key: "materials",
        label: "Materials",
        route: "/(tabs)/materials",
        icon: File02Icon,
      },
      {
        key: "resources",
        label: "Resources",
        route: "/(tabs)/resources",
        icon: Folder01Icon,
      },
      {
        key: "assignments",
        label: "Assignments",
        route: "/(tabs)/assignments",
        icon: ArchiveIcon,
      },
      {
        key: "notes",
        label: "Notes",
        route: "/(tabs)/notes",
        icon: Edit03Icon,
      },
    ],
    [],
  );
  const [items, setItems] = useState<UploadItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let isActive = true;

    const loadUploads = async () => {
      const configured = sources.filter((source) =>
        isConfigured(APPWRITE_IDS.collections[source.key]),
      );

      if (!configured.length) {
        setItems([]);
        return;
      }

      try {
        setIsLoading(true);
        setLoadError(null);
        const responses = await Promise.all(
          configured.map(async (source) => {
            const response = await databases.listDocuments(
              APPWRITE_IDS.databaseId,
              APPWRITE_IDS.collections[source.key],
              [Query.orderDesc("$createdAt"), Query.limit(25)],
            );
            return response.documents.map((doc) => ({
              id: doc.$id,
              title: String(doc.title ?? doc.name ?? source.label),
              subtitle: String(
                doc.description ?? doc.subtitle ?? doc.summary ?? source.label,
              ),
              category: source.label,
              icon: source.icon,
              route: source.route,
              createdAt: String(doc.$createdAt ?? ""),
            }));
          }),
        );

        const merged = responses
          .flat()
          .sort(
            (a, b) =>
              new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
          )
          .slice(0, 50);

        if (isActive) {
          setItems(merged);
        }
      } catch {
        if (isActive) {
          setLoadError("Unable to load uploads right now.");
        }
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    };

    loadUploads();

    return () => {
      isActive = false;
    };
  }, [sources]);

  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.title}>All uploads</Text>
          <Text style={styles.subtitle}>
            Latest content across materials, resources, notes, and assignments
          </Text>
        </View>

        {isLoading ? (
          <Text style={styles.stateText}>Loading uploads...</Text>
        ) : null}
        {!isLoading && loadError ? (
          <Text style={styles.stateText}>{loadError}</Text>
        ) : null}
        {!isLoading && !loadError && items.length === 0 ? (
          <Text style={styles.stateText}>No uploads yet.</Text>
        ) : null}

        {!isLoading && !loadError
          ? items.map((item) => (
              <Pressable
                key={item.id}
                style={styles.card}
                onPress={() => router.push(item.route)}
              >
                <View style={styles.iconWrap}>
                  <HugeiconsIcon icon={item.icon} size={16} color="#2D2E3A" />
                </View>
                <View style={styles.info}>
                  <Text style={styles.cardTitle}>{item.title}</Text>
                  <Text style={styles.cardSubtitle}>{item.subtitle}</Text>
                </View>
                <View style={styles.tag}>
                  <Text style={styles.tagText}>{item.category}</Text>
                </View>
              </Pressable>
            ))
          : null}
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
    gap: 12,
  },
  header: {
    gap: 6,
    marginBottom: 6,
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
  stateText: {
    fontSize: 12,
    color: "#7A7D92",
    textAlign: "center",
    paddingVertical: 12,
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
});

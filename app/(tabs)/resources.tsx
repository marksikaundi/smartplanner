import HugeiconsIcon, {
  type HugeiconsIconData,
} from "@/components/hugeicons-icon";
import { databases, Query } from "@/lib/appwrite";
import { APPWRITE_IDS, isConfigured } from "@/lib/appwrite-ids";
import { addRecentOpen } from "@/lib/recent-opens";
import {
  ArchiveIcon,
  ArrowRight01Icon,
  BookOpen01Icon,
  ClipboardIcon,
  CloudUploadIcon,
  Edit02Icon,
  Edit03Icon,
  File02Icon,
  Folder01Icon,
  GridIcon,
  HelpCircleIcon,
  Notification01Icon,
  UserIcon,
} from "@hugeicons/core-free-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type ResourceItem = {
  id: string;
  title: string;
  subtitle: string;
  icon: string;
  fileId?: string;
  fileName?: string;
  type?: string;
};

const ICON_MAP: Record<string, HugeiconsIconData> = {
  archive: ArchiveIcon,
  book: BookOpen01Icon,
  clipboard: ClipboardIcon,
  "edit-2": Edit02Icon,
  "edit-3": Edit03Icon,
  file: File02Icon,
  "file-text": File02Icon,
  folder: Folder01Icon,
  grid: GridIcon,
  "help-circle": HelpCircleIcon,
  upload: CloudUploadIcon,
  user: UserIcon,
  bell: Notification01Icon,
};

export default function ResourcesScreen() {
  const router = useRouter();
  const { programName } = useLocalSearchParams<{ programName?: string }>();
  const [data, setData] = useState<ResourceItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let isActive = true;

    const loadResources = async () => {
      if (!isConfigured(APPWRITE_IDS.collections.resources)) {
        if (isActive) {
          setLoadError("Resources collection is not configured.");
        }
        return;
      }

      try {
        setIsLoading(true);
        setLoadError(null);
        const queries = [] as string[];
        if (programName) {
          queries.push(Query.equal("programName", String(programName)));
        }
        const response = await databases.listDocuments(
          APPWRITE_IDS.databaseId,
          APPWRITE_IDS.collections.resources,
          queries,
        );
        if (isActive) {
          const mapped = response.documents.map((doc) => ({
            id: String(doc.$id),
            title: String(doc.title ?? doc.name ?? "Resource"),
            subtitle: String(
              doc.subtitle ?? doc.summary ?? doc.description ?? "",
            ),
            icon: String(doc.icon ?? "book"),
            fileId: doc.fileId as string | undefined,
            fileName: String(doc.fileName ?? ""),
            type: String(doc.type ?? ""),
          }));
          setData(mapped);
        }
      } catch {
        if (isActive) {
          setLoadError("Unable to load resources right now.");
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
  }, [programName]);

  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Resources</Text>
          <Text style={styles.subtitle}>
            {programName
              ? `Resources for ${programName}`
              : "Tools to support your study sessions"}
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
                id: item.id,
                title: item.title,
                subtitle: item.subtitle,
                category: "Resources",
              });
              router.push({
                pathname: "/material-viewer",
                params: {
                  fileId: item.fileId,
                  title: item.title,
                },
              });
            }}
          >
            <View style={styles.iconWrap}>
              <HugeiconsIcon
                icon={ICON_MAP[item.icon] ?? BookOpen01Icon}
                size={16}
                color="#2D2E3A"
              />
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
              <HugeiconsIcon
                icon={ArrowRight01Icon}
                size={16}
                color="#9AA0B4"
              />
            )}
          </Pressable>
        ))}
        {isLoading ? (
          <Text style={styles.loadingText}>Loading resources...</Text>
        ) : null}
        {!isLoading && loadError ? (
          <Text style={styles.emptyText}>{loadError}</Text>
        ) : null}
        {!isLoading && !loadError && data.length === 0 ? (
          <Text style={styles.emptyText}>
            {programName
              ? `No resources uploaded for ${programName} yet.`
              : "No resources uploaded yet."}
          </Text>
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

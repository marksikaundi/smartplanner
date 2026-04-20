import HugeiconsIcon, {
  type HugeiconsIconData,
} from "@/components/hugeicons-icon";
import { databases, Query } from "@/lib/appwrite";
import { APPWRITE_IDS, isConfigured } from "@/lib/appwrite-ids";
import {
  ArchiveIcon,
  ArrowRight01Icon,
  BookOpen01Icon,
  Edit03Icon,
  File02Icon,
  Folder01Icon,
  GridIcon,
  Menu01Icon,
  Notification01Icon,
  UserIcon,
} from "@hugeicons/core-free-icons";
import { type Href, useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type DashboardRoute = Href;
type RecentUpload = {
  id: string;
  title: string;
  subtitle: string;
  category: string;
  route: DashboardRoute;
  icon: HugeiconsIconData;
  createdAt: string;
};

export default function DashboardScreen() {
  const router = useRouter();
  const quickLinks = useMemo<
    {
      label: string;
      color: string;
      icon: HugeiconsIconData;
      route: DashboardRoute;
    }[]
  >(
    () => [
      {
        label: "Materials",
        color: "#FFE6D6",
        icon: BookOpen01Icon,
        route: "/(tabs)/materials",
      },
      {
        label: "Programs",
        color: "#DDF4FF",
        icon: GridIcon,
        route: "/(tabs)/explore",
      },
      {
        label: "Resources",
        color: "#E7F8E9",
        icon: Folder01Icon,
        route: "/(tabs)/resources",
      },
      {
        label: "Past Assignments",
        color: "#F4E7FF",
        icon: ArchiveIcon,
        route: "/(tabs)/assignments",
      },
    ],
    [],
  );

  const actionCards = useMemo<
    {
      title: string;
      description: string;
      action: string;
      color: string;
      route: DashboardRoute;
    }[]
  >(
    () => [
      {
        title: "Tutor",
        description: "Get help with school work",
        action: "Coming soon",
        color: "#E6EDFF",
        route: "/(tabs)/journey",
      },
      {
        title: "Take Notes",
        description: "Capture ideas and study points",
        action: "Write",
        color: "#FFF1D6",
        route: "/(tabs)/notes",
      },
    ],
    [],
  );
  const [recentUploads, setRecentUploads] = useState<RecentUpload[]>([]);
  const [isLoadingRecent, setIsLoadingRecent] = useState(false);
  const [recentError, setRecentError] = useState<string | null>(null);

  useEffect(() => {
    let isActive = true;

    const loadRecentUploads = async () => {
      const sources = [
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
      ] as const satisfies readonly {
        key: keyof typeof APPWRITE_IDS.collections;
        label: string;
        route: DashboardRoute;
        icon: HugeiconsIconData;
      }[];

      const configured = sources.filter((source) =>
        isConfigured(APPWRITE_IDS.collections[source.key]),
      );

      if (!configured.length) {
        setRecentUploads([]);
        return;
      }

      try {
        setIsLoadingRecent(true);
        setRecentError(null);
        const responses = await Promise.all(
          configured.map(async (source) => {
            const response = await databases.listDocuments(
              APPWRITE_IDS.databaseId,
              APPWRITE_IDS.collections[source.key],
              [Query.orderDesc("$createdAt"), Query.limit(4)],
            );
            return response.documents.map((doc) => ({
              id: doc.$id,
              title: String(doc.title ?? doc.name ?? source.label),
              subtitle: String(
                doc.description ?? doc.subtitle ?? doc.summary ?? source.label,
              ),
              category: source.label,
              route: source.route,
              icon: source.icon,
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
          .slice(0, 4);

        if (isActive) {
          setRecentUploads(merged);
        }
      } catch {
        if (isActive) {
          setRecentError("Unable to load recent uploads right now.");
        }
      } finally {
        if (isActive) {
          setIsLoadingRecent(false);
        }
      }
    };

    loadRecentUploads();

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
        <View style={styles.topBar}>
          <Pressable
            style={styles.avatar}
            onPress={() => router.push("/(tabs)/profile")}
            accessibilityRole="button"
            accessibilityLabel="Open profile"
          >
            <HugeiconsIcon icon={UserIcon} size={20} color="#2D2E3A" />
          </Pressable>
          <View style={styles.topBarActions}>
            <Pressable style={styles.iconCircle}>
              <HugeiconsIcon
                icon={Notification01Icon}
                size={18}
                color="#2D2E3A"
              />
            </Pressable>
            <Pressable style={styles.iconCircle}>
              <HugeiconsIcon icon={Menu01Icon} size={18} color="#2D2E3A" />
            </Pressable>
          </View>
        </View>

        <View style={styles.header}>
          <Text style={styles.greeting}>Hey there,</Text>
          <Text style={styles.title}>Welcome back</Text>
        </View>

        <View style={styles.quickRow}>
          {quickLinks.map((item) => (
            <Pressable
              key={item.label}
              style={styles.quickItem}
              onPress={() => router.push(item.route)}
            >
              <View style={[styles.quickIcon, { backgroundColor: item.color }]}>
                <HugeiconsIcon icon={item.icon} size={18} color="#2D2E3A" />
              </View>
              <Text style={styles.quickLabel}>{item.label}</Text>
            </Pressable>
          ))}
        </View>

        <View style={styles.heroCard}>
          <View>
            <Text style={styles.heroTitle}>Check your leader board</Text>
            <Text style={styles.heroSubtitle}>
              Track your ranking this week
            </Text>
          </View>
          <Pressable
            style={styles.heroAction}
            onPress={() => router.push("/(tabs)/stats")}
          >
            <Text style={styles.heroActionText}>View</Text>
          </Pressable>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Available Programs</Text>
          <Pressable onPress={() => router.push("/(tabs)/explore")}>
            <Text style={styles.sectionLink}>View all</Text>
          </Pressable>
        </View>
        <View style={styles.programRow}>
          {actionCards.map((card) => (
            <View
              key={card.title}
              style={[styles.programCard, { backgroundColor: card.color }]}
            >
              <Text style={styles.programTitle}>{card.title}</Text>
              <Text style={styles.programSubtitle}>{card.description}</Text>
              <Pressable
                style={styles.programButton}
                onPress={() => router.push(card.route)}
              >
                <Text style={styles.programButtonText}>{card.action}</Text>
                <HugeiconsIcon
                  icon={ArrowRight01Icon}
                  size={14}
                  color="#2D2E3A"
                />
              </Pressable>
            </View>
          ))}
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent uploads</Text>
          <Pressable onPress={() => router.push("/(tabs)/recent-uploads")}>
            <Text style={styles.sectionLink}>View all</Text>
          </Pressable>
        </View>
        <View style={styles.listCard}>
          {isLoadingRecent ? (
            <Text style={styles.listEmptyText}>Loading uploads...</Text>
          ) : null}
          {!isLoadingRecent && recentError ? (
            <Text style={styles.listEmptyText}>{recentError}</Text>
          ) : null}
          {!isLoadingRecent && !recentError && recentUploads.length === 0 ? (
            <Text style={styles.listEmptyText}>No uploads yet.</Text>
          ) : null}
          {!isLoadingRecent && !recentError
            ? recentUploads.map((item) => (
                <View key={item.id} style={styles.listItem}>
                  <View style={styles.listIcon}>
                    <HugeiconsIcon icon={item.icon} size={16} color="#2D2E3A" />
                  </View>
                  <View style={styles.listContent}>
                    <Text style={styles.listTitle}>{item.title}</Text>
                    <Text style={styles.listSubtitle}>{item.subtitle}</Text>
                  </View>
                  <Pressable
                    style={styles.listAction}
                    onPress={() => router.push(item.route)}
                  >
                    <Text style={styles.listActionText}>Open</Text>
                  </Pressable>
                </View>
              ))
            : null}
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Resources</Text>
          <Pressable onPress={() => router.push("/(tabs)/resources")}>
            <Text style={styles.sectionLink}>Browse</Text>
          </Pressable>
        </View>
        <View style={styles.resourceRow}>
          <Pressable
            style={styles.resourceCard}
            onPress={() => router.push("/(tabs)/materials")}
          >
            <Text style={styles.resourceTitle}>Materials</Text>
            <Text style={styles.resourceSubtitle}>PDFs, slides, audio</Text>
          </Pressable>
          <Pressable
            style={styles.resourceCard}
            onPress={() => router.push("/(tabs)/notes")}
          >
            <Text style={styles.resourceTitle}>Take a Note</Text>
            <Text style={styles.resourceSubtitle}>Save your insights</Text>
          </Pressable>
        </View>
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
  },
  topBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 18,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 12,
    elevation: 3,
  },
  topBarActions: {
    flexDirection: "row",
    gap: 12,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 12,
    elevation: 2,
  },
  header: {
    marginBottom: 18,
  },
  greeting: {
    fontSize: 14,
    color: "#7A7D92",
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: "#2D2E3A",
    marginTop: 4,
  },
  quickRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 18,
  },
  quickItem: {
    width: "47%",
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    paddingVertical: 14,
    alignItems: "center",
    gap: 10,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 12,
    elevation: 2,
  },
  quickIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
  },
  quickLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#2D2E3A",
  },
  heroCard: {
    backgroundColor: "#363A77",
    borderRadius: 20,
    padding: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  heroTitle: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },
  heroSubtitle: {
    color: "#CFD3FF",
    fontSize: 12,
    marginTop: 4,
  },
  heroAction: {
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
  },
  heroActionText: {
    color: "#363A77",
    fontSize: 12,
    fontWeight: "700",
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#2D2E3A",
  },
  sectionLink: {
    fontSize: 12,
    fontWeight: "600",
    color: "#7A7D92",
  },
  programRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 20,
  },
  programCard: {
    flex: 1,
    borderRadius: 18,
    padding: 16,
  },
  programTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#2D2E3A",
  },
  programSubtitle: {
    fontSize: 12,
    color: "#6D6F7F",
    marginTop: 6,
  },
  programButton: {
    marginTop: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  programButtonText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#2D2E3A",
  },
  listCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 12,
    gap: 12,
    marginBottom: 20,
  },
  listItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  listIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: "#EEF1FF",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  listContent: {
    flex: 1,
  },
  listTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#2D2E3A",
  },
  listSubtitle: {
    fontSize: 11,
    color: "#6D6F7F",
    marginTop: 3,
  },
  listAction: {
    backgroundColor: "#E9ECFF",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
  },
  listActionText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#2D2E3A",
  },
  listEmptyText: {
    fontSize: 12,
    color: "#7A7D92",
    textAlign: "center",
    paddingVertical: 8,
  },
  resourceRow: {
    flexDirection: "row",
    gap: 12,
  },
  resourceCard: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 16,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 12,
    elevation: 2,
  },
  resourceTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#2D2E3A",
  },
  resourceSubtitle: {
    fontSize: 12,
    color: "#6D6F7F",
    marginTop: 6,
  },
});

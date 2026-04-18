import { databases, Query } from "@/lib/appwrite";
import { APPWRITE_IDS, isConfigured } from "@/lib/appwrite-ids";
import { Feather } from "@expo/vector-icons";
import { useLocalSearchParams } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

export default function JourneyScreen() {
  const { programId } = useLocalSearchParams<{ programId?: string }>();
  const chapters = useMemo(
    () => [
      {
        id: "chapter-1",
        title: "Chapter 1",
        subtitle: "Organic chemistry",
        topics: "15 Topics",
        color: "#DDF9C8",
        status: "done",
      },
      {
        id: "chapter-2",
        title: "Chapter 2",
        subtitle: "Organic chemistry",
        topics: "15 Topics",
        color: "#E8F2FF",
        status: "active",
      },
      {
        id: "chapter-3",
        title: "Chapter 3",
        subtitle: "Organic chemistry",
        topics: "15 Topics",
        color: "#FFE0E7",
        status: "locked",
      },
      {
        id: "chapter-4",
        title: "Chapter 4",
        subtitle: "Organic chemistry",
        topics: "15 Topics",
        color: "#FFEFC0",
        status: "locked",
      },
    ],
    [],
  );
  const [data, setData] = useState(chapters);
  const [headerTitle, setHeaderTitle] = useState("Chemistry");
  const [headerSubtitle, setHeaderSubtitle] = useState("10 Chapters");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    let isActive = true;

    const loadChapters = async () => {
      if (!isConfigured(APPWRITE_IDS.collections.chapters)) {
        return;
      }

      try {
        setIsLoading(true);
        const queries = [];
        if (programId) {
          queries.push(Query.equal("programId", String(programId)));
        }
        const response = await databases.listDocuments(
          APPWRITE_IDS.databaseId,
          APPWRITE_IDS.collections.chapters,
          queries,
        );
        if (isActive) {
          const mapped = response.documents.map((doc) => ({
            id: doc.$id,
            title: String(doc.title ?? doc.name ?? "Chapter"),
            subtitle: String(doc.subtitle ?? doc.subject ?? "Course"),
            topics: String(doc.topics ?? doc.topicCount ?? "Topics"),
            color: String(doc.color ?? "#E8F2FF"),
            status: String(doc.status ?? "active"),
          }));
          setData(mapped);
          if (response.documents[0]?.programName) {
            setHeaderTitle(String(response.documents[0].programName));
          }
          setHeaderSubtitle(`${mapped.length} Chapters`);
        }
      } catch {
        if (isActive) {
          setData(chapters);
        }
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    };

    loadChapters();

    return () => {
      isActive = false;
    };
  }, [chapters, programId]);

  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.title}>{headerTitle}</Text>
          <Text style={styles.subtitle}>{headerSubtitle}</Text>
        </View>

        {data.map((chapter) => (
          <View
            key={chapter.id}
            style={[styles.chapterCard, { backgroundColor: chapter.color }]}
          >
            <View style={styles.chapterLeft}>
              <View style={styles.chapterIcon}>
                <Feather name="book" size={18} color="#2D2E3A" />
              </View>
              <View>
                <Text style={styles.chapterTitle}>{chapter.title}</Text>
                <Text style={styles.chapterSubtitle}>{chapter.subtitle}</Text>
                <Text style={styles.chapterTopics}>{chapter.topics}</Text>
              </View>
            </View>
            <Pressable
              style={styles.chapterAction}
              disabled={chapter.status === "locked"}
            >
              <Text style={styles.chapterActionText}>
                {chapter.status === "active" ? "Topics" : ""}
              </Text>
              <View
                style={[
                  styles.chapterStatus,
                  chapter.status === "done" ? styles.statusDone : null,
                  chapter.status === "locked" ? styles.statusLocked : null,
                ]}
              >
                <Feather
                  name={
                    chapter.status === "done"
                      ? "check"
                      : chapter.status === "locked"
                        ? "lock"
                        : "arrow-right"
                  }
                  size={14}
                  color="#FFFFFF"
                />
              </View>
            </Pressable>
          </View>
        ))}
        {isLoading ? (
          <Text style={styles.loadingText}>Loading chapters...</Text>
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
    marginBottom: 6,
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: "#2D2E3A",
  },
  subtitle: {
    fontSize: 12,
    color: "#7A7D92",
    marginTop: 4,
  },
  chapterCard: {
    borderRadius: 18,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  chapterLeft: {
    flexDirection: "row",
    gap: 12,
    alignItems: "center",
  },
  chapterIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "rgba(255, 255, 255, 0.7)",
    alignItems: "center",
    justifyContent: "center",
  },
  chapterTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#2D2E3A",
  },
  chapterSubtitle: {
    fontSize: 12,
    color: "#6D6F7F",
    marginTop: 2,
  },
  chapterTopics: {
    fontSize: 11,
    color: "#6D6F7F",
    marginTop: 2,
  },
  chapterAction: {
    alignItems: "center",
    gap: 6,
  },
  chapterActionText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#2D2E3A",
  },
  chapterStatus: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#34356E",
    alignItems: "center",
    justifyContent: "center",
  },
  statusDone: {
    backgroundColor: "#3B6B3F",
  },
  statusLocked: {
    backgroundColor: "#5B5C73",
  },
  loadingText: {
    fontSize: 12,
    color: "#7A7D92",
    textAlign: "center",
    marginTop: 6,
  },
});

import { databases } from "@/lib/appwrite";
import { APPWRITE_IDS, isConfigured } from "@/lib/appwrite-ids";
import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function ProgramsScreen() {
  const router = useRouter();
  const programs = useMemo(
    () => [
      {
        id: "electronic-computing",
        title: "Electronic Computing",
        subtitle: "10 Chapters",
        description: "Systems, logic, and computing fundamentals",
        color: "#DDF9C8",
      },
      {
        id: "engineering-drawing",
        title: "Engineering Drawing",
        subtitle: "12 Chapters",
        description: "Drafting, layouts, and technical sketching",
        color: "#E8F2FF",
      },
      {
        id: "advanced-math",
        title: "Advanced Math",
        subtitle: "9 Chapters",
        description: "Calculus, vectors, and advanced algebra",
        color: "#FFE0E7",
      },
      {
        id: "theory-of-electrical",
        title: "Theory Of Electrical",
        subtitle: "8 Chapters",
        description: "Circuits, power, and electrical systems",
        color: "#FFEFC0",
      },
      {
        id: "interactive-web",
        title: "Interactive Web",
        subtitle: "7 Chapters",
        description: "UI, UX, and modern web interactions",
        color: "#E7F8E9",
      },
      {
        id: "programming",
        title: "Programming",
        subtitle: "10 Chapters",
        description: "Problem solving and coding foundations",
        color: "#F4E7FF",
      },
      {
        id: "advanced-physics",
        title: "Advanced Physics",
        subtitle: "9 Chapters",
        description: "Mechanics, waves, and electromagnetism",
        color: "#E6EDFF",
      },
      {
        id: "advanced-chemistry",
        title: "Advanced Chemistry",
        subtitle: "8 Chapters",
        description: "Reactions, compounds, and lab practice",
        color: "#FFE6D6",
      },
      {
        id: "other",
        title: "Other",
        subtitle: "Open",
        description: "Additional programs and materials",
        color: "#F1F2F6",
      },
    ],
    [],
  );
  const [data, setData] = useState(programs);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    let isActive = true;

    const loadPrograms = async () => {
      if (!isConfigured(APPWRITE_IDS.collections.programs)) {
        return;
      }

      try {
        setIsLoading(true);
        const response = await databases.listDocuments(
          APPWRITE_IDS.databaseId,
          APPWRITE_IDS.collections.programs,
        );
        if (isActive) {
          const mapped = response.documents.map((doc) => ({
            id: doc.$id,
            title: String(doc.title ?? doc.name ?? "Program"),
            subtitle: String(doc.subtitle ?? doc.chapterCount ?? "Chapters"),
            description: String(doc.description ?? ""),
            color: String(doc.color ?? "#E8F2FF"),
          }));
          setData(mapped);
        }
      } catch {
        if (isActive) {
          setData(programs);
        }
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    };

    loadPrograms();

    return () => {
      isActive = false;
    };
  }, [programs]);

  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Programs</Text>
          <Text style={styles.subtitle}>
            Pick a course to continue learning
          </Text>
        </View>

        {data.map((program) => (
          <View
            key={program.title}
            style={[styles.programCard, { backgroundColor: program.color }]}
          >
            <View style={styles.programInfo}>
              <Text style={styles.programTitle}>{program.title}</Text>
              <Text style={styles.programSubtitle}>{program.subtitle}</Text>
              <Text style={styles.programDescription}>
                {program.description}
              </Text>
            </View>
            <Pressable
              style={styles.programAction}
              onPress={() =>
                router.push({
                  pathname: "/(tabs)/resources",
                  params: { programName: program.title },
                })
              }
            >
              <Text style={styles.programActionText}>Open</Text>
              <Feather name="arrow-right" size={14} color="#2D2E3A" />
            </Pressable>
          </View>
        ))}
        {isLoading ? (
          <Text style={styles.loadingText}>Loading programs...</Text>
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
    gap: 16,
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
  programCard: {
    borderRadius: 18,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  programInfo: {
    flex: 1,
    paddingRight: 12,
  },
  programTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#2D2E3A",
  },
  programSubtitle: {
    fontSize: 12,
    color: "#6D6F7F",
    marginTop: 4,
  },
  programDescription: {
    fontSize: 11,
    color: "#6D6F7F",
    marginTop: 4,
  },
  programAction: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(255, 255, 255, 0.8)",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
  },
  programActionText: {
    fontSize: 12,
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

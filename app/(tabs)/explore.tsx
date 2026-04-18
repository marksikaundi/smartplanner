import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { databases } from "@/lib/appwrite";
import { APPWRITE_IDS, isConfigured } from "@/lib/appwrite-ids";

export default function ProgramsScreen() {
  const router = useRouter();
  const programs = useMemo(
    () => [
      {
        id: "chemistry",
        title: "Chemistry",
        subtitle: "10 Chapters",
        description: "Organic chemistry, reactions, lab safety",
        color: "#DDF9C8",
      },
      {
        id: "maths",
        title: "Maths",
        subtitle: "12 Chapters",
        description: "Algebra, geometry, calculus",
        color: "#E8F2FF",
      },
      {
        id: "biology",
        title: "Biology",
        subtitle: "9 Chapters",
        description: "Cells, systems, genetics",
        color: "#FFE0E7",
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
                  pathname: "/(tabs)/journey",
                  params: { programId: program.id },
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

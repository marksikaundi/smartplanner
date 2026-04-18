import { databases } from "@/lib/appwrite";
import { APPWRITE_IDS, isConfigured } from "@/lib/appwrite-ids";
import { Feather } from "@expo/vector-icons";
import { useEffect, useMemo, useState } from "react";
import {
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

export default function MaterialsScreen() {
  const materials = useMemo(
    () => [
      {
        title: "Lecture Slides",
        subtitle: "Chemistry · Week 5",
        type: "PDF",
      },
      {
        title: "Lab Manual",
        subtitle: "Safety and procedures",
        type: "DOC",
      },
      {
        title: "Audio Recap",
        subtitle: "Organic reactions",
        type: "MP3",
      },
      {
        title: "Worksheet",
        subtitle: "Practice problems",
        type: "PDF",
      },
    ],
    [],
  );
  const [data, setData] = useState(materials);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    let isActive = true;

    const loadMaterials = async () => {
      if (!isConfigured(APPWRITE_IDS.collections.materials)) {
        return;
      }

      try {
        setIsLoading(true);
        const response = await databases.listDocuments(
          APPWRITE_IDS.databaseId,
          APPWRITE_IDS.collections.materials,
        );
        if (isActive) {
          const mapped = response.documents.map((doc) => ({
            title: String(doc.title ?? doc.name ?? "Material"),
            subtitle: String(doc.subtitle ?? doc.summary ?? ""),
            type: String(doc.type ?? doc.format ?? "PDF"),
          }));
          setData(mapped);
        }
      } catch {
        if (isActive) {
          setData(materials);
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
  }, [materials]);

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
          <View key={item.title} style={styles.card}>
            <View style={styles.iconWrap}>
              <Feather name="file-text" size={16} color="#2D2E3A" />
            </View>
            <View style={styles.info}>
              <Text style={styles.cardTitle}>{item.title}</Text>
              <Text style={styles.cardSubtitle}>{item.subtitle}</Text>
            </View>
            <Pressable style={styles.tag}>
              <Text style={styles.tagText}>{item.type}</Text>
            </Pressable>
          </View>
        ))}
        {isLoading ? (
          <Text style={styles.loadingText}>Loading materials...</Text>
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

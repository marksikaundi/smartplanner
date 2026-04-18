import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useMemo } from "react";
import {
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

export default function DashboardScreen() {
  const router = useRouter();
  const quickLinks = useMemo(
    () => [
      {
        label: "Materials",
        color: "#FFE6D6",
        icon: "book-open",
        route: "/(tabs)/materials",
      },
      {
        label: "Programs",
        color: "#DDF4FF",
        icon: "grid",
        route: "/(tabs)/explore",
      },
      {
        label: "Resources",
        color: "#E7F8E9",
        icon: "folder",
        route: "/(tabs)/resources",
      },
      {
        label: "Past Assignments",
        color: "#F4E7FF",
        icon: "archive",
        route: "/(tabs)/assignments",
      },
    ],
    [],
  );

  const actionCards = useMemo(
    () => [
      {
        title: "Course Outline",
        description: "Organized syllabus and milestones",
        action: "Open",
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

  const todayItems = useMemo(
    () => [
      {
        title: "Chemistry",
        subtitle: "Lesson 5 · Organic chemistry",
        action: "Review",
      },
      {
        title: "Maths",
        subtitle: "Lesson 1 · Algebra",
        action: "Continue",
      },
    ],
    [],
  );

  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.topBar}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>KW</Text>
          </View>
          <View style={styles.topBarActions}>
            <Pressable style={styles.iconCircle}>
              <Feather name="bell" size={18} color="#2D2E3A" />
            </Pressable>
            <Pressable style={styles.iconCircle}>
              <Feather name="menu" size={18} color="#2D2E3A" />
            </Pressable>
          </View>
        </View>

        <View style={styles.header}>
          <Text style={styles.greeting}>Hey kid,</Text>
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
                <Feather name={item.icon} size={18} color="#2D2E3A" />
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
                <Feather name="arrow-right" size={14} color="#2D2E3A" />
              </Pressable>
            </View>
          ))}
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Today&apos;s Homework</Text>
          <Pressable onPress={() => router.push("/(tabs)/assignments")}>
            <Text style={styles.sectionLink}>View all</Text>
          </Pressable>
        </View>
        <View style={styles.listCard}>
          {todayItems.map((item) => (
            <View key={item.title} style={styles.listItem}>
              <View style={styles.listIcon}>
                <Feather name="bookmark" size={16} color="#2D2E3A" />
              </View>
              <View style={styles.listContent}>
                <Text style={styles.listTitle}>{item.title}</Text>
                <Text style={styles.listSubtitle}>{item.subtitle}</Text>
              </View>
              <Pressable
                style={styles.listAction}
                onPress={() => router.push("/(tabs)/assignments")}
              >
                <Text style={styles.listActionText}>{item.action}</Text>
              </Pressable>
            </View>
          ))}
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
  avatarText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#2D2E3A",
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

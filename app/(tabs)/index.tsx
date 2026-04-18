import { useRouter } from "expo-router";
import { Pressable, SafeAreaView, StyleSheet, Text, View } from "react-native";

export default function DashboardScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.header}>
        <Text style={styles.title}>Dashboard</Text>
        <Text style={styles.subtitle}>
          Welcome back. Your tabs are active here.
        </Text>
      </View>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Quick Actions</Text>
        <Pressable
          style={styles.actionButton}
          onPress={() => router.push("/explore")}
        >
          <Text style={styles.actionText}>Go to Explore</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#F5F7F8",
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  header: {
    marginBottom: 20,
  },
  title: {
    fontSize: 26,
    fontWeight: "700",
    color: "#1C3E45",
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    color: "#6B7C80",
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 16,
    shadowColor: "#0F2D33",
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 16,
    elevation: 4,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1C3E45",
    marginBottom: 12,
  },
  actionButton: {
    backgroundColor: "#1A4650",
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
  },
  actionText: {
    color: "#FFFFFF",
    fontWeight: "600",
  },
});

import HugeiconsIcon from "@/components/hugeicons-icon";
import { account } from "@/lib/appwrite";
import {
  CloudUploadIcon,
  File02Icon,
  HelpCircleIcon,
  Notification01Icon,
  Shield01Icon,
  UserIcon,
} from "@hugeicons/core-free-icons";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type AccountInfo = {
  name?: string;
  email?: string;
};

export default function ProfileScreen() {
  const router = useRouter();
  const [accountInfo, setAccountInfo] = useState<AccountInfo>({});

  useEffect(() => {
    let isActive = true;

    const loadAccount = async () => {
      try {
        const data = await account.get();
        if (isActive) {
          setAccountInfo({ name: data.name, email: data.email });
        }
      } catch {
        if (isActive) {
          setAccountInfo({});
        }
      }
    };

    loadAccount();

    return () => {
      isActive = false;
    };
  }, []);

  const handleSignOut = async () => {
    try {
      await account.deleteSession("current");
      router.replace("/");
    } catch (error) {
      const message =
        typeof error === "object" && error && "message" in error
          ? String(error.message)
          : "Unable to sign out right now.";
      Alert.alert("Sign out failed", message);
    }
  };

  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {(accountInfo.name || "User")
                .split(" ")
                .map((part) => part[0])
                .join("")
                .slice(0, 2)
                .toUpperCase()}
            </Text>
          </View>
          <Text style={styles.title}>{accountInfo.name || "Your Profile"}</Text>
          <Text style={styles.subtitle}>
            {accountInfo.email || "Signed in"}
          </Text>
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Account</Text>
          <View style={styles.rowItem}>
            <HugeiconsIcon icon={UserIcon} size={16} color="#2D2E3A" />
            <Text style={styles.rowLabel}>Personal Details</Text>
          </View>
          <Pressable
            style={styles.rowItem}
            onPress={() => router.push("/(tabs)/upload-content")}
          >
            <HugeiconsIcon icon={CloudUploadIcon} size={16} color="#2D2E3A" />
            <Text style={styles.rowLabel}>Upload Content</Text>
          </Pressable>
          <View style={styles.rowItem}>
            <HugeiconsIcon icon={Shield01Icon} size={16} color="#2D2E3A" />
            <Text style={styles.rowLabel}>Security</Text>
          </View>
          <View style={styles.rowItem}>
            <HugeiconsIcon
              icon={Notification01Icon}
              size={16}
              color="#2D2E3A"
            />
            <Text style={styles.rowLabel}>Notifications</Text>
          </View>
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Support</Text>
          <View style={styles.rowItem}>
            <HugeiconsIcon icon={HelpCircleIcon} size={16} color="#2D2E3A" />
            <Text style={styles.rowLabel}>Help Center</Text>
          </View>
          <View style={styles.rowItem}>
            <HugeiconsIcon icon={File02Icon} size={16} color="#2D2E3A" />
            <Text style={styles.rowLabel}>Terms &amp; Privacy</Text>
          </View>
        </View>

        <Pressable style={styles.signOutButton} onPress={handleSignOut}>
          <Text style={styles.signOutText}>Sign Out</Text>
        </Pressable>
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
    gap: 18,
  },
  header: {
    alignItems: "center",
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 16,
    elevation: 4,
  },
  avatarText: {
    fontSize: 20,
    fontWeight: "700",
    color: "#2D2E3A",
  },
  title: {
    marginTop: 12,
    fontSize: 20,
    fontWeight: "700",
    color: "#2D2E3A",
  },
  subtitle: {
    marginTop: 4,
    fontSize: 12,
    color: "#7A7D92",
  },
  sectionCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 16,
    gap: 12,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#2D2E3A",
  },
  rowItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 6,
  },
  rowLabel: {
    fontSize: 13,
    color: "#2D2E3A",
  },
  signOutButton: {
    backgroundColor: "#2D2E3A",
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
  },
  signOutText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "700",
  },
});

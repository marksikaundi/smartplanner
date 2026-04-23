import HugeiconsIcon from "@/components/hugeicons-icon";
import {
  AiMicIcon,
  BellDotIcon,
  BubbleChatIcon,
  More01Icon,
  PlayIcon,
  Sun01Icon,
} from "@hugeicons/core-free-icons";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function JourneyScreen() {
  const filters = ["All", "Unread", "Groups", "Favorite", "Others"];
  const waveBars = [6, 14, 10, 18, 12, 20, 14, 22, 16, 24, 18, 14, 20, 12];
  const avatars = [
    { name: "Emery Saris", initials: "ES", color: "#F6B97B", badge: 5 },
    { name: "Justin Dokidis", initials: "JD", color: "#C9C1F6" },
    { name: "Erin Arcand", initials: "EA", color: "#9AE7C1" },
    { name: "Aspen Botosh", initials: "AB", color: "#E7C3A4", status: "Typing" },
    { name: "Zaire Workman", initials: "ZW", color: "#F1A9B6" },
  ];

  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.backgroundGlowTop} />
        <View style={styles.backgroundGlowBottom} />

        <View style={styles.topBar}>
          <View style={styles.brandMark}>
            <View style={styles.brandDot} />
            <HugeiconsIcon icon={BubbleChatIcon} size={18} color="#1FAF75" />
          </View>
          <View style={styles.topBarRight}>
            <View style={styles.notificationButton}>
              <HugeiconsIcon icon={BellDotIcon} size={18} color="#1F2937" />
            </View>
            <View style={styles.profileAvatar}>
              <Text style={styles.profileInitials}>J</Text>
            </View>
          </View>
        </View>

        <View style={styles.greetingRow}>
          <Text style={styles.greetingText}>Good Afternoon</Text>
          <View style={styles.greetingAccent}>
            <Text style={styles.greetingName}>Jane</Text>
            <HugeiconsIcon icon={Sun01Icon} size={18} color="#F5B647" />
          </View>
        </View>

        <View style={styles.filterRow}>
          {filters.map((label, index) => {
            const isActive = index === 0;
            return (
              <View
                key={label}
                style={[styles.filterChip, isActive ? styles.filterChipActive : null]}
              >
                <Text
                  style={[
                    styles.filterText,
                    isActive ? styles.filterTextActive : null,
                  ]}
                >
                  {label}
                </Text>
              </View>
            );
          })}
        </View>

        <View style={styles.voiceCard}>
          <View style={styles.voiceHeader}>
            <View style={styles.voiceAvatar}>
              <Text style={styles.voiceAvatarText}>RM</Text>
            </View>
            <Text style={styles.voiceName}>Randy Mango</Text>
            <View style={styles.voiceMenu}>
              <HugeiconsIcon icon={More01Icon} size={16} color="#FFFFFF" />
            </View>
          </View>
          <View style={styles.voiceBody}>
            <View style={styles.playButton}>
              <HugeiconsIcon icon={PlayIcon} size={16} color="#1FAF75" />
            </View>
            <View style={styles.waveform}>
              {waveBars.map((height, index) => (
                <View
                  key={`${height}-${index}`}
                  style={[
                    styles.waveBar,
                    { height, opacity: index > 8 ? 0.35 : 1 },
                  ]}
                />
              ))}
            </View>
            <Text style={styles.voiceTime}>7:18</Text>
          </View>
          <View style={styles.voiceFooter}>
            <View style={styles.voiceIconCircle}>
              <HugeiconsIcon icon={AiMicIcon} size={14} color="#8A8DA2" />
            </View>
            <View style={styles.voiceIconCircle}>
              <HugeiconsIcon icon={BubbleChatIcon} size={14} color="#8A8DA2" />
            </View>
          </View>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Direct Message</Text>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.avatarRow}
        >
          {avatars.map((person) => (
            <View key={person.name} style={styles.avatarItem}>
              <View style={[styles.avatarCircle, { backgroundColor: person.color }]}> 
                <Text style={styles.avatarInitials}>{person.initials}</Text>
                {person.badge ? (
                  <View style={styles.avatarBadge}>
                    <Text style={styles.avatarBadgeText}>{person.badge}</Text>
                  </View>
                ) : null}
              </View>
              {person.status ? (
                <View style={styles.typingPill}>
                  <Text style={styles.typingText}>{person.status}...</Text>
                </View>
              ) : null}
              <Text style={styles.avatarName} numberOfLines={2}>
                {person.name}
              </Text>
            </View>
          ))}
        </ScrollView>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Channels</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#F7F7FA",
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 32,
    paddingTop: 18,
    gap: 18,
  },
  backgroundGlowTop: {
    position: "absolute",
    top: -120,
    right: -80,
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: "#E6F5EE",
  },
  backgroundGlowBottom: {
    position: "absolute",
    bottom: -180,
    left: -120,
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: "#EEF2FF",
  },
  topBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  brandMark: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  brandDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#1FAF75",
  },
  topBarRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  notificationButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 16,
    elevation: 4,
  },
  profileAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#E9E3FF",
    alignItems: "center",
    justifyContent: "center",
  },
  profileInitials: {
    fontSize: 14,
    fontWeight: "700",
    color: "#2D2E3A",
  },
  greetingRow: {
    gap: 6,
  },
  greetingText: {
    fontSize: 32,
    fontWeight: "700",
    color: "#1F2937",
    letterSpacing: -0.5,
  },
  greetingAccent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  greetingName: {
    fontSize: 32,
    fontWeight: "700",
    color: "#1F2937",
  },
  filterRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E6E7EE",
  },
  filterChipActive: {
    backgroundColor: "#1FAF75",
    borderColor: "#1FAF75",
  },
  filterText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#5A6072",
  },
  filterTextActive: {
    color: "#FFFFFF",
  },
  voiceCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 16,
    gap: 14,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 10 },
    shadowRadius: 20,
    elevation: 5,
  },
  voiceHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  voiceAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#E5ECFF",
    alignItems: "center",
    justifyContent: "center",
  },
  voiceAvatarText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#1F2937",
  },
  voiceName: {
    flex: 1,
    marginLeft: 10,
    fontSize: 14,
    fontWeight: "600",
    color: "#1F2937",
  },
  voiceMenu: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#7A5AF8",
    alignItems: "center",
    justifyContent: "center",
  },
  voiceBody: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  playButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#E9F7F0",
    alignItems: "center",
    justifyContent: "center",
  },
  waveform: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  waveBar: {
    width: 3,
    borderRadius: 2,
    backgroundColor: "#1FAF75",
  },
  voiceTime: {
    fontSize: 12,
    fontWeight: "600",
    color: "#1F2937",
  },
  voiceFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  voiceIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#F4F5F8",
    alignItems: "center",
    justifyContent: "center",
  },
  sectionHeader: {
    paddingTop: 6,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#1F2937",
  },
  avatarRow: {
    paddingVertical: 8,
    gap: 16,
  },
  avatarItem: {
    width: 70,
    alignItems: "center",
    gap: 6,
  },
  avatarCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarInitials: {
    fontSize: 12,
    fontWeight: "700",
    color: "#1F2937",
  },
  avatarBadge: {
    position: "absolute",
    top: -4,
    right: -4,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#F04438",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarBadgeText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  typingPill: {
    backgroundColor: "#F5A623",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  typingText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  avatarName: {
    fontSize: 11,
    fontWeight: "600",
    color: "#2D2E3A",
    textAlign: "center",
  },
});

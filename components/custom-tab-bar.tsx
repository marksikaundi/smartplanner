import { Feather } from "@expo/vector-icons";
import type { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const TAB_CONFIG: Record<
  string,
  { label: string; icon: keyof typeof Feather.glyphMap }
> = {
  index: { label: "Home", icon: "home" },
  explore: { label: "Explore", icon: "compass" },
  journey: { label: "Journey", icon: "map" },
  stats: { label: "Stats", icon: "bar-chart-2" },
  profile: { label: "Profile", icon: "user" },
};

export function CustomTabBar({
  state,
  descriptors,
  navigation,
}: BottomTabBarProps) {
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[styles.container, { paddingBottom: Math.max(insets.bottom, 10) }]}
    >
      <View style={styles.bar}>
        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          const config = TAB_CONFIG[route.name] ?? {
            label: options.title ?? route.name,
            icon: "circle",
          };
          const isFocused = state.index === index;

          const onPress = () => {
            const event = navigation.emit({
              type: "tabPress",
              target: route.key,
              canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          return (
            <Pressable
              key={route.key}
              onPress={onPress}
              accessibilityRole="button"
              accessibilityState={isFocused ? { selected: true } : {}}
              style={[styles.item, isFocused ? styles.itemActive : null]}
            >
              <View
                style={[styles.iconWrap, isFocused ? styles.iconActive : null]}
              >
                <Feather
                  name={config.icon}
                  size={18}
                  color={isFocused ? "#FFFFFF" : "#8A8DA2"}
                />
              </View>
              <Text
                style={[styles.label, isFocused ? styles.labelActive : null]}
              >
                {config.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#F4F3F9",
    paddingHorizontal: 18,
    paddingTop: 8,
  },
  bar: {
    backgroundColor: "#FFFFFF",
    borderRadius: 22,
    paddingVertical: 10,
    paddingHorizontal: 14,
    flexDirection: "row",
    justifyContent: "space-between",
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 16,
    elevation: 6,
  },
  item: {
    flex: 1,
    alignItems: "center",
    gap: 6,
  },
  itemActive: {
    transform: [{ translateY: -2 }],
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F1F2F6",
  },
  iconActive: {
    backgroundColor: "#34356E",
  },
  label: {
    fontSize: 10,
    fontWeight: "600",
    color: "#8A8DA2",
  },
  labelActive: {
    color: "#2D2E3A",
  },
});

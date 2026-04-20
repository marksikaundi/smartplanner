import HugeiconsIcon, {
  type HugeiconsIconData,
} from "@/components/hugeicons-icon";
import {
  BarChartIcon,
  CircleIcon,
  CompassIcon,
  HelpCircleIcon,
  Home01Icon,
} from "@hugeicons/core-free-icons";
import type { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const TAB_CONFIG: Record<string, { label: string; icon: HugeiconsIconData }> = {
  index: { label: "Home", icon: Home01Icon },
  explore: { label: "Explore", icon: CompassIcon },
  journey: { label: "Tutor", icon: HelpCircleIcon },
  stats: { label: "Stats", icon: BarChartIcon },
};

export function CustomTabBar({
  state,
  descriptors,
  navigation,
}: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const activeKey = state.routes[state.index]?.key;
  const visibleRoutes = state.routes.filter((route) => TAB_CONFIG[route.name]);

  return (
    <View
      style={[styles.container, { paddingBottom: Math.max(insets.bottom, 10) }]}
    >
      <View style={styles.bar}>
        {visibleRoutes.map((route) => {
          const { options } = descriptors[route.key];
          const config = TAB_CONFIG[route.name] ?? {
            label: options.title ?? route.name,
            icon: CircleIcon,
          };
          const isFocused = route.key === activeKey;

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
                <HugeiconsIcon
                  icon={config.icon}
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

import AsyncStorage from "@react-native-async-storage/async-storage";

const STORAGE_KEY = "recent-opens";
const MAX_ITEMS = 6;

export type RecentOpenItem = {
  id: string;
  title: string;
  subtitle: string;
  category: string;
  openedAt: string;
};

const normalizeItems = (value: unknown): RecentOpenItem[] => {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter((item): item is RecentOpenItem =>
      Boolean(
        item &&
          typeof item === "object" &&
          "id" in item &&
          "title" in item &&
          "subtitle" in item &&
          "category" in item &&
          "openedAt" in item,
      ),
    )
    .map((item) => ({
      id: String(item.id),
      title: String(item.title),
      subtitle: String(item.subtitle ?? ""),
      category: String(item.category),
      openedAt: String(item.openedAt),
    }));
};

export const getRecentOpens = async (): Promise<RecentOpenItem[]> => {
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return [];
  }

  try {
    return normalizeItems(JSON.parse(raw));
  } catch {
    return [];
  }
};

export const addRecentOpen = async (
  entry: Omit<RecentOpenItem, "openedAt">,
): Promise<RecentOpenItem[]> => {
  const existing = await getRecentOpens();
  const now = new Date().toISOString();
  const nextItem: RecentOpenItem = { ...entry, openedAt: now };

  const filtered = existing.filter(
    (item) => !(item.id === nextItem.id && item.category === nextItem.category),
  );
  const next = [nextItem, ...filtered].slice(0, MAX_ITEMS);

  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  return next;
};

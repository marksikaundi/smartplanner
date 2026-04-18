export const APPWRITE_IDS = {
  databaseId: "69e35bf30037b0cf93c7",
  collections: {
    programs: "CHANGE_ME",
    chapters: "CHANGE_ME",
    materials: "CHANGE_ME",
    assignments: "CHANGE_ME",
    notes: "CHANGE_ME",
    resources: "CHANGE_ME",
  },
} as const;

export const isConfigured = (value: string) =>
  Boolean(value && !value.startsWith("CHANGE_ME"));

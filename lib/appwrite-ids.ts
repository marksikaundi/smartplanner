export const APPWRITE_IDS = {
  endpoint: "https://fra.cloud.appwrite.io/v1",
  projectId: "69e351c40030ad9ed4d3",
  databaseId: "69e35bf30037b0cf93c7",
  storageBucketId: "icu-data",
  collections: {
    programs: "CHANGE_ME",
    chapters: "CHANGE_ME",
    materials: "materials",
    assignments: "assignments",
    notes: "notes",
    resources: "resources",
    channels: "channels",
    channelInvites: "channelInvites",
    channelMessages: "channelMessages",
    channelMembers: "channelMembers",
  },
} as const;

export const isConfigured = (value: string) =>
  Boolean(value && !value.startsWith("CHANGE_ME"));

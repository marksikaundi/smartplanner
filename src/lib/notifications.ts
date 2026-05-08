import { isExpoGo } from "@/lib/expo-environment";

/** Safe to call from app root: no-ops in Expo Go (avoids loading expo-notifications there). */
export async function configurePushNotificationHandler(): Promise<void> {
  if (isExpoGo()) return;
  try {
    const Notifications = await import("expo-notifications");
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: false,
        shouldSetBadge: false,
        shouldShowBanner: true,
        shouldShowList: true,
      }),
    });
  } catch {
    // Dev client / bare workflow edge cases
  }
}

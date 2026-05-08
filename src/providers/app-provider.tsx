import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { PropsWithChildren, useEffect, useState } from "react";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { configurePushNotificationHandler } from "@/lib/notifications";

export const AppProvider = ({ children }: PropsWithChildren) => {
  useEffect(() => {
    void configurePushNotificationHandler();
  }, []);

  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60_000,
            retry: 1,
          },
        },
      }),
  );

  return (
    <SafeAreaProvider>
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    </SafeAreaProvider>
  );
};

import * as SecureStore from "expo-secure-store";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { supabase } from "@/lib/supabase";

type AuthState = {
  userId: string | null;
  username: string | null;
  isGuest: boolean;
  onboardingDone: boolean;
  setAuth: (payload: { userId: string; username: string }) => void;
  continueAsGuest: () => void;
  finishOnboarding: () => void;
  hydrateFromSession: () => Promise<void>;
  signOut: () => void;
};

const secureStorage = {
  getItem: (name: string) => SecureStore.getItemAsync(name),
  setItem: (name: string, value: string) => SecureStore.setItemAsync(name, value),
  removeItem: (name: string) => SecureStore.deleteItemAsync(name),
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      userId: null,
      username: null,
      isGuest: false,
      onboardingDone: false,
      setAuth: ({ userId, username }) =>
        set({ userId, username, isGuest: false }),
      continueAsGuest: () => set({ isGuest: true, userId: null, username: "Guest" }),
      finishOnboarding: () => set({ onboardingDone: true }),
      hydrateFromSession: async () => {
        const { data } = await supabase.auth.getSession();
        const user = data.session?.user;
        if (!user) return;
        set({
          userId: user.id,
          username: user.user_metadata?.username ?? user.email?.split("@")[0] ?? "student",
          isGuest: false,
        });
      },
      signOut: () => set({ userId: null, username: null, isGuest: false, onboardingDone: false }),
    }),
    {
      name: "campus-market-auth",
      storage: createJSONStorage(() => secureStorage),
      partialize: (state) => ({
        userId: state.userId,
        username: state.username,
        isGuest: state.isGuest,
        onboardingDone: state.onboardingDone,
      }),
    },
  ),
);

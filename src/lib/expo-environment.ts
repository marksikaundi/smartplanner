import Constants from "expo-constants";

/** Expo Go cannot use remote push (SDK 53+ on Android; limited on iOS). Use a dev build instead. */
export const isExpoGo = () => Constants.appOwnership === "expo";

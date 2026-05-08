import * as ImageManipulator from "expo-image-manipulator";
import * as ImagePicker from "expo-image-picker";
import { env } from "@/config/env";

export const pickImages = async () => {
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ["images"],
    quality: 1,
    allowsMultipleSelection: true,
    selectionLimit: 6,
  });
  if (result.canceled) return [];
  return Promise.all(
    result.assets.map(async (asset) => {
      const processed = await ImageManipulator.manipulateAsync(
        asset.uri,
        [{ resize: { width: 1280 } }],
        { compress: 0.75, format: ImageManipulator.SaveFormat.JPEG },
      );
      return processed.uri;
    }),
  );
};

export const uploadToUploadthing = async (uri: string) => {
  if (!env.uploadthingToken) {
    throw new Error("Missing EXPO_PUBLIC_UPLOADTHING_TOKEN.");
  }
  const fileName = `listing-${Date.now()}.jpg`;
  const fileType = "image/jpeg";
  const signRes = await fetch("https://api.uploadthing.com/v6/uploadFiles", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-uploadthing-api-key": env.uploadthingToken,
    },
    body: JSON.stringify({
      files: [{ name: fileName, size: 0, type: fileType }],
      metadata: { app: "campus-market" },
    }),
  });
  if (!signRes.ok) {
    throw new Error("Failed to get signed upload URL.");
  }
  const signJson = (await signRes.json()) as { data?: { url: string; key: string }[] };
  const target = signJson.data?.[0];
  if (!target?.url) throw new Error("Uploadthing signed response invalid.");

  const fileBlob = await (await fetch(uri)).blob();
  const uploadRes = await fetch(target.url, {
    method: "PUT",
    body: fileBlob,
    headers: { "Content-Type": fileType },
  });
  if (!uploadRes.ok) {
    throw new Error("Upload to Uploadthing failed.");
  }
  return target.url.split("?")[0];
};

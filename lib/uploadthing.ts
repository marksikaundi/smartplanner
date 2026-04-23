import type { UploadRouter } from "@/uploadthing/router";
import { generateReactNativeHelpers } from "@uploadthing/expo";

const uploadthingUrl = process.env.EXPO_PUBLIC_UPLOADTHING_URL;
const appwriteProjectId = process.env.EXPO_PUBLIC_APPWRITE_PROJECT_ID;

const buildFetch = () => {
  if (!uploadthingUrl || !appwriteProjectId) {
    return undefined;
  }

  const uploadthingHost = new URL(uploadthingUrl).host;

  return (input: RequestInfo | URL, init?: RequestInit) => {
    const targetUrl =
      typeof input === "string" || input instanceof URL
        ? input.toString()
        : input.url;
    const headers = new Headers(init?.headers ?? undefined);

    if (new URL(targetUrl).host === uploadthingHost) {
      headers.set("X-Appwrite-Project", appwriteProjectId);
    }

    return fetch(input, { ...init, headers });
  };
};

export const {
  uploadFiles,
  useUploadThing,
  useDocumentUploader,
  useImageUploader,
  routeRegistry,
  getRouteConfig,
  createUpload,
} = generateReactNativeHelpers<UploadRouter>(
  uploadthingUrl
    ? {
        url: uploadthingUrl,
        fetch: buildFetch(),
      }
    : undefined,
);

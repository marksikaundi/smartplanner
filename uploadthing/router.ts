import { createUploadthing, type FileRouter } from "uploadthing/server";

const f = createUploadthing();

export const uploadRouter = {
  documents: f({ blob: { maxFileSize: "256MB" } })
    .middleware(() => ({ uploadedAt: new Date().toISOString() }))
    .onUploadComplete(({ file, metadata }) => ({
      uploadedAt: metadata.uploadedAt,
      fileKey: file.key,
      fileUrl: file.ufsUrl,
    })),
} satisfies FileRouter;

export type UploadRouter = typeof uploadRouter;

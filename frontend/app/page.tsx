"use client";

import { useEffect, useMemo, useState } from "react";

type UploadItem = {
  id: string;
  name: string;
  size: number;
  status: "queued" | "uploading" | "uploaded" | "failed";
  createdAt: string;
};

type LibraryItem = {
  id: number;
  title: string;
  preview: string;
  source: string;
};

const UPLOAD_ENDPOINT = "https://httpbin.org/post";
const LIBRARY_ENDPOINT =
  "https://jsonplaceholder.typicode.com/photos?_limit=8";

const formatBytes = (value: number) => {
  if (!value) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const index = Math.min(
    Math.floor(Math.log(value) / Math.log(1024)),
    units.length - 1
  );
  const size = value / Math.pow(1024, index);
  return `${size.toFixed(size >= 10 || index === 0 ? 0 : 1)} ${units[index]}`;
};

export default function Home() {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploads, setUploads] = useState<UploadItem[]>([]);
  const [libraryItems, setLibraryItems] = useState<LibraryItem[]>([]);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("General");
  const [notes, setNotes] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [isLoadingLibrary, setIsLoadingLibrary] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    const loadLibrary = async () => {
      try {
        setIsLoadingLibrary(true);
        const response = await fetch(LIBRARY_ENDPOINT, {
          signal: controller.signal,
        });
        if (!response.ok) {
          throw new Error("Unable to load library items.");
        }
        const data = (await response.json()) as Array<{
          id: number;
          title: string;
          url: string;
        }>;
        setLibraryItems(
          data.map((item) => ({
            id: item.id,
            title: item.title,
            preview: item.url,
            source: "Public placeholder feed",
          }))
        );
      } catch (err) {
        if (err instanceof Error && err.name === "AbortError") return;
        setError("Library feed is offline. Try again later.");
      } finally {
        setIsLoadingLibrary(false);
      }
    };

    void loadLibrary();
    return () => controller.abort();
  }, []);

  const totalUploaded = useMemo(
    () => uploads.filter((item) => item.status === "uploaded").length,
    [uploads]
  );

  const totalBytes = useMemo(
    () => uploads.reduce((sum, item) => sum + item.size, 0),
    [uploads]
  );

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files ? Array.from(event.target.files) : [];
    setSelectedFiles(files);
  };

  const handleUpload = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedFiles.length) {
      setError("Choose at least one file to upload.");
      return;
    }

    setError(null);
    setIsUploading(true);

    const timestamp = new Date().toISOString();
    const newUploads = selectedFiles.map((file) => ({
      id: `${file.name}-${file.size}-${timestamp}`,
      name: file.name,
      size: file.size,
      status: "uploading" as const,
      createdAt: timestamp,
    }));

    setUploads((prev) => [...newUploads, ...prev]);

    const formData = new FormData();
    selectedFiles.forEach((file) => formData.append("files", file));
    formData.append("title", title || "Untitled upload");
    formData.append("category", category);
    formData.append("notes", notes);

    try {
      const response = await fetch(UPLOAD_ENDPOINT, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Upload failed.");
      }

      setUploads((prev) =>
        prev.map((item) =>
          newUploads.some((upload) => upload.id === item.id)
            ? { ...item, status: "uploaded" }
            : item
        )
      );
      setSelectedFiles([]);
      setNotes("");
      setTitle("");
    } catch (err) {
      setUploads((prev) =>
        prev.map((item) =>
          newUploads.some((upload) => upload.id === item.id)
            ? { ...item, status: "failed" }
            : item
        )
      );
      setError("Upload failed. Check the endpoint and try again.");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="page-shell">
      <main className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-6 py-10">
        <header className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div className="fade-up">
            <span className="chip">ICU Study Content Hub</span>
            <h1 className="mt-4 text-4xl font-semibold tracking-tight text-zinc-900 md:text-5xl">
              Upload once. Share everywhere.
            </h1>
            <p className="mt-3 max-w-xl text-base leading-7 text-[var(--muted)]">
              Manage all study materials in one place. The app reads only what
              you publish here, while uploads happen through this dashboard.
            </p>
          </div>
          <div className="grid w-full gap-4 sm:grid-cols-3 md:w-auto">
            {[
              { label: "Total uploads", value: uploads.length },
              { label: "Published", value: totalUploaded },
              { label: "Stored", value: formatBytes(totalBytes) },
            ].map((stat) => (
              <div
                key={stat.label}
                className="glass-card rounded-2xl px-4 py-3 text-left"
              >
                <p className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">
                  {stat.label}
                </p>
                <p className="mt-2 text-2xl font-semibold text-zinc-900">
                  {stat.value}
                </p>
              </div>
            ))}
          </div>
        </header>

        <section className="grid gap-8 md:grid-cols-[1.1fr_0.9fr]">
          <form
            onSubmit={handleUpload}
            className="glass-card flex flex-col gap-6 rounded-3xl p-6"
          >
            <div>
              <h2 className="text-2xl font-semibold text-zinc-900">
                Upload new content
              </h2>
              <p className="mt-2 text-sm text-[var(--muted)]">
                Any file type is allowed. The demo endpoint stores nothing, but
                the UI mirrors the production flow.
              </p>
            </div>

            <label className="upload-area flex flex-col items-center justify-center gap-3 px-6 py-10 text-center">
              <input
                type="file"
                multiple
                onChange={handleFileChange}
                className="sr-only"
              />
              <div className="text-lg font-medium text-zinc-900">
                Drop files here or click to browse
              </div>
              <div className="text-xs uppercase tracking-[0.3em] text-[var(--muted)]">
                Multi-upload enabled
              </div>
            </label>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">
                  Title
                </label>
                <input
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  placeholder="Enter a clear title"
                  className="mt-2 w-full rounded-xl border border-[var(--stroke)] bg-white px-4 py-2 text-sm text-zinc-900 shadow-sm focus:border-[var(--accent-strong)] focus:outline-none"
                />
              </div>
              <div>
                <label className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">
                  Category
                </label>
                <select
                  value={category}
                  onChange={(event) => setCategory(event.target.value)}
                  className="mt-2 w-full rounded-xl border border-[var(--stroke)] bg-white px-4 py-2 text-sm text-zinc-900 shadow-sm focus:border-[var(--accent-strong)] focus:outline-none"
                >
                  <option>General</option>
                  <option>Assignments</option>
                  <option>Lectures</option>
                  <option>Resources</option>
                  <option>Research</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">
                Notes
              </label>
              <textarea
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                placeholder="Add a short description"
                className="mt-2 min-h-[120px] w-full resize-none rounded-2xl border border-[var(--stroke)] bg-white px-4 py-3 text-sm text-zinc-900 shadow-sm focus:border-[var(--accent-strong)] focus:outline-none"
              />
            </div>

            {selectedFiles.length ? (
              <div className="rounded-2xl border border-[var(--stroke)] bg-white/60 px-4 py-3 text-sm">
                <p className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">
                  Selected files
                </p>
                <ul className="mt-3 flex flex-col gap-2 text-zinc-900">
                  {selectedFiles.map((file) => (
                    <li key={`${file.name}-${file.size}`}>
                      {file.name} ({formatBytes(file.size)})
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            {error ? (
              <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            ) : null}

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <button
                type="submit"
                disabled={isUploading}
                className="inline-flex items-center justify-center rounded-full bg-[var(--foreground)] px-6 py-2 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isUploading ? "Uploading..." : "Publish upload"}
              </button>
              <p className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">
                Endpoint: {UPLOAD_ENDPOINT}
              </p>
            </div>
          </form>

          <aside className="flex flex-col gap-6">
            <div className="glass-card rounded-3xl p-6">
              <h3 className="text-lg font-semibold text-zinc-900">
                Upload queue
              </h3>
              <p className="mt-2 text-sm text-[var(--muted)]">
                Track progress for files being published right now.
              </p>
              <div className="mt-4 flex flex-col gap-3">
                {uploads.length ? (
                  uploads.slice(0, 5).map((item) => (
                    <div
                      key={item.id}
                      className="rounded-2xl border border-[var(--stroke)] bg-white/70 px-4 py-3"
                    >
                      <div className="flex items-center justify-between text-sm text-zinc-900">
                        <span className="font-medium">{item.name}</span>
                        <span className="text-xs text-[var(--muted)]">
                          {formatBytes(item.size)}
                        </span>
                      </div>
                      <div className="mt-2 flex items-center justify-between text-xs uppercase tracking-[0.2em]">
                        <span className="text-[var(--muted)]">
                          {new Date(item.createdAt).toLocaleDateString()}
                        </span>
                        <span
                          className={`rounded-full px-2 py-1 text-[10px] font-semibold ${
                            item.status === "uploaded"
                              ? "bg-emerald-100 text-emerald-700"
                              : item.status === "failed"
                              ? "bg-rose-100 text-rose-700"
                              : "bg-amber-100 text-amber-700"
                          }`}
                        >
                          {item.status}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="rounded-2xl border border-[var(--stroke)] bg-white/60 px-4 py-6 text-sm text-[var(--muted)]">
                    No uploads yet. Your latest files will appear here.
                  </div>
                )}
              </div>
            </div>

            <div className="glass-card rounded-3xl p-6">
              <h3 className="text-lg font-semibold text-zinc-900">
                Publishing tips
              </h3>
              <div className="mt-4 flex flex-col gap-3 text-sm text-[var(--muted)]">
                <p>
                  Keep names consistent so the mobile app can surface content
                  quickly.
                </p>
                <p>
                  Use categories to organize materials for tabs like Resources
                  and Assignments.
                </p>
                <p>
                  After hosting, swap the upload endpoint to your deployed API.
                </p>
              </div>
            </div>
          </aside>
        </section>

        <section className="stagger">
          <div className="flex items-end justify-between">
            <div>
              <h2 className="text-2xl font-semibold text-zinc-900">
                Content library
              </h2>
              <p className="mt-2 text-sm text-[var(--muted)]">
                Pulled from a public API feed until your backend is deployed.
              </p>
            </div>
          </div>

          <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {isLoadingLibrary
              ? Array.from({ length: 4 }).map((_, index) => (
                  <div
                    key={`skeleton-${index}`}
                    className="glass-card h-48 animate-pulse rounded-2xl"
                  />
                ))
              : libraryItems.map((item) => (
                  <article
                    key={item.id}
                    className="glass-card flex flex-col overflow-hidden rounded-2xl"
                  >
                    <div className="relative h-32 w-full overflow-hidden bg-zinc-100">
                      <img
                        src={item.preview}
                        alt={item.title}
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <div className="flex flex-1 flex-col gap-2 p-4">
                      <h3 className="text-sm font-semibold text-zinc-900 line-clamp-2">
                        {item.title}
                      </h3>
                      <p className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">
                        {item.source}
                      </p>
                    </div>
                  </article>
                ))}
          </div>
        </section>
      </main>
    </div>
  );
}

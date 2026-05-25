/**
 * planner-common.js — Shared storage & utilities
 * Used by: planner.html (app.js), analytics.html (analytics-page.js)
 *
 * SECTION INDEX (search for "SECTION:"):
 *   SECTION: Storage keys
 *   SECTION: Date helpers
 *   SECTION: Load tasks & activity log
 *   SECTION: Formatting helpers
 *   SECTION: Activity log descriptions
 *   SECTION: Task flattening
 */

/* ==========================================================================
   SECTION: Storage keys
   ========================================================================== */
const STORAGE_KEY = "smartPlannerTasks";
const ACTIVITY_LOG_KEY = "smartPlannerActivityLog";
const ACTIVITY_LOG_MAX = 400;

/* ==========================================================================
   SECTION: Date helpers
   ========================================================================== */
function getTodayISO() {
  return toISODateLocal(new Date());
}

function toISODateLocal(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function parseISODateLocal(isoDate) {
  const [y, m, d] = isoDate.split("-").map((n) => Number(n));
  return new Date(y, m - 1, d);
}

function startOfLocalDay(d) {
  const copy = new Date(d);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

/* ==========================================================================
   SECTION: Load tasks & activity log
   ========================================================================== */
function loadAllTasks() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    if (typeof parsed !== "object" || parsed === null) return {};
    Object.keys(parsed).forEach((dateISO) => {
      const list = parsed[dateISO];
      if (!Array.isArray(list)) return;
      parsed[dateISO] = list.map((task) => ({
        ...task,
        loggedSeconds:
          typeof task.loggedSeconds === "number" && !Number.isNaN(task.loggedSeconds)
            ? task.loggedSeconds
            : 0,
      }));
    });
    return parsed;
  } catch (e) {
    console.error("Failed to parse tasks from localStorage", e);
    return {};
  }
}

function loadActivityLog() {
  try {
    const raw = localStorage.getItem(ACTIVITY_LOG_KEY);
    if (!raw) return [];
    const a = JSON.parse(raw);
    return Array.isArray(a) ? a : [];
  } catch (e) {
    console.error("Failed to read activity log", e);
    return [];
  }
}

/* ==========================================================================
   SECTION: Formatting helpers
   ========================================================================== */
function formatReadableDate(isoDate) {
  const d = parseISODateLocal(isoDate);
  return d.toLocaleDateString(undefined, {
    weekday: "long",
    month: "short",
    day: "numeric",
  });
}

function formatTrackedDuration(totalSeconds) {
  const s = Math.max(0, Math.floor(totalSeconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (h > 0) {
    return `${h}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
  }
  return `${m}:${String(sec).padStart(2, "0")}`;
}

function formatHumanDurationShort(seconds) {
  const s = Math.max(0, Math.floor(seconds || 0));
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  const rm = m % 60;
  return `${h}h ${rm}m`;
}

function getLastNDaysISO(n) {
  const out = [];
  const now = new Date();
  for (let i = n - 1; i >= 0; i -= 1) {
    const x = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
    out.push(toISODateLocal(x));
  }
  return out;
}

  //  SECTION: Activity log descriptions
function activityGlyph(type) {
  const map = {
    task_created: { icon: "fa-plus-circle", tone: "analytics-glyph--create" },
    task_completed: { icon: "fa-check-circle", tone: "analytics-glyph--done" },
    task_reopened: { icon: "fa-rotate-left", tone: "analytics-glyph--reopen" },
    task_deleted: { icon: "fa-trash", tone: "analytics-glyph--delete" },
    time_logged: { icon: "fa-stopwatch", tone: "analytics-glyph--time" },
    focus_set: { icon: "fa-bullseye", tone: "analytics-glyph--focus" },
    day_cleared: { icon: "fa-eraser", tone: "analytics-glyph--clear" },
  };
  return map[type] || { icon: "fa-circle", tone: "analytics-glyph--default" };
}

function describeActivityEntry(e) {
  const title = typeof e.title === "string" ? e.title : "";
  switch (e.type) {
    case "task_created":
      return `Created “${title}” on ${e.dateISO || "—"}`;
    case "task_completed":
      return `Completed “${title}”`;
    case "task_reopened":
      return `Reopened “${title}”`;
    case "task_deleted":
      return `Deleted “${title}”`;
    case "time_logged":
      return `Logged ${formatHumanDurationShort(typeof e.seconds === "number" ? e.seconds : 0)} on “${title}”`;
    case "focus_set":
      return `Set focus to “${title}”`;
    case "day_cleared":
      return `Cleared ${typeof e.count === "number" ? e.count : 0} task(s) on ${e.dateISO || "—"}`;
    default:
      return String(e.type || "Event");
  }
}

/* ==========================================================================
   SECTION: Task flattening
   ========================================================================== */
function flattenTasksWithDates(tasksByDate) {
  const all = [];
  Object.entries(tasksByDate).forEach(([dateISO, tasks]) => {
    if (!Array.isArray(tasks)) return;
    tasks.forEach((task) => {
      all.push({ ...task, __date: dateISO });
    });
  });
  return all;
}

/**
 * analytics-page.js — Analytics dashboard (analytics.html)
 * Requires: planner-common.js (loaded first)
 *
 * SECTION INDEX (search for "SECTION:"):
 *   SECTION: Theme key
 *   SECTION: renderAnalyticsPage (stats, charts, table, feed)
 *   SECTION: DOMContentLoaded — theme, refresh, startup
 */

  //  SECTION: Theme key
  
const THEME_STORAGE_KEY = "smartPlannerTheme";

  //  SECTION: renderAnalyticsPage (stats, charts, table, feed)
function renderAnalyticsPage() {
  const analyticsAllTotalEl = document.getElementById("analyticsAllTotal");
  const analyticsCompletedAllEl = document.getElementById("analyticsCompletedAll");
  const analyticsPendingAllEl = document.getElementById("analyticsPendingAll");
  const analyticsTimeTotalEl = document.getElementById("analyticsTimeTotal");
  const analyticsActiveDaysEl = document.getElementById("analyticsActiveDays");
  const analyticsTrackedTasksEl = document.getElementById("analyticsTrackedTasks");
  const analyticsDayBars = document.getElementById("analyticsDayBars");
  const analyticsCategoryBars = document.getElementById("analyticsCategoryBars");
  const analyticsTableBody = document.getElementById("analyticsTableBody");
  const analyticsActivityFeed = document.getElementById("analyticsActivityFeed");

  const tasksByDate = loadAllTasks();
  const all = flattenTasksWithDates(tasksByDate);
  const total = all.length;
  const completed = all.filter((t) => t.completed).length;
  const pending = total - completed;
  const timeTotalSec = all.reduce(
    (s, t) => s + (typeof t.loggedSeconds === "number" ? t.loggedSeconds : 0),
    0,
  );
  const byDate = {};
  all.forEach((t) => {
    byDate[t.__date] = (byDate[t.__date] || 0) + 1;
  });
  const activeDays = Object.keys(byDate).length;
  const withTime = all.filter((t) => (typeof t.loggedSeconds === "number" ? t.loggedSeconds : 0) > 0).length;

  if (analyticsAllTotalEl) analyticsAllTotalEl.textContent = String(total);
  if (analyticsCompletedAllEl) analyticsCompletedAllEl.textContent = String(completed);
  if (analyticsPendingAllEl) analyticsPendingAllEl.textContent = String(pending);
  if (analyticsTimeTotalEl) analyticsTimeTotalEl.textContent = formatTrackedDuration(timeTotalSec);
  if (analyticsActiveDaysEl) analyticsActiveDaysEl.textContent = String(activeDays);
  if (analyticsTrackedTasksEl) analyticsTrackedTasksEl.textContent = String(withTime);

  /* --- Category breakdown bars --- */
  if (analyticsCategoryBars) {
    analyticsCategoryBars.innerHTML = "";
    const catCount = {};
    all.forEach((t) => {
      const c = t.category || "General";
      catCount[c] = (catCount[c] || 0) + 1;
    });
    const sorted = Object.entries(catCount).sort((a, b) => b[1] - a[1]);
    const maxCat = Math.max(1, ...sorted.map(([, v]) => v));
    if (sorted.length === 0) {
      const p = document.createElement("p");
      p.className = "text-muted small mb-0";
      p.textContent = "No tasks yet.";
      analyticsCategoryBars.appendChild(p);
    } else {
      sorted.forEach(([cat, count]) => {
        const pct = Math.round((count / maxCat) * 100);
        const row = document.createElement("div");
        row.className = "analytics-cat-row";
        const labelRow = document.createElement("div");
        labelRow.className = "analytics-cat-label";
        const name = document.createElement("span");
        name.textContent = cat;
        const snum = document.createElement("span");
        snum.className = "analytics-cat-num";
        snum.textContent = String(count);
        labelRow.appendChild(name);
        labelRow.appendChild(snum);
        const track = document.createElement("div");
        track.className = "analytics-bar-track";
        const fill = document.createElement("div");
        fill.className = "analytics-bar-fill";
        fill.style.width = `${pct}%`;
        track.appendChild(fill);
        row.appendChild(labelRow);
        row.appendChild(track);
        analyticsCategoryBars.appendChild(row);
      });
    }
  }

  /* --- Last 14 days bar chart --- */
  if (analyticsDayBars) {
    analyticsDayBars.innerHTML = "";
    const days = getLastNDaysISO(14);
    const maxDay = Math.max(1, ...days.map((d) => byDate[d] || 0));
    const grid = document.createElement("div");
    grid.className = "analytics-day-grid";
    const todayISO = getTodayISO();
    days.forEach((iso) => {
      const c = byDate[iso] || 0;
      const col = document.createElement("div");
      col.className = "analytics-day-col";
      const wrap = document.createElement("div");
      wrap.className = "analytics-day-bar-wrap";
      wrap.title = `${iso}: ${c} task(s)`;
      const bar = document.createElement("div");
      bar.className = "analytics-day-bar" + (iso === todayISO ? " analytics-day-bar--today" : "");
      const h = Math.max(c > 0 ? 4 : 2, Math.round((c / maxDay) * 72));
      bar.style.height = `${h}px`;
      wrap.appendChild(bar);
      const lab = document.createElement("span");
      lab.className = "analytics-day-label";
      lab.textContent = parseISODateLocal(iso).toLocaleDateString(undefined, { weekday: "narrow" });
      col.appendChild(wrap);
      col.appendChild(lab);
      grid.appendChild(col);
    });
    analyticsDayBars.appendChild(grid);
  }

  /* --- All tasks table --- */
  if (analyticsTableBody) {
    analyticsTableBody.innerHTML = "";
    const sortedTasks = all.slice().sort((a, b) => {
      if (a.__date !== b.__date) return b.__date.localeCompare(a.__date);
      const ca = typeof a.createdAt === "number" ? a.createdAt : 0;
      const cb = typeof b.createdAt === "number" ? b.createdAt : 0;
      return cb - ca;
    });
    if (sortedTasks.length === 0) {
      const tr = document.createElement("tr");
      const td = document.createElement("td");
      td.colSpan = 6;
      td.className = "text-muted small";
      td.textContent = "No tasks stored yet.";
      tr.appendChild(td);
      analyticsTableBody.appendChild(tr);
    } else {
      sortedTasks.forEach((t) => {
        const tr = document.createElement("tr");
        const logged = typeof t.loggedSeconds === "number" ? t.loggedSeconds : 0;

        const tdDate = document.createElement("td");
        tdDate.className = "small";
        tdDate.textContent = t.__date;

        const tdTime = document.createElement("td");
        tdTime.className = "small";
        tdTime.textContent = t.time || "—";

        const tdTitle = document.createElement("td");
        tdTitle.className = "small fw-semibold";
        tdTitle.textContent = t.title;

        const tdCat = document.createElement("td");
        tdCat.className = "small";
        const badge = document.createElement("span");
        badge.className = "badge rounded-pill analytics-badge-cat";
        badge.textContent = t.category || "General";
        tdCat.appendChild(badge);

        const tdDone = document.createElement("td");
        tdDone.className = "small";
        if (t.completed) {
          const sp = document.createElement("span");
          sp.className = "text-success";
          sp.textContent = "Done";
          tdDone.appendChild(sp);
        } else {
          const sp = document.createElement("span");
          sp.className = "text-muted";
          sp.textContent = "Open";
          tdDone.appendChild(sp);
        }

        const tdLogged = document.createElement("td");
        tdLogged.className = "small font-monospace analytics-table-mono";
        tdLogged.textContent = logged > 0 ? formatTrackedDuration(logged) : "—";

        tr.appendChild(tdDate);
        tr.appendChild(tdTime);
        tr.appendChild(tdTitle);
        tr.appendChild(tdCat);
        tr.appendChild(tdDone);
        tr.appendChild(tdLogged);
        analyticsTableBody.appendChild(tr);
      });
    }
  }

  /* --- Activity log feed --- */
  if (analyticsActivityFeed) {
    analyticsActivityFeed.innerHTML = "";
    const log = loadActivityLog();
    if (log.length === 0) {
      const li = document.createElement("li");
      li.className = "analytics-feed-empty text-muted small";
      li.textContent =
        "No events yet. Add tasks, run timers, complete items, and use focus—the history builds here.";
      analyticsActivityFeed.appendChild(li);
    } else {
      log.slice(0, 100).forEach((e) => {
        const li = document.createElement("li");
        li.className = "analytics-feed-item";
        const g = activityGlyph(e.type);
        const iconWrap = document.createElement("span");
        iconWrap.className = `analytics-feed-icon ${g.tone}`;
        const ic = document.createElement("i");
        ic.className = `fa-solid ${g.icon}`;
        iconWrap.appendChild(ic);
        const body = document.createElement("div");
        body.className = "analytics-feed-body";
        const line = document.createElement("div");
        line.className = "analytics-feed-msg small";
        line.textContent = describeActivityEntry(e);
        const meta = document.createElement("div");
        meta.className = "analytics-feed-when text-muted small";
        meta.textContent = new Date(e.t).toLocaleString(undefined, {
          month: "short",
          day: "numeric",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        });
        body.appendChild(line);
        body.appendChild(meta);
        li.appendChild(iconWrap);
        li.appendChild(body);
        analyticsActivityFeed.appendChild(li);
      });
    }
  }
}

  //  SECTION: DOMContentLoaded — theme, refresh, startup
document.addEventListener("DOMContentLoaded", () => {
  const themeToggleBtn = document.getElementById("themeToggleBtn");
  const sidebarSelectedDateLabel = document.getElementById("sidebarSelectedDateLabel");
  const analyticsRefreshBtn = document.getElementById("analyticsRefreshBtn");

  function applyTheme(theme) {
    const isDark = theme === "dark";
    document.body.classList.toggle("dark-mode", isDark);
    localStorage.setItem(THEME_STORAGE_KEY, isDark ? "dark" : "light");

    if (themeToggleBtn) {
      const icon = themeToggleBtn.querySelector("i");
      if (icon) {
        icon.className = isDark ? "fa-regular fa-sun" : "fa-regular fa-moon";
      }
      themeToggleBtn.setAttribute("aria-label", isDark ? "Switch to light mode" : "Switch to dark mode");
      themeToggleBtn.title = isDark ? "Light mode" : "Dark mode";
    }
  }

  applyTheme(localStorage.getItem(THEME_STORAGE_KEY) === "dark" ? "dark" : "light");

  if (themeToggleBtn) {
    themeToggleBtn.addEventListener("click", () => {
      const isDark = document.body.classList.contains("dark-mode");
      applyTheme(isDark ? "light" : "dark");
    });
  }

  if (sidebarSelectedDateLabel) {
    sidebarSelectedDateLabel.textContent = formatReadableDate(getTodayISO());
  }

  renderAnalyticsPage();

  if (analyticsRefreshBtn) {
    analyticsRefreshBtn.addEventListener("click", () => {
      renderAnalyticsPage();
    });
  }

  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") {
      renderAnalyticsPage();
    }
  });
});

/**
 * app.js — Planner dashboard logic (planner.html)
 * Requires: planner-common.js (loaded first)
 *
 * SECTION INDEX (search for "SECTION:"):
 *   SECTION: Constants & activity persistence
 *   SECTION: Helpers (dates, timer, formatting)
 *   SECTION: DOMContentLoaded — init & state
 *   SECTION: URL routing & sidebar sync
 *   SECTION: Theme toggle
 *   SECTION: Task CRUD & storage
 *   SECTION: Views & filters
 *   SECTION: Render task list
 *   SECTION: Time tracking (start / pause)
 *   SECTION: Focus task
 *   SECTION: Event listeners
 *   SECTION: Startup
 */

  //  SECTION: Constants & activity persistence
const THEME_STORAGE_KEY = "smartPlannerTheme";
const ACTIVE_TIMER_KEY = "smartPlannerActiveTimer";
const ALLOWED_VIEWS = new Set(["today", "inbox", "upcoming", "meetings", "design"]);

/**
 * @param {Record<string, unknown>} entry
 */
function appendActivity(entry) {
  const row = {
    id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    t: Date.now(),
    ...entry,
  };
  const log = loadActivityLog();
  log.unshift(row);
  localStorage.setItem(ACTIVITY_LOG_KEY, JSON.stringify(log.slice(0, ACTIVITY_LOG_MAX)));
}

function saveAllTasks(tasksByDate) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tasksByDate));
}

function generateId() {
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

  //  SECTION: Helpers (dates, timer, formatting)
function formatSubheading(isoDate) {
  const todayISO = getTodayISO();
  if (isoDate === todayISO) return "Today";
  const d = startOfLocalDay(parseISODateLocal(isoDate));
  const today = startOfLocalDay(parseISODateLocal(todayISO));
  const diffDays = Math.round((d - today) / (1000 * 60 * 60 * 24));
  if (diffDays === 1) return "Tomorrow";
  if (diffDays === -1) return "Yesterday";
  return d.toLocaleDateString();
}

function formatTaskMeta(isoDate, timeText) {
  const date = parseISODateLocal(isoDate);
  const datePart = date.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
  if (timeText) return `${datePart} · ${timeText}`;
  return `${datePart} · 30 m`;
}

function readActiveTimer() {
  try {
    const raw = localStorage.getItem(ACTIVE_TIMER_KEY);
    if (!raw) return null;
    const o = JSON.parse(raw);
    if (o && typeof o.taskId === "string" && typeof o.segmentStart === "number") {
      return { taskId: o.taskId, segmentStart: o.segmentStart };
    }
  } catch (e) {
    console.error("Failed to read active timer", e);
  }
  return null;
}

function writeActiveTimer(state) {
  if (!state) {
    localStorage.removeItem(ACTIVE_TIMER_KEY);
    return;
  }
  localStorage.setItem(ACTIVE_TIMER_KEY, JSON.stringify(state));
}

  //  SECTION: DOMContentLoaded — init & state
document.addEventListener("DOMContentLoaded", () => {
  const datePicker = document.getElementById("datePicker");
  const todayBtn = document.getElementById("todayBtn");
  const taskForm = document.getElementById("taskForm");
  const taskTitleInput = document.getElementById("taskTitle");
  const taskTimeInput = document.getElementById("taskTime");
  const taskCategorySelect = document.getElementById("taskCategory");
  const taskList = document.getElementById("taskList");
  const emptyState = document.getElementById("emptyState");
  const clearDayBtn = document.getElementById("clearDayBtn");
  const selectedDateHeading = document.getElementById("selectedDateHeading");
  const selectedDateSubheading = document.getElementById("selectedDateSubheading");
  const taskCountBadge = document.getElementById("taskCountBadge");
  const filterButtons = document.querySelectorAll("[data-filter]");
  const viewButtons = document.querySelectorAll(".sidebar-item[data-view]");
  const openAddTaskModalLink = document.getElementById("openAddTaskModalLink");
  const sidebarDatePicker = document.getElementById("sidebarDatePicker");
  const sidebarSelectedDateLabel = document.getElementById("sidebarSelectedDateLabel");
  const themeToggleBtn = document.getElementById("themeToggleBtn");
  const quickAddTaskBtn = document.getElementById("quickAddTaskBtn");
  const modalTaskForm = document.getElementById("modalTaskForm");
  const modalTaskTitle = document.getElementById("modalTaskTitle");
  const modalTaskDate = document.getElementById("modalTaskDate");
  const modalTaskTime = document.getElementById("modalTaskTime");
  const modalTaskCategory = document.getElementById("modalTaskCategory");
  const modalTaskPlacement = document.getElementById("modalTaskPlacement");
  const addTaskModalEl = document.getElementById("addTaskModal");
  const focusTaskText = document.getElementById("focusTaskText");
  const focusInfo = document.getElementById("focusInfo");
  const totalTasksStat = document.getElementById("totalTasksStat");
  const completedTasksStat = document.getElementById("completedTasksStat");
  const progressStat = document.getElementById("progressStat");

  let tasksByDate = loadAllTasks();
  let currentDate = getTodayISO();
  let currentFilter = "all";
  let currentView = "today";
  let timerDisplayInterval = null;
  const hasSidebarDatepicker = !!sidebarDatePicker && typeof window.$ === "function";
  const addTaskModal = addTaskModalEl && window.bootstrap ? new window.bootstrap.Modal(addTaskModalEl) : null;

  function isValidISODate(value) {
    return /^\d{4}-\d{2}-\d{2}$/.test(value);
  }

  /* --- URL routing & sidebar sync --- */
  function applyStateFromUrl() {
    const params = new URLSearchParams(window.location.search);
    const view = params.get("view");
    const date = params.get("date");

    currentView = ALLOWED_VIEWS.has(view) ? view : "today";
    currentDate = isValidISODate(date || "") ? date : getTodayISO();
  }

  function syncUrl(push = false) {
    const url = new URL(window.location.href);
    url.searchParams.set("view", currentView);

    // Keep date in URL to make view state shareable/reload-safe.
    url.searchParams.set("date", currentDate);

    const method = push ? "pushState" : "replaceState";
    window.history[method]({}, "", url);
  }

  function syncSidebarLabel() {
    if (!sidebarSelectedDateLabel) return;
    sidebarSelectedDateLabel.textContent = formatReadableDate(currentDate);
  }

  function syncSidebarPickerFromCurrentDate() {
    if (!hasSidebarDatepicker) return;
    // bootstrap-datepicker expects yyyy-mm-dd when `format` is set.
    window.$(sidebarDatePicker).datepicker("update", currentDate);
  }

  function getTomorrowISO() {
    const d = parseISODateLocal(getTodayISO());
    d.setDate(d.getDate() + 1);
    return toISODateLocal(d);
  }

  function openAddTaskModal() {
    if (!addTaskModal || !modalTaskTitle || !modalTaskDate) return;
    modalTaskTitle.value = "";
    modalTaskDate.value = currentDate || getTodayISO();
    if (modalTaskTime) modalTaskTime.value = "";
    if (modalTaskCategory) modalTaskCategory.value = "Planning";
    if (modalTaskPlacement) modalTaskPlacement.value = currentView || "today";
    addTaskModal.show();
    setTimeout(() => modalTaskTitle.focus(), 100);
  }

  function createTask({ title, time, category, dateISO }) {
    const tasks = getTasksForDate(dateISO);
    const newTask = {
      id: generateId(),
      title,
      time,
      category,
      completed: false,
      focus: false,
      createdAt: Date.now(),
      loggedSeconds: 0,
    };
    tasks.push(newTask);
    setTasksForDate(dateISO, tasks);
    appendActivity({
      type: "task_created",
      taskId: newTask.id,
      title: newTask.title,
      dateISO,
      category: newTask.category,
    });
  }

  /* --- Theme toggle --- */
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

  function toggleTheme() {
    const isDark = document.body.classList.contains("dark-mode");
    applyTheme(isDark ? "light" : "dark");
  }

  applyStateFromUrl();
  datePicker.value = currentDate;
  applyTheme(localStorage.getItem(THEME_STORAGE_KEY) === "dark" ? "dark" : "light");

  /* --- Task CRUD & storage --- */
  function getTasksForDate(dateISO) {
    return tasksByDate[dateISO] || [];
  }

  function setTasksForDate(dateISO, tasks) {
    tasksByDate[dateISO] = tasks;
    saveAllTasks(tasksByDate);
  }

  function findDateForTaskId(taskId) {
    for (const dateISO of Object.keys(tasksByDate)) {
      if ((tasksByDate[dateISO] || []).some((t) => t.id === taskId)) return dateISO;
    }
    return null;
  }

  function findTaskById(taskId) {
    for (const tasks of Object.values(tasksByDate)) {
      const t = tasks.find((x) => x.id === taskId);
      if (t) return t;
    }
    return null;
  }

  function getDisplayedSecondsForTask(taskId) {
    const task = findTaskById(taskId);
    if (!task) return 0;
    const base = typeof task.loggedSeconds === "number" ? task.loggedSeconds : 0;
    const active = readActiveTimer();
    if (active && active.taskId === taskId) {
      return base + Math.floor((Date.now() - active.segmentStart) / 1000);
    }
    return base;
  }

  /* --- Time tracking (start / pause) — see also readActiveTimer above --- */
  function commitActiveSegment() {
    const state = readActiveTimer();
    if (!state) return;
    const dateISO = findDateForTaskId(state.taskId);
    if (!dateISO) {
      writeActiveTimer(null);
      if (timerDisplayInterval) {
        clearInterval(timerDisplayInterval);
        timerDisplayInterval = null;
      }
      return;
    }
    const add = Math.floor((Date.now() - state.segmentStart) / 1000);
    if (add > 0) {
      const taskSnap = findTaskById(state.taskId);
      const tasks = getTasksForDate(dateISO).map((t) =>
        t.id === state.taskId
          ? { ...t, loggedSeconds: (typeof t.loggedSeconds === "number" ? t.loggedSeconds : 0) + add }
          : t,
      );
      setTasksForDate(dateISO, tasks);
      if (taskSnap) {
        appendActivity({
          type: "time_logged",
          seconds: add,
          title: taskSnap.title,
          taskId: state.taskId,
          dateISO,
        });
      }
    }
    writeActiveTimer(null);
    if (timerDisplayInterval) {
      clearInterval(timerDisplayInterval);
      timerDisplayInterval = null;
    }
  }

  function clearActiveTimerForTask(taskId) {
    const state = readActiveTimer();
    if (state && state.taskId === taskId) {
      writeActiveTimer(null);
      if (timerDisplayInterval) {
        clearInterval(timerDisplayInterval);
        timerDisplayInterval = null;
      }
    }
  }

  function startTaskTimer(taskId) {
    if (!findTaskById(taskId)) return;
    commitActiveSegment();
    writeActiveTimer({ taskId, segmentStart: Date.now() });
    scheduleTimerTick();
    renderTasks();
  }

  function pauseTaskTimer() {
    commitActiveSegment();
    renderTasks();
  }

  function scheduleTimerTick() {
    if (timerDisplayInterval) {
      clearInterval(timerDisplayInterval);
      timerDisplayInterval = null;
    }
    if (!readActiveTimer()) return;
    timerDisplayInterval = setInterval(() => {
      updateActiveTimerDisplays();
    }, 1000);
  }

  function updateActiveTimerDisplays() {
    const state = readActiveTimer();
    if (!state) return;
    const el = document.getElementById(`task-timer-display-${state.taskId}`);
    if (el) {
      el.textContent = formatTrackedDuration(getDisplayedSecondsForTask(state.taskId));
    }
  }

  function getAllTasksWithDate() {
    const all = [];
    Object.entries(tasksByDate).forEach(([dateISO, tasks]) => {
      tasks.forEach((task) => {
        all.push({ ...task, __date: dateISO });
      });
    });
    return all;
  }

  /* --- Views & filters --- */
  function getTasksForCurrentView() {
    const todayISO = getTodayISO();
    const all = getAllTasksWithDate();

    switch (currentView) {
      case "today":
        return getTasksForDate(currentDate).map((task) => ({ ...task, __date: currentDate }));
      case "inbox":
        return all;
      case "upcoming":
        return all.filter((task) => task.__date > todayISO);
      case "meetings":
        return all.filter((task) => (task.category || "").toLowerCase() === "meetings");
      case "design":
        return all.filter((task) => (task.category || "").toLowerCase() === "design");
      default:
        return getTasksForDate(currentDate).map((task) => ({ ...task, __date: currentDate }));
    }
  }

  function mutateTaskById(taskId, updater) {
    Object.keys(tasksByDate).forEach((dateISO) => {
      const updated = tasksByDate[dateISO].map((task) => (task.id === taskId ? updater(task, dateISO) : task));
      tasksByDate[dateISO] = updated;
    });
    saveAllTasks(tasksByDate);
  }

  function getViewTitle() {
    switch (currentView) {
      case "today":
        return formatReadableDate(currentDate);
      case "inbox":
        return "Inbox";
      case "upcoming":
        return "Upcoming";
      case "meetings":
        return "Meetings";
      case "design":
        return "Design";
      default:
        return formatReadableDate(currentDate);
    }
  }

  function getViewSubtitle() {
    switch (currentView) {
      case "today":
        return formatSubheading(currentDate);
      case "inbox":
        return "All plans";
      case "upcoming":
        return "Plans after today";
      case "meetings":
        return "Meeting-related plans";
      case "design":
        return "Design-related plans";
      default:
        return formatSubheading(currentDate);
    }
  }

  function isDateScopedView() {
    return currentView === "today";
  }

  function updateViewUIState() {
    viewButtons.forEach((button) => {
      const isActive = button.getAttribute("data-view") === currentView;
      button.classList.toggle("active", isActive);
    });

    if (clearDayBtn) {
      clearDayBtn.disabled = !isDateScopedView();
      clearDayBtn.title = isDateScopedView() ? "" : "Switch to Today to clear by day";
    }
  }

  /* --- Render task list --- */
  function renderTasks() {
    const tasks = getTasksForCurrentView();
    const completedCount = tasks.filter((t) => t.completed).length;
    const progressValue = tasks.length === 0 ? 0 : Math.round((completedCount / tasks.length) * 100);
    const filtered = tasks.filter((t) => {
      if (currentFilter === "pending") return !t.completed;
      if (currentFilter === "done") return t.completed;
      return true;
    });

    taskList.innerHTML = "";

    if (filtered.length === 0) {
      emptyState.classList.remove("d-none");
      emptyState.textContent = "No tasks yet for this day. Add your first task above.";
    } else {
      emptyState.classList.add("d-none");
    }

    filtered
      .slice()
      .sort((a, b) => {
        if (a.__date !== b.__date) return a.__date.localeCompare(b.__date);
        if (!a.time && !b.time) return 0;
        if (!a.time) return 1;
        if (!b.time) return -1;
        return a.time.localeCompare(b.time);
      })
      .forEach((task) => {
        const li = document.createElement("li");
        li.className =
          "list-group-item planner-task-row d-flex justify-content-between align-items-start py-2 px-3 small";
        if (task.completed) {
          li.classList.add("completed");
        }

        const left = document.createElement("div");
        left.className = "d-flex align-items-center gap-2";

        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.className = "form-check-input mt-0";
        checkbox.checked = !!task.completed;
        checkbox.addEventListener("change", () => {
          toggleTaskCompletion(task.id);
        });

        const content = document.createElement("div");

        const titleRow = document.createElement("div");
        titleRow.className = "d-flex align-items-center gap-2";

        const titleSpan = document.createElement("span");
        titleSpan.className = "fw-semibold";
        titleSpan.textContent = task.title;

        const categoryBadge = document.createElement("span");
        categoryBadge.className = "badge bg-secondary badge-category";
        categoryBadge.textContent = `# ${task.category || "General"}`;

        titleRow.appendChild(titleSpan);
        titleRow.appendChild(categoryBadge);
        content.appendChild(titleRow);

        const meta = document.createElement("div");
        meta.className = "text-secondary small d-flex align-items-center gap-1";
        meta.innerHTML = `<i class="fa-regular fa-calendar"></i><span>${formatTaskMeta(task.__date, task.time)}</span>`;
        content.appendChild(meta);

        const timerRow = document.createElement("div");
        timerRow.className = "task-timer-row d-flex flex-wrap align-items-center gap-2 mt-1";

        const swIcon = document.createElement("i");
        swIcon.className = "fa-solid fa-stopwatch task-timer-icon";
        swIcon.setAttribute("aria-hidden", "true");

        const timeLabel = document.createElement("span");
        timeLabel.className = "task-timer-display small";
        timeLabel.id = `task-timer-display-${task.id}`;
        timeLabel.textContent = formatTrackedDuration(getDisplayedSecondsForTask(task.id));

        const activeTimer = readActiveTimer();
        const isRunning = !!(activeTimer && activeTimer.taskId === task.id);

        const timerBtn = document.createElement("button");
        timerBtn.type = "button";
        timerBtn.className = "btn btn-sm task-timer-btn";
        if (isRunning) {
          timerBtn.classList.add("btn-warning");
          timerBtn.innerHTML = '<i class="fa-solid fa-pause me-1" aria-hidden="true"></i>Pause';
          timerBtn.setAttribute("aria-label", "Pause time tracking for this task");
          timerBtn.addEventListener("click", () => pauseTaskTimer());
        } else {
          timerBtn.classList.add("btn-outline-success");
          timerBtn.innerHTML = '<i class="fa-solid fa-play me-1" aria-hidden="true"></i>Start';
          timerBtn.setAttribute("aria-label", "Start time tracking for this task");
          timerBtn.addEventListener("click", () => startTaskTimer(task.id));
        }

        if (task.completed && !isRunning) {
          timerBtn.disabled = true;
          timerBtn.classList.remove("btn-outline-success", "btn-warning");
          timerBtn.classList.add("btn-outline-secondary");
          timerBtn.innerHTML = '<i class="fa-solid fa-play me-1" aria-hidden="true"></i>Start';
          timerBtn.title = "Uncheck the task to track time";
        }

        if (isRunning) {
          timeLabel.classList.add("task-timer-display--active");
        }

        timerRow.appendChild(swIcon);
        timerRow.appendChild(timeLabel);
        timerRow.appendChild(timerBtn);
        content.appendChild(timerRow);

        left.appendChild(checkbox);
        left.appendChild(content);

        const right = document.createElement("div");
        right.className = "d-flex align-items-center gap-2 flex-shrink-0";

        const focusBtn = document.createElement("button");
        focusBtn.className = "btn btn-outline-info btn-xs btn-sm";
        focusBtn.textContent = "Focus";
        focusBtn.addEventListener("click", () => setFocusTask(task.id));

        const deleteBtn = document.createElement("button");
        deleteBtn.className = "btn btn-outline-danger btn-xs btn-sm";
        deleteBtn.textContent = "×";
        deleteBtn.setAttribute("aria-label", "Delete task");
        deleteBtn.addEventListener("click", () => deleteTask(task.id));

        right.appendChild(focusBtn);
        right.appendChild(deleteBtn);

        li.appendChild(left);
        li.appendChild(right);

        taskList.appendChild(li);
      });

    taskCountBadge.textContent = `${tasks.length} task${tasks.length === 1 ? "" : "s"}`;
    if (totalTasksStat) totalTasksStat.textContent = String(tasks.length);
    if (completedTasksStat) completedTasksStat.textContent = String(completedCount);
    if (progressStat) progressStat.textContent = `${progressValue}%`;
    updateFocusInfo();
    syncSidebarLabel();
  }

  function addTask() {
    const title = taskTitleInput.value.trim();
    if (!title) return;

    const time = taskTimeInput.value || "";
    const category = taskCategorySelect.value || "General";
    createTask({ title, time, category, dateISO: currentDate });
    taskTitleInput.value = "";
    renderTasks();
  }

  function deleteTask(id) {
    const snap = findTaskById(id);
    const dateISO = findDateForTaskId(id);
    clearActiveTimerForTask(id);
    Object.keys(tasksByDate).forEach((dateKey) => {
      tasksByDate[dateKey] = tasksByDate[dateKey].filter((t) => t.id !== id);
    });
    saveAllTasks(tasksByDate);
    if (snap) {
      appendActivity({
        type: "task_deleted",
        taskId: id,
        title: snap.title,
        dateISO: dateISO || undefined,
      });
    }
    renderTasks();
  }

  function toggleTaskCompletion(id) {
    const before = findTaskById(id);
    if (!before) return;
    const dateForTask = findDateForTaskId(id);
    const state = readActiveTimer();
    if (state && state.taskId === id) {
      commitActiveSegment();
    }
    const wasCompleted = !!before?.completed;
    mutateTaskById(id, (task) => ({ ...task, completed: !task.completed }));
    if (before) {
      appendActivity({
        type: !wasCompleted ? "task_completed" : "task_reopened",
        taskId: id,
        title: before.title,
        dateISO: dateForTask || undefined,
      });
    }
    renderTasks();
  }

  function setFocusTask(id) {
    const sourceTask = getAllTasksWithDate().find((task) => task.id === id);
    if (!sourceTask) return;

    const targetDate = sourceTask.__date;
    const tasks = getTasksForDate(targetDate).map((task) => ({
      ...task,
      focus: task.id === id,
    }));
    setTasksForDate(targetDate, tasks);
    appendActivity({
      type: "focus_set",
      taskId: id,
      title: sourceTask.title,
      dateISO: targetDate,
    });
    renderTasks();
  }

  /* --- Focus task --- */
  function getFocusTask() {
    return getTasksForDate(currentDate).find((t) => t.focus);
  }

  function updateFocusInfo() {
    const focusTask = getFocusTask();
    if (focusTask) {
      focusTaskText.textContent = focusTask.title;
      focusTaskText.classList.remove("text-secondary");
      focusInfo.textContent = "1 focus task";
    } else {
      focusTaskText.textContent = "No focus task yet.";
      focusTaskText.classList.add("text-secondary");
      focusInfo.textContent = "";
    }
  }

  function updateHeader() {
    selectedDateHeading.textContent = getViewTitle();
    selectedDateSubheading.textContent = getViewSubtitle();
    updateViewUIState();
  }

  /* ==========================================================================
     SECTION: Event listeners
     ========================================================================== */
  taskForm.addEventListener("submit", (e) => {
    e.preventDefault();
    addTask();
  });

  if (quickAddTaskBtn) {
    quickAddTaskBtn.addEventListener("click", () => {
      openAddTaskModal();
    });
  }

  if (openAddTaskModalLink) {
    openAddTaskModalLink.addEventListener("click", (e) => {
      e.preventDefault();
      openAddTaskModal();
    });
  }

  if (modalTaskForm) {
    modalTaskForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const title = modalTaskTitle?.value.trim() || "";
      if (!title) return;

      const placement = modalTaskPlacement?.value || "today";
      let dateISO = modalTaskDate?.value || currentDate || getTodayISO();
      let category = modalTaskCategory?.value || "Planning";
      const time = modalTaskTime?.value || "";

      if (placement === "upcoming" && dateISO <= getTodayISO()) {
        dateISO = getTomorrowISO();
      }
      if (placement === "meetings") category = "Meetings";
      if (placement === "design") category = "Design";

      createTask({ title, time, category, dateISO });

      currentDate = dateISO;
      currentView = placement === "planning" ? "inbox" : placement;
      if (!ALLOWED_VIEWS.has(currentView)) currentView = "today";
      datePicker.value = currentDate;
      syncSidebarPickerFromCurrentDate();
      updateHeader();
      syncUrl();
      renderTasks();
      addTaskModal?.hide();
    });
  }

  datePicker.addEventListener("change", () => {
    currentDate = datePicker.value || getTodayISO();
    currentView = "today";
    updateHeader();
    syncSidebarPickerFromCurrentDate();
    syncUrl();
    renderTasks();
  });

  clearDayBtn.addEventListener("click", () => {
    if (!isDateScopedView()) return;
    if (!confirm("Clear all tasks for this day?")) return;
    const state = readActiveTimer();
    if (state) {
      const d = findDateForTaskId(state.taskId);
      if (d === currentDate) {
        writeActiveTimer(null);
        if (timerDisplayInterval) {
          clearInterval(timerDisplayInterval);
          timerDisplayInterval = null;
        }
      }
    }
    const clearedCount = getTasksForDate(currentDate).length;
    setTasksForDate(currentDate, []);
    if (clearedCount > 0) {
      appendActivity({
        type: "day_cleared",
        dateISO: currentDate,
        count: clearedCount,
      });
    }
    renderTasks();
  });

  filterButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      filterButtons.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      currentFilter = btn.getAttribute("data-filter");
      renderTasks();
    });
  });

  viewButtons.forEach((button) => {
    button.addEventListener("click", (e) => {
      e.preventDefault();
      const nextView = button.getAttribute("data-view");
      if (!nextView) return;

      currentView = nextView;
      if (currentView === "today") {
        currentDate = getTodayISO();
        datePicker.value = currentDate;
        syncSidebarPickerFromCurrentDate();
      }
      updateHeader();
      syncUrl(true);
      renderTasks();
    });
  });

  if (hasSidebarDatepicker) {
    window.$(sidebarDatePicker).datepicker({
      format: "yyyy-mm-dd",
      weekStart: 1,
      autoclose: true,
      todayHighlight: true,
    });

    // Initialize to currentDate
    window.$(sidebarDatePicker).datepicker("update", currentDate);
    syncSidebarLabel();

    window.$(sidebarDatePicker).on("changeDate", (e) => {
      // e.format is provided by bootstrap-datepicker.
      const next = e.format ? e.format("yyyy-mm-dd") : currentDate;
      currentDate = next || getTodayISO();
      currentView = "today";
      datePicker.value = currentDate;
      updateHeader();
      syncUrl();
      renderTasks();
    });
  } else {
    // Graceful fallback if jQuery/datepicker didn't load.
    syncSidebarLabel();
  }

  if (themeToggleBtn) {
    themeToggleBtn.addEventListener("click", toggleTheme);
  }

  window.addEventListener("popstate", () => {
    applyStateFromUrl();
    datePicker.value = currentDate;
    syncSidebarPickerFromCurrentDate();
    updateHeader();
    renderTasks();
    if (readActiveTimer()) {
      scheduleTimerTick();
    }
  });

  function ensureActiveTimerConsistency() {
    const state = readActiveTimer();
    if (!state) return;
    if (!findTaskById(state.taskId)) {
      writeActiveTimer(null);
      if (timerDisplayInterval) {
        clearInterval(timerDisplayInterval);
        timerDisplayInterval = null;
      }
    }
  }

  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") {
      commitActiveSegment();
      renderTasks();
    }
  });

  window.addEventListener("beforeunload", () => {
    commitActiveSegment();
  });

  //  SECTION: Startup
  ensureActiveTimerConsistency();
  updateHeader();
  syncUrl();
  renderTasks();
  if (readActiveTimer()) {
    scheduleTimerTick();
  }
});


// Simple localStorage-based planner

const STORAGE_KEY = "smartPlannerTasks";
const ALLOWED_VIEWS = new Set(["today", "inbox", "upcoming", "meetings", "design"]);

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

function loadAllTasks() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return typeof parsed === "object" && parsed !== null ? parsed : {};
  } catch (e) {
    console.error("Failed to parse tasks from localStorage", e);
    return {};
  }
}

function saveAllTasks(tasksByDate) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tasksByDate));
}

function generateId() {
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function formatReadableDate(isoDate) {
  const d = parseISODateLocal(isoDate);
  return d.toLocaleDateString(undefined, {
    weekday: "long",
    month: "short",
    day: "numeric",
  });
}

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
  const sidebarDatePicker = document.getElementById("sidebarDatePicker");
  const sidebarSelectedDateLabel = document.getElementById("sidebarSelectedDateLabel");
  const sidebarTodayBtn = document.getElementById("sidebarTodayBtn");
  const focusTaskText = document.getElementById("focusTaskText");
  const focusInfo = document.getElementById("focusInfo");
  const totalTasksStat = document.getElementById("totalTasksStat");
  const completedTasksStat = document.getElementById("completedTasksStat");
  const progressStat = document.getElementById("progressStat");

  let tasksByDate = loadAllTasks();
  let currentDate = getTodayISO();
  let currentFilter = "all";
  let currentView = "today";
  const hasSidebarDatepicker = !!sidebarDatePicker && typeof window.$ === "function";

  function isValidISODate(value) {
    return /^\d{4}-\d{2}-\d{2}$/.test(value);
  }

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

  applyStateFromUrl();
  datePicker.value = currentDate;

  function getTasksForDate(dateISO) {
    return tasksByDate[dateISO] || [];
  }

  function setTasksForDate(dateISO, tasks) {
    tasksByDate[dateISO] = tasks;
    saveAllTasks(tasksByDate);
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

        left.appendChild(checkbox);
        left.appendChild(content);

        const right = document.createElement("div");
        right.className = "d-flex align-items-center gap-2";

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

    const tasks = getTasksForDate(currentDate);
    const newTask = {
      id: generateId(),
      title,
      time,
      category,
      completed: false,
      focus: false,
      createdAt: Date.now(),
    };

    tasks.push(newTask);
    setTasksForDate(currentDate, tasks);
    taskTitleInput.value = "";
    renderTasks();
  }

  function deleteTask(id) {
    Object.keys(tasksByDate).forEach((dateISO) => {
      tasksByDate[dateISO] = tasksByDate[dateISO].filter((t) => t.id !== id);
    });
    saveAllTasks(tasksByDate);
    renderTasks();
  }

  function toggleTaskCompletion(id) {
    mutateTaskById(id, (task) => ({ ...task, completed: !task.completed }));
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
    renderTasks();
  }

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

  taskForm.addEventListener("submit", (e) => {
    e.preventDefault();
    addTask();
  });

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
    setTasksForDate(currentDate, []);
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

  if (sidebarTodayBtn) {
    sidebarTodayBtn.addEventListener("click", () => {
      currentDate = getTodayISO();
      currentView = "today";
      datePicker.value = currentDate;
      syncSidebarPickerFromCurrentDate();
      updateHeader();
      syncUrl();
      renderTasks();
    });
  }

  window.addEventListener("popstate", () => {
    applyStateFromUrl();
    datePicker.value = currentDate;
    syncSidebarPickerFromCurrentDate();
    updateHeader();
    renderTasks();
  });

  updateHeader();
  syncUrl();
  renderTasks();
});


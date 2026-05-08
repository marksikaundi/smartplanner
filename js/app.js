// Simple localStorage-based planner

const STORAGE_KEY = "smartPlannerTasks";

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
  const sidebarDatePicker = document.getElementById("sidebarDatePicker");
  const sidebarSelectedDateLabel = document.getElementById("sidebarSelectedDateLabel");
  const sidebarTodayBtn = document.getElementById("sidebarTodayBtn");
  const focusTaskText = document.getElementById("focusTaskText");
  const focusInfo = document.getElementById("focusInfo");

  let tasksByDate = loadAllTasks();
  let currentDate = getTodayISO();
  let currentFilter = "all";
  const hasSidebarDatepicker = !!sidebarDatePicker && typeof window.$ === "function";

  function syncSidebarLabel() {
    if (!sidebarSelectedDateLabel) return;
    sidebarSelectedDateLabel.textContent = formatReadableDate(currentDate);
  }

  function syncSidebarPickerFromCurrentDate() {
    if (!hasSidebarDatepicker) return;
    // bootstrap-datepicker expects yyyy-mm-dd when `format` is set.
    window.$(sidebarDatePicker).datepicker("update", currentDate);
  }

  datePicker.value = currentDate;

  function getTasksForDate(dateISO) {
    return tasksByDate[dateISO] || [];
  }

  function setTasksForDate(dateISO, tasks) {
    tasksByDate[dateISO] = tasks;
    saveAllTasks(tasksByDate);
  }

  function renderTasks() {
    const tasks = getTasksForDate(currentDate);
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
        if (!a.time && !b.time) return 0;
        if (!a.time) return 1;
        if (!b.time) return -1;
        return a.time.localeCompare(b.time);
      })
      .forEach((task) => {
        const li = document.createElement("li");
        li.className =
          "list-group-item d-flex justify-content-between align-items-start py-2 px-3 small";
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
        titleSpan.textContent = task.title;

        const categoryBadge = document.createElement("span");
        categoryBadge.className = "badge bg-secondary badge-category";
        categoryBadge.textContent = task.category || "General";

        titleRow.appendChild(titleSpan);
        titleRow.appendChild(categoryBadge);
        content.appendChild(titleRow);

        if (task.time) {
          const timeSpan = document.createElement("span");
          timeSpan.className = "text-secondary task-time d-inline-block";
          timeSpan.textContent = task.time;
          content.appendChild(timeSpan);
        }

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
    const tasks = getTasksForDate(currentDate).filter((t) => t.id !== id);
    setTasksForDate(currentDate, tasks);
    renderTasks();
  }

  function toggleTaskCompletion(id) {
    const tasks = getTasksForDate(currentDate).map((t) =>
      t.id === id ? { ...t, completed: !t.completed } : t
    );
    setTasksForDate(currentDate, tasks);
    renderTasks();
  }

  function setFocusTask(id) {
    const tasks = getTasksForDate(currentDate).map((t) => ({
      ...t,
      focus: t.id === id,
    }));
    setTasksForDate(currentDate, tasks);
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
    selectedDateHeading.textContent = formatReadableDate(currentDate);
    selectedDateSubheading.textContent = formatSubheading(currentDate);
  }

  taskForm.addEventListener("submit", (e) => {
    e.preventDefault();
    addTask();
  });

  datePicker.addEventListener("change", () => {
    currentDate = datePicker.value || getTodayISO();
    updateHeader();
    syncSidebarPickerFromCurrentDate();
    renderTasks();
  });

  todayBtn.addEventListener("click", () => {
    currentDate = getTodayISO();
    datePicker.value = currentDate;
    updateHeader();
    syncSidebarPickerFromCurrentDate();
    renderTasks();
  });

  clearDayBtn.addEventListener("click", () => {
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
      datePicker.value = currentDate;
      updateHeader();
      renderTasks();
    });
  } else {
    // Graceful fallback if jQuery/datepicker didn't load.
    syncSidebarLabel();
  }

  if (sidebarTodayBtn) {
    sidebarTodayBtn.addEventListener("click", () => {
      currentDate = getTodayISO();
      datePicker.value = currentDate;
      syncSidebarPickerFromCurrentDate();
      updateHeader();
      renderTasks();
    });
  }

  updateHeader();
  renderTasks();
});


# Smart Planner

<!-- SECTION: Overview — see Table of contents below for all sections -->

A **local-first**, browser-based daily task planner. Plan by date, organize work across views, track time on tasks, set a single focus item, and review analytics—all without sign-up or a backend. Data stays in your browser via `localStorage`.

---

## Table of contents

- [Overview](#overview)
- [Features](#features)
- [Pages](#pages)
- [Tech stack](#tech-stack)
- [Project structure](#project-structure)
- [Getting started](#getting-started)
- [How to use](#how-to-use)
- [Data & storage](#data--storage)
- [URL routing](#url-routing)
- [Analytics & activity log](#analytics--activity-log)
- [Browser support](#browser-support)
- [Development history](#development-history)
- [License](#license)

---

<!-- SECTION: Overview -->
## Overview

Smart Planner is a static web app with three main surfaces:

| Page | File | Purpose |
|------|------|---------|
| **Landing** | `index.html` | Marketing-style home: features, workflow, CTA to open the planner |
| **Planner** | `planner.html` | Main dashboard: tasks, views, timers, focus, stats |
| **Analytics** | `analytics.html` | All-time stats, charts, task table, activity feed |

The app is designed for **privacy and speed**: no accounts, no API calls for tasks, instant load, and optional light/dark theme in the planner and analytics.

---

<!-- SECTION: Features -->
## Features

### Landing page (`index.html`)

- Hero section with product preview mockup
- **Features** grid: date-first planning, multiple views, focus task, progress stats, filters, local storage
- **How it works** (3-step workflow)
- Call-to-action band and footer with links to planner and analytics
- Responsive navigation with mobile menu toggle
- SEO meta description

### Task planning (`planner.html`)

- **Date-first dashboard** — pick any day via sidebar date picker (Bootstrap Datepicker) or native date input; headings show “Today”, “Tomorrow”, “Yesterday”, or a formatted date
- **Inline quick-add form** — title, optional time, category (Meetings, Design, Planning, Personal)
- **Add Task modal** — full form with title, date, time, category, and “Show in” placement (Today, Inbox, Upcoming, Meetings, Design)
- **Sidebar views** with URL-backed state:
  - **Today** — tasks for the selected date
  - **Inbox** — all tasks across all dates
  - **Upcoming** — tasks on dates after today
  - **Meetings** — category filter: Meetings
  - **Design** — category filter: Design
  - **Planning** — links to inbox-style listing
  - **Analytics** — navigates to analytics page
- **Task list** — checkbox completion, category badge, date/time metadata, delete, focus button
- **Filters** — All · Pending · Done
- **Focus task** — one focus per day on the Today view; shown in footer strip and sidebar info
- **Day stats** — total tasks, completed count, progress percentage (for current view)
- **Clear Day** — remove all tasks for the selected date (Today view only; confirms before delete)
- **Theme toggle** — light/dark mode persisted in `localStorage`

### Time tracking

- Per-task **Start / Pause** stopwatch
- Only one active timer at a time; switching tasks commits the previous segment
- Logged seconds stored on each task (`loggedSeconds`)
- Timer pauses/commits when the tab is hidden or the page unloads
- Completed tasks cannot start a timer until reopened
- Live display updates every second while running

### Analytics (`analytics.html`)

- **Summary chips**: total tasks, completed, open, total time tracked, days with tasks, tasks with logged time
- **Tasks per day** — bar chart for the last 14 days (today highlighted)
- **By category** — horizontal bar breakdown
- **All tasks table** — date, time, title, category, status, logged duration (newest dates first)
- **Activity log** — last 100 events with icons and timestamps
- **Refresh** button and auto-refresh when returning to the tab
- Shared sidebar navigation and dark mode

### Activity logging

Events are recorded automatically (max **400** entries) and power the analytics feed:

| Event type | When |
|------------|------|
| `task_created` | New task added |
| `task_completed` | Task checked done |
| `task_reopened` | Task unchecked |
| `task_deleted` | Task removed |
| `time_logged` | Timer segment committed |
| `focus_set` | Focus task changed |
| `day_cleared` | All tasks cleared for a day |

---

<!-- SECTION: Pages -->
## Pages

```
index.html      → Landing / marketing
planner.html    → Main task dashboard (?view=…&date=…)
analytics.html  → Stats, charts, activity log
```

Shared assets:

- `css/style.css` — landing, dashboard, dark mode, analytics, timers
- `js/planner-common.js` — storage keys, date helpers, activity descriptions
- `js/app.js` — planner logic (tasks, views, timers, theme, modal)
- `js/analytics-page.js` — analytics rendering and theme

---

<!-- SECTION: Tech stack -->
## Tech stack

| Layer | Technology |
|-------|------------|
| Markup | HTML5 |
| Styling | Custom CSS + [Bootstrap 5.3.3](https://getbootstrap.com/) |
| Icons | [Font Awesome 6.5.2](https://fontawesome.com/) |
| Date picker | [Bootstrap Datepicker 1.10.0](https://github.com/uxsolutions/bootstrap-datepicker) (jQuery 3.7.1) |
| Scripts | Vanilla JavaScript (ES modules not used; script tags) |
| Data | Browser `localStorage` |
| Routing | `history.pushState` / `replaceState` + query params (`view`, `date`) |

No build step, npm package, or backend server is required.

---

<!-- SECTION: Project structure -->
## Project structure

```
smart-planner/
├── index.html              # Landing page
├── planner.html            # Task dashboard
├── analytics.html          # Analytics & activity
├── README.md
├── css/
│   └── style.css           # All styles (landing + app + dark + analytics)
└── js/
    ├── planner-common.js   # Shared storage & utilities
    ├── app.js              # Planner application logic
    └── analytics-page.js   # Analytics page logic
```

### Navigate the codebase

In your editor, search for **`SECTION:`** to jump to labeled blocks:

| File | What you will find |
|------|---------------------|
| `css/style.css` | Index at top + Landing, Dashboard, Analytics, Dark mode, Responsive |
| `index.html` | Header, Hero, Features, Workflow, CTA, Footer |
| `planner.html` | Sidebar, Stats, Tasks, Focus, Modal |
| `analytics.html` | Stats, Charts, Table, Activity log |
| `js/planner-common.js` | Storage keys, dates, activity helpers |
| `js/app.js` | Planner logic, timers, views, events |
| `js/analytics-page.js` | Charts, table, feed rendering |

---

<!-- SECTION: Getting started -->
## Getting started

### Option 1: Open directly

Open `index.html` in a modern browser (double-click or drag into the window). For full behavior (especially date picker and history API), prefer serving over HTTP.

### Option 2: Local HTTP server

From the project root:

```bash
# Python 3
python3 -m http.server 8080

# or Node (if npx is available)
npx --yes serve -p 8080
```

Then visit:

- Landing: `http://localhost:8080/index.html`
- Planner: `http://localhost:8080/planner.html`
- Analytics: `http://localhost:8080/analytics.html`

---

<!-- SECTION: How to use -->
## How to use

1. Open the **landing page** and click **Open Planner** (or go straight to `planner.html`).
2. Use the **sidebar date picker** or stay on **Today** to work on a specific day.
3. Add tasks via the inline form or **Add Task** (modal) with optional time and category.
4. Switch **views** (Inbox, Upcoming, Meetings, etc.) from the sidebar; the URL updates so you can bookmark or refresh safely.
5. **Complete** tasks with the checkbox; use **All / Pending / Done** filters as needed.
6. Click **Focus** on one task to highlight your priority for that day.
7. Use **Start / Pause** on a task to track time spent.
8. Open **Analytics** from the sidebar to see totals, charts, and the activity log.

**Clear Day** (Today view only) removes every task for the currently selected date after confirmation.

---

<!-- SECTION: Data & storage -->
## Data & storage

### Tasks (`smartPlannerTasks`)

Tasks are stored as a JSON object keyed by ISO date (`YYYY-MM-DD`):

```json
{
  "2026-05-25": [
    {
      "id": "1730000000000-abc123",
      "title": "Team standup",
      "time": "09:30",
      "category": "Meetings",
      "completed": false,
      "focus": true,
      "createdAt": 1730000000000,
      "loggedSeconds": 1800
    }
  ]
}
```

### Activity log (`smartPlannerActivityLog`)

Array of event objects (newest first), capped at 400 entries. Each entry includes `id`, `t` (timestamp), `type`, and type-specific fields (`title`, `dateISO`, `seconds`, etc.).

### Other keys

| Key | Purpose |
|-----|---------|
| `smartPlannerTheme` | `"light"` or `"dark"` |
| `smartPlannerActiveTimer` | `{ taskId, segmentStart }` while a timer is running |

Clearing site data in the browser removes all tasks and history.

---

<!-- SECTION: URL routing -->
## URL routing

Planner state is reflected in the query string:

| Parameter | Values | Description |
|-----------|--------|-------------|
| `view` | `today`, `inbox`, `upcoming`, `meetings`, `design` | Active sidebar view |
| `date` | `YYYY-MM-DD` | Selected date (especially for Today) |

Examples:

- `planner.html?view=today&date=2026-05-25`
- `planner.html?view=meetings`
- `planner.html?view=upcoming`

Browser **Back/Forward** restores view and date via `popstate`.

---

<!-- SECTION: Analytics & activity log -->
## Analytics & activity log

The analytics page reads the same `localStorage` data as the planner:

- Aggregates across **all dates** and categories
- Computes **total tracked time** from `loggedSeconds` on every task
- Builds a **14-day** task count chart
- Lists every task in a sortable table
- Shows the **activity feed** (create, complete, delete, time logged, focus, clear day)

Use **Refresh** on the analytics header to re-read storage after changes in another tab.

---

<!-- SECTION: Browser support -->
## Browser support

Works best in current versions of:

- Chrome / Edge
- Firefox
- Safari

Requires JavaScript and `localStorage`. Third-party CDNs (Bootstrap, Font Awesome, jQuery, Datepicker) need network access on first load unless you vendor those assets locally.

---

<!-- SECTION: Development history -->
## Development history

The project evolved through incremental features (from git history):

1. Landing page redesign and marketing layout
2. Sidebar navigation with view-based routing and URL state
3. Font Awesome icons and planner layout polish
4. Dark mode theme toggle
5. Add Task modal with placement and categories
6. Enhanced landing footer and SEO meta
7. Per-task timers (start/pause, persistence, dark mode styles)
8. Analytics page with activity logging
9. Sidebar branding updates on planner and analytics

---

<!-- SECTION: License -->
## License

No license file is included in the repository. Add one if you plan to distribute or open-source the project.

---

## Summary

**Smart Planner** is a complete static task-management experience: marketing landing, full planner with views and timers, and analytics with activity history—all running locally in the browser with no account required.

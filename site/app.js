(() => {
  "use strict";

  const STORAGE_KEY = "quickcal.web.v1";
  const CALENDAR_SHORTCUT_NAME = "QuickCal-Calendar";
  const CALENDAR_PENDING_KEY = "quickcal.calendar.pending.v2";
  const DURATIONS = [30, 45, 60, 90, 120];
  const CUSTOM_COLORS = ["#ff453a", "#ff2d55", "#5e5ce6", "#30b0c7", "#a2845e", "#ffd60a"];
  const ICONS = {
    fitness: '<path d="M7 8v8M4.5 10v4M17 8v8M19.5 10v4M7 12h10"/>',
    briefcase: '<rect x="3" y="7" width="18" height="13" rx="2"/><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M3 12h18M10 12v2h4v-2"/>',
    meeting: '<circle cx="9" cy="8" r="3"/><circle cx="17" cy="9" r="2"/><path d="M3 20a6 6 0 0 1 12 0M15 15a5 5 0 0 1 6 5"/>',
    checklist: '<rect x="4" y="3" width="16" height="18" rx="2"/><path d="M8 8l1.5 1.5L12 7M8 14l1.5 1.5L12 13M14 8h3M14 14h3"/>',
    hammer: '<path d="M14 5l5 5M12 7l5 5M13.5 5.5L6 13l-2 5 5-2 7.5-7.5"/>',
    homework: '<path d="M6 3h9l3 3v15H6z"/><path d="M14 3v4h4M9 11h6M9 15h6"/>',
    book: '<path d="M4 5.5A3.5 3.5 0 0 1 7.5 2H11v18H7.5A3.5 3.5 0 0 0 4 23z"/><path d="M20 5.5A3.5 3.5 0 0 0 16.5 2H13v18h3.5A3.5 3.5 0 0 1 20 23z"/>',
    podcast: '<path d="M7 17a7 7 0 1 1 10 0"/><path d="M9.5 14.5a3.5 3.5 0 1 1 5 0M10 18l1 4h2l1-4"/>',
    walk: '<circle cx="12" cy="4" r="2"/><path d="M10 8l-2 6 4 2 2-5 3 3M10 15l-2 6M13 16l4 5"/>',
    brain: '<path d="M9 4a3 3 0 0 0-3 3v1a3 3 0 0 0-1 5 3 3 0 0 0 3 5 3 3 0 0 0 4 2V6a3 3 0 0 0-3-2zM15 4a3 3 0 0 1 3 3v1a3 3 0 0 1 1 5 3 3 0 0 1-3 5 3 3 0 0 1-4 2"/>',
    cup: '<path d="M5 8h12v7a5 5 0 0 1-5 5h-2a5 5 0 0 1-5-5zM17 10h2a2 2 0 0 1 0 4h-2M4 22h14"/>',
    music: '<path d="M9 18V6l10-2v12"/><circle cx="6" cy="18" r="3"/><circle cx="16" cy="16" r="3"/>',
    palette: '<path d="M12 3a9 9 0 1 0 0 18h1.5a2 2 0 0 0 0-4H12a2 2 0 0 1 0-4h5a4 4 0 0 0 4-4c0-3.5-4-6-9-6z"/><circle cx="7.5" cy="9" r="1"/><circle cx="11" cy="6.5" r="1"/><circle cx="15" cy="7" r="1"/>',
    plane: '<path d="M22 2L9 15M22 2l-6 19-4-8-8-4z"/>',
    sparkles: '<path d="M12 3l1.4 4.1L17 9l-3.6 1.9L12 15l-1.4-4.1L7 9l3.6-1.9zM19 15l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8z"/>'
  };

  const BUILT_INS = [
    { id: "work", title: "工作", duration: 60, color: "#0a84ff", icon: "briefcase" },
    { id: "study", title: "学习", duration: 60, color: "#af52de", icon: "book" },
    { id: "meeting", title: "会议", duration: 30, color: "#ff9f0a", icon: "meeting" },
    { id: "exercise", title: "运动", duration: 60, color: "#34c759", icon: "fitness" },
    { id: "personal", title: "个人事务", duration: 30, color: "#32ade6", icon: "checklist" }
  ];

  const $ = (selector) => document.querySelector(selector);
  const $$ = (selector) => [...document.querySelectorAll(selector)];
  const pad = (value) => String(value).padStart(2, "0");
  const escapeHTML = (value = "") => String(value).replace(/[&<>'"]/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[character]);
  const iconSVG = (name) => `<svg viewBox="0 0 24 24" aria-hidden="true">${ICONS[name] || ICONS.sparkles}</svg>`;

  function dateKey(date) {
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
  }

  function fromDateKey(key) {
    const [year, month, day] = key.split("-").map(Number);
    return new Date(year, month - 1, day);
  }

  function offsetDate(key, offset) {
    const date = fromDateKey(key);
    date.setDate(date.getDate() + offset);
    return dateKey(date);
  }

  function todayKey(offset = 0) {
    const date = new Date();
    date.setHours(12, 0, 0, 0);
    date.setDate(date.getDate() + offset);
    return dateKey(date);
  }

  function roundToQuarter(minutes) {
    return Math.min(1425, Math.max(0, Math.ceil(minutes / 15) * 15));
  }

  function nowMinutes() {
    const now = new Date();
    return roundToQuarter(now.getHours() * 60 + now.getMinutes());
  }

  function formatTime(minutes) {
    const wrapped = ((minutes % 1440) + 1440) % 1440;
    return `${pad(Math.floor(wrapped / 60))}:${pad(wrapped % 60)}`;
  }

  function loadStore() {
    try {
      const stored = JSON.parse(localStorage.getItem(STORAGE_KEY));
      if (stored?.version === 1 && Array.isArray(stored.tasks) && Array.isArray(stored.customTypes)) return stored;
    } catch (_) {}
    return { version: 1, tasks: [], customTypes: [] };
  }

  let store = loadStore();
  let selectedDate = todayKey();
  let selectedPresetId = "work";
  let selectedMinutes = nowMinutes();
  let selectedDuration = 60;
  let editingTaskId = null;
  let newTypeIcon = "walk";
  let newTypeColor = CUSTOM_COLORS[0];
  let newTypeDuration = 60;
  let toastTimer;
  let calendarLaunchPending = false;
  let shortcutWasHidden = false;

  function saveStore() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  }

  function presets() {
    return [...BUILT_INS, ...store.customTypes];
  }

  function presetById(id) {
    return presets().find((preset) => preset.id === id) || BUILT_INS[0];
  }

  function formatDateLabel(key, long = false) {
    const date = fromDateKey(key);
    return new Intl.DateTimeFormat("zh-CN", long
      ? { month: "long", day: "numeric", weekday: "short" }
      : { month: "numeric", day: "numeric", weekday: "short" }
    ).format(date);
  }

  function dayRelation(key) {
    if (key === todayKey()) return "今天";
    if (key === todayKey(1)) return "明天";
    if (key === todayKey(2)) return "后天";
    return null;
  }

  function earliestMinuteForSelectedDate() {
    return selectedDate === todayKey() ? nowMinutes() : 0;
  }

  function clampSelectedTime() {
    selectedMinutes = Math.max(earliestMinuteForSelectedDate(), Math.min(1425, roundToQuarter(selectedMinutes)));
  }

  function axisLabels() {
    if (selectedDate !== todayKey()) return ["00:00", "06:00", "12:00", "18:00", "23:45"];
    const start = earliestMinuteForSelectedDate();
    const span = Math.max(0, 1425 - start);
    return [0, 1, 2, 3, 4].map((index) => formatTime(Math.min(1425, Math.round((start + span * index / 4) / 15) * 15)));
  }

  function showToast(message) {
    const toast = $("#toast");
    toast.textContent = message;
    toast.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove("show"), 1900);
  }

  function setActiveColor(color) {
    document.documentElement.style.setProperty("--active", color);
  }

  function renderSchedule() {
    $("#scheduleDate").textContent = formatDateLabel(selectedDate, true);
    const list = $("#scheduleList");
    const tasks = store.tasks
      .filter((task) => task.date === selectedDate)
      .sort((a, b) => Number(b.allDay) - Number(a.allDay) || a.startMinutes - b.startMinutes);

    if (!tasks.length) {
      list.innerHTML = '<div class="empty-state">这一天还没有安排</div>';
      return;
    }

    const allDayTasks = tasks.filter((task) => task.allDay);
    const timedTasks = tasks.filter((task) => !task.allDay);
    let html = allDayTasks.length ? '<p class="all-day-label">全天</p>' : "";
    html += allDayTasks.map(scheduleItemHTML).join("");
    html += timedTasks.map(scheduleItemHTML).join("");
    list.innerHTML = html;
    $$(".schedule-item").forEach((button) => button.addEventListener("click", () => openEventSheet(button.dataset.taskId)));
  }

  function scheduleItemHTML(task) {
    const end = task.startMinutes + task.duration;
    const time = task.allDay ? "全天" : formatTime(task.startMinutes);
    const detail = task.allDay ? "全天任务" : `至 ${formatTime(end)}`;
    return `<button class="schedule-item${task.allDay ? " all-day" : ""}" data-task-id="${escapeHTML(task.id)}" style="--event-color:${escapeHTML(task.color)}">
      <span class="event-time">${time}</span><span class="event-bar"></span>
      <span class="event-copy"><strong>${escapeHTML(task.title)}</strong><span>${detail}</span></span>
      <span class="event-more">•••</span>
    </button>`;
  }

  function renderPresets() {
    const grid = $("#presetGrid");
    grid.innerHTML = presets().map((preset) => `<button class="preset-card${preset.id === selectedPresetId ? " selected" : ""}" data-preset-id="${escapeHTML(preset.id)}" style="--preset-color:${escapeHTML(preset.color)}" aria-pressed="${preset.id === selectedPresetId}">
      <span class="preset-icon">${iconSVG(preset.icon)}</span>
      <span class="preset-copy"><strong>${escapeHTML(preset.title)}</strong><small>${preset.duration} 分钟</small></span>
    </button>`).join("") + `<button class="preset-card add-type-card" id="openTypeSheet"><span class="preset-icon">${iconSVG("sparkles")}</span><span class="preset-copy"><strong>新任务类型</strong><small>保存到任务类型</small></span></button>`;

    $$("[data-preset-id]").forEach((button) => button.addEventListener("click", () => selectPreset(button.dataset.presetId)));
    $("#openTypeSheet").addEventListener("click", openTypeSheet);
  }

  function selectPreset(id) {
    const preset = presetById(id);
    selectedPresetId = preset.id;
    selectedDuration = preset.duration;
    $("#taskName").value = "";
    renderPresets();
    renderComposer();
  }

  function renderDayChips() {
    const choices = [
      { label: "今天", key: todayKey() },
      { label: "明天", key: todayKey(1) },
      { label: "后天", key: todayKey(2) }
    ];
    const isCustom = !choices.some((choice) => choice.key === selectedDate);
    $("#dayChips").innerHTML = choices.map((choice) => `<button class="${selectedDate === choice.key ? "selected" : ""}" data-date="${choice.key}">${choice.label}</button>`).join("") + `<button id="customDateButton" class="${isCustom ? "selected" : ""}" aria-label="选择其他日期">日历</button>`;
    $$("[data-date]").forEach((button) => button.addEventListener("click", () => setSelectedDate(button.dataset.date)));
    $("#customDateButton").addEventListener("click", () => {
      const input = $("#customDate");
      input.classList.toggle("visible");
      if (input.showPicker) input.showPicker();
    });
  }

  function setSelectedDate(key) {
    selectedDate = key;
    clampSelectedTime();
    $("#customDate").value = key;
    $("#customDate").classList.remove("visible");
    renderAll();
  }

  function renderComposer() {
    const preset = presetById(selectedPresetId);
    setActiveColor(preset.color);
    clampSelectedTime();
    renderDayChips();
    $("#customDate").min = todayKey();
    $("#customDate").value = selectedDate;
    const allDay = $("#allDayToggle").checked;
    $("#timeControls").hidden = allDay;
    $("#durationBadge").textContent = allDay ? "全天" : `${selectedDuration} 分钟`;
    // Keep the selected task type as a visible, grey default. An untouched
    // field remains empty, so buildTask falls back to the preset title.
    $("#taskName").placeholder = preset.title;
    $("#timeOutput").textContent = formatTime(selectedMinutes);
    const relation = dayRelation(selectedDate) || formatDateLabel(selectedDate);
    $("#scheduleSummary").textContent = allDay ? `${relation} · 全天` : `${relation} · ${formatTime(selectedMinutes)}–${formatTime(selectedMinutes + selectedDuration)}`;

    const slider = $("#timeSlider");
    slider.min = String(earliestMinuteForSelectedDate());
    slider.max = "1425";
    slider.value = String(selectedMinutes);
    $("#timeAxis").innerHTML = axisLabels().map((label) => `<span>${label}</span>`).join("");

    $("#durationChips").innerHTML = DURATIONS.map((duration) => `<button class="${duration === selectedDuration ? "selected" : ""}" data-duration="${duration}">${duration}m</button>`).join("");
    $$("[data-duration]").forEach((button) => button.addEventListener("click", () => {
      selectedDuration = Number(button.dataset.duration);
      renderComposer();
    }));

    $$("[data-quick]").forEach((button) => {
      const value = button.dataset.quick;
      const minutes = value === "soon" ? nowMinutes() : Number(value);
      const invalidPast = selectedDate === todayKey() && minutes < earliestMinuteForSelectedDate();
      button.disabled = value === "soon" ? selectedDate !== todayKey() : invalidPast;
      button.classList.toggle("selected", selectedMinutes === minutes && !button.disabled);
    });
  }

  function renderAll() {
    renderSchedule();
    renderPresets();
    renderComposer();
  }

  function buildTask(input = {}) {
    const preset = presetById(input.presetId || selectedPresetId);
    const taskDate = input.date || selectedDate;
    const allDay = input.allDay ?? $("#allDayToggle").checked;
    let startMinutes = Number.isFinite(input.startMinutes) ? roundToQuarter(input.startMinutes) : selectedMinutes;
    if (taskDate === todayKey()) startMinutes = Math.max(startMinutes, nowMinutes());
    const duration = DURATIONS.includes(Number(input.duration)) ? Number(input.duration) : selectedDuration;
    const title = String(input.title || $("#taskName").value || preset.title).trim();
    if (!title) throw new Error("请填写任务名称");

    return {
      id: `task-${Date.now()}-${Math.random().toString(16).slice(2)}`,
      presetId: preset.id,
      title,
      date: taskDate,
      allDay: Boolean(allDay),
      startMinutes,
      duration,
      color: preset.color,
      createdAt: new Date().toISOString()
    };
  }

  function commitTask(task, options = {}) {
    if (store.tasks.some((item) => item.id === task.id)) return task;
    store.tasks.push(task);
    saveStore();
    selectedDate = task.date;
    $("#taskName").value = "";
    renderAll();
    if (!options.silent) showToast("已加入当天安排");
    return task;
  }

  function addTask(input = {}, options = {}) {
    return commitTask(buildTask(input), options);
  }

  function openTypeSheet() {
    $("#newTypeName").value = "";
    newTypeIcon = "walk";
    newTypeColor = CUSTOM_COLORS[store.customTypes.length % CUSTOM_COLORS.length];
    newTypeDuration = 60;
    renderTypeChoices();
    openSheet("typeSheet");
  }

  function renderTypeChoices() {
    $("#iconPicker").innerHTML = Object.keys(ICONS).filter((name) => !["fitness", "hammer", "homework", "book", "podcast"].includes(name)).map((name) => `<button class="icon-choice${newTypeIcon === name ? " selected" : ""}" data-icon="${name}" aria-label="选择图标">${iconSVG(name)}</button>`).join("");
    $("#colorPicker").innerHTML = CUSTOM_COLORS.map((color) => `<button class="color-choice${newTypeColor === color ? " selected" : ""}" style="--swatch:${color}" data-color="${color}" aria-label="选择颜色"></button>`).join("");
    $("#newTypeDurations").innerHTML = DURATIONS.map((duration) => `<button class="${newTypeDuration === duration ? "selected" : ""}" data-new-duration="${duration}">${duration}m</button>`).join("");
    $$("[data-icon]").forEach((button) => button.addEventListener("click", () => { newTypeIcon = button.dataset.icon; renderTypeChoices(); }));
    $$("[data-color]").forEach((button) => button.addEventListener("click", () => { newTypeColor = button.dataset.color; renderTypeChoices(); }));
    $$("[data-new-duration]").forEach((button) => button.addEventListener("click", () => { newTypeDuration = Number(button.dataset.newDuration); renderTypeChoices(); }));
  }

  function saveCustomType() {
    const title = $("#newTypeName").value.trim();
    if (!title) return showToast("先写一个任务类型名称");
    const preset = { id: `custom-${Date.now()}`, title, duration: newTypeDuration, color: newTypeColor, icon: newTypeIcon, custom: true };
    store.customTypes.push(preset);
    saveStore();
    selectedPresetId = preset.id;
    selectedDuration = preset.duration;
    closeSheet("typeSheet");
    renderAll();
    showToast("任务类型已保存");
  }

  function openEventSheet(id) {
    const task = store.tasks.find((item) => item.id === id);
    if (!task) return;
    editingTaskId = id;
    $("#editName").value = task.title;
    $("#editDate").value = task.date;
    $("#editTime").value = formatTime(task.startMinutes);
    $("#editDuration").value = String(task.duration);
    $("#editAllDay").checked = task.allDay;
    syncEditAllDay();
    openSheet("eventSheet");
  }

  function syncEditAllDay() {
    const disabled = $("#editAllDay").checked;
    $("#editTime").disabled = disabled;
    $("#editDuration").disabled = disabled;
  }

  function saveEditedEvent() {
    const task = store.tasks.find((item) => item.id === editingTaskId);
    if (!task) return;
    const title = $("#editName").value.trim();
    if (!title) return showToast("任务名称不能为空");
    const [hours, minutes] = $("#editTime").value.split(":").map(Number);
    task.title = title;
    task.date = $("#editDate").value;
    task.allDay = $("#editAllDay").checked;
    task.startMinutes = Number.isFinite(hours) ? roundToQuarter(hours * 60 + minutes) : task.startMinutes;
    task.duration = Number($("#editDuration").value);
    saveStore();
    selectedDate = task.date;
    closeSheet("eventSheet");
    renderAll();
    showToast("修改已保存");
  }

  function deleteEditedEvent() {
    const task = store.tasks.find((item) => item.id === editingTaskId);
    if (!task || !window.confirm(`删除“${task.title}”吗？`)) return;
    store.tasks = store.tasks.filter((item) => item.id !== editingTaskId);
    saveStore();
    closeSheet("eventSheet");
    renderAll();
    showToast("任务已删除");
  }

  function icsDate(date, allDay = false) {
    if (allDay) return dateKey(date).replaceAll("-", "");
    return `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}T${pad(date.getHours())}${pad(date.getMinutes())}00`;
  }

  function isoWithOffset(date) {
    const offset = -date.getTimezoneOffset();
    const sign = offset >= 0 ? "+" : "-";
    const offsetHours = pad(Math.floor(Math.abs(offset) / 60));
    const offsetMinutes = pad(Math.abs(offset) % 60);
    return `${dateKey(date)}T${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}${sign}${offsetHours}:${offsetMinutes}`;
  }

  function isIOSDevice() {
    return /iPad|iPhone|iPod/.test(navigator.userAgent)
      || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  }

  function exportEditedEvent() {
    const task = store.tasks.find((item) => item.id === editingTaskId);
    if (!task || calendarLaunchPending) return;
    calendarLaunchPending = true;
    closeSheet("eventSheet");
    setCalendarActionState("loading");
    exportTaskToCalendar(task, { commitOnSuccess: false });
    if (!isIOSDevice()) setTimeout(resetCalendarAction, 1800);
  }

  function exportTaskToCalendar(task, options = {}) {
    const startDate = fromDateKey(task.date);
    let endDate;
    if (task.allDay) {
      endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + 1);
    } else {
      startDate.setHours(Math.floor(task.startMinutes / 60), task.startMinutes % 60, 0, 0);
      endDate = new Date(startDate.getTime() + task.duration * 60000);
    }

    if (isIOSDevice()) {
      runCalendarShortcut(task, startDate, endDate, options);
    } else {
      downloadCalendarFile(task, startDate, endDate);
    }
    return true;
  }

  function addTaskToCalendar() {
    if (calendarLaunchPending) return;
    try {
      const task = buildTask();
      calendarLaunchPending = true;
      setCalendarActionState("loading");
      exportTaskToCalendar(task, { commitOnSuccess: true });
      if (!isIOSDevice()) commitTask(task, { silent: true });
      if (!isIOSDevice()) setTimeout(resetCalendarAction, 1800);
    } catch (error) {
      resetCalendarAction();
      showToast(error.message);
    }
  }

  function setCalendarActionState(state) {
    const button = $("#addTask");
    const progress = $("#calendarProgress");
    button.disabled = state === "loading";
    button.classList.toggle("is-loading", state === "loading");
    $("#addTaskLabel").textContent = state === "loading"
      ? (isIOSDevice() ? "正在打开快捷指令…" : "正在准备日历…")
      : "加入 Apple 日历";
    progress.hidden = state !== "ready";
  }

  function resetCalendarAction() {
    calendarLaunchPending = false;
    setCalendarActionState("idle");
  }

  function callbackURL(result, requestId, pending = null) {
    const url = new URL(window.location.href);
    url.search = "";
    url.hash = "";
    url.searchParams.set("quickcal", result);
    url.searchParams.set("requestId", requestId);
    if (pending) url.searchParams.set("state", JSON.stringify(pending));
    return url.toString();
  }

  function runCalendarShortcut(task, startDate, endDate, options = {}) {
    const requestId = `calendar-${Date.now()}-${Math.random().toString(16).slice(2)}`;
    const expectedReceipt = `created:${task.id}`;
    const verificationToken = `QuickCal-ID:${task.id}`;
    const pending = {
      version: 3,
      requestId,
      expectedReceipt,
      task,
      commitOnSuccess: Boolean(options.commitOnSuccess)
    };
    const payload = {
      version: 2,
      eventId: task.id,
      receipt: expectedReceipt,
      verificationToken,
      title: task.title,
      start: isoWithOffset(startDate),
      end: isoWithOffset(endDate),
      allDay: Boolean(task.allDay)
    };
    localStorage.setItem(CALENDAR_PENDING_KEY, JSON.stringify(pending));
    shortcutWasHidden = false;
    const params = new URLSearchParams({
      name: CALENDAR_SHORTCUT_NAME,
      input: "text",
      text: JSON.stringify(payload),
      "x-success": callbackURL("success", requestId, pending),
      "x-cancel": callbackURL("cancel", requestId),
      "x-error": callbackURL("error", requestId)
    });
    window.location.href = `shortcuts://x-callback-url/run-shortcut?${params.toString()}`;
  }

  function downloadCalendarFile(task, startDate, endDate) {
    const startLine = task.allDay
      ? `DTSTART;VALUE=DATE:${icsDate(startDate, true)}`
      : `DTSTART:${icsDate(startDate)}`;
    const endLine = task.allDay
      ? `DTEND;VALUE=DATE:${icsDate(endDate, true)}`
      : `DTEND:${icsDate(endDate)}`;
    const escapeICS = (value) => value.replace(/([,;\\])/g, "\\$1").replace(/\n/g, "\\n");
    const body = [
      "BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//QuickCal//QuickCal Web//ZH-CN", "CALSCALE:GREGORIAN",
      "BEGIN:VEVENT", `UID:${task.id}@quickcal.local`, `DTSTAMP:${icsDate(new Date())}Z`, startLine, endLine,
      `SUMMARY:${escapeICS(task.title)}`, "END:VEVENT", "END:VCALENDAR"
    ].join("\r\n");
    const url = URL.createObjectURL(new Blob([body], { type: "text/calendar;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `${task.title.replace(/[\\/:*?"<>|]/g, "-")}.ics`;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    setCalendarActionState("ready");
    showToast("日程已生成，请在日历中确认添加");
  }

  function openSheet(id) {
    const sheet = document.getElementById(id);
    sheet.hidden = false;
    document.body.style.overflow = "hidden";
    setTimeout(() => sheet.querySelector("input:not([type=checkbox]), button")?.focus(), 20);
  }

  function closeSheet(id) {
    document.getElementById(id).hidden = true;
    document.body.style.overflow = "";
  }

  function wireEvents() {
    $("#jumpToday").addEventListener("click", () => setSelectedDate(todayKey()));
    $("#previousDay").addEventListener("click", () => setSelectedDate(offsetDate(selectedDate, -1)));
    $("#nextDay").addEventListener("click", () => setSelectedDate(offsetDate(selectedDate, 1)));
    $("#customDate").addEventListener("change", (event) => event.target.value && setSelectedDate(event.target.value));
    $("#allDayToggle").addEventListener("change", renderComposer);
    $("#timeSlider").addEventListener("input", (event) => { selectedMinutes = Number(event.target.value); renderComposer(); });
    $("#minusTime").addEventListener("click", () => { selectedMinutes -= 15; clampSelectedTime(); renderComposer(); });
    $("#plusTime").addEventListener("click", () => { selectedMinutes += 15; clampSelectedTime(); renderComposer(); });
    $$("[data-quick]").forEach((button) => button.addEventListener("click", () => {
      selectedMinutes = button.dataset.quick === "soon" ? nowMinutes() : Number(button.dataset.quick);
      clampSelectedTime();
      renderComposer();
    }));
    $("#addTask").addEventListener("click", addTaskToCalendar);
    $("#saveType").addEventListener("click", saveCustomType);
    $("#editAllDay").addEventListener("change", syncEditAllDay);
    $("#saveEvent").addEventListener("click", saveEditedEvent);
    $("#deleteEvent").addEventListener("click", deleteEditedEvent);
    $("#exportEvent").addEventListener("click", exportEditedEvent);
    $$('[data-close]').forEach((button) => button.addEventListener("click", () => closeSheet(button.dataset.close)));
    $$(".sheet-backdrop").forEach((backdrop) => backdrop.addEventListener("click", (event) => { if (event.target === backdrop) closeSheet(backdrop.id); }));
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") $$(".sheet-backdrop:not([hidden])").forEach((sheet) => closeSheet(sheet.id));
    });
  }

  function readCalendarPending() {
    try {
      const pending = JSON.parse(localStorage.getItem(CALENDAR_PENDING_KEY));
      return pending?.version === 3 ? pending : null;
    } catch (_) {
      return null;
    }
  }

  function readCallbackPending(url) {
    try {
      const pending = JSON.parse(url.searchParams.get("state"));
      return pending?.version === 3 ? pending : null;
    } catch (_) {
      return null;
    }
  }

  function restoreComposer(task) {
    if (!task) return;
    selectedDate = task.date;
    selectedPresetId = task.presetId;
    selectedMinutes = task.startMinutes;
    selectedDuration = task.duration;
    renderAll();
    $("#taskName").value = task.title;
    $("#allDayToggle").checked = task.allDay;
    renderComposer();
  }

  function handleCalendarReturn() {
    const url = new URL(window.location.href);
    const result = url.searchParams.get("quickcal");
    if (!result) return;
    const requestId = url.searchParams.get("requestId");
    const shortcutOutput = url.searchParams.get("result") || "";
    const storedPending = readCalendarPending();
    const callbackPending = readCallbackPending(url);
    const pending = storedPending?.requestId === requestId ? storedPending : callbackPending;
    url.searchParams.delete("quickcal");
    url.searchParams.delete("requestId");
    url.searchParams.delete("state");
    url.searchParams.delete("result");
    url.searchParams.delete("errorMessage");
    window.history.replaceState({}, "", `${url.pathname}${url.search}${url.hash}`);
    resetCalendarAction();

    if (!pending || pending.requestId !== requestId) {
      setTimeout(() => showToast("无法确认本次日历写入，请重新添加"), 80);
      return;
    }

    localStorage.removeItem(CALENDAR_PENDING_KEY);
    if (result === "success") {
      if (shortcutOutput !== pending.expectedReceipt) {
        restoreComposer(pending.task);
        setTimeout(() => showToast("快捷指令已结束，但未确认写入日历；任务内容已保留"), 80);
        return;
      }
      if (pending.commitOnSuccess) commitTask(pending.task, { silent: true });
      setTimeout(() => showToast("已确认加入 Apple 日历"), 80);
      return;
    }

    restoreComposer(pending.task);
    setTimeout(() => showToast(result === "cancel" ? "已取消，任务内容已保留" : "添加失败，请检查快捷指令后重试"), 80);
  }

  function handleUnconfirmedShortcutReturn() {
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "hidden" && calendarLaunchPending) {
        shortcutWasHidden = true;
        return;
      }
      if (document.visibilityState !== "visible" || !calendarLaunchPending || !shortcutWasHidden) return;
      shortcutWasHidden = false;
      resetCalendarAction();
      showToast("未收到快捷指令结果；如日历中没有日程，请再试一次");
    });
  }

  function registerWebMCP() {
    const context = document.modelContext;
    if (!context?.registerTool) return;
    const report = (error) => console.warn("QuickCal WebMCP", error);
    try {
      Promise.resolve(context.registerTool({
        name: "list_quickcal_schedule",
        title: "查看 QuickCal 安排",
        description: "读取指定日期保存在当前设备上的 QuickCal 任务。",
        inputSchema: { type: "object", properties: { date: { type: "string", description: "YYYY-MM-DD；省略时使用当前选中日期" } }, additionalProperties: false },
        annotations: { readOnlyHint: true, untrustedContentHint: false },
        execute(input = {}) {
          const date = input.date || selectedDate;
          return { date, tasks: store.tasks.filter((task) => task.date === date).map(({ id, title, allDay, startMinutes, duration }) => ({ id, title, allDay, startTime: allDay ? null : formatTime(startMinutes), duration })) };
        }
      })).catch(report);
      Promise.resolve(context.registerTool({
        name: "create_quickcal_task",
        title: "创建 QuickCal 任务",
        description: "在当前设备的 QuickCal 中创建任务，并立即更新可见的当天安排。",
        inputSchema: {
          type: "object",
          properties: {
            title: { type: "string" }, date: { type: "string", description: "YYYY-MM-DD" }, presetId: { type: "string" },
            allDay: { type: "boolean" }, startMinutes: { type: "integer", minimum: 0, maximum: 1425, multipleOf: 15 },
            duration: { type: "integer", enum: DURATIONS }
          },
          required: ["title", "date"], additionalProperties: false
        },
        annotations: { readOnlyHint: false, untrustedContentHint: false },
        execute(input) {
          if (!input || typeof input.title !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(input.date)) throw new Error("需要有效的任务名称和日期");
          const task = addTask(input);
          return { id: task.id, title: task.title, date: task.date, created: true };
        }
      })).catch(report);
    } catch (error) { report(error); }
  }

  wireEvents();
  renderAll();
  renderTypeChoices();
  registerWebMCP();
  handleCalendarReturn();
  handleUnconfirmedShortcutReturn();
})();

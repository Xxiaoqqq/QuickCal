import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const appSource = await readFile(new URL("../site/app.js", import.meta.url), "utf8");
assert.match(appSource, /CALENDAR_SHORTCUT_NAME = "QuickCal-Calendar"/);
assert.match(appSource, /shortcuts:\/\/x-callback-url\/run-shortcut/);
assert.match(appSource, /"x-success": callbackURL\("success", requestId, pending\)/);
assert.match(appSource, /"x-cancel": callbackURL\("cancel", requestId\)/);
assert.match(appSource, /"x-error": callbackURL\("error", requestId\)/);
assert.match(appSource, /isoWithOffset\(startDate\)/);
assert.match(appSource, /version: 2,\s+eventId: task\.id,\s+receipt: expectedReceipt,\s+verificationToken/);
assert.match(appSource, /shortcutOutput !== pending\.expectedReceipt/);
assert.match(appSource, /已确认加入 Apple 日历/);
assert.doesNotMatch(appSource, /result === "success" \? "已加入 Apple 日历"/);
assert.doesNotMatch(appSource, /shortcuts:\/\/create-shortcut/);
assert.match(appSource, /placeholder = preset\.title/);
assert.match(appSource, /input\.title \|\| \$\("#taskName"\)\.value \|\| preset\.title/);
assert.match(appSource, /class="preset-icon"/);
assert.match(appSource, /class="preset-copy"/);
for (const title of ["工作", "学习", "会议", "运动", "个人事务"]) assert.match(appSource, new RegExp(`title: "${title}"`));
for (const title of ["搓&学习产品", "作业", "听播客"]) assert.doesNotMatch(appSource, new RegExp(`title: "${title}"`));

const indexSource = await readFile(new URL("../site/index.html", import.meta.url), "utf8");
assert.match(indexSource, /加入 Apple 日历/);
assert.match(indexSource, /QuickCal-Calendar/);
assert.doesNotMatch(indexSource, /选择后自动带入时长/);
assert.match(indexSource, /app\.js\?v=9/);
assert.match(indexSource, /styles\.css\?v=9/);

const worker = (await import("../dist/server/index.js")).default;

const page = await worker.fetch(new Request("https://quickcal.test/"), {}, {});
assert.equal(page.status, 200);
assert.match(page.headers.get("content-type"), /text\/html/);
assert.match(await page.text(), /两步加入 Apple 日历/);

const stylesheet = await worker.fetch(new Request("https://quickcal.test/styles.css"), {}, {});
assert.equal(stylesheet.status, 200);
assert.match(stylesheet.headers.get("content-type"), /text\/css/);

const form = new FormData();
form.set("title", "测试日程");
form.set("uid", "task-123@quickcal.local");
form.set("allDay", "0");
form.set("start", "20260924T090000");
form.set("end", "20260924T100000");
const calendar = await worker.fetch(new Request("https://quickcal.test/calendar.ics", { method: "POST", body: form }), {}, {});
assert.equal(calendar.status, 200);
assert.match(calendar.headers.get("content-type"), /^text\/calendar/);
assert.equal(calendar.headers.get("content-disposition"), "attachment; filename=quickcal-event.ics");
const calendarText = await calendar.text();
assert.match(calendarText, /SUMMARY:测试日程/);
assert.match(calendarText, /DTSTART:20260924T090000/);
assert.match(calendarText, /DTEND:20260924T100000/);

const allDayForm = new FormData();
allDayForm.set("title", "全天任务");
allDayForm.set("uid", "task-all-day@quickcal.local");
allDayForm.set("allDay", "1");
allDayForm.set("start", "20260924");
allDayForm.set("end", "20260925");
const allDayCalendar = await worker.fetch(new Request("https://quickcal.test/calendar.ics", { method: "POST", body: allDayForm }), {}, {});
assert.equal(allDayCalendar.status, 200);
const allDayText = await allDayCalendar.text();
assert.match(allDayText, /DTSTART;VALUE=DATE:20260924/);
assert.match(allDayText, /DTEND;VALUE=DATE:20260925/);

const invalid = new FormData();
invalid.set("title", "测试日程");
const invalidResponse = await worker.fetch(new Request("https://quickcal.test/calendar.ics", { method: "POST", body: invalid }), {}, {});
assert.equal(invalidResponse.status, 400);

console.log("QuickCal calendar endpoint checks passed");

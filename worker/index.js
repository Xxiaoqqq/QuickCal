const ASSETS = __QUICKCAL_ASSETS__;

const encoder = new TextEncoder();

function decodeBase64(value) {
  return Uint8Array.from(atob(value), (character) => character.charCodeAt(0));
}

function serveAsset(pathname, requestMethod) {
  const path = pathname === "/" ? "/index.html" : pathname;
  const asset = ASSETS[path];
  if (!asset) return null;
  const headers = new Headers({
    "content-type": asset.contentType,
    "cache-control": path === "/index.html" ? "no-cache" : "public, max-age=300",
    "x-content-type-options": "nosniff"
  });
  if (path.endsWith(".shortcut")) {
    headers.set("content-disposition", 'attachment; filename="QuickCal-Calendar.shortcut"');
    headers.set("cache-control", "no-store");
  }
  return new Response(requestMethod === "HEAD" ? null : decodeBase64(asset.body), { headers });
}

function escapeICS(value) {
  return String(value)
    .replace(/\\/g, "\\\\")
    .replace(/\r?\n/g, "\\n")
    .replace(/([,;])/g, "\\$1");
}

function foldICSLine(line) {
  const parts = [];
  let current = "";
  let currentBytes = 0;
  for (const character of line) {
    const characterBytes = encoder.encode(character).length;
    const limit = parts.length ? 74 : 75;
    if (current && currentBytes + characterBytes > limit) {
      parts.push(current);
      current = ` ${character}`;
      currentBytes = 1 + characterBytes;
    } else {
      current += character;
      currentBytes += characterBytes;
    }
  }
  if (current) parts.push(current);
  return parts.join("\r\n");
}

function utcStamp(date = new Date()) {
  return date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
}

function calendarResponse({ title, uid, allDay, start, end }) {
  const startLine = allDay ? `DTSTART;VALUE=DATE:${start}` : `DTSTART:${start}`;
  const endLine = allDay ? `DTEND;VALUE=DATE:${end}` : `DTEND:${end}`;
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//QuickCal//QuickCal Web//ZH-CN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${uid}`,
    `DTSTAMP:${utcStamp()}`,
    startLine,
    endLine,
    `SUMMARY:${escapeICS(title)}`,
    "END:VEVENT",
    "END:VCALENDAR"
  ];
  const body = `${lines.map(foldICSLine).join("\r\n")}\r\n`;
  return new Response(body, {
    headers: {
      "content-type": "text/calendar; charset=utf-8",
      "content-disposition": "attachment; filename=quickcal-event.ics",
      "cache-control": "no-store",
      "content-language": "zh-CN",
      "x-content-type-options": "nosniff"
    }
  });
}

async function createCalendarFile(request) {
  if (request.method !== "POST") {
    return new Response("Method not allowed", { status: 405, headers: { allow: "POST" } });
  }
  const form = await request.formData();
  const title = String(form.get("title") || "").trim();
  const uid = String(form.get("uid") || "").trim();
  const allDay = form.get("allDay") === "1";
  const start = String(form.get("start") || "").trim();
  const end = String(form.get("end") || "").trim();
  const datePattern = /^\d{8}$/;
  const dateTimePattern = /^\d{8}T\d{6}$/;
  const expectedPattern = allDay ? datePattern : dateTimePattern;
  const valid = title.length > 0
    && title.length <= 60
    && /^[A-Za-z0-9@._-]{1,160}$/.test(uid)
    && expectedPattern.test(start)
    && expectedPattern.test(end);
  if (!valid) {
    return new Response("Invalid calendar event", {
      status: 400,
      headers: { "content-type": "text/plain; charset=utf-8", "cache-control": "no-store" }
    });
  }
  return calendarResponse({ title, uid, allDay, start, end });
}

export default {
  async fetch(request, env, ctx) {
    void env;
    void ctx;
    const url = new URL(request.url);
    if (url.pathname === "/calendar.ics") {
      try {
        return await createCalendarFile(request);
      } catch (_) {
        return new Response("Unable to create calendar event", { status: 400 });
      }
    }
    if (request.method !== "GET" && request.method !== "HEAD") {
      return new Response("Method not allowed", { status: 405, headers: { allow: "GET, HEAD" } });
    }
    return serveAsset(url.pathname, request.method) || new Response("Not found", { status: 404 });
  }
};

export const SHORTCUT_NAME = "QuickCal-Calendar";

export function isoWithOffset(date) {
  const pad = (value) => String(Math.abs(value)).padStart(2, "0");
  const offset = -date.getTimezoneOffset();
  const sign = offset >= 0 ? "+" : "-";
  const hours = Math.floor(Math.abs(offset) / 60);
  const minutes = Math.abs(offset) % 60;
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}${sign}${pad(hours)}:${pad(minutes)}`;
}

export function callbackURL(currentHref, outcome, requestId) {
  const url = new URL(currentHref);
  url.search = "";
  url.hash = "";
  url.searchParams.set("quickcal", outcome);
  url.searchParams.set("requestId", requestId);
  return url.toString();
}

export function createTestRequest(currentHref, now = new Date(), requestId = `bridge-${Date.now()}`) {
  const start = new Date(now.getTime() + 10 * 60 * 1000);
  start.setSeconds(0, 0);
  const end = new Date(start.getTime() + 30 * 60 * 1000);
  const expectedReceipt = `created:${requestId}`;
  const payload = {
    version: 2,
    eventId: requestId,
    receipt: expectedReceipt,
    verificationToken: `QuickCal-ID:${requestId}`,
    title: "QuickCal 桥接测试",
    start: isoWithOffset(start),
    end: isoWithOffset(end),
    allDay: false
  };
  const params = new URLSearchParams({
    name: SHORTCUT_NAME,
    input: "text",
    text: JSON.stringify(payload),
    "x-success": callbackURL(currentHref, "success", requestId),
    "x-cancel": callbackURL(currentHref, "cancel", requestId),
    "x-error": callbackURL(currentHref, "error", requestId)
  });
  return {
    payload,
    expectedReceipt,
    requestId,
    shortcutURL: `shortcuts://x-callback-url/run-shortcut?${params.toString()}`
  };
}

export function isVerifiedSuccess(currentHref, expectedReceipt) {
  const callback = parseBridgeCallback(currentHref);
  return callback.outcome === "success" && callback.message === expectedReceipt;
}

export function parseBridgeCallback(currentHref) {
  const url = new URL(currentHref);
  const outcome = url.searchParams.get("quickcal");
  if (!outcome) return { outcome: "idle", message: "" };
  if (outcome === "success") return { outcome, message: url.searchParams.get("result") || "" };
  if (outcome === "cancel") return { outcome, message: "" };
  if (outcome === "error") return { outcome, message: url.searchParams.get("errorMessage") || "" };
  return { outcome: "invalid", message: "" };
}

export function openShortcutURL() {
  return `shortcuts://open-shortcut?name=${encodeURIComponent(SHORTCUT_NAME)}`;
}

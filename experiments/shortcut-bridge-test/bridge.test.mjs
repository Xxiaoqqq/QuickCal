import assert from "node:assert/strict";
import {
  SHORTCUT_NAME,
  callbackURL,
  createTestRequest,
  isVerifiedSuccess,
  openShortcutURL,
  parseBridgeCallback
} from "./bridge.mjs";

const pageURL = "https://example.com/bridge/?stale=1#old";
const request = createTestRequest(pageURL, new Date("2026-09-24T15:00:00+08:00"), "bridge-fixed");
const shortcutURL = new URL(request.shortcutURL);

assert.equal(shortcutURL.protocol, "shortcuts:");
assert.equal(shortcutURL.hostname, "x-callback-url");
assert.equal(shortcutURL.pathname, "/run-shortcut");
assert.equal(shortcutURL.searchParams.get("name"), SHORTCUT_NAME);
assert.equal(shortcutURL.searchParams.get("input"), "text");
assert.deepEqual(JSON.parse(shortcutURL.searchParams.get("text")), request.payload);
assert.equal(request.payload.version, 2);
assert.equal(request.payload.eventId, "bridge-fixed");
assert.equal(request.payload.receipt, "created:bridge-fixed");
assert.equal(request.payload.verificationToken, "QuickCal-ID:bridge-fixed");
assert.equal(request.expectedReceipt, "created:bridge-fixed");
assert.equal(request.payload.allDay, false);
assert.equal(new Date(request.payload.end).getTime() - new Date(request.payload.start).getTime(), 30 * 60 * 1000);

assert.equal(callbackURL(pageURL, "success", "bridge-fixed"), "https://example.com/bridge/?quickcal=success&requestId=bridge-fixed");
assert.deepEqual(parseBridgeCallback("https://example.com/bridge/"), { outcome: "idle", message: "" });
assert.deepEqual(parseBridgeCallback("https://example.com/bridge/?quickcal=success&result=created%3Abridge-fixed"), {
  outcome: "success",
  message: "created:bridge-fixed"
});
assert.deepEqual(parseBridgeCallback("https://example.com/bridge/?quickcal=cancel"), { outcome: "cancel", message: "" });
assert.deepEqual(parseBridgeCallback("https://example.com/bridge/?quickcal=error&errorMessage=Denied"), {
  outcome: "error",
  message: "Denied"
});
assert.equal(isVerifiedSuccess("https://example.com/bridge/?quickcal=success&result=created%3Abridge-fixed", request.expectedReceipt), true);
assert.equal(isVerifiedSuccess("https://example.com/bridge/?quickcal=success", request.expectedReceipt), false);
assert.equal(isVerifiedSuccess("https://example.com/bridge/?quickcal=success&result=created%3Aanother-event", request.expectedReceipt), false);
assert.equal(isVerifiedSuccess("https://example.com/bridge/?quickcal=error&result=created%3Abridge-fixed", request.expectedReceipt), false);
assert.match(openShortcutURL(), /^shortcuts:\/\/open-shortcut\?name=/);

console.log("shortcut bridge protocol: all tests passed");

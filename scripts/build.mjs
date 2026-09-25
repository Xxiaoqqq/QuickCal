import { readFile, readdir, rm, mkdir, writeFile, copyFile } from "node:fs/promises";
import { extname, join } from "node:path";

const root = new URL("../", import.meta.url);
const siteDirectory = new URL("../site/", import.meta.url);
const outputDirectory = new URL("../dist/", import.meta.url);
const mimeTypes = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".shortcut": "application/octet-stream",
  ".svg": "image/svg+xml; charset=utf-8",
  ".webmanifest": "application/manifest+json; charset=utf-8"
};

const assets = {};
for (const entry of await readdir(siteDirectory, { withFileTypes: true })) {
  if (!entry.isFile()) continue;
  if (extname(entry.name) === ".shortcut" && entry.name !== "QuickCal-Calendar.shortcut") continue;
  const content = await readFile(new URL(entry.name, siteDirectory));
  assets[`/${entry.name}`] = {
    contentType: mimeTypes[extname(entry.name)] || "application/octet-stream",
    body: content.toString("base64")
  };
}

const workerTemplate = await readFile(new URL("../worker/index.js", import.meta.url), "utf8");
if (!workerTemplate.includes("__QUICKCAL_ASSETS__")) throw new Error("Worker asset placeholder is missing");
const worker = workerTemplate.replace("__QUICKCAL_ASSETS__", JSON.stringify(assets));

await rm(outputDirectory, { recursive: true, force: true });
await mkdir(new URL("./server/", outputDirectory), { recursive: true });
await mkdir(new URL("./.openai/", outputDirectory), { recursive: true });
await writeFile(new URL("./server/index.js", outputDirectory), worker);
await copyFile(new URL("../.openai/hosting.json", import.meta.url), new URL("./.openai/hosting.json", outputDirectory));

console.log(`Built ${join(root.pathname, "dist")}`);

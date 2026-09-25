import { readFile, writeFile } from "node:fs/promises";

const [html, css, source] = await Promise.all([
  readFile(new URL("../site/index.html", import.meta.url), "utf8"),
  readFile(new URL("../site/styles.css", import.meta.url), "utf8"),
  readFile(new URL("../site/app.js", import.meta.url), "utf8")
]);

const previewStorage = `const previewStorage = (() => {
  const values = new Map();
  return { getItem: (key) => values.has(key) ? values.get(key) : null, setItem: (key, value) => values.set(key, String(value)), removeItem: (key) => values.delete(key) };
})();\n`;
const previewScript = source
  .replaceAll("localStorage", "previewStorage")
  .replaceAll("sessionStorage", "previewStorage");
const previewCSS = `${css}\nhtml{background:#e9e9ed}.app-shell{max-width:390px;background:var(--canvas);box-shadow:0 24px 70px rgba(0,0,0,.18)}.preset-grid{grid-template-columns:repeat(2,minmax(0,1fr))}`;
const output = html
  .replace(/\s*<link rel="manifest"[^>]+>/, "")
  .replace(/\s*<link rel="apple-touch-icon"[^>]+>/, "")
  .replace(/\s*<link rel="icon"[^>]+>/, "")
  .replace(/<link rel="stylesheet"[^>]+>/, `<style>${previewCSS}</style>`)
  // Use a replacement function so JavaScript `$$` tokens are preserved.
  // In a string replacement value, `$$` is otherwise collapsed to `$`.
  .replace(/<script src="\.\/app\.js\?v=\d+"><\/script>/, () => `<script>${previewStorage}${previewScript}</script>`);

const outputPath = process.argv[2];
if (!outputPath) throw new Error("Preview output path is required");
await writeFile(outputPath, output);
console.log(outputPath);

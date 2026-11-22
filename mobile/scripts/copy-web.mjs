// ينسخ ملفات البرنامج من ../seerah إلى www قبل كل sync
import { cpSync, rmSync } from "node:fs";
import { fileURLToPath } from "node:url";
const here = fileURLToPath(new URL("..", import.meta.url));
rmSync(here + "www", { recursive: true, force: true });
cpSync(here + "../seerah", here + "www", { recursive: true, filter: s => !s.endsWith("README.md") });
console.log("copied ../seerah -> www");

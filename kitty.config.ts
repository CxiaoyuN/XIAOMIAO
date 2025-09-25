import vod from "./vod";
import * as fs from "fs";
import * as path from "path";

/**
 * Load all sources from x18 directory (each .ts should export a source or array of sources).
 */
function loadX18() {
  const dir = path.resolve(process.cwd(), "x18");
  const list: any[] = [];

  if (!fs.existsSync(dir)) return list;

  const files = fs
    .readdirSync(dir)
    .filter((f) => f.endsWith(".ts") || f.endsWith(".js"));

  for (const f of files) {
    const full = path.join(dir, f);
    // Bun/Node can require TS with transpile; fallback to default export
    const mod = require(full);
    const val = mod?.default ?? mod;
    if (Array.isArray(val)) list.push(...val);
    else if (val != null) list.push(val);
  }

  return list;
}

export default function () {
  const target = (process.env.KITTY_TARGET || "").toLowerCase();

  if (target === "x") {
    // Adult sources from x18/
    return loadX18();
  }

  if (target === "vod") {
    // All regular sources from root vod.ts
    return vod;
  }

  // Default: merge both
  return [...loadX18(), ...vod];
}

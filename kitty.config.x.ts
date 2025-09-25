import * as fs from "fs";
import * as path from "path";

function loadX18() {
  const dir = path.resolve(process.cwd(), "x18");
  const list: any[] = [];
  if (!fs.existsSync(dir)) return list;

  const files = fs.readdirSync(dir).filter(f => f.endsWith(".ts") || f.endsWith(".js"));
  for (const f of files) {
    const mod = require(path.join(dir, f));
    const val = mod?.default ?? mod;
    if (Array.isArray(val)) list.push(...val);
    else if (val != null) list.push(val);
  }
  return list;
}

export default function () {
  return loadX18();
}

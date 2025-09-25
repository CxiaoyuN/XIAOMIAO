import vod from "./vod";
import * as fs from "fs";

function loadX18() {
  const list: any[] = [];
  if (fs.existsSync("./x18")) {
    const files = fs.readdirSync("./x18").filter(f => f.endsWith(".ts"));
    for (const f of files) {
      const mod = require("./x18/" + f);
      const val = mod.default ?? mod;
      if (Array.isArray(val)) list.push(...val);
      else list.push(val);
    }
  }
  return list;
}

export default function () {
  const target = (process.env.KITTY_TARGET || "").toLowerCase();

  if (target === "x") {
    return loadX18();
  }
  if (target === "vod") {
    return vod.filter(i => i.nsfw === false);
  }
  if (target === "xvod") {
    return vod.filter(i => i.nsfw === true);
  }

  // 默认：全部
  return [...loadX18(), ...vod];
}

import vod from "./vod";

export default function () {
  return vod.filter(i => i.nsfw === false);
}

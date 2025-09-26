import type { Handle, IConfig, VodDetail, VodItem } from "@types/kitty";

class JvLook implements Handle {
  getConfig(): IConfig {
    return {
      id: "jvlook",
      name: "JvLook",
      type: 1, // JS 源
      api: "https://jvlook.com",
      nsfw: true,
      logo: "https://jvlook.com/favicon.ico",
      desc: "JvLook 资源站",
      extra: { gfw: false }
    };
  }

  async getCategory() {
    return [
      { id: "short", name: "短视频" },
      { id: "long", name: "长视频" },
      { id: "av", name: "AV" },
      { id: "anime", name: "动漫" }
    ];
  }

  async getHome() {
    const html = await fetch("https://jvlook.com/index").then(r => r.text());
    const reg = /<a[^>]+href="(\\/video\\/[^"]+)"[^>]*>(.*?)<\\/a>/g;
    const list: VodItem[] = [];
    let m;
    while ((m = reg.exec(html)) !== null) {
      list.push({
        vod_id: "https://jvlook.com" + m[1],
        vod_name: m[2].replace(/<[^>]+>/g, ""),
        vod_pic: "",
        vod_remarks: ""
      });
    }
    return list;
  }

  async getSearch(wd: string) {
    const url = `https://jvlook.com/search/${encodeURIComponent(wd)}`;
    const html = await fetch(url).then(r => r.text());
    const reg = /<a[^>]+href="(\\/video\\/[^"]+)"[^>]*>(.*?)<\\/a>/g;
    const list: VodItem[] = [];
    let m;
    while ((m = reg.exec(html)) !== null) {
      list.push({
        vod_id: "https://jvlook.com" + m[1],
        vod_name: m[2].replace(/<[^>]+>/g, ""),
        vod_pic: "",
        vod_remarks: ""
      });
    }
    return list;
  }

  async getDetail(id: string): Promise<VodDetail> {
    const html = await fetch(id).then(r => r.text());
    const titleMatch = html.match(/<title>(.*?)<\\/title>/);
    return {
      vod_id: id,
      vod_name: titleMatch ? titleMatch[1] : "未知",
      vod_pic: "",
      vod_play_from: ["JvLook"],
      vod_play_url: [`播放$${id}`]
    };
  }

  async parseIframe(url: string) {
    return url;
  }
}

export default new JvLook();

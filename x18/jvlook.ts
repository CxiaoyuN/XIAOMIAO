export default class JVLook implements Handle {
  getConfig() {
    return <IConfig>{
      id: "jvlook$",
      name: "JVLook",
      type: 1,
      nsfw: true,
      api: "https://zdapi.421573.top",
    };
  }

  // 分类
  async getCategory() {
    const url = `${env.baseUrl}/zd/sp/getPlateLabelList?plateId=4`;
    const json = await req(url, { headers: this.makeHeaders() }).then(r => JSON.parse(r));
    return json.data.map((v: any) => <ICategory>{ id: v.id, text: v.name });
  }

  // 首页/列表
  async getHome() {
    const cate = env.get("category") || 1;
    const page = env.get("page") || 1;
    const url = `${env.baseUrl}/zd/sp/getLabelVideoList?plateId=4&labelId=${cate}&page=${page}&size=25`;
    const json = await req(url, { headers: this.makeHeaders() }).then(r => JSON.parse(r));

    return json.data.records.map((v: any) => <IMovie>{
      id: v.id,
      title: v.title || v.videoTitle || "",
      cover: v.coverUrl || v.videoCoverUrl || "",
      remark: v.updateTime || "",
    });
  }

  // 搜索
  async getSearch(keyword: string) {
    const page = env.get("page") || 1;
    const url = `${env.baseUrl}/zd/sp/getSearchList?plateId=4&searchName=${encodeURIComponent(keyword)}&page=${page}&size=25`;
    const json = await req(url, { headers: this.makeHeaders() }).then(r => JSON.parse(r));

    return json.data.records.map((v: any) => <IMovie>{
      id: v.id,
      title: v.title || v.videoTitle || "",
      cover: v.coverUrl || v.videoCoverUrl || "",
      remark: v.updateTime || "",
    });
  }

  // 详情（只展示封面和标题，播放可选）
  async getDetail() {
    const id = env.get("movieId");
    const url = `${env.baseUrl}/zd/sp/getLovelyList?plateId=4&videoId=${id}`;
    const json = await req(url, { headers: this.makeHeaders() }).then(r => JSON.parse(r));

    const videos = Array.isArray(json.data)
      ? json.data.filter((x: any) => x.playUrl).map((x: any) => <IPlaylistVideo>{
          text: x.title || "播放",
          id: x.playUrl,
        })
      : [];

    return <IMovie>{
      id,
      title: "影片详情",
      cover: videos.length > 0 ? "" : "",
      desc: "",
      playlist: [{ title: "默认线路", videos }],
    };
  }

  async parseIframe() {
    return env.get<string>("iframe");
  }

  // ————————————————————————————————
  // 签名与请求头
  private makeHeaders() {
    const timestamp = Date.now();
    const nonce = this.randomString(16);
    const token = this.getToken();
    const secret = "@1243asd31**21#";
    const sign = this.md5(String(timestamp) + token + nonce + secret).toUpperCase();

    return {
      "Origin": "https://jvlook.com",
      "Referer": "https://jvlook.com/plate1",
      "User-Agent": "Mozilla/5.0",
      "Accept": "application/json, text/plain, */*",
      "DNT": "1",
      "nonce": nonce,
      "timestamp": String(timestamp),
      "token": token,
      "sign": sign,
      "url": "jvlook.com",
    };
  }

  private randomString(len: number) {
    const chars = "ABCDEFGHJKMNPQRSTWXYZabcdefhijkmnprstwxyz2345678";
    return Array.from({ length: len }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
  }

  private getToken() {
    let token = env.get("token");
    if (!token) {
      token = this.createGuid();
      env.set("token", token);
    }
    return token;
  }

  private createGuid() {
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, c => {
      const r = Math.random() * 16 | 0;
      const v = c === "x" ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  // 简化版 MD5（用 Node.js crypto 更稳）
  private md5(str: string): string {
    const crypto = require("crypto");
    return crypto.createHash("md5").update(str).digest("hex");
  }
}

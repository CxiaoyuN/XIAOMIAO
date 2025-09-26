export default class JVLook implements Handle {
  getConfig() {
    return <IConfig>{
      id: "jvlook$",
      name: "JVLook (plate1)",
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

  // 列表
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

  // 详情
  async getDetail() {
    const id = env.get("movieId");
    const url = `${env.baseUrl}/zd/sp/getLovelyList?plateId=4&videoId=${id}`;
    const json = await req(url, { headers: this.makeHeaders() }).then(r => JSON.parse(r));

    const videos = Array.isArray(json.data) ? json.data
      .filter((x: any) => x.playUrl)
      .map((x: any) => <IPlaylistVideo>{
        text: x.title || "播放",
        id: x.playUrl,
      }) : [];

    return <IMovie>{
      id,
      title: "影片详情",
      cover: "",
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
    const secret = "@1243asd31**21#"; // 固定密钥
    const sign = this.md5(String(timestamp) + token + nonce + secret).toUpperCase();

    return {
      "Origin": "https://jvlook.com",
      "Referer": "https://jvlook.com/plate1",
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36",
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

  // 纯 JS MD5
  private md5(str: string): string {
    function rl(l: number, s: number) { return (l << s) | (l >>> (32 - s)); }
    function au(x: number, y: number) {
      const x8 = x & 0x80000000, y8 = y & 0x80000000, x4 = x & 0x40000000, y4 = y & 0x40000000;
      let r = (x & 0x3FFFFFFF) + (y & 0x3FFFFFFF);
      if (x4 & y4) return r ^ 0x80000000 ^ x8 ^ y8;
      if (x4 | y4) return (r & 0x40000000) ? r ^ 0xC0000000 ^ x8 ^ y8 : r ^ 0x40000000 ^ x8 ^ y8;
      return r ^ x8 ^ y8;
    }
    function F(x: number, y: number, z: number) { return (x & y) | (~x & z); }
    function G(x: number, y: number, z: number) { return (x & z) | (y & ~z); }
    function H(x: number, y: number, z: number) { return x ^ y ^ z; }
    function I(x: number, y: number, z: number) { return y ^ (x | ~z); }
    function FF(a: number, b: number, c: number, d: number, x: number, s: number, ac: number) { return au(rl(au(a, au(F(b, c, d), au(x, ac))), s), b); }
    function GG(a: number, b: number, c: number, d: number, x: number, s: number, ac: number) { return au(rl(au(a, au(G(b, c, d), au(x, ac))), s), b); }
    function HH(a: number, b: number, c: number, d: number, x: number, s: number, ac: number) { return au(rl(au(a, au(H(b, c, d), au(x, ac))), s), b); }
    function II(a: number, b: number, c: number, d: number, x: number, s: number, ac: number) { return au(rl(au(a, au(I(b, c, d), au(x, ac))), s), b); }
    function cwa(s: string) {
      const wa: number[] = []; let ml = s.length, bc = 0;
      while (bc < ml) {
        const i = (bc - (bc % 4)) / 4;
        wa[i] = wa[i] | (s.charCodeAt(bc) << ((bc % 4) * 8)); bc++;
      }
      const i = (bc - (bc % 4)) / 4;
      wa[i] = wa[i] | (0x80 << ((bc % 4) * 8));
      const nw1 = ml + 8, nw2 = (nw1 - (nw1 % 64)) / 64, nw = (nw2 + 1) * 16;
      wa[nw - 2] = ml << 3; wa[nw - 1] = ml >>> 29; return wa;
    }
    function w2h(v: number) {
      let out = ""; for (let i = 0; i <= 3; i++) {
        const b = (v >>> (i * 8)) & 255; const tmp = "0" + b.toString(16);
        out += tmp.substring(tmp.length - 2, tmp.length);
      } return out;
    }
    let x = cwa(str), a = 0x67452301, b = 0xEFCDAB89, c = 0x98BADCFE, d = 0x10325476;
    for

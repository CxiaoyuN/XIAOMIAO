import md5 from "crypto-js/md5";

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

  // 列表
  async getHome() {
    const cate = env.get("category") || 1;
    const page = env.get("page") || 1;
    const url = `${env.baseUrl}/zd/sp/getLabelVideoList?plateId=4&labelId=${cate}&page=${page}&size=25`;
    const json = await req(url, { headers: this.makeHeaders() }).then(r => JSON.parse(r));

    return json.data.records.map((v: any) => <IMovie>{
      id: v.id,
      title: v.title,
      cover: v.coverUrl,
      remark: v.updateTime,
    });
  }

  // 详情（示例用 getLovelyList，你也可以换成 getVideoDetail）
  async getDetail() {
    const id = env.get("movieId");
    const url = `${env.baseUrl}/zd/sp/getLovelyList?plateId=4&videoId=${id}`;
    const json = await req(url, { headers: this.makeHeaders() }).then(r => JSON.parse(r));

    return <IMovie>{
      id,
      title: "影片详情",
      cover: "",
      desc: "",
      playlist: [
        {
          title: "默认线路",
          videos: json.data.map((v: any) => <IPlaylistVideo>{
            text: v.title,
            id: v.playUrl,
          }),
        },
      ],
    };
  }

  async parseIframe() {
    return env.get<string>("iframe");
  }

  // 🔑 请求头生成
  private makeHeaders() {
    const timestamp = Date.now();
    const nonce = this.randomString(16);
    const token = this.getToken();
    const secret = "@1243asd31**21#"; // 固定密钥
    const sign = md5(timestamp + token + nonce + secret).toString().toUpperCase();

    return {
      "Origin": "https://jvlook.com",
      "Referer": "https://jvlook.com/plate1",
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 Edg/141.0.0.0",
      "Accept": "application/json, text/plain, */*",
      "DNT": "1",
      "nonce": nonce,
      "timestamp": timestamp.toString(),
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
}

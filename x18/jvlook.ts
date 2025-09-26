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
    const json = await req(url, {
      headers: this.makeHeaders(),
    }).then(r => JSON.parse(r));

    return json.data.map((v: any) => <ICategory>{
      id: v.id,
      text: v.name,
    });
  }

  // 列表
  async getHome() {
    const cate = env.get("category") || 1;
    const page = env.get("page") || 1;
    const url = `${env.baseUrl}/zd/sp/getLabelVideoList?plateId=4&labelId=${cate}&page=${page}&size=25`;
    const json = await req(url, {
      headers: this.makeHeaders(),
    }).then(r => JSON.parse(r));

    return json.data.records.map((v: any) => <IMovie>{
      id: v.id,
      title: v.title,
      cover: v.coverUrl,
      remark: v.updateTime,
    });
  }

  // 详情
  async getDetail() {
    const id = env.get("movieId");
    const url = `${env.baseUrl}/zd/sp/getLovelyList?plateId=4&videoId=${id}`;
    const json = await req(url, {
      headers: this.makeHeaders(),
    }).then(r => JSON.parse(r));

    // 这里只是示例，实际要根据返回结构拼 playlist
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
    const url = env.get<string>("iframe");
    return url; // 如果是 m3u8/mp4 直链，直接返回
  }

  // 🔑 生成请求头（需要你补充 sign 算法）
  private makeHeaders() {
    const timestamp = Date.now();
    const nonce = this.randomString(16);
    const token = "你的token"; // 可以从浏览器复制，或者逆向生成
    const sign = this.calcSign(nonce, timestamp, token);

    return {
      "Origin": "https://jvlook.com",
      "Referer": "https://jvlook.com/",
      "User-Agent": "Mozilla/5.0 ...",
      "Accept": "application/json, text/plain, */*",
      "nonce": nonce,
      "timestamp": timestamp.toString(),
      "token": token,
      "sign": sign,
      "url": "jvlook.com",
    };
  }

  private randomString(len: number) {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    return Array.from({ length: len }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
  }

  private calcSign(nonce: string, timestamp: number, token: string) {
    // TODO: 这里实现 jvlook 的 sign 算法
    // 一般是 md5(nonce + timestamp + token + secretKey)
    return "FAKE_SIGN";
  }
}

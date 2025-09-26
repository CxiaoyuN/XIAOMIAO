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

  // 详情
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
    const sign = this.md5(timestamp + token + nonce + secret).toUpperCase();

    return {
      "Origin": "https://jvlook.com",
      "Referer": "https://jvlook.com/plate1",
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36",
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

  // 纯 JS MD5 实现
  private md5(str: string): string {
    function rotateLeft(lValue: number, iShiftBits: number) {
      return (lValue << iShiftBits) | (lValue >>> (32 - iShiftBits));
    }
    function addUnsigned(lX: number, lY: number) {
      const lX8 = lX & 0x80000000;
      const lY8 = lY & 0x80000000;
      const lX4 = lX & 0x40000000;
      const lY4 = lY & 0x40000000;
      let result = (lX & 0x3FFFFFFF) + (lY & 0x3FFFFFFF);
      if (lX4 & lY4) return result ^ 0x80000000 ^ lX8 ^ lY8;
      if (lX4 | lY4) {
        if (result & 0x40000000) return result ^ 0xC0000000 ^ lX8 ^ lY8;
        else return result ^ 0x40000000 ^ lX8 ^ lY8;
      } else {
        return result ^ lX8 ^ lY8;
      }
    }
    function F(x: number, y: number, z: number) { return (x & y) | (~x & z); }
    function G(x: number, y: number, z: number) { return (x & z) | (y & ~z); }
    function H(x: number, y: number, z: number) { return x ^ y ^ z; }
    function I(x: number, y: number, z: number) { return y ^ (x | ~z); }
    function FF(a: number, b: number, c: number, d: number, x: number, s: number, ac: number) {
      a = addUnsigned(a, addUnsigned(addUnsigned(F(b, c, d), x), ac));
      return addUnsigned(rotateLeft(a, s), b);
    }
    function GG(a: number, b: number, c: number, d: number, x: number, s: number, ac: number) {
      a = addUnsigned(a, addUnsigned(addUnsigned(G(b, c, d), x), ac));
      return addUnsigned(rotateLeft(a, s), b);
    }
    function HH(a: number, b: number, c: number, d: number, x: number, s: number, ac: number) {
      a = addUnsigned(a, addUnsigned(addUnsigned(H(b, c, d), x), ac));
      return addUnsigned(rotateLeft(a, s), b);
    }
    function II(a: number, b: number, c: number, d: number, x: number, s: number, ac: number) {
      a = addUnsigned(a, addUnsigned(addUnsigned(I(b, c, d), x), ac));
      return addUnsigned(rotateLeft(a, s), b);
    }
    function convertToWordArray(str: string) {
      const lWordCount: number[] = [];
      let lMessageLength = str.length;
      let lNumberOfWordsTemp1 = lMessageLength + 8;
      let lNumberOfWordsTemp2 = (lNumberOfWordsTemp1 - (lNumberOfWordsTemp1 % 64)) / 64;
      let lNumberOfWords = (lNumberOfWordsTemp2 + 1) * 16;
      let lByteCount = 0;
      while (lByteCount < lMessageLength) {
        const lWordCountIndex = (lByteCount - (lByteCount % 4)) / 4;
        lWordCount[lWordCountIndex] = lWordCount[lWordCountIndex] | (str.charCodeAt(lByteCount) << ((lByteCount % 4) * 8));
        lByteCount++;
      }
      const lWordCountIndex = (lByteCount - (lByteCount % 4)) / 4;
      lWordCount[lWordCountIndex] = lWordCount[lWordCountIndex] | (0x80 << ((lByteCount % 4) * 8));
      lWordCount[lNumberOfWords - 2] = lMessageLength << 3;
      lWordCount[lNumberOfWords - 1] = lMessageLength >>> 29;
      return lWordCount;
    }
    function wordToHex(lValue: number) {
      let wordToHexValue = "";
      for (let lCount = 0; lCount <= 3; lCount++) {
        const lByte = (lValue >>> (lCount * 8)) & 255;
        let wordToHexValueTemp = "0" + lByte.toString(16);
        wordToHexValue += wordToHexValueTemp.substr(wordToHexValueTemp.length - 2, 2);
      }
      return wordToHexValue;
    }
    let x = convertToWordArray(str);
    let a = 0x67452301;
    let b = 0xEFCDAB89

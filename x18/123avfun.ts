export default class AV123Source implements Handle {
  getConfig() {
    return {
      id: "AvFun",
      name: "123AV",
      api: "https://123av.fun",
      type: 1,
      nsfw: true
    };
  }

  async getCategory() {
    return [
      { id: "", text: "短视频" },
      { id: "long", text: "长视频" }
    ];
  }

  async getCategoryPage() {
    const tid = env.get("category");
    const pg = env.get("page");
    let url = "";

    if (!tid || tid === "") {
      url = pg === 1
        ? `https://123av.fun/zh-cn/`
        : `https://123av.fun/zh-cn/page-${pg}`;
    } else {
      url = pg === 1
        ? `https://123av.fun/zh-cn/${tid}`
        : `https://123av.fun/zh-cn/${tid}/page-${pg}`;
    }

    const html = await req(url);
    const $ = kitty.load(html);
    const items = $("a[href*='/detail/']").toArray().map(el => {
      const id = $(el).attr("href") ?? "";
      const title = $(el).find("img").attr("alt") ?? $(el).find("h1").text().trim();
      const cover = $(el).find("img").attr("data-src") ?? $(el).find("img").attr("src") ?? "";
      const remark = $(el).find(".video-tag").text().trim();
      return { id, title, cover, desc: "", remark, playlist: [] };
    });

    return items;
  }

  async getHome() {
    env.set("category", "");
    env.set("page", 1);
    return await this.getCategoryPage();
  }

  async getDetail() {
    const id = env.get("movieId");
    const html = await req(`https://123av.fun${id}`);
    const $ = kitty.load(html);
    const title = $("h1").text().trim();
    const cover = $("video.detail-video").attr("poster") ?? "";
    const videoUrl = $("video.detail-video").attr("data-src") ?? "";

    return {
      id,
      title,
      cover,
      desc: "",
      remark: "",
      playlist: [
        {
          title: "主线路",
          videos: [{ text: "在线播放", type: "m3u8", url: videoUrl }]
        }
      ]
    };
  }

  async getSearch() {
    const wd = env.get("keyword");
    const pg = env.get("page");
    const url = `https://123av.fun/zh-cn/explore/q-${encodeURIComponent(wd)}/page-${pg}`;
    const html = await req(url);
    const $ = kitty.load(html);
    const items = $("a[href*='/detail/']").toArray().map(el => {
      const id = $(el).attr("href") ?? "";
      const title = $(el).find("img").attr("alt") ?? $(el).find("h1").text().trim();
      const cover = $(el).find("img").attr("data-src") ?? $(el).find("img").attr("src") ?? "";
      const remark = $(el).find(".video-tag").text().trim();
      return { id, title, cover, desc: "", remark, playlist: [] };
    });

    return items;
  }

  async play(flag: string, id: string) {
    return {
      parse: 0,
      url: id,
      header: {
        "User-Agent": "Mozilla/5.0",
        Referer: "https://123av.fun/"
      }
    };
  }
}

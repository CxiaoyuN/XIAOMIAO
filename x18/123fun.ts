export default class AV123Source implements Handle {
  getConfig() {
    return {
      id: "123avfun",
      name: "123Fun",
      api: "https://123av.fun",
      type: 1,
      nsfw: true
    };
  }

  async getCategory() {
    return [
      { id: "page-1", text: "短视频" },
      { id: "long/page-1", text: "长视频" },
      { id: "explore/q-巨乳/page-1", text: "巨乳" },
      { id: "explore/q-口/page-1", text: "口" },
      { id: "explore/q-人妻/page-1", text: "人妻" },
      { id: "explore/q-蘿莉/page-1", text: "蘿莉" },
      { id: "explore/q-中出/page-1", text: "中出" }
    ];
  }

  async getCategoryPage() {
    const tid = env.get("category");
    const url = tid === "page-1"
      ? `https://123av.fun/zh-cn/page-1`
      : `https://123av.fun/zh-cn/${tid}`;

    const html = await req(url);
    const $ = kitty.load(html);
    const items: any[] = [];

    $(".video-card").each((_, el) => {
      const a = $(el).find("a[href*='/detail/']");
      const id = a.attr("href") ?? "";
      const title = a.find("img").attr("alt")?.trim() ?? "";
      const cover = a.find("img").attr("data-src") ?? a.find("img").attr("src") ?? "";
      items.push({ id, title, cover, desc: "", remark: "", playlist: [] });
    });

    return items;
  }

  async getHome() {
    env.set("category", "page-1");
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
    const url = `https://123av.fun/zh-cn/explore/q-${encodeURIComponent(wd)}/page-1`;
    const html = await req(url);
    const $ = kitty.load(html);
    const items: any[] = [];

    $(".video-card").each((_, el) => {
      const a = $(el).find("a[href*='/detail/']");
      const id = a.attr("href") ?? "";
      const title = a.find("img").attr("alt")?.trim() ?? "";
      const cover = a.find("img").attr("data-src") ?? a.find("img").attr("src") ?? "";
      items.push({ id, title, cover, desc: "", remark: "搜索结果", playlist: [] });
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

export default class AV123Source implements Handle {
  getConfig() {
    return {
      id: "123avfun",
      name: "123AV",
      api: "https://123av.fun",
      type: 1,
      nsfw: true
    };
  }

  async getCategory() {
    return [
      { id: "", text: "短视频" },
      { id: "long", text: "长视频" },
      { id: "list", text: "榜单" },
      { id: "explore", text: "探索" }
    ];
  }

  async getCategoryPage() {
    const tid = env.get("category");
    const pg = env.get("page");

    let url = `https://123av.fun/zh-tw/${tid}`;
    if (tid !== "explore") url += `/page-${pg}`;

    const html = await req(url);
    const $ = kitty.load(html);

    let items: any[] = [];

    if (tid === "long") {
      items = $("[style='aspect-ratio: 4/3;']").toArray().map(el => {
        const id = $(el).closest("a").attr("href") ?? "";
        const title = $(el).find("img").attr("alt") ?? "";
        const cover = $(el).find("img").attr("data-src") ?? "";
        return { id, title, cover, desc: "", remark: "长视频", playlist: [] };
      });
    } else if (tid === "") {
      items = $("[style='aspect-ratio: 3/4;']").toArray().map(el => {
        const id = $(el).closest("a").attr("href") ?? "";
        const title = $(el).find("img").attr("alt") ?? "";
        const cover = $(el).find("img").attr("data-src") ?? "";
        return { id, title, cover, desc: "", remark: "短视频", playlist: [] };
      });
    } else if (tid === "list") {
      items = $("a[href*='/detail/']").toArray().map(el => {
        const id = $(el).attr("href") ?? "";
        const title = $(el).find("img").attr("alt") ?? "";
        const cover = $(el).find("img").attr("data-src") ?? "";
        return { id, title, cover, desc: "", remark: "榜单", playlist: [] };
      });
    } else if (tid === "explore") {
      items = $("a[href*='/detail/']").toArray().map(el => {
        const id = $(el).attr("href") ?? "";
        const title = $(el).find("img").attr("alt") ?? "";
        const cover = $(el).find("img").attr("data-src") ?? "";
        return { id, title, cover, desc: "", remark: "探索", playlist: [] };
      });
    }

    return items;
  }

  async getHome() {
    const html = await req("https://123av.fun/zh-tw/");
    const $ = kitty.load(html);
    const items = $("a[href*='/detail/']").toArray().map(el => {
      const id = $(el).attr("href") ?? "";
      const title = $(el).find("img").attr("alt") ?? "";
      const cover = $(el).find("img").attr("data-src") ?? "";
      return { id, title, cover, desc: "", remark: "", playlist: [] };
    });
    return items;
  }

  async getDetail() {
    const id = env.get("movieId");
    const html = await req(`https://123av.fun${id}`);
    const $ = kitty.load(html);
    const title = $("h1").text().trim();
    const cover = $("video.detail-video").attr("poster") ?? "";
    const videoUrl = $("video.detail-video").attr("data-src") ?? "";
    const playlist = [
      {
        title: "主线路",
        videos: [{ text: "在线播放", type: "m3u8", url: videoUrl }]
      }
    ];
    return { id, title, cover, desc: "", remark: "", playlist };
  }

  async getSearch() {
    const wd = env.get("keyword");
    const html = await req(`https://123av.fun/search/${wd}`);
    const $ = kitty.load(html);
    const items = $("a[href*='/detail/']").toArray().map(el => {
      const id = $(el).attr("href") ?? "";
      const title = $(el).find("img").attr("alt") ?? "";
      const cover = $(el).find("img").attr("data-src") ?? "";
      return { id, title, cover, desc: "", remark: "搜索结果", playlist: [] };
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

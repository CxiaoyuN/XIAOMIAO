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
      { id: "explore", text: "探索" },
      { id: "list", text: "榜单" }
    ];
  }

  async getCategoryPage() {
    const tid = env.get("category"); // e.g. "long"
    const pg = env.get("page");
    const url = `https://123av.fun/zh-tw/${tid}?page=${pg}`;
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
    const html = await req("https://123av.fun/zh-tw/");
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

  async getDetail() {
    const id = env.get("movieId"); // e.g. "/zh-tw/detail/4505"
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

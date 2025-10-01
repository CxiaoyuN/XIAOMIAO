export default class AV123Source implements Handle {
  getConfig() {
    return {
      id: "123Fun",
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
      { id: "explore/q-巨乳", text: "巨乳" },
      { id: "explore/q-COSPLAY", text: "COSPLAY" },
      { id: "explore/q-人妻", text: "人妻" },
      { id: "explore/q-蘿莉", text: "蘿莉" },
      { id: "explore/q-sm", text: "SM" },
      { id: "explore/q-中出", text: "中出" }
    ];
  }

  async getCategoryPage() {
    const tid = env.get("category");
    const pg = env.get("page");

    let url = `https://123av.fun/zh-tw/${tid}/page-${pg}`;
    if (tid === "") url = `https://123av.fun/zh-tw/page-${pg}`;
    if (tid === "long") url = `https://123av.fun/zh-tw/long/page-${pg}`;

    const html = await req(url);
    const $ = kitty.load(html);

    const items: any[] = [];

    $("[style='aspect-ratio: 3/4;'], [style='aspect-ratio: 4/3;']").each((_, el) => {
      const style = $(el).attr("style") ?? "";
      const isLong = style.includes("4/3");
      const a = $(el).closest("a");
      const id = a.attr("href") ?? "";
      const title = a.find("img").attr("alt") ?? "";
      const cover = a.find("img").attr("src") ?? "";
      const videoDiv = a.next(".video-play");
      const videoUrl = videoDiv.attr("data-src") ?? "";
      const remark = isLong ? "长视频" : "短视频";

      items.push({
        id,
        title,
        cover,
        desc: "",
        remark,
        playlist: videoUrl
          ? [{ title: "主线路", videos: [{ text: "在线播放", type: "m3u8", url: videoUrl }] }]
          : []
      });
    });

    return items;
  }

  async getHome() {
    return await this.getCategoryPage(); // 首页结构一致，直接复用
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
      const cover = $(el).find("img").attr("src") ?? "";
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

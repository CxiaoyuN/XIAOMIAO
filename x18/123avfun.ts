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
      { id: "explore/q-巨乳", text: "巨乳" },
      { id: "explore/q-人妻", text: "人妻" },
      { id: "explore/q-蘿莉", text: "蘿莉" },
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

    $(".video-play").each((_, el) => {
      const videoUrl = $(el).attr("data-src") ?? "";
      const cover = $(el).attr("data-poster") ?? "";
      const id = $(el).attr("data-id") ?? "";
      const parent = $(el).prev("a");
      const title = parent.find("img").attr("alt") ?? "";

      if (videoUrl && id) {
        items.push({
          id: `/zh-tw/detail/${id}`,
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
        });
      }
    });

    return items;
  }

  async getHome() {
    const html = await req("https://123av.fun/zh-tw/");
    const $ = kitty.load(html);
    const items: any[] = [];

    $(".video-play").each((_, el) => {
      const videoUrl = $(el).attr("data-src") ?? "";
      const cover = $(el).attr("data-poster") ?? "";
      const id = $(el).attr("data-id") ?? "";
      const parent = $(el).prev("a");
      const title = parent.find("img").attr("alt") ?? "";

      if (videoUrl && id) {
        items.push({
          id: `/zh-tw/detail/${id}`,
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
        });
      }
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
    const items: any[] = [];

    $(".video-play").each((_, el) => {
      const videoUrl = $(el).attr("data-src") ?? "";
      const cover = $(el).attr("data-poster") ?? "";
      const id = $(el).attr("data-id") ?? "";
      const parent = $(el).prev("a");
      const title = parent.find("img").attr("alt") ?? "";

      if (videoUrl && id) {
        items.push({
          id: `/zh-tw/detail/${id}`,
          title,
          cover,
          desc: "",
          remark: "搜索结果",
          playlist: [
            {
              title: "主线路",
              videos: [{ text: "在线播放", type: "m3u8", url: videoUrl }]
            }
          ]
        });
      }
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

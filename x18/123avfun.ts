export default class AV123Source implements Handle {
  getConfig() {
    return {
      id: "av123",
      name: "123AV",
      api: "https://123av.fun/zh-cn",
      type: 1,
      nsfw: true
    };
  }

  async getCategory() {
    return [
      { id: "explore/q-口", text: "口交" },
      { id: "explore/q-乳", text: "乳交" },
      { id: "explore/q-颜射", text: "颜射" },
      { id: "explore/q-无码", text: "无码" },
      { id: "explore/q-中文字幕", text: "中文字幕" }
    ];
  }

  async getHome() {
    const cate = env.get("category");
    const page = env.get("page");
    const url = `${env.baseUrl}/${cate}?page=${page}`;
    const html = await req(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/117 Safari/537.36"
      }
    });
    const $ = kitty.load(html);

    const result = $(".video-card").toArray().map(card => {
      const a = $(card).find("a");
      const id = a.attr("href") ?? "";
      const title = $(card).find(".video-title").text().trim();
      let cover = $(card).find("img").attr("data-src") ?? $(card).find("img").attr("src") ?? "";
      if (cover.startsWith("//")) cover = "https:" + cover;
      const remark = $(card).find(".video-duration").text().trim();

      return {
        id,
        title,
        cover,
        desc: "",
        remark,
        playlist: []
      };
    });

    return result;
  }

  async getDetail() {
    const id = env.get("movieId");
    const url = `${env.baseUrl}${id}`;
    const html = await req(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/117 Safari/537.36"
      }
    });
    const $ = kitty.load(html);

    const video = $("video.detail-video");
    const videoUrl = video.attr("data-src") ?? "";
    const cover = video.attr("poster") ?? "";
    const title = $("img[alt]").attr("alt")?.trim() ?? `视频 ${video.attr("data-id")}`;
    const desc = $(".bg-header").text().trim();
    const remark = $(".ct-time span").text().trim() ?? "";

    const playlist = [{
      name: "默认线路",
      videos: [{ title: "", url: videoUrl }]
    }];

    return {
      id,
      title,
      cover,
      desc,
      remark,
      playlist
    };
  }

  async getSearch() {
    const wd = env.get("keyword");
    const page = env.get("page");
    const url = `${env.baseUrl}/search/${wd}?page=${page}`;
    const html = await req(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/117 Safari/537.36"
      }
    });
    const $ = kitty.load(html);

    const result = $(".video-card").toArray().map(card => {
      const a = $(card).find("a");
      const id = a.attr("href") ?? "";
      const title = $(card).find(".video-title").text().trim();
      let cover = $(card).find("img").attr("data-src") ?? $(card).find("img").attr("src") ?? "";
      if (cover.startsWith("//")) cover = "https:" + cover;
      const remark = $(card).find(".video-duration").text().trim();

      return {
        id,
        title,
        cover,
        desc: "",
        remark,
        playlist: []
      };
    });

    return result;
  }

  async parseIframe() {
    return kitty.utils.getM3u8WithIframe(env);
  }
}

export default class AV123Source implements Handle {
  getConfig() {
    return {
      id: "av123",
      name: "AVFUN",
      api: "https://123av.fun/zh-cn",
      type: 1,
      nsfw: true
    };
  }

  async getCategory() {
    return [
      { id: "explore/q-口", text: "口交" },
      { id: "explore/q-对白", text: "对白" },
      { id: "explore/q-巨乳", text: "巨乳" },
      { id: "explore/q-萝莉", text: "萝莉" },
      { id: "explore/q-白虎", text: "白虎" },
      { id: "explore/q-吞精", text: "吞精" },
      { id: "explore/q-内射", text: "内射" },
      { id: "explore/q-自慰", text: "自慰" },
      { id: "explore/q-喷水", text: "喷水" },
      { id: "explore/q-高潮", text: "高潮" },
      { id: "explore/q-Ai", text: "AI" },
      { id: "explore/q-极品", text: "极品" },
      { id: "explore/q-妹妹", text: "妹妹" },
      { id: "explore/q-姐姐", text: "姐姐" },
      { id: "explore/q-ts", text: "人妖" }
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

    const result = $("a.video-card").toArray().map(card => {
      const id = $(card).attr("href") ?? "";
      const title = $(card).find("img").attr("alt")?.trim() ?? "";
      const cover = $(card).find("img").attr("src") ?? "";
      const remark = $(card).find(".video-date").text().trim();
      const desc = $(card).find(".truncate").text().trim();
      const videoUrl = $(card).find(".video-play").attr("data-src") ?? "";

      return {
        id,
        title,
        cover,
        desc,
        remark,
        playlist: videoUrl
          ? [{
              name: "默认线路",
              videos: [{ title: "", url: videoUrl }]
            }]
          : []
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
    const remark = $(".video-date").text().trim();

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

    const result = $("a.video-card").toArray().map(card => {
      const id = $(card).attr("href") ?? "";
      const title = $(card).find("img").attr("alt")?.trim() ?? "";
      const cover = $(card).find("img").attr("src") ?? "";
      const remark = $(card).find(".video-date").text().trim();
      const desc = $(card).find(".truncate").text().trim();
      const videoUrl = $(card).find(".video-play").attr("data-src") ?? "";

      return {
        id,
        title,
        cover,
        desc,
        remark,
        playlist: videoUrl
          ? [{
              name: "默认线路",
              videos: [{ title: "", url: videoUrl }]
            }]
          : []
      };
    });

    return result;
  }

  async parseIframe() {
    return kitty.utils.getM3u8WithIframe(env);
  }
}

export default class AV123Source implements Handle {
  getConfig() {
    return {
      id: "123avfun",
      name: "123AV",
      api: "https://123av.fun/zh-cn",
      type: 1,
      nsfw: true
    };
  }

  async getCategory() {
    return [
      { id: "publish-time/sort-desc", text: "发布时间" },
      { id: "view-count/sort-asc", text: "播放数" },
      { id: "comment-count/sort-desc", text: "评论数" },
      { id: "favorite-count/sort-desc", text: "收藏数" }
    ];
  }

  async getCategoryPage() {
    const tid = env.get("category");
    const pg = env.get("page");
    const url = `https://123av.fun/zh-cn/${tid}/page-${pg}`;
    const html = await req(url);
    const $ = kitty.load(html);
    const items = $(".video-card").toArray().map(el => {
      const id = $(el).attr("href") ?? "";
      const title = $(el).find(".truncate").text().trim();
      const cover = $(el).find("img").attr("data-src") ?? $(el).find("img").attr("src") ?? "";
      const videoUrl = $(el).find(".video-play").attr("data-src") ?? "";
      const remark = $(el).find(".video-date").text().trim() + " / " + $(el).find(".view-count").text().trim();
      return {
        id,
        title,
        cover,
        desc: "",
        remark,
        playlist: [
          {
            title: "主线路",
            videos: [{ text: "播放", type: "mp4", url: videoUrl }]
          }
        ]
      };
    });
    return items;
  }

  async getHome() {
    env.set("category", "publish-time/sort-desc");
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
          videos: [{ text: "播放", type: "m3u8", url: videoUrl }]
        }
      ]
    };
  }

  async getSearch() {
    const wd = env.get("keyword");
    const html = await req(`https://123av.fun/explore/q-${encodeURIComponent(wd)}`);
    const $ = kitty.load(html);
    const items = $(".video-card").toArray().map(el => {
      const id = $(el).attr("href") ?? "";
      const title = $(el).find(".truncate").text().trim();
      const cover = $(el).find("img").attr("data-src") ?? $(el).find("img").attr("src") ?? "";
      const videoUrl = $(el).find(".video-play").attr("data-src") ?? "";
      const remark = $(el).find(".video-date").text().trim() + " / " + $(el).find(".view-count").text().trim();
      return {
        id,
        title,
        cover,
        desc: "",
        remark,
        playlist: [
          {
            title: "主线路",
            videos: [{ text: "播放", type: "mp4", url: videoUrl }]
          }
        ]
      };
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

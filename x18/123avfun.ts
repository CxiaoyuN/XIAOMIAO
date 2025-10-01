export default class AV123 implements Handle {
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
      { id: "publish-time/sort-desc", text: "最新" },
      { id: "view-count/sort-asc", text: "播放数" },
      { id: "comment-count/sort-desc", text: "评论数" },
      { id: "favorite-count/sort-desc", text: "收藏数" }
    ];
  }

  async getCategoryPage() {
    const tid = env.get("category");
    const page = env.get("page", "1");
    const url = `${env.baseUrl}/${tid}/page-${page}`;
    const html = await req(url);
    const $ = kitty.load(html);
    const items = $(".video-card").toArray().map(el => {
      const id = $(el).attr("href") ?? "";
      const title = $(el).find(".truncate").text().trim();
      const cover = $(el).find("img").attr("src") ?? "";
      const remark = $(el).find(".video-date").text().trim() + " / " + $(el).find(".view-count").text().trim();
      return {
        id,
        title,
        cover,
        desc: "",
        remark
      };
    });
    return items;
  }

  async getHome() {
    env.set("category", "publish-time/sort-desc");
    return await this.getCategoryPage();
  }

  async getSearch() {
    const keyword = env.get("keyword");
    const url = `${env.baseUrl}/explore/q-${encodeURIComponent(keyword)}`;
    const html = await req(url);
    const $ = kitty.load(html);
    const items = $(".video-card").toArray().map(el => {
      const id = $(el).attr("href") ?? "";
      const title = $(el).find(".truncate").text().trim();
      const cover = $(el).find("img").attr("src") ?? "";
      const remark = $(el).find(".video-date").text().trim() + " / " + $(el).find(".view-count").text().trim();
      return {
        id,
        title,
        cover,
        desc: "",
        remark
      };
    });
    return items;
  }

  async getDetail() {
    const id = env.get("movieId");
    const url = `${env.baseUrl}${id}`;
    const html = await req(url);
    const $ = kitty.load(html);
    const title = $("h1").text().trim() || $(".truncate").text().trim();
    const cover = $("video.detail-video").attr("poster") ?? "";
    const videoUrl = $("video.detail-video").attr("data-src") ?? "";
    const desc = $(".bg-header").text().trim();
    const remark = $(".text-xs:contains(发表于)").text().trim();
    return {
      id,
      title,
      cover,
      desc,
      remark,
      playlist: [
        {
          title: "主线路",
          videos: [
            {
              text: "播放",
              type: "m3u8",
              url: videoUrl
            }
          ]
        }
      ]
    };
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

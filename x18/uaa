export default class UAA implements Handle {
  getConfig() {
    return <IConfig>{
      id: "uaa$",
      name: "UAA视频",
      type: 1,
      nsfw: true,
      api: "https://www.uaa.com",
    };
  }

  // 首页列表
  async getHome() {
    const page = env.get("page") || 1;
    const url = `${env.baseUrl}/video?page=${page}`;
    const html = await req(url);
    const $ = kitty.load(html);

    return $(".video-card").map((i, el) => {
      const a = $(el).find("a");
      return <IMovie>{
        id: a.attr("href"),
        title: a.find(".title").text().trim(),
        cover: a.find("img").attr("src"),
        remark: a.find(".duration").text().trim(),
      };
    }).get();
  }

  // 详情页（解析播放地址）
  async getDetail() {
    const id = env.get("movieId");
    const url = `${env.baseUrl}${id}`;
    const html = await req(url);
    const $ = kitty.load(html);

    const title = $("h1").text().trim() || $("title").text().trim();
    const poster = $("video").attr("poster");
    const m3u8 = $("video source[type='application/x-mpegURL']").attr("src");

    return <IMovie>{
      id,
      title,
      cover: poster,
      desc: "",
      playlist: [
        {
          title: "默认线路",
          videos: m3u8 ? [{ text: "播放", id: m3u8 }] : [],
        },
      ],
    };
  }

  // 搜索功能（如果页面支持）
  async getSearch(keyword: string) {
    const url = `${env.baseUrl}/search?wd=${encodeURIComponent(keyword)}`;
    const html = await req(url);
    const $ = kitty.load(html);

    return $(".video-card").map((i, el) => {
      const a = $(el).find("a");
      return <IMovie>{
        id: a.attr("href"),
        title: a.find(".title").text().trim(),
        cover: a.find("img").attr("src"),
        remark: a.find(".duration").text().trim(),
      };
    }).get();
  }

  async parseIframe() {
    return env.get<string>("iframe");
  }
}

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

  // 分类列表
  async getCategory() {
    const url = `${env.baseUrl}/video`;
    const html = await req(url);
    const $ = kitty.load(html);

    return $(".links_box a").map((i, el) => {
      return <ICategory>{
        id: $(el).attr("href"),
        text: $(el).text().trim(),
      };
    }).get();
  }

  // 视频列表
  async getHome() {
    const cate = env.get("category") || "/video/list";
    const page = env.get("page") || 1;
    const url = `${env.baseUrl}${cate}${cate.includes("?") ? "&" : "?"}page=${page}`;
    const html = await req(url);
    const $ = kitty.load(html);

    return $("li.video_li").map((i, el) => {
      const a = $(el).find(".cover_box a");
      return <IMovie>{
        id: a.attr("href"),
        title: $(el).find(".video_title").text().trim(),
        cover: a.find("img").attr("src"),
        remark: $(el).find(".video_time").text().trim(),
      };
    }).get();
  }

  // 搜索功能
  async getSearch(keyword: string) {
    const page = env.get("page") || 1;
    const url = `${env.baseUrl}/search?wd=${encodeURIComponent(keyword)}&page=${page}`;
    const html = await req(url);
    const $ = kitty.load(html);

    return $("li.video_li").map((i, el) => {
      const a = $(el).find(".cover_box a");
      return <IMovie>{
        id: a.attr("href"),
        title: $(el).find(".video_title").text().trim(),
        cover: a.find("img").attr("src"),
        remark: $(el).find(".video_time").text().trim(),
      };
    }).get();
  }

  // 详情页（支持 m3u8 和 iframe）
  async getDetail() {
    const id = env.get("movieId");
    const url = `${env.baseUrl}${id}`;
    const html = await req(url);
    const $ = kitty.load(html);

    const title = $("h1").text().trim() || $("title").text().trim();
    const poster = $("video").attr("poster") || $("meta[property='og:image']").attr("content") || "";
    const m3u8 = $("video source[type='application/x-mpegURL']").attr("src");
    const iframe = $("iframe").attr("src");

    let playlist: IPlaylist[] = [];

    if (m3u8) {
      playlist = [{ title: "默认线路", videos: [{ text: "播放", id: m3u8 }] }];
    } else if (iframe) {
      env.set("iframe", iframe);
      playlist = [{ title: "默认线路", videos: [{ text: "播放", id: iframe }] }];
    }

    return <IMovie>{
      id,
      title,
      cover: poster,
      desc: "",
      playlist,
    };
  }

  // iframe 播放支持
  async parseIframe() {
    return env.get<string>("iframe");
  }
}

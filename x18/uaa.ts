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

  // ✅ 分类列表（已确认链接结构）
  async getCategory() {
    return [
      { id: "/video/list", text: "全部视频" },
      { id: "/video/rank?type=1", text: "排行榜" },
      { id: "/actress", text: "AV女优" },
      { id: "/authors", text: "片商排行" },
      { id: "/chinese-av-porn", text: "国产视频" },
      { id: "/jav", text: "日本AV" },
      { id: "/video/list?category=无码流出&origin=2", text: "无码流出" },
      { id: "/video/list?origin=3", text: "H动漫" },
      { id: "/video/list?category=里番", text: "里番" },
      { id: "/video/list?category=泡面番", text: "泡面番" },
    ];
  }

  // ✅ 视频列表页（修复选择器 + 封面图 + 发布时间等）
  async getHome() {
    const cate = env.get("category") || "/video/list";
    const page = env.get("page") || 1;
    const url = `${env.baseUrl}${cate}${cate.includes("?") ? "&" : "?"}page=${page}`;
    const html = await req(url);
    const $ = kitty.load(html);

    return $("li.video_li").map((i, el) => {
      const a = $(el).find(".cover_box a");
      const img = a.find("img.cover");
      const id = a.attr("href") ?? "";
      const title = $(el).find(".brief_box .title a").text().trim();

      // ✅ 封面图处理（支持懒加载）
      let cover = img.attr("src") || img.attr("data-cfsrc") || "";
      if (cover && !cover.startsWith("http")) {
        cover = `${env.baseUrl}${cover}`;
      }

      // ✅ 发布时间、收藏数、播放量
      const spans = $(el).find(".info_box .view span");
      const time = spans.eq(0).text().trim();
      const favs = spans.eq(1).text().trim();
      const views = spans.eq(2).text().trim();

      // ✅ 作者信息
      const author = $(el).find("a[href*='/video/author']").text().trim();

      return <IMovie>{
        id,
        title,
        cover,
        remark: `${time} | ❤${favs} | 👁${views}`,
        extra: author || "",
      };
    }).get();
  }

  // ✅ 搜索功能（结构一致）
  async getSearch(keyword: string) {
    const page = env.get("page") || 1;
    const url = `${env.baseUrl}/search?wd=${encodeURIComponent(keyword)}&page=${page}`;
    const html = await req(url);
    const $ = kitty.load(html);

    return $("li.video_li").map((i, el) => {
      const a = $(el).find(".cover_box a");
      const img = a.find("img.cover");
      const id = a.attr("href") ?? "";
      const title = $(el).find(".brief_box .title a").text().trim();

      let cover = img.attr("src") || img.attr("data-cfsrc") || "";
      if (cover && !cover.startsWith("http")) {
        cover = `${env.baseUrl}${cover}`;
      }

      const spans = $(el).find(".info_box .view span");
      const time = spans.eq(0).text().trim();
      const favs = spans.eq(1).text().trim();
      const views = spans.eq(2).text().trim();

      const author = $(el).find("a[href*='/video/author']").text().trim();

      return <IMovie>{
        id,
        title,
        cover,
        remark: `${time} | ❤${favs} | 👁${views}`,
        extra: author || "",
      };
    }).get();
  }

  // ✅ 详情页解析（标题、封面、描述、播放地址）
  async getDetail() {
    const id = env.get("movieId");
    const url = `${env.baseUrl}${id}`;
    const html = await req(url);
    const $ = kitty.load(html);

    const title =
      $("#mui-player").attr("video_title") ||
      $("#title-name").text().trim() ||
      $("title").text().trim();

    const m3u8 =
      $("#mui-player").attr("src") ||
      $("video").attr("src");

    const poster =
      $("#mui-player").attr("poster") ||
      $(".mplayer-poster img").attr("src") ||
      $("meta[property='og:image']").attr("content") ||
      "";

    const iframe = $("iframe").attr("src");

    const desc =
      $("meta[name='description']").attr("content") ||
      $(".video-intro").text().trim() ||
      $(".desc_box").text().trim() ||
      "";

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
      desc,
      playlist,
    };
  }

  // ✅ iframe 播放支持
  async parseIframe() {
    return env.get<string>("iframe");
  }
}

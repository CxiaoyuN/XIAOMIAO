export default class XifanArea implements Handle {
  getConfig() {
    return <IConfig>{
      id: "xifan_area",
      name: "稀饭动漫(地区)",
      api: "https://dm.xifanacg.com",
      type: 1,
      nsfw: false,
    };
  }

  // ✅ 分类：按地区
  async getCategory() {
    return [
      { id: "/search/area/日本.html", text: "日本动漫" },
    ];
  }

  // ✅ 列表页
  async getHome() {
    const cate = env.get("category") || "/search/area/日本.html";
    const page = env.get("page") || 1;
    // 稀饭动漫分页规则：/search/area/日本/page/2.html
    const url = cate.replace(".html", `/page/${page}.html`);
    const html = await req(`${env.baseUrl}${url}`);
    const $ = kitty.load(html);

    return $(".anime_list .anime_item").map((i, el) => {
      const a = $(el).find("a");
      const id = a.attr("href") ?? "";
      const title = a.attr("title") ?? a.text().trim();
      const cover = $(el).find("img").attr("src") ?? "";
      const remark = $(el).find(".anime_status").text().trim();
      return <IMovie>{ id, title, cover, remark };
    }).get();
  }

  // ✅ 搜索
  async getSearch(keyword: string) {
    const page = env.get("page") || 1;
    const url = `${env.baseUrl}/search.html?wd=${encodeURIComponent(keyword)}&page=${page}`;
    const html = await req(url);
    const $ = kitty.load(html);

    return $(".anime_list .anime_item").map((i, el) => {
      const a = $(el).find("a");
      const id = a.attr("href") ?? "";
      const title = a.attr("title") ?? a.text().trim();
      const cover = $(el).find("img").attr("src") ?? "";
      const remark = $(el).find(".anime_status").text().trim();
      return <IMovie>{ id, title, cover, remark };
    }).get();
  }

  // ✅ 详情页
  async getDetail() {
    const id = env.get("movieId");
    const url = `${env.baseUrl}${id}`;
    const html = await req(url);
    const $ = kitty.load(html);

    const title = $("h1").text().trim();
    const desc = $(".anime_detail .desc").text().trim();
    const cover = $("meta[property='og:image']").attr("content") ?? "";
    const iframe = $("iframe").attr("src");

    let playlist: IPlaylist[] = [];
    if (iframe) {
      env.set("iframe", iframe);
      playlist = [{ title: "默认线路", videos: [{ text: "播放", id: iframe }] }];
    }

    return <IMovie>{ id, title, desc, cover, playlist };
  }

  // ✅ iframe 播放支持
  async parseIframe() {
    return env.get<string>("iframe");
  }
}

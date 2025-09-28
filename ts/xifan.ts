export default class Xifan implements Handle {
  getConfig() {
    return <IConfig>{
      id: "xifan",
      name: "稀饭动漫",
      api: "https://dm.xifanacg.com",
      type: 1,
      nsfw: false,
    };
  }

  async getCategory() {
    return [
      { id: "/type/1.html", text: "日本动漫" },
      { id: "/type/2.html", text: "国产动漫" },
      { id: "/type/3.html", text: "剧场版" },
      { id: "/search/area/欧美.html", text: "欧美动漫" },
    ];
  }

  async getHome() {
    const cate = env.get("category") || "/type/1.html";
    const page = env.get("page") || 1;
    const url = `${env.baseUrl}${cate.replace(".html", "")}-${page}.html`;
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

  async parseIframe() {
    return env.get<string>("iframe");
  }
}

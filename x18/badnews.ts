export default class BadNewsSource implements Handle {
  getConfig() {
    return {
      id: "badnews",
      name: "BadNews",
      api: "https://bad.news",
      type: 1,
      nsfw: true
    };
  }

  async getCategory() {
    return [
      { id: "porn", text: "短视频" },
      { id: "long-porn", text: "长视频" }
    ];
  }

  async getHome() {
    const cate = env.get("category");
    const page = env.get("page");
    const url = `${env.baseUrl}/tag/${cate}?page=${page}`;
    const html = await req(url);
    const $ = kitty.load(html);

    const result = $("article").toArray().map(item => {
      const id = $(item).find("a").attr("href") ?? "";
      const title = $(item).find("a").text().trim();
      const cover = $(item).find("video").attr("poster") ?? "";
      const remark = $(item).find("time").text().trim();

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
    const html = await req(url);
    const $ = kitty.load(html);

    const title = $("h1").text().trim();
    const cover = $("video").attr("poster") ?? "";
    const desc = $(".entry-content").text().trim();
    const remark = $("time").text().trim();

    const videoUrl = $("video source").attr("src") ?? "";

    const playlist = [{
      name: "默认",
      videos: [{ title, url: videoUrl }]
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
    const url = `${env.baseUrl}/?s=${encodeURIComponent(wd)}&page=${page}`;
    const html = await req(url);
    const $ = kitty.load(html);

    const result = $("article").toArray().map(item => {
      const id = $(item).find("a").attr("href") ?? "";
      const title = $(item).find("a").text().trim();
      const cover = $(item).find("video").attr("poster") ?? "";
      const remark = $(item).find("time").text().trim();

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

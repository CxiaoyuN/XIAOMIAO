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

  async getHome() {
    const cate = env.get("category");
    const page = env.get("page");
    const url = `${env.baseUrl}/tag/${cate}?page=${page}`;
    const html = await req(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/117 Safari/537.36"
      }
    });
    const $ = kitty.load(html);

    const result = $("video.my-videos").toArray().map(video => {
      const cover = video.attr("poster") ?? "";
      const videoUrl = video.attr("data-source") ?? "";
      const remark = $(video).closest(".coverdiv").find(".ct-time span").text().trim();

      // 提取 onclick 中的跳转链接
      const onclick = $(video).closest(".coverdiv").parent().find("[onclick*='Clipboard.copy']").attr("onclick") ?? "";
      const match = onclick.match(/Clipboard\.copy\('([^']+)'\)/);
      const id = match ? match[1] : video.attr("data-id") ?? "";

      return {
        id,
        title: "",
        cover,
        desc: "",
        remark,
        playlist: [{
          name: "默认线路",
          videos: [{ title: "", url: videoUrl }]
        }]
      };
    });

    return result;
  }

  async getSearch() {
    const wd = env.get("keyword");
    const page = env.get("page");
    const url = `${env.baseUrl}/?s=${encodeURIComponent(wd)}&page=${page}`;
    const html = await req(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/117 Safari/537.36"
      }
    });
    const $ = kitty.load(html);

    const result = $("video.my-videos").toArray().map(video => {
      const cover = video.attr("poster") ?? "";
      const videoUrl = video.attr("data-source") ?? "";
      const remark = $(video).closest(".coverdiv").find(".ct-time span").text().trim();

      const onclick = $(video).closest(".coverdiv").parent().find("[onclick*='Clipboard.copy']").attr("onclick") ?? "";
      const match = onclick.match(/Clipboard\.copy\('([^']+)'\)/);
      const id = match ? match[1] : video.attr("data-id") ?? "";

      return {
        id,
        title: "",
        cover,
        desc: "",
        remark,
        playlist: [{
          name: "默认线路",
          videos: [{ title: "", url: videoUrl }]
        }]
      };
    });

    return result;
  }

  async getCategory() {
    return [
      { id: "porn", text: "短视频" },
      { id: "long-porn", text: "长视频" }
    ];
  }

  async getDetail() {
    throw new Error("此源无详情页，所有信息已在分类页中提供");
  }

  async parseIframe() {
    return kitty.utils.getM3u8WithIframe(env);
  }
}

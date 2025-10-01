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

    const result = $("video.my-videos").toArray().map(video => {
      const id = video.attr("data-id") ?? "";
      const title = `视频 ${id}`;
      const cover = video.attr("poster") ?? "";
      const videoUrl = video.attr("data-source") ?? "";
      const remark = $(video).closest(".coverdiv").find(".ct-time span").text().trim();

      return {
        id,
        title,
        cover,
        desc: "",
        remark,
        playlist: [{
          name: "默认线路",
          videos: [{ title, url: videoUrl }]
        }]
      };
    });

    return result;
  }

  async getSearch() {
    const wd = env.get("keyword");
    const page = env.get("page");
    const url = `${env.baseUrl}/?s=${encodeURIComponent(wd)}&page=${page}`;
    const html = await req(url);
    const $ = kitty.load(html);

    const result = $("video.my-videos").toArray().map(video => {
      const id = video.attr("data-id") ?? "";
      const title = `搜索结果 ${id}`;
      const cover = video.attr("poster") ?? "";
      const videoUrl = video.attr("data-source") ?? "";
      const remark = $(video).closest(".coverdiv").find(".ct-time span").text().trim();

      return {
        id,
        title,
        cover,
        desc: "",
        remark,
        playlist: [{
          name: "默认线路",
          videos: [{ title, url: videoUrl }]
        }]
      };
    });

    return result;
  }

  async getDetail() {
    // 无详情页，直接抛出错误或返回空
    throw new Error("此源无详情页，所有信息已在分类页中提供");
  }

  async parseIframe() {
    return kitty.utils.getM3u8WithIframe(env);
  }
}

export default class FourHu implements Handle {
  getConfig() {
    return {
      id: "4hu",
      name: "四虎成人",
      api: "https://www.4hu.tv",
      type: 1,
      nsfw: true
    };
  }

  async getCategory() {
    return [
      { id: "1", text: "国产" },
      { id: "2", text: "自拍视频" },
      { id: "3", text: "淫妻作乐" },
      { id: "4", text: "国产传媒" },
      { id: "5", text: "热门探花" },
      { id: "6", text: "开放青年" },
      { id: "7", text: "JVID专区" },
      { id: "8", text: "SWAG专区" },
      { id: "9", text: "直播录屏" },
      { id: "10", text: "短视频" },
      { id: "11", text: "无码破解" },
      { id: "12", text: "动漫卡通" },
      { id: "13", text: "三级伦理" },
      { id: "14", text: "热门女优" },
      { id: "15", text: "女性向純愛" },
      { id: "16", text: "GIGA女战士" },
      { id: "17", text: "男男视频" }
    ];
  }

  async getHome() {
    const html = await req("https://www.4hu.tv/");
    const $ = kitty.load(html);
    const items = $(".video-item").toArray().map((el) => {
      const id = $(el).find("a").attr("href") ?? "";
      const title = $(el).find("img").attr("alt") ?? "";
      const cover = $(el).find("img").attr("data-src") ?? "";
      const remark = $(el).find(".video-tag").text() ?? "";
      return { id, title, cover, desc: "", remark, playlist: [] };
    });
    return items;
  }

  async getCategoryPage() {
    const tid = env.get("category");
    const pg = env.get("page");
    const html = await req(`https://www.4hu.tv/category/${tid}?page=${pg}`);
    const $ = kitty.load(html);
    const items = $(".video-item").toArray().map((el) => {
      const id = $(el).find("a").attr("href") ?? "";
      const title = $(el).find("img").attr("alt") ?? "";
      const cover = $(el).find("img").attr("data-src") ?? "";
      const remark = $(el).find(".video-tag").text() ?? "";
      return { id, title, cover, desc: "", remark, playlist: [] };
    });
    return items;
  }

  async getDetail() {
    const id = env.get("movieId");
    const html = await req(`${env.baseUrl}${id}`);
    const $ = kitty.load(html);
    const title = $("h1").text();
    const cover = $(".video-player").find("video").attr("poster") ?? "";
    const videoUrl = $(".video-player").find("video").attr("src") ?? "";

    const playlist = [
      {
        title: "默认线路",
        videos: [
          {
            text: "高清播放",
            type: "mp4",
            url: videoUrl
          }
        ]
      }
    ];

    return { id, title, cover, desc: "", remark: "", playlist };
  }

  async getSearch() {
    const wd = env.get("keyword");
    const html = await req(`https://www.4hu.tv/search/${wd}`);
    const $ = kitty.load(html);
    const items = $(".video-item").toArray().map((el) => {
      const id = $(el).find("a").attr("href") ?? "";
      const title = $(el).find("img").attr("alt") ?? "";
      const cover = $(el).find("img").attr("data-src") ?? "";
      const remark = $(el).find(".video-tag").text() ?? "";
      return { id, title, cover, desc: "", remark, playlist: [] };
    });
    return items;
  }

  async play(flag: string, id: string) {
    return {
      parse: 0,
      url: id,
      header: {
        "User-Agent": "Mozilla/5.0",
        Referer: "https://www.4hu.tv/"
      }
    };
  }
}

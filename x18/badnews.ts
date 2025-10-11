export default class BadNewsSource implements Handle {
  getConfig() {
    return {
      id: "badnews",
      name: "BadNews",
      api: "https://bad.news/tag/porn",
      type: 1,
      nsfw: true
    };
  }

  async getCategory() {
    return [
      { id: "sort-hot", text: "热门" },
      { id: "sort-new", text: "最新" },
      { id: "sort-score", text: "得分" },
      { id: "sort-better", text: "精选" },
      { id: "long-porn", text: "长视频" }
    ];
  }

async getHome () {
  const cate = env.get("category");
  const page = env.get("page");
  const url = cate === "long-porn"
    ? `https://bad.news/tag/long-porn/page-${page}`
    : `https://bad.news/tag/porn/${cate}/page-${page}`;

  const html = await req(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/117 Safari/537.36"
    }
  });

  const $ = kitty.load(html);
  const result = $(".link.show").toArray().map(item => {
    const video = $(item).find("video.my-videos");
    const cover = video.attr("poster") ?? video.attr("data-poster") ?? "";
    const videoUrl = video.attr("data-source") ?? "";
    const remark = $(item).find(".ct-time span").text().trim();
    const idMatch = $(item).find(".share-copy-icon").attr("onclick")?.match(/Clipboard\.copy\('([^']+)'/);
    const id = idMatch ? idMatch[1] : video.attr("data-id") ?? "";
    const title = $(item).find("a.title").text().trim();

    return {
      id,
      title,
      cover,
      desc: "",
      remark,
      playlist: [
        {
          name: "默认线路",
          videos: [
            {
              title,
              url: videoUrl
            }
          ]
        }
      ]
    };
  });

  return result;
}

async getSearch() {
  const wd = env.get("keyword");
  const page = env.get("page");
  const url = `https://bad.news/search/q-${encodeURIComponent(wd)}/via-log/page-${page}`;

  const html = await req(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/117 Safari/537.36"
    }
  });

  const $ = kitty.load(html);
  const result = $(".link.show").toArray().map(item => {
    const video = $(item).find("video.my-videos");
    const cover = video.attr("poster") ?? video.attr("data-poster") ?? "";
    const videoUrl = video.attr("data-source") ?? "";
    const remark = $(item).find(".ct-time span").text().trim();
    const idMatch = $(item).find(".share-copy-icon").attr("onclick")?.match(/Clipboard\.copy\('([^']+)'/);
    const id = idMatch ? idMatch[1] : video.attr("data-id") ?? "";
    const title = $(item).find("a.title").text().trim();

    return {
      id,
      title,
      cover,
      desc: "",
      remark,
      playlist: [
        {
          name: "默认线路",
          videos: [
            {
              title,
              url: videoUrl
            }
          ]
        }
      ]
    };
  });

  return result;
}

  async getDetail() {
    throw new Error("此源无详情页，所有信息已在分类页中提供");
  }

  async parseIframe() {
    return kitty.utils.getM3u8WithIframe(env);
  }
}

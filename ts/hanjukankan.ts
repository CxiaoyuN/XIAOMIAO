// ts/hanjukankan.ts
// 小猫影视 JS 扩展源：韩剧看看
// 作者：花专用

export default class hanjukankan implements Handle {
  getConfig() {
    return <Iconfig>{
      id: "hanjukankan$",
      name: "韩剧看看",
      type: 1,
      nsfw: false,
      api: "https://www.hanjukankan.com",
    }
  }

  async getCategory() {
    // 三大分类：韩剧、韩影、韩综
    return [
      { text: "韩剧", id: "/xvs1xatxbtxctxdtxetxftxgtxhtatbtct.html" },
      { text: "韩影", id: "/xvs2xatxbtxctxdtxetxftxgtxhtatbtct.html" },
      { text: "韩综", id: "/xvs3xatxbtxctxdtxetxftxgtxhtatbtct.html" },
    ]
  }

  async getHome() {
    const cate = env.get<string>('category')
    const page = env.get<number>('page') || 1
    const url = `${env.baseUrl}${cate}?page=${page}`
    const html = await req(url)
    const $ = kitty.load(html)

    return $('.module-poster-item')
      .toArray()
      .map(item => {
        const a = $(item).find('a').first()
        const img = $(item).find('img').first()
        return {
          id: a.attr('href') ?? "",
          title: a.attr('title') || img.attr('alt') || "",
          cover: img.attr('data-original') || img.attr('src') || "",
          remark: $(item).find('.module-item-note').text().trim() || ""
        }
      })
  }

  async getDetail() {
    const id = env.get<string>('movieId')
    const html = await req(`${env.baseUrl}${id}`)
    const $ = kitty.load(html)

    const title = $('h1, .title, .module-info-heading .module-info-title').text().trim()
    const cover = $('.module-info-poster img, .pic img').attr('data-original') ||
                  $('.module-info-poster img, .pic img').attr('src') || ""

    const videos = $('.module-play-list li, .playlist li')
      .toArray()
      .map(li => {
        const a = $(li).find('a').first()
        return { id: a.attr('href') ?? "", text: a.text().trim() }
      })

    return {
      id,
      title,
      cover,
      playlist: [{ title: "默认", videos }]
    }
  }

  async getSearch() {
    const wd = env.get<string>('keyword')
    const page = env.get<number>('page') || 1
    const url = `${env.baseUrl}/vodsearch.html?wd=${encodeURIComponent(wd)}&page=${page}`
    const html = await req(url)
    const $ = kitty.load(html)

    return $('.module-poster-item')
      .toArray()
      .map(item => {
        const a = $(item).find('a').first()
        const img = $(item).find('img').first()
        return {
          id: a.attr('href') ?? "",
          title: a.attr('title') || img.attr('alt') || "",
          cover: img.attr('data-original') || img.attr('src') || "",
          remark: $(item).find('.module-item-note').text().trim() || ""
        }
      })
  }

  async parseIframe() {
    const iframe = env.get<string>('iframe')
    const html = await req(`${env.baseUrl}${iframe}`)
    const $ = kitty.load(html)

    // 常见播放器容器
    return $('#mse').attr('data-url') ||
           $('video source').attr('src') ||
           $('iframe').attr('src') ||
           ""
  }
}

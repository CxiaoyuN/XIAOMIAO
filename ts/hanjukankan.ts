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
    return [
      { text: "韩剧", id: "1" },
      { text: "韩影", id: "2" },
      { text: "韩综", id: "3" },
      { text: "其他", id: "4" },
    ]
  }

  async getHome() {
    const cate = env.get<string>('category')
    const page = env.get<number>('page') || 1
    const url = `${env.baseUrl}/vodtype/${cate}-${page}.html`
    const html = await req(url)
    const $ = kitty.load(html)

    return $('.module-item, .hl-item, .vodlist_item')
      .toArray()
      .map(item => {
        const a = $(item).find('a').first()
        const img = $(item).find('img').first()
        return {
          id: a.attr('href') ?? "",
          title: img.attr('alt') || a.attr('title') || "",
          cover: img.attr('data-src') || img.attr('src') || "",
          remark: $(item).find('.module-item-note, .vodlist_sub').text().trim() || ""
        }
      })
  }

  async getDetail() {
    const id = env.get<string>('movieId')
    const html = await req(`${env.baseUrl}${id}`)
    const $ = kitty.load(html)

    const title = $('h1, .title').text().trim()
    const cover = $('.module-info-poster img, .pic img').attr('src') || ""

    const videos = $('.module-play-list li, .playlist li')
      .toArray()
      .map(li => {
        const a = $(li).find('a').first()
        return { id: a.attr('href') ?? "", text: a.text().trim() }
      })

    return { id, title, cover, playlist: [{ title: "默认", videos }] }
  }

  async getSearch() {
    const wd = env.get<string>('keyword')
    const page = env.get<number>('page') || 1
    const url = `${env.baseUrl}/vodsearch.html?wd=${encodeURIComponent(wd)}&page=${page}`
    const html = await req(url)
    const $ = kitty.load(html)

    return $('.module-item, .hl-item, .vodlist_item')
      .toArray()
      .map(item => {
        const a = $(item).find('a').first()
        const img = $(item).find('img').first()
        return {
          id: a.attr('href') ?? "",
          title: img.attr('alt') || a.attr('title') || "",
          cover: img.attr('data-src') || img.attr('src') || "",
          remark: $(item).find('.module-item-note, .vodlist_sub').text().trim() || ""
        }
      })
  }

  async parseIframe() {
    const iframe = env.get<string>('iframe')
    const html = await req(`${env.baseUrl}${iframe}`)
    const $ = kitty.load(html)

    return $('#mse').attr('data-url') ||
           $('video source').attr('src') ||
           $('iframe').attr('src') ||
           ""
  }
}

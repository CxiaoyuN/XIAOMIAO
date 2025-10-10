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
        const a = $(item).first()
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
    const desc = $('.module-info-introduction, .content_desc, .vod_content').text().trim()

    const playlist: IPlaylist[] = []
    $('.module-play-list').each((i, el) => {
      const lineTitle = $(el).find('.module-tab-item, .title').text().trim() || `线路${i+1}`
      const videos = $(el).find('a').toArray().map(a => {
        const href = $(a).attr('href') ?? ""
        const text = $(a).text().trim()
        return { id: href, text }
      })
      playlist.push({ title: lineTitle, videos })
    })

    return {
      id,
      title,
      cover,
      desc,
      playlist
    }
  }

  async getSearch() {
    const wd = env.get<string>('keyword')
    const page = env.get<number>('page') || 1
    const url = `${env.baseUrl}/xvseabcdefghigklm.html?wd=${encodeURIComponent(wd)}&page=${page}`
    const html = await req(url)
    const $ = kitty.load(html)

    return $('.module-poster-item')
      .toArray()
      .map(item => {
        const a = $(item).first()
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
    const url = `${env.baseUrl}${iframe}`
    const html = await req(url)

    // 匹配 player_aaaa JSON
    const match = html.match(/var\s+player_aaaa\s*=\s*(\{.*?\});/)
    if (match) {
      try {
        const json = JSON.parse(match[1])
        if (json.url) return json.url
      } catch (e) {
        // ignore
      }
    }

    // 兜底方案：直接返回补齐的播放页链接
    return url
  }
}

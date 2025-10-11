export default class kimivod implements Handle {
  getConfig() {
    return <Iconfig>{
      id: "kimivod$",
      name: "Kimivod",
      type: 1,
      nsfw: false,
      api: "https://kimivod.com",
    }
  }

  headers = {
    'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile/15E148 Safari/604.1'
  }

  async getCategory() {
    return [
      { text: "電視", id: "/vod/show/id/1.html" },
      { text: "電影", id: "/vod/show/id/2.html" },
      { text: "動漫", id: "/vod/show/id/3.html" },
      { text: "綜藝", id: "/vod/show/id/4.html" },
      { text: "短劇", id: "/vod/show/id/39.html" },
      { text: "伦理", id: "/vod/show/id/42.html" },
    ]
  }

  async getHome() {
    const cate = env.get<string>('category') || '/vod/show/id/1.html'
    const page = env.get<number>('page') || 1
    const url = page === 1
      ? `${env.baseUrl}${cate}`
      : `${env.baseUrl}${cate.replace('.html', '')}/page/${page}.html`

    const html = await req(url, { headers: this.headers })
    const $ = kitty.load(html)

    const items = $('.grid.container_list .post, .s6.m3.l2').toArray()
    return items.map(item => {
      const a = $(item).find('a').first()
      const id = a.attr('href') ?? ""
      const title = a.attr('title')?.trim() ?? $(item).find('div').last().text().trim()
      let cover = $(item).find('img').attr('data-src') ?? ""
      if (cover.startsWith('//')) cover = 'https:' + cover
      const remark = $(item).find('.absolute').text().trim()
      return { id, title, cover, remark, desc: '' }
    })
  }

  async getDetail() {
    const id = env.get<string>('movieId')
    const html = await req(`${env.baseUrl}${id}`, { headers: this.headers })
    const $ = kitty.load(html)

    const title = $('h1.title').text().trim()
    let cover = $('img[itemprop="image"]').attr('data-src') ?? ""
    if (cover.startsWith('//')) cover = 'https:' + cover

    // 简介：优先 meta，再退回正文
    const desc = $('meta[name="description"]').attr('content') 
              ?? $('body').text().match(/本劇.*?。/)?.[0] 
              ?? ""

    // 播放列表：直接抓静态 a 标签
    const playlist: IPlaylist[] = []
    $('.page').each((i, page) => {
      const groupTitle = $(`.tabs a[data-ui="#${$(page).attr('id')}"] span`).text().trim() || `线路${i+1}`
      const videos = $(page).find('.playno a').map((j, a) => {
        return {
          id: $(a).attr('href') ?? "",
          text: $(a).text().trim()
        }
      }).get()
      playlist.push({ title: groupTitle, videos })
    })

    // 解析真实 m3u8
    for (const line of playlist) {
      for (const video of line.videos) {
        const playHtml = await req(video.id, { headers: this.headers })
        const m3u8 = kitty.utils.getM3u8WithStr(playHtml)
        video.id = m3u8
      }
    }

    return { id, title, cover, desc, playlist }
  }

  async getSearch() {
    const wd = env.get<string>('keyword') || ''
    const page = env.get<number>('page') || 1
    const url = page === 1
      ? `https://cn.kimivod.com/search.php?searchword=${encodeURIComponent(wd)}`
      : `https://cn.kimivod.com/search.php?searchword=${encodeURIComponent(wd)}&page=${page}`

    const html = await req(url, { headers: this.headers })
    const $ = kitty.load(html)

    return $('a[href*="/vod/"]').toArray().map((a, i) => {
      const id = $(a).attr('href') ?? ""
      const title = $(a).text().trim()
      const remark = $(a).prev().text().trim().match(/(已完結|HD中字|更新至第\\d+集)/)?.[0] ?? ""
      return { id, title, cover: '', desc: '', remark, playlist: [] }
    })
  }

  async parseIframe() {
    const iframe = env.get<string>('iframe')
    const html = await req(`${env.baseUrl}${iframe}`, { headers: this.headers })
    return kitty.utils.getM3u8WithStr(html)
  }
}

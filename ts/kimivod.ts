export default class kimivod implements Handle {
  getConfig() {
    return <Iconfig>{
      id: "kimivod$",
      name: "KimiVod",
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

    const items = $('.grid.container_list .post').toArray()
    if (items.length === 0) {
      // 短剧或特殊结构处理
      return $('a[href*="/vod/"]').toArray().map(a => {
        const id = $(a).attr('href') ?? ""
        const title = $(a).text().trim()
        return { id, title, cover: '', remark: '', desc: '' }
      })
    }

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
    let cover = $('.module-info-poster img').attr('data-src') ?? ""
    if (cover.startsWith('//')) cover = 'https:' + cover

    const desc = $('details summary:contains("影片簡介")').next('p').text().trim()
      || $('span.right-align').text().trim()

    const playlist: IPlaylist[] = []
    const tabs = $('.tabs a[data-ui]')
    if (tabs.length) {
      tabs.each((i, tab) => {
        const tabId = $(tab).attr('data-ui') ?? ""
        const groupTitle = $(tab).find('span').text().trim() || `线路${i + 1}`
        const videos = $(`${tabId} .playno a`).toArray().map((a, j) => {
          const href = $(a).attr('href') ?? ""
          const text = $(a).text().trim() || `第${j + 1}集`
          return { id: href, text }
        })
        if (videos.length) playlist.push({ title: groupTitle, videos })
      })
    } else {
      // 单集结构处理
      const single = $('a[href*="/vod/"][class*="play"]').attr('href')
      if (single) playlist.push({ title: '單集', videos: [{ id: single, text: '播放' }] })
    }

    // 自动提取每集真实播放地址
    for (const line of playlist) {
      for (const video of line.videos) {
        const html = await req(`${env.baseUrl}${video.id}`, { headers: this.headers })
        const m3u8 = kitty.utils.getM3u8WithStr(html)
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
      const remark = $(a).prev().text().trim().match(/(已完結|HD中字|更新至第\d+集)/)?.[0] ?? ""
      return { id, title, cover: '', desc: '', remark, playlist: [] }
    })
  }

  async parseIframe() {
    const iframe = env.get<string>('iframe')
    const html = await req(`${env.baseUrl}${iframe}`, { headers: this.headers })
    return kitty.utils.getM3u8WithStr(html)
  }
}

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

  // 提取真实封面地址：优先 img[src]；若包含 &src=，取其后为真实地址
  private normalizeCover(raw?: string): string {
    let cover = raw?.trim() ?? ""
    if (!cover) return ""
    const idx = cover.indexOf("&src=")
    if (idx !== -1) {
      cover = cover.substring(idx + 5) // after "&src="
    }
    if (cover.startsWith("//")) cover = "https:" + cover
    if (cover && !cover.startsWith("http")) cover = "https://" + cover
    return cover
  }

  async getCategory() {
    return [
      { text: "電視劇", id: "/vod/show/id/1.html" },
      { text: "電影", id: "/vod/show/id/2.html" },
      { text: "動漫", id: "/vod/show/id/3.html" },
      { text: "綜藝", id: "/vod/show/id/4.html" },
      { text: "短劇", id: "/vod/show/id/39.html" },
      { text: "伦理片", id: "/vod/show/id/42.html" },
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

    const results: any[] = []
    const seen = new Set<string>()

    // 普通分类：卡片在 .grid.container_list 下的 a
    if ($('.grid.container_list').length) {
      $('.grid.container_list a').each((_, a) => {
        const id = $(a).attr('href') ?? ""
        if (!id || seen.has(id)) return
        seen.add(id)
        const title = $(a).attr('title')?.trim() || $(a).find('img').attr('alt')?.trim() || ""
        const cover = this.normalizeCover($(a).find('img').attr('src'))
        const remark = $(a).find('.absolute').text().trim()
        results.push({ id, title, cover, remark, desc: '' })
      })
    }

    // 短剧分类：从 div.grid 下的 div.s6.m3.l2 取首个 a.wave（带封面），避免重复
    if ($('div.grid .s6.m3.l2').length) {
      $('div.grid .s6.m3.l2').each((_, card) => {
        const a = $(card).find('a.wave').first()
        const id = a.attr('href') ?? ""
        if (!id || seen.has(id)) return
        seen.add(id)
        const title = a.attr('title')?.trim() || a.find('img').attr('alt')?.trim() || $(card).find('a.max div').text().trim() || ""
        const cover = this.normalizeCover(a.find('img').attr('src'))
        const remark = a.find('.absolute').text().trim()
        results.push({ id, title, cover, remark, desc: '' })
      })
    }

    return results
  }

  async getDetail() {
    const id = env.get<string>('movieId')
    const html = await req(`${env.baseUrl}${id}`, { headers: this.headers })
    const $ = kitty.load(html)

    const title = $('h1.title').text().trim() || $('h1').first().text().trim()
    let cover = this.normalizeCover($('img[itemprop="image"]').attr('src'))
    if (!cover) {
      cover = this.normalizeCover($('img.responsive').first().attr('src'))
    }

    const desc =
      $('meta[name="description"]').attr('content')
      ?? $('body').text().match(/本劇.*?。/)?.[0]
      ?? ""

    const playlist: IPlaylist[] = []
    $('.page').each((i, page) => {
      const pid = $(page).attr('id') || ''
      const groupTitle = $(`.tabs a[data-ui="#${pid}"] span`).text().trim() || `线路${i + 1}`
      const videos = $(page).find('.playno a').map((_, a) => {
        return {
          id: $(a).attr('href') ?? "",
          text: $(a).text().trim()
        }
      }).get()
      // 仅保留有效链接
      const filtered = videos.filter(v => v.id && v.text)
      playlist.push({ title: groupTitle, videos: filtered })
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

    const results: any[] = []
    const seen = new Set<string>()

    $('a[href*="/vod/"]').each((_, a) => {
      const id = $(a).attr('href') ?? ""
      if (!id || seen.has(id)) return
      seen.add(id)
      const title = $(a).attr('title')?.trim() || $(a).text().trim()
      // 搜索页一般没封面，这里留空
      const remark = $(a).prev().text().trim().match(/(已完結|HD中字|更新至第\d+集)/)?.[0] ?? ""
      results.push({ id, title, cover: '', desc: '', remark, playlist: [] })
    })

    return results
  }

  async parseIframe() {
    const iframe = env.get<string>('iframe')
    const html = await req(`${env.baseUrl}${iframe}`, { headers: this.headers })
    return kitty.utils.getM3u8WithStr(html)
  }
}

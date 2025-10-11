export default class kimivod implements Handle {
  getConfig() {
    return <Iconfig>{
      id: "kimivod$",
      name: "KiMiVod",
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
      { text: "倫理", id: "/vod/show/id/42.html" },
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
      const title = a.attr('title')?.trim() || $(item).find('img').attr('alt')?.trim() || ""
      const cover = $(item).find('img').attr('data-src')?.trim() ?? ""
      const remark = $(item).find('.absolute').text().trim()
      return { id, title, cover, remark, desc: '' }
    })
  }

  async getDetail() {
    const id = env.get<string>('movieId')
    const html = await req(`${env.baseUrl}${id}`, { headers: this.headers })
    const $ = kitty.load(html)

    const title = $('h1.title').text().trim()
    const cover = $('img[itemprop="image"]').attr('data-src')?.trim() ?? ""
    const remark = $('p:contains("更新")').text().trim()

    const desc = $('meta[name="description"]').attr('content')?.trim()
              ?? $('details summary:contains("影片簡介")').next('p').text().trim()
              ?? $('details p span.right-align').text().trim()
              ?? ""

    const playlist: IPlaylist[] = []

    $('.page').each((i, page) => {
      const pid = $(page).attr('id') || ''
      const groupTitle = $(`.tabs a[data-ui="#${pid}"] span`).text().trim() || `线路${i+1}`

      const videos = $(page).find('.playno a').map((j, a) => {
        const text = $(a).text().trim()
        const href = $(a).attr('href') ?? ""
        const link = href.startsWith('http') ? href : `${env.baseUrl}${href}`
        return { text, id: link }
      }).get()

      playlist.push({ title: groupTitle, videos })
    })

    return { id, cover, title, remark, desc, playlist }
  }

  async getSearch() {
    const wd = env.get<string>('keyword') || ''
    const page = env.get<number>('page') || 1
    const url = page === 1
      ? `https://cn.kimivod.com/search.php?searchword=${encodeURIComponent(wd)}`
      : `https://cn.kimivod.com/search.php?searchword=${encodeURIComponent(wd)}&page=${page}`

    const html = await req(url, { headers: this.headers })
    const $ = kitty.load(html)

    const items = $('a[title]').toArray()
    return items.map(a => {
      const id = $(a).attr('href') ?? ""
      const title = $(a).attr('title')?.trim() ?? ""
      const cover = $(a).find('img').attr('data-src')?.trim() ?? ""
      const remark = $(a).find('.absolute').text().trim()
      return { id, title, cover, remark, desc: '', playlist: [] }
    })
  }

  async parseIframe() {
    const iframe = env.get<string>('iframe')
    const html = await req(iframe.startsWith('http') ? iframe : `${env.baseUrl}${iframe}`, { headers: this.headers })
    const $ = kitty.load(html)
    return $('meta[itemprop="contentUrl"]').attr('content')?.trim() ?? ""
  }
}

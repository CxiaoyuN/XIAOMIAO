// ts/kimivod.ts
// 小猫影视 JS 扩展源：Kimivod.com

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
      { text: "电影", id: "/vod/type/id/1.html" },
      { text: "电视剧", id: "/vod/type/id/2.html" },
      { text: "动漫", id: "/vod/type/id/4.html" },
      { text: "综艺", id: "/vod/type/id/3.html" },
    ]
  }

  async getHome() {
    const cate = env.get<string>('category') || '/vod/type/id/1.html'
    const page = env.get<number>('page') || 1
    const url = page === 1
      ? `${env.baseUrl}${cate}`
      : `${env.baseUrl}${cate.replace('.html', '')}/page/${page}.html`

    const html = await req(url, { headers: this.headers })
    const $ = kitty.load(html)

    return $('.module-poster-item').toArray().map(item => {
      const a = $(item).find('a').first()
      const id = a.attr('href') ?? ""
      const title = $(item).find('.module-poster-item-title').text().trim()
      let cover = $(item).find('img').attr('data-src') ?? ""
      if (cover.startsWith('//')) cover = 'https:' + cover
      const remark = $(item).find('.module-item-note').text().trim()
      return { id, title, cover, remark, desc: '' }
    })
  }

  async getDetail() {
    const id = env.get<string>('movieId')
    const html = await req(`${env.baseUrl}${id}`, { headers: this.headers })
    const $ = kitty.load(html)

    const title = $('.module-info-heading h1').text().trim()
    let cover = $('.module-info-poster img').attr('data-src') ?? ""
    if (cover.startsWith('//')) cover = 'https:' + cover
    const desc = $('.module-info-introduction p').text().trim()

    const playlist: IPlaylist[] = []
    $('.module-play-list').each((i, el) => {
      const groupTitle = $(el).find('.module-play-list-title').text().trim() || `线路${i + 1}`
      const videos = $(el).find('a').toArray().map(a => {
        const href = $(a).attr('href') ?? ""
        const text = $(a).text().trim()
        return { id: href, text }
      })
      if (videos.length) playlist.push({ title: groupTitle, videos })
    })

    return { id, title, cover, desc, playlist }
  }

  async getSearch() {
    const wd = env.get<string>('keyword') || ''
    const page = env.get<number>('page') || 1
    const url = `${env.baseUrl}/vod/search/page/${page}/wd/${encodeURIComponent(wd)}.html`
    const html = await req(url, { headers: this.headers })
    const $ = kitty.load(html)

    return $('.module-poster-item').toArray().map<IMovie>(item => {
      const a = $(item).find('a').first()
      const id = a.attr('href') ?? ""
      const title = $(item).find('.module-poster-item-title').text().trim()
      let cover = $(item).find('img').attr('data-src') ?? ""
      if (cover.startsWith('//')) cover = 'https:' + cover
      const remark = $(item).find('.module-item-note').text().trim()
      return { id, title, cover, desc: '', remark, playlist: [] }
    })
  }

  async parseIframe() {
    const iframe = env.get<string>('iframe')
    return `${env.baseUrl}${iframe}`
  }
}

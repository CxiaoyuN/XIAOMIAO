export default class fourkvm implements Handle {
  getConfig() {
    return <Iconfig>{
      id: "4kvm$",
      name: "4K影视",
      type: 1,
      nsfw: false,
      api: "https://www.4kvm.net",
    }
  }

  headers = {
    'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile/15E148 Safari/604.1'
  }

  async getCategory() {
    return [
      { text: "电影", id: "/movies" },
      { text: "美剧", id: "/classify/meiju" },
      { text: "国产剧", id: "/classify/guochan" },
      { text: "韩剧", id: "/classify/hanju" },
      { text: "番剧", id: "/classify/fanju" },
      { text: "热门播放", id: "/trending" },
    ]
  }

  async getHome() {
    const cate = env.get<string>('category') || '/movies'
    const page = env.get<number>('page') || 1
    const url = `${env.baseUrl}${cate}?page=${page}`

    const html = await req(url, { headers: this.headers })
    const $ = kitty.load(html)

    const items = $('article.item.tvshows, article.item.movies').toArray().map(item => {
      const title = $(item).find('h3 a').text().trim()
      const id = $(item).find('h3 a').attr('href') ?? ""
      let cover = $(item).find('.poster img').attr('src') ?? ""
      if (cover.startsWith('//')) cover = 'https:' + cover
      const remark = $(item).find('.rating').text().trim()
      const desc = $(item).find('.texto').text().trim()
      const genres = $(item).find('.genres a').toArray().map(a => $(a).text().trim()).join(' / ')
      return { id, title, cover, remark, desc: genres ? `${desc}（类型：${genres}）` : desc }
    })

    return items
  }

  async getDetail() {
    const id = env.get<string>('movieId')
    const html = await req(`${env.baseUrl}${id}`, { headers: this.headers })
    const $ = kitty.load(html)

    const title = $('h1.entry-title').text().trim()
    let cover = $('.entry-content img').first().attr('src') ?? ""
    if (cover.startsWith('//')) cover = 'https:' + cover
    const desc = $('.entry-content p').first().text().trim()

    const playlist: IPlaylist[] = []
    const videos = $('.entry-content a[href*="/play/"], .entry-content a[href*="/artplayer?id="]').toArray().map((a, i) => {
      const href = $(a).attr('href') ?? ""
      const text = $(a).text().trim() || `第${i + 1}集`
      return { id: href, text }
    })
    if (videos.length) playlist.push({ title: '默认线路', videos })

    return { id, title, cover, desc, playlist }
  }

  async getSearch() {
    const wd = env.get<string>('keyword') || ''
    const page = env.get<number>('page') || 1
    const url = `${env.baseUrl}/search/${encodeURIComponent(wd)}?page=${page}`
    const html = await req(url, { headers: this.headers })
    const $ = kitty.load(html)

    return $('article.item.tvshows, article.item.movies').toArray().map<IMovie>(item => {
      const title = $(item).find('h3 a').text().trim()
      const id = $(item).find('h3 a').attr('href') ?? ""
      let cover = $(item).find('.poster img').attr('src') ?? ""
      if (cover.startsWith('//')) cover = 'https:' + cover
      const remark = $(item).find('.rating').text().trim()
      return { id, title, cover, desc: '', remark, playlist: [] }
    })
  }

  async parseIframe() {
    const iframe = env.get<string>('iframe')

    // 🎬 如果是电影播放页，直接返回链接作为直链
    if (iframe.includes('/artplayer?id=')) {
      return `${env.baseUrl}${iframe}`
    }

    // 📺 如果是剧集播放页，提取 MP4 路径
    const html = await req(`${env.baseUrl}${iframe}`, { headers: this.headers })
    const match = html.match(/var\s+now\s*=\s*"([^"]+\.mp4)"/)
    if (match) {
      const mp4Path = match[1]
      return `https://v.damoli.pro/v/${mp4Path}`
    }

    return `${env.baseUrl}${iframe}`
  }
}

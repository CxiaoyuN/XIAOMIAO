// ts/4kvm.ts
// 小猫影视 JS 扩展源：4kvm.net

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

  // 分类导航（来自你贴的 HTML）
  async getCategory() {
    return [
      { text: "电影", id: "/movies" },
      { text: "美剧", id: "/classify/meiju" },
      { text: "国产剧", id: "/classify/guochan" },
      { text: "韩剧", id: "/classify/hanju" },
      { text: "番剧", id: "/classify/fanju" },
      { text: "高分电影", id: "/imdb" },
      { text: "热门播放", id: "/trending" },
    ]
  }

  // 分类/首页列表
  async getHome() {
    const cate = env.get<string>('category') || '/movies'
    const page = env.get<number>('page') || 1
    const url = `${env.baseUrl}${cate}?page=${page}`

    const html = await req(url, { headers: this.headers })
    const $ = kitty.load(html)

    return $('.post-box').toArray().map(item => {
      const a = $(item).find('a').first()
      const id = a.attr('href') ?? ""
      const title = $(item).find('.post-title').text().trim()
      let cover = $(item).find('img').attr('data-src') ?? ""
      if (cover.startsWith('//')) cover = 'https:' + cover
      const remark = $(item).find('.post-rate').text().trim()
      const desc = $(item).find('.post-excerpt').text().trim()
      return { id, title, cover, remark, desc }
    })
  }

  // 详情页
  async getDetail() {
    const id = env.get<string>('movieId')
    const html = await req(`${env.baseUrl}${id}`, { headers: this.headers })
    const $ = kitty.load(html)

    const title = $('h1.entry-title').text().trim()
    let cover = $('.entry-content img').first().attr('src') ?? ""
    if (cover.startsWith('//')) cover = 'https:' + cover
    const desc = $('.entry-content p').first().text().trim()

    const playlist: IPlaylist[] = []
    const videos = $('.entry-content a[href*="/play/"]').toArray().map((a, i) => {
      const href = $(a).attr('href') ?? ""
      const text = $(a).text().trim() || `第${i + 1}集`
      return { id: href, text }
    })
    if (videos.length) playlist.push({ title: '默认线路', videos })

    return { id, title, cover, desc, playlist }
  }

  // 搜索页
  async getSearch() {
    const wd = env.get<string>('keyword') || ''
    const page = env.get<number>('page') || 1
    const url = `${env.baseUrl}/search/${encodeURIComponent(wd)}?page=${page}`
    const html = await req(url, { headers: this.headers })
    const $ = kitty.load(html)

    return $('.post-box').toArray().map<IMovie>(item => {
      const a = $(item).find('a').first()
      const id = a.attr('href') ?? ""
      const title = $(item).find('.post-title').text().trim()
      let cover = $(item).find('img').attr('data-src') ?? ""
      if (cover.startsWith('//')) cover = 'https:' + cover
      const remark = $(item).find('.post-rate').text().trim()
      return { id, title, cover, desc: '', remark, playlist: [] }
    })
  }

  // 播放页：提取 JS 中的 MP4 路径
  async parseIframe() {
    const iframe = env.get<string>('iframe')
    const html = await req(`${env.baseUrl}${iframe}`, { headers: this.headers })

    const match = html.match(/var\\s+now\\s*=\\s*"([^"]+\\.mp4)"/)
    if (match) {
      const mp4Path = match[1]
      return `https://v.damoli.pro/v/${mp4Path}`
    }

    return `${env.baseUrl}${iframe}`
  }
}

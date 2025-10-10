// ts/hdmoli.ts
// 小猫影视 JS 扩展源：HDmoli (hdmoli.pro)

export default class hdmoli implements Handle {
  getConfig() {
    return <Iconfig>{
      id: "hdmoli$",
      name: "HDmoli",
      type: 1,
      nsfw: false,
      api: "https://hdmoli.pro",
      extra: {
        gfw: false,
        searchLimit: 16,
      }
    }
  }

  // 分类导航
  async getCategory() {
    return [
      { text: "电影", id: "/mlist/index1.html" },
      { text: "剧集", id: "/mlist/index2.html" },
      { text: "动画", id: "/mlist/index41.html" },
    ]
  }

  // 分类/首页列表
  async getHome() {
    const cate = env.get<string>('category') || '/mlist/index1.html'
    const page = env.get<number>('page') || 1
    const url = page === 1
      ? `${env.baseUrl}${cate}`
      : `${env.baseUrl}${cate.replace('.html', '')}-${page}.html`

    const html = await req(url)
    const $ = kitty.load(html)

    return $('.myui-vodlist__box').toArray().map(item => {
      const a = $(item).find('a.myui-vodlist__thumb').first()
      const id = a.attr('href') ?? ""
      const title = a.attr('title')?.trim() ?? ""
      let cover = a.attr('data-original') ?? ""
      if (cover.startsWith('//')) cover = 'https:' + cover
      const remarkTop = $(item).find('.pic-tag.pic-tag-top').text().trim()
      const remarkText = $(item).find('.pic-text.text-right').text().trim()
      const remark = [remarkTop, remarkText].filter(Boolean).join(' / ')
      const desc = $(item).find('.myui-vodlist__detail p.text').text().trim()
      return { id, title, cover, remark, desc }
    })
  }

  // 详情页
  async getDetail() {
    const id = env.get<string>('movieId')
    const html = await req(`${env.baseUrl}${id}`)
    const $ = kitty.load(html)

    const title = $('h1.title, .myui-content__detail h1').first().text().trim()
    let cover = $('.myui-content__thumb img').attr('data-original') || ""
    if (cover.startsWith('//')) cover = 'https:' + cover

    const desc = $('.myui-content__detail p.text-muted, .myui-panel p.text-muted').text().trim()

    const playlist: IPlaylist[] = []
    const videos = $('#playlist1 a, .stui-content__playlist a').toArray().map((a, i) => {
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
    const url = `${env.baseUrl}/search.php?searchkey=${encodeURIComponent(wd)}&page=${page}`
    const html = await req(url)
    const $ = kitty.load(html)

    return $('.myui-vodlist__box').toArray().map<IMovie>(item => {
      const a = $(item).find('a.myui-vodlist__thumb').first()
      const id = a.attr('href') ?? ""
      const title = a.attr('title')?.trim() ?? ""
      let cover = a.attr('data-original') ?? ""
      if (cover.startsWith('//')) cover = 'https:' + cover
      const remarkTop = $(item).find('.pic-tag.pic-tag-top').text().trim()
      const remarkText = $(item).find('.pic-text.text-right').text().trim()
      const remark = [remarkTop, remarkText].filter(Boolean).join(' / ')
      return { id, title, cover, desc: '', remark, playlist: [] }
    })
  }

  // 播放页：提取 JS 中的 MP4 路径
  async parseIframe() {
    const iframe = env.get<string>('iframe')
    const html = await req(`${env.baseUrl}${iframe}`)

    const match = html.match(/var\\s+now\\s*=\\s*"([^"]+\\.mp4)"/)
    if (match) {
      const mp4Path = match[1]
      return `https://v.damoli.pro/v/${mp4Path}`
    }

    return `${env.baseUrl}${iframe}`
  }
}

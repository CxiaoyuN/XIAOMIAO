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
    }
  }

  // 分类导航：电影 / 剧集 / 动画
  async getCategory() {
    return [
      { text: "电影", id: "/mlist/index1.html" },
      { text: "剧集", id: "/mlist/index2.html" },
      { text: "动画", id: "/mlist/index41.html" },
    ]
  }

  // 列表页（分类/首页内容）
  async getHome() {
    const cate = env.get<string>('category') || '/mlist/index1.html'
    const page = env.get<number>('page') || 1
    // 分页规则：index2.html → index2-2.html → index2-3.html
    const url = page === 1
      ? `${env.baseUrl}${cate}`
      : `${env.baseUrl}${cate.replace('.html', '')}-${page}.html`

    const html = await req(url)
    const $ = kitty.load(html)

    // 解析卡片：myui-vodlist__box
    const items = $('.myui-vodlist__box').toArray().map(item => {
      const a = $(item).find('a.myui-vodlist__thumb').first()
      const id = a.attr('href') ?? ""
      const title = a.attr('title')?.trim() ?? ""
      let cover = a.attr('data-original') ?? ""
      if (cover.startsWith('//')) cover = 'https:' + cover
      const remarkTop = $(item).find('.pic-tag.pic-tag-top').first().text().trim() // 评分
      const remarkText = $(item).find('.pic-text.text-right').first().text().trim() // “网盘”等状态
      const remark = [remarkTop, remarkText].filter(Boolean).join(' / ')
      const desc = $(item).find('.myui-vodlist__detail p.text').first().text().trim()
      return { id, title, cover, remark, desc }
    })

    return items
  }

  // 详情页
  async getDetail() {
    const id = env.get<string>('movieId')
    const html = await req(`${env.baseUrl}${id}`)
    const $ = kitty.load(html)

    // 标题与海报
    const title =
      $('h1.title').first().text().trim()
      || $('.myui-content__detail h1').first().text().trim()
    let cover =
      $('.myui-content__thumb img').attr('data-original')
      || $('.myui-content__thumb img').attr('src')
      || ""
    if (cover && cover.startsWith('//')) cover = 'https:' + cover

    // 简介
    const desc =
      $('.myui-content__detail p.text-muted').first().text().trim()
      || $('.myui-panel p.text-muted').first().text().trim()

    // 播放列表（常见容器：#playlist1 或 .stui-content__playlist）
    const videos = $('#playlist1 a, .stui-content__playlist a').toArray().map((a, i) => {
      const href = $(a).attr('href') ?? ""
      const text = $(a).text().trim() || `第${i + 1}集`
      // 仅保留站内播放页链接
      if (href) return { id: href, text }
      return null
    }).filter(Boolean) as { id: string, text: string }[]

    const playlist: IPlaylist[] = []
    if (videos.length) playlist.push({ title: '默认线路', videos })

    return { id, title, cover, desc, playlist }
  }

  // 搜索
  async getSearch() {
    const wd = env.get<string>('keyword') || ''
    const page = env.get<number>('page') || 1
    const url = `${env.baseUrl}/search.php?searchkey=${encodeURIComponent(wd)}&page=${page}`
    const html = await req(url)
    const $ = kitty.load(html)

    const items = $('.myui-vodlist__box').toArray().map<IMovie>(item => {
      const a = $(item).find('a.myui-vodlist__thumb').first()
      const id = a.attr('href') ?? ""
      const title = a.attr('title')?.trim() ?? ""
      let cover = a.attr('data-original') ?? ""
      if (cover.startsWith('//')) cover = 'https:' + cover
      const remarkTop = $(item).find('.pic-tag.pic-tag-top').first().text().trim()
      const remarkText = $(item).find('.pic-text.text-right').first().text().trim()
      const remark = [remarkTop, remarkText].filter(Boolean).join(' / ')
      return { id, title, cover, desc: '', remark, playlist: [] }
    })

    return items
  }

  // 播放：返回站内播放页 URL，方便用网页播放器打开
  async parseIframe() {
    const iframe = env.get<string>('iframe')
    return `${env.baseUrl}${iframe}`
  }
}

export default class JvLook implements Handle {
  getConfig() {
    return <Iconfig>{
      id: 'jvlook',
      name: 'JvLook影视',
      api: 'https://jvlook.com',
      nsfw: false,
      type: 1,
    }
  }

  // 固定分类（示例，可根据实际站点调整）
  async getCategory() {
    return <ICategory[]>[
      { text: '电影', id: '/plate1' },
      { text: '电视剧', id: '/plate2' },
      { text: '综艺', id: '/plate3' },
      { text: '动漫', id: '/plate4' },
    ]
  }

  // 分类下的视频列表
  async getHome() {
    const cate = env.get<string>('category') || ''
    const page = env.get<number>('page') || 1
    let url = `${env.baseUrl}/${cate}/`
    if (page > 1) url += `page/${page}/`

    const html = await req(url)
    const $ = kitty.load(html)

    return $('article.post, div.video-item').toArray().map<IMovie>(el => {
      const a = $(el).find('a').first()
      const id = a.attr('href') ?? ''
      const title = a.attr('title') || a.text().trim()
      let cover = $(el).find('img').attr('src') ?? ''
      if (cover.startsWith('//')) cover = 'https:' + cover
      return { id, title, cover, desc: '', remark: '', playlist: [] }
    })
  }

  // 详情页：提取 MP4 和 m3u8 多线路
  async getDetail() {
    const id = env.get<string>('movieId')
    const url = id.startsWith('http') ? id : `${env.baseUrl}${id}`
    const html = await req(url)
    const $ = kitty.load(html)

    const title = $('h1').text().trim()
    let cover = $('article img, .post img').first().attr('src') ?? ''
    if (cover.startsWith('//')) cover = 'https:' + cover
    const desc = $('article').text().slice(0, 200)

    const playlist: IPlaylist[] = []
    const lines: IVideo[] = []

    // 遍历所有可能的线路按钮/链接
    $('a, button, source').each((_, el) => {
      const text = $(el).text().trim() || $(el).attr('title') || '线路'
      const link = $(el).attr('data-url') || $(el).attr('href') || $(el).attr('src') || ''
      if (link.endsWith('.mp4') || link.endsWith('.m3u8')) {
        let finalUrl = link
        if (finalUrl.startsWith('//')) finalUrl = 'https:' + finalUrl
        lines.push({ text, id: finalUrl })
      }
    })

    if (lines.length > 0) {
      playlist.push({ title: '播放线路', videos: lines })
    }

    return <IMovie>{ id: url, title, cover, desc, playlist }
  }

  // 搜索
  async getSearch() {
    const wd = env.get<string>('keyword') || ''
    const page = env.get<number>('page') || 1
    const url = `${env.baseUrl}/page/${page}/?s=${encodeURIComponent(wd)}`

    const html = await req(url)
    const $ = kitty.load(html)

    return $('article.post, div.video-item').toArray().map<IMovie>(el => {
      const a = $(el).find('a').first()
      const id = a.attr('href') ?? ''
      const title = a.attr('title') || a.text().trim()
      let cover = $(el).find('img').attr('src') ?? ''
      if (cover.startsWith('//')) cover = 'https:' + cover
      return { id, title, cover, desc: '', remark: '搜索结果', playlist: [] }
    })
  }
}

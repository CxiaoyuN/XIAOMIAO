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

  // 固定分类（直接写死）
  async getCategory() {
    return <ICategory[]>[
      { text: '电影', id: 'category/movie' },
      { text: '电视剧', id: 'category/tv' },
      { text: '综艺', id: 'category/variety' },
      { text: '动漫', id: 'category/anime' },
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

  // 详情页：提取多条 MP4 播放线路
  async getDetail() {
    const id = env.get<string>('movieId')
    const url = id.startsWith('http') ? id : `${env.baseUrl}${id}`
    const html = await req(url)
    const $ = kitty.load(html)

    const title = $('h1').text().trim()
    let cover = $('article img, .post img').first().attr('src') ?? ''
    if (cover.startsWith('//')) cover = 'https:' + cover
    const desc = $('article').text().slice(0, 200)

    // 多线路解析：假设页面里有 <a data-url="xxx.mp4">线路1</a>
    const playlist: IPlaylist[] = []
    const lines: IVideo[] = []

    $('a, button').each((_, el) => {
      const text = $(el).text().trim()
      const mp4 = $(el).attr('data-url') || $(el).attr('href') || ''
      if (mp4.endsWith('.mp4')) {
        lines.push({ text: text || '线路', id: mp4 })
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

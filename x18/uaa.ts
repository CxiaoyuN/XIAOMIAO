export default class UAA implements Handle {
  getConfig() {
    return <Iconfig>{
      id: 'uaa',
      name: 'UAA影视',
      api: 'https://www.uaa.com',
      nsfw: false,
      type: 1,
    }
  }

  // 固定分类（根据你提供的结构）
  async getCategory() {
    return <ICategory[]>[
      { text: '全部题材', id: '/video/list?keyword=&searchType=1&category=&origin=&tag=&sort=1' },
      { text: '国产视频', id: '/video/list?keyword=&searchType=1&origin=1&tag=&sort=1' },
      { text: '日本AV', id: '/video/list?keyword=&searchType=1&origin=2&tag=&sort=1' },
      { text: 'H动漫', id: '/video/list?keyword=&searchType=1&origin=3&tag=&sort=1' },
      { text: '正规', id: '/video/list?keyword=&searchType=1&origin=4&tag=&sort=1' },
      { text: '欧美', id: '/video/list?keyword=&searchType=1&origin=5&tag=&sort=1' },
      { text: '短剧', id: '/video/list?keyword=&searchType=1&category=短剧&origin=&tag=&sort=1' },
      { text: '偷拍', id: '/video/list?keyword=&searchType=1&category=偷拍&origin=&tag=&sort=1' },
      { text: '00后露出', id: '/video/list?keyword=&searchType=1&category=00后露出&origin=&tag=&sort=1' },
      { text: '无码流出', id: '/video/list?keyword=&searchType=1&category=无码流出&origin=&tag=&sort=1' },
      { text: '高清AV', id: '/video/list?keyword=&searchType=1&category=高清AV&origin=&tag=&sort=1' },
      { text: '自拍', id: '/video/list?keyword=&searchType=1&category=自拍&origin=&tag=&sort=1' },
      { text: '人妖伪娘', id: '/video/list?keyword=&searchType=1&category=人妖伪娘&origin=&tag=&sort=1' },
      { text: '主播福利', id: '/video/list?keyword=&searchType=1&category=主播福利&origin=&tag=&sort=1' },
      { text: '里番', id: '/video/list?keyword=&searchType=1&category=里番&origin=&tag=&sort=1' },
      { text: '泡面番', id: '/video/list?keyword=&searchType=1&category=泡面番&origin=&tag=&sort=1' },
    ]
  }

  // 视频列表
  async getHome() {
    const cate = env.get<string>('category') || '/video/list'
    const page = env.get<number>('page') || 1
    let url = `${env.baseUrl}${cate}`
    if (page > 1) url += `&page=${page}`

    const html = await req(url)
    const $ = kitty.load(html)

    return $('div.video-item, div.post-box, article.post').toArray().map<IMovie>(el => {
      const a = $(el).find('a').first()
      const id = a.attr('href') ?? ''
      const title = a.attr('title') || a.text().trim()
      let cover = $(el).find('img').attr('src') ?? $(el).find('img').attr('data-src') ?? ''
      if (cover.startsWith('//')) cover = 'https:' + cover
      const remark = $(el).find('.video-meta, .post-meta').text().trim()
      return { id, title, cover, desc: '', remark, playlist: [] }
    })
  }

  // 详情页：提取 MP4 和 m3u8 播放地址
  async getDetail() {
    const id = env.get<string>('movieId')
    const url = id.startsWith('http') ? id : `${env.baseUrl}${id}`
    const html = await req(url)
    const $ = kitty.load(html)

    const title = $('h1').text().trim()
    let cover = $('article img, .post img, .video-player img').first().attr('src') ?? ''
    if (cover.startsWith('//')) cover = 'https:' + cover
    const desc = $('article, .post-content').text().slice(0, 200)

    const playlist: IPlaylist[] = []
    const lines: IVideo[] = []

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
    const url = `${env.baseUrl}/video/list?keyword=${encodeURIComponent(wd)}&searchType=1&page=${page}`

    const html = await req(url)
    const $ = kitty.load(html)

    return $('div.video-item, div.post-box, article.post').toArray().map<IMovie>(el => {
      const a = $(el).find('a').first()
      const id = a.attr('href') ?? ''
      const title = a.attr('title') || a.text().trim()
      let cover = $(el).find('img').attr('src') ?? $(el).find('img').attr('data-src') ?? ''
      if (cover.startsWith('//')) cover = 'https:' + cover
      return { id, title, cover, desc: '', remark: '搜索结果', playlist: [] }
    })
  }
}

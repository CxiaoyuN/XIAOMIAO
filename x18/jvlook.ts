export default class JvLook implements Handle {
  getConfig() {
    return <Iconfig>{
      id: 'jvlook',
      name: 'JvLook',
      api: 'https://jvlook.com/plate3',
      nsfw: true,
      type: 1,
    }
  }

  async getCategory() {
    return <ICategory[]>[
      { text: '短视频', id: 'short' },
      { text: '长视频', id: 'long' },
      { text: 'AV', id: 'av' },
      { text: '动漫', id: 'anime' },
    ]
  }

  async getHome() {
    const cate = env.get<string>('category') || ''
    const page = env.get<number>('page') || 1
    let url = `${env.baseUrl}/`
    if (cate) url += `${cate}/`
    if (page > 1) url += `page/${page}/`

    const html = await req(url)
    const $ = kitty.load(html)

    return $('article.excerpt').toArray().map<IMovie>(el => {
      const a = $(el).find('h2 a')
      const id = a.attr('href') ?? ''
      const title = a.text().trim()
      let cover = $(el).find('img').attr('data-src') ?? $(el).find('img').attr('src') ?? ''
      if (cover.startsWith('//')) cover = 'https:' + cover
      const remark = $(el).find('.post-view').text().trim()
      return { id, title, cover, desc: '', remark, playlist: [] }
    })
  }

  async getDetail() {
    const id = env.get<string>('movieId')
    const url = id.startsWith('http') ? id : `${env.baseUrl}${id}`
    const html = await req(url)
    const $ = kitty.load(html)

    const title = $('h1').text().trim()
    let cover = $('article img').first().attr('src') ?? ''
    if (cover.startsWith('//')) cover = 'https:' + cover
    const desc = $('article').text().slice(0, 200)

    // 提取 iframe
    const iframeUrl = $('iframe').attr('src') ?? ''

    let realUrl = ''
    if (iframeUrl) {
      const iframeHtml = await req(iframeUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0',
          'Referer': url
        }
      })
      // jvlook 的 iframe 可能直接就是 m3u8 地址
      const m3u8Match = iframeHtml.match(/(https?:\\/\\/[^'"]+\\.m3u8[^'"]*)/)
      if (m3u8Match) {
        realUrl = m3u8Match[1]
      }
    }

    const playlist = [{
      title: '默认',
      videos: realUrl
        ? [{ text: '在线播放', url: realUrl }]
        : [{ text: '打开详情页', id: url }]
    }]

    return <IMovie>{ id: url, title, cover, desc, playlist }
  }

  async getSearch() {
    const wd = env.get<string>('keyword') || ''
    const page = env.get<number>('page') || 1
    const url = `${env.baseUrl}/search/${encodeURIComponent(wd)}/page/${page}/`
    const html = await req(url)
    const $ = kitty.load(html)

    return $('article.excerpt').toArray().map<IMovie>(el => {
      const a = $(el).find('h2 a')
      const id = a.attr('href') ?? ''
      const title = a.text().trim()
      let cover = $(el).find('img').attr('data-src') ?? $(el).find('img').attr('src') ?? ''
      if (cover.startsWith('//')) cover = 'https:' + cover
      return { id, title, cover, desc: '', remark: '搜索结果', playlist: [] }
    })
  }
}

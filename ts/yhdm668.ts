export default class YHDM668 implements Handle {
  getConfig(): Iconfig {
    return {
      id: 'yhdm668',
      name: '樱花动漫',
      api: 'https://www.yhdm668.com',
      type: 1,
      nsfw: false,
    }
  }

  async getCategory(): Promise<ICategory[]> {
    return [
      { id: '4', text: '动漫' },
      { id: '20', text: '剧场' },
      { id: '1', text: '电影' },
      { id: '2', text: '电视' },
      { id: '3', text: '短剧' },
    ]
  }

  async getHome(): Promise<IMovie[]> {
    const cate = env.get('category', '4')
    const page = env.get('page', '1')
    const url = `${env.baseUrl}/index.php/vod/type/id/${cate}/page/${page}.html`
    const html = await req(url)
    const $ = kitty.load(html)

    return $('a.module-poster-item.module-item').toArray().map(el => {
      const href = $(el).attr('href') ?? ''
      const title = $(el).attr('title') ?? ''
      const cover = $(el).find('img.lazy.lazyload').attr('data-original') ?? ''
      const remark = $(el).find('.module-item-note').text().trim()
      return { id: href, title, cover, remark, playlist: [] }
    })
  }

  async getDetail(): Promise<IMovie> {
    const detailPath = env.get('detailPath')
    if (!detailPath) throw new Error('缺少 detailPath 参数')

    const url = `${env.baseUrl}${detailPath}`
    const html = await req(url)
    const $ = kitty.load(html)

    const title = $('h1').text().trim()
    const cover = $('img.lazy.lazyload').attr('data-original') ?? ''
    const desc = $('.module-info-introduction-content').text().trim()

    const playlist: IPlaylist[] = []

    $('.module-play-list').each((i, el) => {
      const lineTitle = $(el).prev('.module-tab-item').text().trim() || `线路${i + 1}`
      const videos: IVideo[] = []

      $(el).find('a').each((_, a) => {
        const text = $(a).text().trim()
        const href = $(a).attr('href') ?? ''
        videos.push({ text, url: href })
      })

      playlist.push({ title: lineTitle, videos })
    })

    return { id: detailPath, title, cover, desc, remark: '', playlist }
  }

  async getSearch(): Promise<IMovie[]> {
    const keyword = env.get('keyword')
    const page = env.get('page', '1')
    const url = `${env.baseUrl}/index.php/vod/search/page/${page}/wd/${encodeURIComponent(keyword)}.html`
    const html = await req(url)
    const $ = kitty.load(html)

    return $('a.module-poster-item.module-item').toArray().map(el => {
      const href = $(el).attr('href') ?? ''
      const title = $(el).attr('title') ?? ''
      const cover = $(el).find('img.lazy.lazyload').attr('data-original') ?? ''
      const remark = $(el).find('.module-item-note').text().trim()
      return { id: href, title, cover, remark, playlist: [] }
    })
  }

  async parseIframe(): Promise<string> {
    const playPath = env.get('playPath')
    if (!playPath) throw new Error('缺少 playPath 参数')

    const url = `${env.baseUrl}${playPath}`
    const html = await req(url)

    const match = html.match(/"url":"(.*?)"/)
    const m3u8 = match ? match[1].replace(/\\/g, '') : ''
    return m3u8
  }
}

// js/yhdm668.ts
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
      { text: 'TV动漫', id: '4' },
      { text: '剧场版动漫', id: '20' },
      { text: '电影', id: '1' },
      { text: '连续剧', id: '2' },
      { text: '短剧', id: '3' },
    ]
  }

  async getHome(): Promise<IMovie[]> {
    const cate = env.get('category', '4')
    const page = env.get('page', '1')
    const url = `${env.baseUrl}/index.php/vod/type/id/${cate}/page/${page}.html`
    const html = await req(url)
    const $ = kitty.load(html)

    return $('a.module-poster-item.module-item').toArray().map(item => {
      const id = $(item).attr('href') ?? ''
      const title = $(item).attr('title') ?? ''
      const cover = $(item).find('img.lazy.lazyload').attr('data-original') ?? ''
      const remark = $(item).find('.module-item-note').text() ?? ''
      return { id, title, cover, remark, playlist: [] }
    })
  }

  async getDetail(): Promise<IMovie> {
    const id = env.get('movieId')
    const url = `${env.baseUrl}${id}`
    const html = await req(url)
    const $ = kitty.load(html)

    const title = $('h1').text()
    const cover = $('img.lazy.lazyload').attr('data-original') ?? ''
    const desc = $('.module-info-introduction-content').text().trim()

    const playlist: IPlaylist[] = [{
      title: '默认线路',
      videos: $('.player-box-main script').toArray().map(script => {
        const content = $(script).html() ?? ''
        const match = content.match(/"url":"(.*?)"/)
        const m3u8 = match ? match[1].replace(/\\/g, '') : ''
        return { text: '播放', url: m3u8 }
      })
    }]

    return { id, title, cover, desc, remark: '', playlist }
  }

  async getSearch(): Promise<IMovie[]> {
    const wd = env.get('keyword')
    const page = env.get('page', '1')
    const url = `${env.baseUrl}/index.php/vod/search/page/${page}/wd/${wd}.html`
    const html = await req(url)
    const $ = kitty.load(html)

    return $('a.module-poster-item.module-item').toArray().map(item => {
      const id = $(item).attr('href') ?? ''
      const title = $(item).attr('title') ?? ''
      const cover = $(item).find('img.lazy.lazyload').attr('data-original') ?? ''
      const remark = $(item).find('.module-item-note').text() ?? ''
      return { id, title, cover, remark, playlist: [] }
    })
  }

  async parseIframe(): Promise<string> {
    const iframe = env.get('iframe')
    return kitty.utils.getM3u8WithIframe(env)
  }
}

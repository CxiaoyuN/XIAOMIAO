// import { kitty, req, createTestEnv } from 'utils'

export default class YHDM668 implements Handle {
  getConfig() {
    return <Iconfig>{
      id: 'yhdm668',
      name: '樱花动漫',
      api: 'https://www.yhdm668.com',
      nsfw: false,
      type: 1,
    }
  }

  async getCategory() {
    return <ICategory[]>[
      { text: 'TV动漫', id: '/index.php/vod/type/id/4.html' },
      { text: '剧场版动漫', id: '/index.php/vod/type/id/20.html' },
      { text: '电影', id: '/index.php/vod/type/id/1.html' },
      { text: '连续剧', id: '/index.php/vod/type/id/2.html' },
      { text: '短剧', id: '/index.php/vod/type/id/3.html' },
      { text: '热榜', id: '/index.php/label/hot.html' },
      { text: '今日更新', id: '/index.php/label/new.html' },
      { text: '周表', id: '/index.php/label/week.html' },
    ]
  }

  // 统一列表解析
  private _parseList($: any): IMovie[] {
    const items: IMovie[] = []
    $('.module .module-items a.module-poster-item').each((_: any, el: any) => {
      const $a = $(el)
      let href = $a.attr('href') || ''
      if (!href) return
      if (!/^https?:/.test(href)) href = `${env.baseUrl}${href}`

      let img =
        $a.find('img').attr('data-original') ||
        $a.find('img').attr('data-src') ||
        $a.find('img').attr('src') ||
        ''
      if (img && img.startsWith('//')) img = 'https:' + img

      const title =
        ($a.find('.module-poster-item-title').text() || '').trim() ||
        ($a.attr('title') || '').trim()

      const remark = ($a.find('.module-item-note').text() || '').trim()

      items.push({
        id: href,
        title,
        cover: img || '',
        desc: '',
        remark,
        playlist: [],
      })
    })

    // 兜底
    if (items.length === 0) {
      $('a[href*="/detail/"]').each((_: any, el: any) => {
        const $a = $(el)
        let href = $a.attr('href') || ''
        if (!href) return
        if (!/^https?:/.test(href)) href = `${env.baseUrl}${href}`

        let img = $a.find('img').attr('data-original') || $a.find('img').attr('src') || ''
        if (img && img.startsWith('//')) img = 'https:' + img

        const title = ($a.attr('title') || $a.text() || '').trim()
        items.push({ id: href, title, cover: img, desc: '', remark: '', playlist: [] })
      })
    }

    return items
  }

  async getHome() {
    const cate = env.get<string>('category') || '/index.php/vod/type/id/4.html'
    const page = env.get<number>('page') || 1
    const hasQuery = /\?/.test(cate)
    const url = `${env.baseUrl}${cate}${hasQuery ? '&' : '?'}page=${page}`
    const html = await req(url)
    const $ = kitty.load(html)
    return this._parseList($)
  }

  async getDetail() {
    const id = env.get<string>('movieId') || ''
    const url = id.startsWith('http') ? id : `${env.baseUrl}${id}`
    const html = await req(url, { headers: { 'User-Agent': 'Mozilla/5.0', 'Referer': env.baseUrl } })
    const $ = kitty.load(html)

    const title =
      $('.module-info-heading .module-info-title').first().text().trim() ||
      $('h1').first().text().trim() ||
      $('title').text().trim()

    let cover =
      $('.module-info-poster img').attr('data-original') ||
      $('.module-info-poster img').attr('src') ||
      $('img').first().attr('src') ||
      ''
    if (cover && cover.startsWith('//')) cover = 'https:' + cover

    const episodes: { text: string; id: string }[] = []
    $('.module-play-list a, .module-play-list-link a').each((_: any, el: any) => {
      const $a = $(el)
      const text = ($a.text() || '').trim()
      let href = $a.attr('href') || ''
      if (!href) return
      if (!/^https?:/.test(href)) href = `${env.baseUrl}${href}`
      episodes.push({ text, id: href })
    })

    let directUrl = ''
    $('script').each((_: any, el: any) => {
      const t = $(el).html() || ''
      if (!t) return
      const m =
        t.match(/https?:[^\s'"<>]+\.m3u8[^\s'"<>]*/i) ||
        t.match(/["'](https?:\/\/[^"']+\.m3u8[^"']*)["']/i) ||
        t.match(/url\s*[:=]\s*["'](https?:\/\/[^"']+)["']/i)
      if (m) {
        directUrl = m[1] || m[0]
      }
    })

    const playlist: IPlaylist[] = []
    if (directUrl) {
      playlist.push({ title: '默认', videos: [{ text: '在线播放', url: directUrl }] })
    } else if (episodes.length > 0) {
      playlist.push({ title: '默认', videos: episodes })
    } else {
      playlist.push({ title: '默认', videos: [{ text: '打开详情页', id: url }] })
    }

    return <IMovie>{ id: url, title, cover, desc: '', playlist }
  }

  async getSearch() {
    const wd = env.get<string>('keyword') || ''
    const page = env.get<number>('page') || 1
    if (!wd) return []

    const url = `${env.baseUrl}/index.php/vod/search.html?wd=${encodeURIComponent(wd)}&page=${page}`
    const html = await req(url)
    const $ = kitty.load(html)
    return this._parseList($).map(it => ({ ...it, remark: '搜索结果' }))
  }
}

// TEST
// const env = createTestEnv(`https://www.yhdm668.com`)
// const call = new YHDM668();
// (async () => {
//   const cates = await call.getCategory()
//   env.set("category", cates[0].id)
//   env.set("page", 1)
//   const home = await call.getHome()
//   env.set("movieId", home[0].id)
//   const detail = await call.getDetail()
//   env.set("keyword", "火影")
//   const search = await call.getSearch()
//   debugger
// })()

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
      { text: 'TV动漫', id: '4' },
      { text: '剧场版动漫', id: '20' },
      { text: '电影', id: '1' },
      { text: '连续剧', id: '2' },
      { text: '短剧', id: '3' },
    ]
  }

  private _parseList($: any): IMovie[] {
    const items: IMovie[] = []
    $('a.module-poster-item').each((_: any, el: any) => {
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

      items.push({ id: href, title, cover: img, desc: '', remark, playlist: [] })
    })
    return items
  }

  async getHome() {
    const cate = env.get<string>('category') || '4'
    const page = env.get<number>('page') || 1
    const url = `${env.baseUrl}/vodshow/${cate}-----------${page}---.html`
    const html = await req(url)
    const $ = kitty.load(html)
    return this._parseList($)
  }

  async getDetail() {
    const id = env.get<string>('movieId') || ''
    const url = id.startsWith('http') ? id : `${env.baseUrl}${id}`
    const html = await req(url)
    const $ = kitty.load(html)

    const title =
      $('.module-info-heading .module-info-title').first().text().trim() ||
      $('h1').first().text().trim()

    let cover =
      $('.module-info-poster img').attr('data-original') ||
      $('.module-info-poster img').attr('src') ||
      ''
    if (cover && cover.startsWith('//')) cover = 'https:' + cover

    const episodes: { text: string; id: string }[] = []
    $('.module-play-list a').each((_: any, el: any) => {
      const $a = $(el)
      const text = ($a.text() || '').trim()
      let href = $a.attr('href') || ''
      if (!href) return
      if (!/^https?:/.test(href)) href = `${env.baseUrl}${href}`
      episodes.push({ text, id: href })
    })

    const playlist: IPlaylist[] = []
    if (episodes.length > 0) {
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

    const url = `${env.baseUrl}/vodsearch/${encodeURIComponent(wd)}----------${page}---.html`
    const html = await req(url)
    const $ = kitty.load(html)
    return this._parseList($).map(it => ({ ...it, remark: '搜索结果' }))
  }
}

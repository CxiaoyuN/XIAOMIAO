// import { env, req, kitty } from 'utils'

export default class FiveWeitingSource implements Handle {
  getConfig(): IConfig {
    return {
      id: '5weiting',
      name: '六月听书',
      api: 'http://www.5weiting.com',
      type: 1,
      nsfw: false
    }
  }

  async getCategory(): Promise<ICategory[]> {
    return [
      { text: '玄幻奇幻', id: 't1' },
      { text: '武侠仙侠', id: 't2' },
      { text: '都市言情', id: 't3' },
      { text: '历史军事', id: 't4' },
      { text: '科幻灵异', id: 't5' }
    ]
  }

  async getHome(): Promise<IMovie[]> {
    const cate = env.get('category', 't1')
    const order = env.get('order', '1')   // 1=人气，2=时间
    const page = env.get('page', '1')

    const url = `http://www.5weiting.com/ys/${cate}/o${order}/p${page}`
    const html = await req(url)
    const $ = kitty.load(html)

    return $('li.album-item').toArray().map<IMovie>(el => {
      const $el = $(el)
      const title = $el.find('.book-item-name a').text().trim()
      const id = $el.find('.book-item-name a').attr('href') || ''
      const rawCover = $el.find('.book-item-img img').attr('src') || ''
      const cover = rawCover
        ? (rawCover.startsWith('http') ? rawCover : `http://www.5weiting.com${rawCover}`)
        : 'http://www.5weiting.com/template/default/images/loading.gif'
      const remark = $el.find('.book-item-status').text().trim()
      const desc = $el.find('.book-item-desc').text().trim()

      return { id, title, cover, desc, remark, playlist: [] }
    })
  }

  async getDetail(): Promise<IMovie> {
    const id = env.get('movieId')
    const url = `http://www.5weiting.com${id}`
    const html = await req(url)
    const $ = kitty.load(html)

    const title = $('.book-title,.content_title,h1').first().text().trim() || $('title').text().trim()
    const rawCover = $('.book-img img,.content_pic img').attr('src') || ''
    const cover = rawCover
      ? (rawCover.startsWith('http') ? rawCover : `http://www.5weiting.com${rawCover}`)
      : 'http://www.5weiting.com/template/default/images/loading.gif'
    const desc = $('.book-desc,.content_desc,.data .desc').text().trim()
    const remark = $('.book-item-status,.data .remarks').text().trim()

    // 播放列表（单线路，多集）
    const videos: IVideo[] = []
    $('ul.list.clearfix li a').each((_, link) => {
      const $link = $(link)
      const text = $link.text().trim()
      const playId = $link.attr('href') || ''
      if (playId) {
        videos.push({ text, id: playId, type: 'iframe' })
      }
    })

    const playlist: IPlaylist[] = []
    if (videos.length > 0) {
      playlist.push({ title: '默认线路', videos })
    }

    return { id, title, cover, desc, remark, playlist }
  }

  async getSearch(): Promise<IMovie[]> {
    const keyword = env.get('keyword')
    const page = env.get('page', '1')
    const url = `http://www.5weiting.com/search/${encodeURIComponent(keyword)}/${page}.html`
    const html = await req(url)
    const $ = kitty.load(html)

    return $('li.album-item').toArray().map<IMovie>(el => {
      const $el = $(el)
      const title = $el.find('.book-item-name a').text().trim()
      const id = $el.find('.book-item-name a').attr('href') || ''
      const rawCover = $el.find('.book-item-img img').attr('src') || ''
      const cover = rawCover
        ? (rawCover.startsWith('http') ? rawCover : `http://www.5weiting.com${rawCover}`)
        : 'http://www.5weiting.com/template/default/images/loading.gif'
      const remark = $el.find('.book-item-status').text().trim()
      const desc = $el.find('.book-item-desc').text().trim()

      return { id, title, cover, desc, remark, playlist: [] }
    })
  }

  async parseIframe(): Promise<string> {
    const iframe = env.get('iframe')
    const url = `http://www.5weiting.com${iframe}`
    const html = await req(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X)'
      }
    })

    // 匹配带签名的 mp3 链接
    const m1 = html.match(/https?:\\/\\/[0-9.:]+\\/[0-9a-z]+\\/[0-9]+\\.mp3\\?[^'"]+/)
    if (m1) return m1[0]

    // 兜底：player = {url: "..."}
    const m2 = html.match(/player\\s*=\\s*\\{[^}]*url\\s*:\\s*['"]([^'"]+\\.mp3[^'"]*)['"]/)
    if (m2) return m2[1]

    return ''
  }
}

export default class Libvio {
  getConfig() {
    return {
      id: 'libvio',
      name: 'LIBVIO',
      api: 'https://www.libvio.cc',
      nsfw: false,
      type: 1,
    }
  }

  async getCategory() {
    return [
      { text: '电影', id: '1' },
      { text: '剧集', id: '2' },
      { text: '综艺', id: '3' },
      { text: '动漫', id: '4' },
    ]
  }

  // 列表解析
  _parseList($) {
    const items = []
    $('a.module-poster-item').each((_, el) => {
      const $a = $(el)
      let href = $a.attr('href') || ''
      if (!href) return
      if (!/^https?:/.test(href)) href = `${env.baseUrl}${href}`

      let img =
        $a.find('img').attr('data-original') ||
        $a.find('img').attr('data-src') ||
        $a.find('img').attr('src') ||
        ''
      if (img.startsWith('//')) img = 'https:' + img

      const title =
        ($a.find('.module-poster-item-title').text() || '').trim() ||
        ($a.attr('title') || '').trim()

      const remark = ($a.find('.module-item-note').text() || '').trim()

      items.push({ id: href, title, cover: img, desc: '', remark, playlist: [] })
    })
    return items
  }

  async getHome() {
    const cate = env.get('category') || '1'
    const page = env.get('page') || 1
    const url = `${env.baseUrl}/type/${cate}-${page}.html`
    const html = await req(url)
    const $ = kitty.load(html)
    return this._parseList($)
  }

  async getDetail() {
    const id = env.get('movieId') || ''
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
    if (cover.startsWith('//')) cover = 'https:' + cover

    const episodes = []
    $('.module-play-list a').each((_, el) => {
      const $a = $(el)
      const text = ($a.text() || '').trim()
      let href = $a.attr('href') || ''
      if (!href) return
      if (!/^https?:/.test(href)) href = `${env.baseUrl}${href}`
      episodes.push({ text, id: href })
    })

    const playlist = []
    if (episodes.length > 0) {
      playlist.push({ title: '默认', videos: episodes })
    } else {
      playlist.push({ title: '默认', videos: [{ text: '打开详情页', id: url }] })
    }

    return { id: url, title, cover, desc: '', playlist }
  }

  async getSearch() {
    const wd = env.get('keyword') || ''
    const page = env.get('page') || 1
    if (!wd) return []

    const url = `${env.baseUrl}/search/${encodeURIComponent(wd)}----------${page}---.html`
    const html = await req(url)
    const $ = kitty.load(html)
    return this._parseList($).map(it => ({ ...it, remark: '搜索结果' }))
  }
}

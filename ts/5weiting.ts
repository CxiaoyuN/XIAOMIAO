// import { env, req, kitty } from 'utils'

export default class FiveWeitingSource implements Handle {
  getConfig(): IConfig {
    return {
      id: '5weiting',
      name: '5味厅',
      api: 'http://www.5weiting.com',
      type: 1,
      nsfw: false
    }
  }

  async getCategory(): Promise<ICategory[]> {
    return [
      { text: '玄幻奇幻', id: 'ys/t1' },
      { text: '武侠仙侠', id: 'ys/t2' },
      { text: '都市言情', id: 'ys/t3' },
      { text: '历史军事', id: 'ys/t4' },
      { text: '科幻灵异', id: 'ys/t5' }
    ]
  }

  async getHome(): Promise<IMovie[]> {
    const cate = env.get('category', 'ys/t1')
    const page = env.get('page', '1')
    const url = `http://www.5weiting.com/${cate}/page/${page}.html`
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

    const playlist: IPlaylist[] = []
    const lineEls = $('.module-tab-items-box .module-tab-item,.play_source li a,.playlist-tab li a')
    const panelEls = $('.module-list.sort-list.tab-list.his-tab-list,.play_list_box,.playlist')

    if (lineEls.length && panelEls.length) {
      lineEls.each((i, el) => {
        const lineTitle = $(el).text().trim() || $(el).attr('data-dropdown-value') || `线路${i + 1}`
        const panel = panelEls.eq(i)
        const videos: IVideo[] = []

        panel.find('.module-play-list-link,.play_list a,.playlist a').each((_, link) => {
          const $link = $(link)
          const text = $link.text().trim() || $link.find('span').text().trim() || '播放'
          const playId = $link.attr('href') || ''
          if (playId) videos.push({ text, id: playId, type: 'iframe' })
        })

        if (videos.length) playlist.push({ title: lineTitle, videos })
      })
    } else {
      const playUrl = $('.btn-play a,.module-info-play a,.play-btn a').attr('href') || ''
      if (playUrl) {
        playlist.push({ title: '默认', videos: [{ text: '立即播放', id: playUrl, type: 'iframe' }] })
      }
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
    const html = await req(`http://www.5weiting.com${iframe}`)

    const m1 = html.match(/"url":"(https?:\\\/\\\/[^"]+\.m3u8)"/)
    if (m1) return m1[1].replace(/\\\//g, '/')

    const m2 = html.match(/player\s*=\s*\{[^}]*url\s*:\s*['"]([^'"]+\.m3u8)['"]/)
    if (m2) return m2[1]

    const m3 = html.match(/https?:\/\/[^\s'"<>]+\.m3u8/)
    if (m3) return m3[0]

    return ''
  }
}

// import { kitty, req } from 'utils'

export default class YHW implements Handle {
  getConfig() {
    return {
      id: 'yhw',
      name: '樱花动漫',
      api: 'https://www.857yhw.com',
      type: 1,
      nsfw: false,
    }
  }

  async getCategory() {
    return [
      { text: '日漫', id: 'ribendongman' },
      { text: '国漫', id: 'guochandongman' },
      { text: '美漫', id: 'omeidongman' },
      { text: '剧场', id: 'dongmandianying' },
    ]
  }

  async getHome() {
    const cate = env.get('category')
    const page = env.get('page')
    const supportsPaging = ['ribendongman', 'guochandongman'].includes(cate)
    const url = supportsPaging
      ? `${env.baseUrl}/type/${cate}-${page}.html`
      : `${env.baseUrl}/type/${cate}.html`

    const html = await req(url)
    const $ = kitty.load(html)
    return $('.myui-vodlist__box').toArray().map(item => {
      const a = $(item).find('a.myui-vodlist__thumb')
      const id = a.attr('href') ?? ''
      const title = a.attr('title') ?? ''
      const cover = a.attr('data-original') ?? ''
      const remark = $(item).find('.pic-text').text().trim() ?? ''
      return { id, title, cover, remark, playlist: [] }
    })
  }

  async getDetail() {
    const id = env.get('movieId')
    const url = `${env.baseUrl}${id}`
    const html = await req(url)
    const $ = kitty.load(html)

    const title = $('.myui-content__detail .title').text().trim()
    const desc = $('.myui-content__detail .data').text().trim()
    const cover = $('.myui-content__thumb .lazyload').attr('data-original') ?? ''
    const remark = $('.myui-content__detail .myui-content__other').text().trim()

    const playlists: IPlaylist[] = []

    $('.tab-content .tab-pane').each((_, tab) => {
      const tabId = $(tab).attr('id') ?? ''
      const tabTitle = $(`.nav-tabs a[href="#${tabId}"]`).text().trim() || '默认线路'

      const videos: IPlaylistVideo[] = $(tab).find('a[href*="/play/"]').toArray().map(a => {
        const text = $(a).text().trim()
        const playPath = $(a).attr('href') ?? ''
        return { text, id: playPath } // ✅ 使用 id，交给 parseIframe
      })

      if (videos.length > 0) {
        playlists.push({ title: tabTitle, videos })
      }
    })

    return {
      id,
      title,
      cover,
      desc,
      remark,
      playlist: playlists,
    }
  }

  async getSearch() {
    const wd = env.get('keyword')
    const page = env.get('page')
    const url = `${env.baseUrl}/search/${wd}----------${page}---.html`
    const html = await req(url)
    const $ = kitty.load(html)
    return $('.myui-vodlist__box').toArray().map(item => {
      const a = $(item).find('a.myui-vodlist__thumb')
      const id = a.attr('href') ?? ''
      const title = a.attr('title') ?? ''
      const cover = a.attr('data-original') ?? ''
      const remark = $(item).find('.pic-text').text().trim() ?? ''
      return { id, title, cover, remark, playlist: [] }
    })
  }

  async parseIframe() {
    const playPath = env.get('id')
    const playHtml = await req(`${env.baseUrl}${playPath}`)
    const urlMatch = playHtml.match(/player_aaaa\.url\s*=\s*["']([^"']+)["']/)
    if (!urlMatch) return ''
    const encrypted = urlMatch[1]
    return `https://danmu.yhdmjx.com/m3u8.php?url=${encodeURIComponent(encrypted)}`
  }
}

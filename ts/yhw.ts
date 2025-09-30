// import { kitty, req } from 'utils'

export default class YHW implements Handle {
  getConfig() {
    return {
      id: 'yhw',
      name: '樱花动漫_WEB',
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
    const url = ['ribendongman', 'guochandongman'].includes(cate)
      ? `${env.baseUrl}/type/${cate}-${page}.html`
      : `${env.baseUrl}/type/${cate}.html`

    const html = await req(url)
    const $ = kitty.load(html)

    return $('.myui-vodlist__box').toArray().map(item => {
      const a = $(item).find('a.myui-vodlist__thumb')
      return {
        id: a.attr('href') ?? '',
        title: a.attr('title') ?? '',
        cover: a.attr('data-original') ?? '',
        remark: $(item).find('.pic-text').text().trim(),
        playlist: [],
      }
    })
  }

  async getDetail() {
    const id = env.get('movieId')
    const html = await req(`${env.baseUrl}${id}`)
    const $ = kitty.load(html)

    const title = $('.myui-content__detail .title').text().trim()
    const desc = $('.myui-content__detail .data').text().trim()
    const cover = $('.myui-content__thumb .lazyload').attr('data-original') ?? ''
    const remark = $('.myui-content__detail .myui-content__other').text().trim()

    const baseUrl = env.baseUrl
    const playlists: IPlaylist[] = []

    $('.tab-content .tab-pane').each((_, tab) => {
      const tabId = $(tab).attr('id') ?? ''
      const tabTitle = $(`.nav-tabs a[href="#${tabId}"]`).text().trim() || '默认线路'

      const rawLinks = $(tab).find('a[href*="/play/"]').toArray().map(a => ({
        text: $(a).text().trim(),
        fullUrl: `${baseUrl}${a.attribs.href}`,
      }))

      const videos: IPlaylistVideo[] = []

      // 插入网页播放按钮（第一集）
      if (rawLinks.length > 0) {
        videos.push({ text: '网页播放', id: rawLinks[0].fullUrl })
      }

      // 每集链接使用完整网页地址
      for (const { text, fullUrl } of rawLinks) {
        videos.push({ text, id: fullUrl })
      }

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
    const html = await req(`${env.baseUrl}/search/${wd}----------${page}---.html`)
    const $ = kitty.load(html)

    return $('.myui-vodlist__box').toArray().map(item => {
      const a = $(item).find('a.myui-vodlist__thumb')
      return {
        id: a.attr('href') ?? '',
        title: a.attr('title') ?? '',
        cover: a.attr('data-original') ?? '',
        remark: $(item).find('.pic-text').text().trim(),
        playlist: [],
      }
    })
  }

  async parseIframe() {
    return env.get('id') // ✅ 直接返回网页地址，小猫自动解析
  }
}

// import { kitty, req, createTestEnv } from 'utils'

export default class YHW implements Handle {
  getConfig() {
    return <Iconfig>{
      id: 'yhw',
      name: '樱花动漫',
      api: 'https://www.857yhw.com',
      type: 1,
      nsfw: false,
    }
  }

  async getCategory() {
    return <ICategory[]>[
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
    const items = $('.myui-vodlist__box').toArray().map(item => {
      const a = $(item).find('a.myui-vodlist__thumb')
      const id = a.attr('href') ?? ''
      const title = a.attr('title') ?? ''
      const cover = a.attr('data-original') ?? ''
      const remark = $(item).find('.pic-text').text().trim() ?? ''
      return { id, title, cover, remark, playlist: [] }
    })
    return items.length > 0 ? items : await this.getFallbackHome()
  }

  async getFallbackHome() {
    const html = await req(`${env.baseUrl}/`)
    const $ = kitty.load(html)
    return $('.myui-vodlist__box').toArray().map(item => {
      const a = $(item).find('a.myui-vodlist__thumb')
      const id = a.attr('href') ?? ''
      const title = a.attr('title') ?? ''
      const cover = a.attr('data-original') ?? ''
      const remark = $(item).find('.pic-text').text().trim() ?? ''
      return { id, title, cover, remark, playlist: [] }
    }).filter(v => v.id && v.title)
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

    const rawLinks = $('#playlist .col-md-auto a').toArray().map(item => {
      const text = $(item).text().trim()
      const playPath = $(item).attr('href') ?? ''
      return { text, playPath }
    })

    const videos: IPlaylistVideo[] = []
    for (const { text, playPath } of rawLinks) {
      const playHtml = await req(`${env.baseUrl}${playPath}`)
      const urlMatch = playHtml.match(/player_data\.url\s*=\s*["']([^"']+)["']/)
      const encryptMatch = playHtml.match(/player_data\.encrypt\s*=\s*["']?(\d)["']?/)
      if (!urlMatch || !encryptMatch) continue

      let realUrl = urlMatch[1]
      const encryptType = encryptMatch[1]
      if (encryptType === '2') {
        realUrl = Buffer.from(decodeURIComponent(realUrl), 'base64').toString('utf-8')
      } else if (encryptType === '1') {
        realUrl = decodeURIComponent(realUrl)
      }

      if (realUrl.startsWith('http') || realUrl.startsWith('//')) {
        videos.push({ text, id: realUrl })
      }
    }

    return <IMovie>{
      id,
      title,
      cover,
      desc,
      remark,
      playlist: videos.length > 0 ? [{ title: '在线播放', videos }] : [],
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
    return '' // 已在 getDetail 中提前解密，无需再解析
  }
}

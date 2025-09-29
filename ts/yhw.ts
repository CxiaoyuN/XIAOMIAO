// import { kitty, req } from 'utils'

const CONFIG = {
  BASE_URL: 'https://www.857yhw.com',
  SUPPORT_PAGING_CATEGORIES: ['ribendongman', 'guochandongman'] as const,
  DEFAULT_CATEGORIES: [
    { text: '日漫', id: 'ribendongman' },
    { text: '国漫', id: 'guochandongman' },
    { text: '美漫', id: 'omeidongman' },
    { text: '动画', id: 'dongmandianying' },
  ] as const,
  SELECTORS: {
    VOD_LIST: '.myui-vodlist__box',
    THUMB_LINK: 'a.myui-vodlist__thumb',
    PIC_TEXT: '.pic-text',
    DETAIL_TITLE: '.myui-content__detail .title',
    DETAIL_DESC: '.myui-content__detail .data',
    DETAIL_COVER: '.myui-content__thumb .lazyload',
    DETAIL_REMARK: '.myui-content__detail .myui-content__other',
    PLAY_LIST: '#playlist .col-md-auto a',
  } as const,
  URL_TEMPLATES: {
    CATEGORY: (cate: string, page: string) => `/type/${cate}${page ? `-${page}` : ''}.html`,
    SEARCH: (wd: string, page: string) => `/search/${wd}----------${page}---.html`,
  } as const,
}

async function robustReq(url: string): Promise<string> {
  return await req(url)
}

export default class YHW implements Handle {
  getConfig() {
    return {
      id: 'yhw',
      name: '樱花动漫',
      api: CONFIG.BASE_URL,
      type: 1,
      nsfw: false,
    }
  }

  async getCategory() {
    return [...CONFIG.DEFAULT_CATEGORIES]
  }

  private parseVideoItem(item: cheerio.Element, $: cheerio.CheerioAPI): IVideoItem {
    const $item = $(item)
    const $a = $item.find(CONFIG.SELECTORS.THUMB_LINK)
    const id = $a.attr('href') || ''
    const title = $a.attr('title') || $a.attr('alt') || $a.find('img').attr('title') || ''
    const cover = $a.attr('data-original') || $a.find('img').attr('src') || ''
    const remark = ($item.find(CONFIG.SELECTORS.PIC_TEXT).text() || '').trim()
    return { id, title, cover, remark, playlist: [] }
  }

  async getHome() {
    const cate = env.get('category') || ''
    const page = env.get('page') || '1'
    const supportsPaging = CONFIG.SUPPORT_PAGING_CATEGORIES.includes(cate)
    const path = CONFIG.URL_TEMPLATES.CATEGORY(cate, supportsPaging ? page : '')
    const url = `${CONFIG.BASE_URL}${path}`
    const html = await robustReq(url)
    const $ = kitty.load(html)
    const items = $(CONFIG.SELECTORS.VOD_LIST).toArray().map(item => this.parseVideoItem(item, $)).filter(v => v.id && v.title)
    return items.length > 0 ? items : await this.getFallbackHome()
  }

  async getFallbackHome() {
    const html = await robustReq(`${CONFIG.BASE_URL}/`)
    const $ = kitty.load(html)
    return $(CONFIG.SELECTORS.VOD_LIST).toArray().map(item => this.parseVideoItem(item, $)).filter(v => v.id && v.title)
  }

  async getDetail() {
    const id = env.get('movieId')
    const url = `${CONFIG.BASE_URL}${id}`
    const html = await robustReq(url)
    const $ = kitty.load(html)

    const title = ($(CONFIG.SELECTORS.DETAIL_TITLE).text() || '未知标题').trim()
    const desc = ($(CONFIG.SELECTORS.DETAIL_DESC).text() || '').trim()
    const cover = $(CONFIG.SELECTORS.DETAIL_COVER).attr('data-original') || $(CONFIG.SELECTORS.DETAIL_COVER).attr('src') || ''
    const remark = ($(CONFIG.SELECTORS.DETAIL_REMARK).text() || '').trim()

    const rawLinks = $(CONFIG.SELECTORS.PLAY_LIST).toArray().map(item => {
      const $item = $(item)
      return {
        text: ($item.text() || '未知集数').trim(),
        playPath: $item.attr('href') || '',
      }
    }).filter(link => link.playPath)

    const videos: IPlaylistVideo[] = []
    for (const link of rawLinks) {
      const playUrl = `${CONFIG.BASE_URL}${link.playPath}`
      const playHtml = await robustReq(playUrl)
      const urlMatch = playHtml.match(/player_data\s*\.\s*url\s*=\s*["']([^"']+)["']/)
      const encryptMatch = playHtml.match(/player_data\s*\.\s*encrypt\s*=\s*["']?(\d)["']?/)
      if (!urlMatch || !encryptMatch) continue

      let realUrl = urlMatch[1]
      const encryptType = encryptMatch[1]
      if (encryptType === '2') {
        realUrl = Buffer.from(decodeURIComponent(realUrl), 'base64').toString('utf-8')
      } else if (encryptType === '1') {
        realUrl = decodeURIComponent(realUrl)
      }

      if (realUrl.startsWith('http') || realUrl.startsWith('//')) {
        videos.push({ text: link.text, id: realUrl })
      }
    }

    return {
      id,
      title,
      cover,
      desc,
      remark,
      playlist: videos.length > 0 ? [{ title: '樱花线路', videos }] : [],
    }
  }

  async getSearch() {
    const wd = env.get('keyword')
    const page = env.get('page') || '1'
    if (!wd) return []
    const path = CONFIG.URL_TEMPLATES.SEARCH(wd, page)
    const url = `${CONFIG.BASE_URL}${path}`
    const html = await robustReq(url)
    const $ = kitty.load(html)
    return $(CONFIG.SELECTORS.VOD_LIST).toArray().map(item => this.parseVideoItem(item, $)).filter(v => v.id && v.title)
  }

  async parseIframe() {
    return ''
  }
}

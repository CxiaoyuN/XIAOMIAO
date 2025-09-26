import puppeteer from 'puppeteer'

export default class YHDM668 {
  getConfig() {
    return {
      id: 'yhdm668',
      name: '樱花动漫(模拟浏览器)',
      api: 'https://www.yhdm668.com',
      nsfw: false,
      type: 1,
    }
  }

  async getCategory() {
    return [
      { text: 'TV动漫', id: '4' },
      { text: '剧场版动漫', id: '20' },
      { text: '电影', id: '1' },
      { text: '连续剧', id: '2' },
      { text: '短剧', id: '3' },
    ]
  }

  // 用 Puppeteer 打开页面并返回 HTML
  private async fetchHtml(url: string): Promise<string> {
    const browser = await puppeteer.launch({ headless: true })
    const page = await browser.newPage()
    await page.goto(url, { waitUntil: 'networkidle2' })
    const html = await page.content()
    await browser.close()
    return html
  }

  async getHome() {
    const cate = env.get('category') || '4'
    const pageNum = env.get('page') || 1
    const url = `${this.getConfig().api}/vodshow/${cate}-----------${pageNum}---.html`
    const html = await this.fetchHtml(url)

    const items: IMovie[] = []
    const regex = /<a[^>]+href="([^"]+)"[^>]*class="module-poster-item"[^>]*>[\s\S]*?<img[^>]+(data-original|src)="([^"]+)"[^>]*>[\s\S]*?<div[^>]*class="module-poster-item-title">([^<]+)<\/div>/g
    let match
    while ((match = regex.exec(html)) !== null) {
      let href = match[1]
      if (!href.startsWith('http')) href = this.getConfig().api + href
      let cover = match[3]
      if (cover.startsWith('//')) cover = 'https:' + cover
      const title = match[4].trim()
      items.push({ id: href, title, cover, desc: '', remark: '', playlist: [] })
    }
    return items
  }

  async getDetail() {
    const id = env.get('movieId') || ''
    const url = id.startsWith('http') ? id : `${this.getConfig().api}${id}`
    const html = await this.fetchHtml(url)

    const titleMatch = html.match(/<h1[^>]*>([^<]+)<\/h1>/)
    const title = titleMatch ? titleMatch[1].trim() : '未知标题'

    const coverMatch = html.match(/<div class="module-info-poster">[\s\S]*?<img[^>]+(data-original|src)="([^"]+)"/)
    let cover = coverMatch ? coverMatch[2] : ''
    if (cover.startsWith('//')) cover = 'https:' + cover

    const m3u8Match = html.match(/(https?:\/\/[^"']+\.m3u8[^"']*)/i)
    const playUrl = m3u8Match ? m3u8Match[1] : ''

    const playlist: IPlaylist[] = [{
      title: '默认',
      videos: playUrl ? [{ text: '在线播放', url: playUrl }] : []
    }]

    return <IMovie>{ id: url, title, cover, desc: '', playlist }
  }

  async getSearch() {
    const wd = env.get('keyword') || ''
    const pageNum = env.get('page') || 1
    if (!wd) return []

    const url = `${this.getConfig().api}/vodsearch/${encodeURIComponent(wd)}----------${pageNum}---.html`
    const html = await this.fetchHtml(url)

    const items: IMovie[] = []
    const regex = /<a[^>]+href="([^"]+)"[^>]*class="module-poster-item"[^>]*>[\s\S]*?<img[^>]+(data-original|src)="([^"]+)"[^>]*>[\s\S]*?<div[^>]*class="module-poster-item-title">([^<]+)<\/div>/g
    let match
    while ((match = regex.exec(html)) !== null) {
      let href = match[1]
      if (!href.startsWith('http')) href = this.getConfig().api + href
      let cover = match[3]
      if (cover.startsWith('//')) cover = 'https:' + cover
      const title = match[4].trim()
      items.push({ id: href, title, cover, desc: '', remark: '搜索结果', playlist: [] })
    }
    return items
  }
}

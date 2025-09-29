// import { kitty, req } from 'utils'

export default class SakuraAnime implements Handle {
  getConfig() {
    return <Iconfig>{
      id: 'sakura857',
      name: '樱花动漫',
      api: 'https://www.857yhw.com',
      type: 1,
      nsfw: false,
    }
  }

  async getCategory() {
    return <ICategory[]>[
      { text: '日本动漫', id: 'ribendongman' },
      { text: '国产动漫', id: 'guochandongman' },
      { text: '欧美动漫', id: 'oumeidongman' },
      { text: '剧场版', id: 'juchangban' },
    ]
  }

  async getHome() {
    const cate = env.get('category')
    const page = env.get('page')
    const url = `${env.baseUrl}/type/${cate}-${page}.html`
    const html = await req(url)
    const $ = kitty.load(html)
    return $('.myui-vodlist__box').toArray().map(item => {
      const a = $(item).find('a.myui-vodlist__thumb')
      const id = a.attr('href') ?? ''
      const title = a.attr('title') ?? ''
      const cover = a.attr('data-original') ?? ''
      const remark = $(item).find('.pic-text').text() ?? ''
      return { id, title, cover, remark, playlist: [] }
    })
  }

  async getDetail() {
    const id = env.get('movieId')
    const url = `${env.baseUrl}${id}`
    const html = await req(url)
    const $ = kitty.load(html)
    const title = $('.myui-content__detail .title').text()
    const desc = $('.myui-content__detail .data').text()
    const cover = $('.myui-content__thumb .lazyload').attr('data-original') ?? ''
    const player: IPlaylistVideo[] = $('#playlist .col-md-auto a').toArray().map(item => {
      const text = $(item).text()
      const id = $(item).attr('href') ?? ''
      return { text, id }
    })
    return <IMovie>{
      id,
      title,
      cover,
      desc,
      remark: '',
      playlist: [{ title: '樱花动漫', videos: player }],
    }
  }
  async safeRequest(url: string): Promise<string> {
    try {
      const html = await req(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
          'Referer': 'https://www.857yhw.com/',
        },
      })
      if (!html || html.length < 100) throw new Error('Empty HTML')
      return html
    } catch (err) {
      console.warn(`请求失败: ${url}`, err)
      return ''
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
      const remark = $(item).find('.pic-text').text() ?? ''
      return { id, title, cover, remark, playlist: [] }
    })
  }

  async parseIframe() {
    const iframePath = env.get('iframe') // 例如: /play/9341-1-1.html
    const fullUrl = `${env.baseUrl}${iframePath}`
    const html = await this.safeRequest(fullUrl)

    // 尝试提取 .mp4 或 .m3u8 视频地址
    const match = html.match(/https?:\/\/[^"']+\.(mp4|m3u8)[^"']*/i)
    if (match) {
      console.log('🎯 视频地址:', match[0])
      return match[0]
    }

    // 尝试从 iframe 中继续解析
    const $ = kitty.load(html)
    const iframeSrc = $('iframe').attr('src')
    if (iframeSrc) {
      const nestedHtml = await this.safeRequest(iframeSrc)
      const nestedMatch = nestedHtml.match(/https?:\/\/[^"']+\.(mp4|m3u8)[^"']*/i)
      if (nestedMatch) {
        console.log('🎯 嵌套 iframe 视频地址:', nestedMatch[0])
        return nestedMatch[0]
      }
    }

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

  async getHome() {
    const cate = env.get('category')
    const page = env.get('page')
    const url = `${env.baseUrl}/type/${cate}-${page}.html`
    const html = await this.safeRequest(url)
    const $ = kitty.load(html)
    return $('.myui-vodlist__box').toArray().map(item => {
      const a = $(item).find('a.myui-vodlist__thumb')
      const id = a.attr('href') ?? ''
      const title = a.attr('title') ?? ''
      const cover = a.attr('data-original') ?? ''
      const remark = $(item).find('.pic-text').text() ?? ''
      if (!id || !title || !cover) return null
      return { id, title, cover, remark, playlist: [] }
    }).filter(Boolean)
  }

  async getDetail() {
    const id = env.get('movieId')
    const url = `${env.baseUrl}${id}`
    const html = await this.safeRequest(url)
    const $ = kitty.load(html)
    const title = $('.myui-content__detail .title').text().trim() || $('h1').text().trim()
    const desc = $('.myui-content__detail .data').text().trim()
    const cover = $('.myui-content__thumb .lazyload').attr('data-original') ?? ''
    const player: IPlaylistVideo[] = $('#playlist .col-md-auto a').toArray().map(item => {
      const text = $(item).text().trim()
      const id = $(item).attr('href') ?? ''
      return { text, id }
    }).filter(p => p.id)

    const playlist = player.length > 0
      ? [{ title: '樱花动漫', videos: player }]
      : [{ title: '暂无播放列表', videos: [] }]

    return <IMovie>{
      id,
      title,
      cover,
      desc,
      remark: '',
      playlist,
    }
  }

  async getSearch() {
    const wd = env.get('keyword')
    const page = env.get('page')
    const url = `${env.baseUrl}/search/${wd}----------${page}---.html`
    const html = await this.safeRequest(url)
    const $ = kitty.load(html)
    return $('.myui-vodlist__box').toArray().map(item => {
      const a = $(item).find('a.myui-vodlist__thumb')
      const id = a.attr('href') ?? ''
      const title = a.attr('title') ?? ''
      const cover = a.attr('data-original') ?? ''
      const remark = $(item).find('.pic-text').text() ?? ''
      if (!id || !title || !cover) return null
      return { id, title, cover, remark, playlist: [] }
    }).filter(Boolean)
  }

  async parseIframe() {
    return kitty.utils.getM3u8WithIframe(env)
  }
}

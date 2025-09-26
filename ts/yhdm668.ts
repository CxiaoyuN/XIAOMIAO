// import { kitty, req, createTestEnv } from 'utils'

export default class YHDM668 implements Handle {
  getConfig() {
    return <Iconfig>{
      id: 'yhdm668',
      name: '樱花动漫',
      api: 'https://www.yhdm668.com',
      type: 1,
      nsfw: false,
    }
  }

  async getCategory() {
    return <ICategory[]>[
      { text: 'TV动漫', id: '4' },
      { text: '剧场版动漫', id: '20' },
      { text: '电影', id: '1' },
      { text: '连续剧', id: '2' },
      { text: '短剧', id: '3' },
    ]
  }

  async getHome() {
    const cate = env.get('category') || '4'
    const page = env.get('page') || 1
    // yhdm668 分类页真实路径是 /vodshow/{id}-----------{page}---.html
    const url = `${env.baseUrl}/vodshow/${cate}-----------${page}---.html`
    const html = await req(url)
    const $ = kitty.load(html)

    return $('a.module-poster-item').toArray().map(item => {
      const $a = $(item)
      const id = $a.attr('href') ?? ''
      const title =
        $a.find('.module-poster-item-title').text().trim() ||
        $a.attr('title') ||
        ''
      const remark = $a.find('.module-item-note').text().trim()
      const cover =
        $a.find('img').attr('data-original') ||
        $a.find('img').attr('data-src') ||
        $a.find('img').attr('src') ||
        ''
      return <IMovie>{ id, title, cover, remark, playlist: [] }
    })
  }

  async getDetail() {
    const id = env.get('movieId')
    const url = id.startsWith('http') ? id : `${env.baseUrl}${id}`
    const html = await req(url)
    const $ = kitty.load(html)

    const title =
      $('.module-info-heading h1').text().trim() ||
      $('title').text().trim()
    const cover =
      $('.module-info-poster img').attr('data-original') ||
      $('.module-info-poster img').attr('src') ||
      ''
    const desc = $('.module-info-introduction-content').text().trim()

    const player: IPlaylistVideo[] = $('.module-play-list a').toArray().map(item => {
      const $a = $(item)
      const text = $a.text().trim()
      const id = $a.attr('href') ?? ''
      return { text, id }
    })

    return <IMovie>{
      id: url,
      title,
      cover,
      desc,
      remark: '',
      playlist: [{ title: '樱花动漫', videos: player }],
    }
  }

  async getSearch() {
    const wd = env.get('keyword')
    const page = env.get('page') || 1
    if (!wd) return []

    // 搜索路径：/vodsearch/{关键词}----------{page}---.html
    const url = `${env.baseUrl}/vodsearch/${encodeURIComponent(wd)}----------${page}---.html`
    const html = await req(url)
    const $ = kitty.load(html)

    return $('a.module-poster-item').toArray().map(item => {
      const $a = $(item)
      const id = $a.attr('href') ?? ''
      const title =
        $a.find('.module-poster-item-title').text().trim() ||
        $a.attr('title') ||
        ''
      const cover =
        $a.find('img').attr('data-original') ||
        $a.find('img').attr('data-src') ||
        $a.find('img').attr('src') ||
        ''
      const remark = $a.find('.module-item-note').text().trim()
      return <IMovie>{ id, title, cover, remark, playlist: [] }
    })
  }

  async parseIframe() {
    return kitty.utils.getM3u8WithIframe(env)
  }
}

// TEST
// const env = createTestEnv("https://www.yhdm668.com")
// const call = new YHDM668()
// ;(async () => {
//   const cates = await call.getCategory()
//   env.set("category", cates[0].id)
//   env.set("page", 1)
//   const home = await call.getHome()
//   env.set("movieId", home[0].id)
//   const detail = await call.getDetail()
//   env.set("keyword", "火影")
//   const search = await call.getSearch()
//   debugger
// })()

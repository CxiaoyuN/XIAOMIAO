// import { kitty, req, createTestEnv } from 'utils'

export default class yhdm668 implements Handle {
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
      { text: '热门推荐', id: '/index.php/label/hot.html' },
      { text: '今日更新', id: '/index.php/label/new.html' },
      { text: '周更新表', id: '/index.php/label/week.html' },
      { text: '最近更新', id: '/index.php/vod/show/id/4.html' },
      { text: '动漫电影', id: '/index.php/vod/type/id/20.html' },
      { text: '连载动漫', id: '/index.php/vod/type/id/4.html' },
      { text: '完结动漫', id: '/index.php/vod/type/id/21.html' },
    ]
  }

  async getHome() {
    const cate = env.get('category')
    const page = env.get('page')
    const hasQuery = cate.includes('?') || cate.includes('&')
    const url = `${env.baseUrl}${cate}${hasQuery ? '&' : '?'}page=${page}`
    const html = await req(url)
    const $ = kitty.load(html)

    return $('.module-items .module-item').toArray().map(item => {
      const a = $(item).find('a')
      const id = a.attr('href') ?? ''
      const cover =
        a.find('img').attr('data-original') ||
        a.find('img').attr('src') ||
        ''
      const title =
        a.attr('title') ||
        a.find('.module-poster-item-title').text().trim()
      const remark = $(item).find('.module-item-note').text().trim()
      return <IMovie>{ id, title, cover, remark }
    })
  }

  async getDetail() {
    const id = env.get('movieId')
    const url = `${env.baseUrl}${id}`
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

    const tabs = $('.module-tab-items-box .module-tab-item').toArray().map(item => {
      return $(item).text().trim()
    })

    const _videos = $('.module-play-list').toArray().map<IPlaylistVideo[]>((item) => {
      return $(item).find('a').toArray().map(a => {
        const id = $(a).attr('href') ?? ''
        const text = $(a).text().trim()
        return { id, text }
      })
    })

    const playlist = tabs.map((title, index) => {
      const videos = _videos[index]
      return <IPlaylist>{ title, videos }
    })

    return <IMovie>{ id, title, cover, desc, playlist }
  }

  async getSearch() {
    const wd = env.get('keyword')
    const page = env.get('page')
    const url = `${env.baseUrl}/index.php/vod/search/page/${page}/wd/${wd}.html`
    const html = await req(url)
    const $ = kitty.load(html)

    return $('.module-items .module-search-item').toArray().map<IMovie>(item => {
      const a = $(item).find('a')
      const id = a.attr('href') ?? ''
      const cover =
        a.find('img').attr('data-original') ||
        a.find('img').attr('src') ||
        ''
      const title = a.attr('title') || a.text().trim()
      const remark = $(item).find('.video-remarks').text().trim()
      return { id, cover, title, remark }
    })
  }

  async parseIframe() {
    return kitty.utils.getM3u8WithIframe(env)
  }
}

// TEST
// const env = createTestEnv("https://www.yhdm668.com")
// const call = new yhdm668()
// ;(async () => {
//   const cates = await call.getCategory()
//   env.set("category", cates[0].id)
//   env.set("page", 1)
//   const home = await call.getHome()
//   env.set("movieId", home[0].id)
//   const detail = await call.getDetail()
//   env.set("keyword", "火影")
//   const search = await call.getSearch()
//   env.set("iframe", detail.playlist![0].videos[0].id)
//   const realM3u8 = await call.parseIframe()
//   debugger
// })()

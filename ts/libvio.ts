// import { kitty, req, createTestEnv } from 'utils'

export default class Libvio implements Handle {
  getConfig() {
    return <Iconfig>{
      id: 'libvio',
      name: 'LIBVIO',
      api: 'https://www.libvio.cc',
      type: 1,
      nsfw: false,
    }
  }

  async getCategory() {
    return <ICategory[]>[
      { text: '电影', id: '1' },
      { text: '剧集', id: '2' },
      { text: '综艺', id: '3' },
      { text: '动漫', id: '4' },
      { text: '韩剧', id: '15' },,
      { text: '美剧', id: '16' },
    ]
  }

  async getHome() {
    const cate = env.get('category') || '1'
    const page = env.get('page') || 1
    const url = `${env.baseUrl}/type/${cate}-${page}.html`
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
      playlist: [{ title: 'LIBVIO', videos: player }],
    }
  }

  async getSearch() {
    const wd = env.get('keyword')
    const page = env.get('page') || 1
    const url = `${env.baseUrl}/search/${encodeURIComponent(wd)}----------${page}---.html`
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
// const env = createTestEnv("https://www.libvio.cc")
// const call = new Libvio()
// ;(async () => {
//   const cates = await call.getCategory()
//   env.set("category", cates[0].id)
//   env.set("page", 1)
//   const home = await call.getHome()
//   env.set("movieId", home[0].id)
//   const detail = await call.getDetail()
//   env.set("keyword", "复仇者联盟")
//   const search = await call.getSearch()
//   debugger
// })()

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
    return kitty.utils.getM3u8WithIframe(env)
  }
}

//import { env, req, kitty } from 'utils'

export default class NivodSource implements Handle {
  getConfig(): IConfig {
    return {
      id: 'nivodtv',
      name: '泥视频TV',
      api: 'https://www.nivod.vip',
      type: 1,
      nsfw: false
    }
  }

  async getCategory(): Promise<ICategory[]> {
    return [
      { text: '电影', id: '1' },
      { text: '电视剧', id: '2' },
      { text: '综艺', id: '3' },
      { text: '动漫', id: '4' }
    ]
  }

  async getHome(): Promise<IMovie[]> {
    const cate = env.get('category', '1')
    const page = env.get('page', '1')
    const url = `https://www.nivod.vip/k/${cate}--------${page}---/`
    const html = await req(url)
    const $ = kitty.load(html)

    return $('.module-poster-item').toArray().map<IMovie>(el => {
      const $el = $(el)
      const title = $el.attr('title')?.trim() || ''
      const id = $el.attr('href') || ''
      const cover = $el.find('img').attr('data-original') || ''
      const remark = $el.find('.module-item-note').text().trim()

      return {
        id,
        title,
        cover: `https://www.nivod.vip${cover}`,
        desc: '',
        remark,
        playlist: []
      }
    })
  }

  async getDetail(): Promise<IMovie> {
    const id = env.get('movieId')
    const url = `https://www.nivod.vip${id}`
    const html = await req(url)
    const $ = kitty.load(html)

    const title = $('title').text().trim()
    const cover = $('.module-item-pic img').attr('data-original') || ''
    const desc = $('.module-info-introduction-content').text().trim()
    const remark = $('.module-info-item:contains("备注：") .module-info-item-content').text().trim()

    const playUrl = $('.module-info-play a').attr('href') || ''
    const playlist: IPlaylist[] = [{
      title: '默认',
      videos: [{
        text: '立即播放',
        id: playUrl,
        type: 'iframe'
      }]
    }]

    return {
      id,
      title,
      cover: `https://www.nivod.vip${cover}`,
      desc,
      remark,
      playlist
    }
  }

  async getSearch(): Promise<IMovie[]> {
    const keyword = env.get('keyword')
    const page = env.get('page', '1')
    const url = `https://www.nivod.vip/s/${encodeURIComponent(keyword)}-------------/`
    const html = await req(url)
    const $ = kitty.load(html)

    return $('.module-card-item').toArray().map<IMovie>(el => {
      const $el = $(el)
      const title = $el.find('.module-card-item-title a').text().trim()
      const id = $el.find('.module-card-item-title a').attr('href') || ''
      const cover = $el.find('img').attr('data-original') || ''
      const remark = $el.find('.module-item-note').text().trim()

      return {
        id,
        title,
        cover: `https://www.nivod.vip${cover}`,
        desc: '',
        remark,
        playlist: []
      }
    })
  }

  async parseIframe(): Promise<string> {
    const iframe = env.get('iframe')
    const html = await req(`https://www.nivod.vip${iframe}`)
    const match = html.match(/"url":"(https?:\\\/\\\/[^"]+\.m3u8)"/)
    if (match) {
      return match[1].replace(/\\\//g, '/')
    }
    return ''
  }
}

// import { kitty, req } from 'utils'

export default class Fengche implements Handle {
  getConfig() {
    return {
      id: 'fengche',
      name: '风车动漫_WEB',
      api: 'https://www.fengche.one',
      type: 1,
      nsfw: false
    }
  }

  async getCategory() {
    return [
      { text: '日本动漫', id: 'ribendongman' },
      { text: '国产动漫', id: 'guochandongman' },
      { text: '动漫电影', id: 'dongmandianying' },
      { text: '欧美动漫', id: 'oumeidongman' }
    ]
  }

  async getHome() {
    const cate = env.get('category') || 'ribendongman'
    const page = env.get('page') || '1'
    const url = `${env.baseUrl}/type/${cate}-${page}.html`
    const html = await req(url)
    const $ = kitty.load(html)

    return $('.c2_list li').toArray().map(item => {
      const el = $(item)
      const a = el.find('a.tcl-img')
      return {
        id: a.attr('href') ?? '',
        title: a.attr('title') ?? '',
        cover: el.find('div.tc_img').attr('data-original') ?? '',
        remark: el.find('p.tc_wz').text().trim(),
        playlist: []
      }
    })
  }

  async getDetail() {
    const id = env.get('movieId')
    const html = await req(`${env.baseUrl}${id}`)
    const $ = kitty.load(html)

    const title = $('div.name a').text().trim()
    const desc = $('p.time').text().trim()
    const cover = $('div.tc_img').attr('data-original') ?? ''
    const remark = $('p.tc_wz').text().trim()

    const playlists: IPlaylist[] = []
    $('.play_list ul').each((_, ul) => {
      const tabTitle = $(ul).prev('h2').text().trim() || '默认线路'
      const videos: IPlaylistVideo[] = $(ul).find('li').toArray().map(li => {
        const a = $(li).find('a')
        return {
          text: a.text().trim(),
          id: a.attr('href') ?? ''
        }
      })
      if (videos.length > 0) {
        playlists.push({ title: tabTitle, videos })
      }
    })

    return {
      id,
      title,
      cover: cover.startsWith('//') ? `https:${cover}` : cover,
      desc,
      remark,
      playlist: playlists
    }
  }

  async getSearch() {
    const wd = env.get('keyword')
    const page = env.get('page') || '1'
    const html = await req(`${env.baseUrl}/search/${wd}-${page}.html`)
    const $ = kitty.load(html)

    return $('.c2_list li').toArray().map(item => {
      const el = $(item)
      const a = el.find('a.tcl-img')
      return {
        id: a.attr('href') ?? '',
        title: a.attr('title') ?? '',
        cover: el.find('div.tc_img').attr('data-original') ?? '',
        remark: el.find('p.tc_wz').text().trim(),
        playlist: []
      }
    })
  }

  async parseIframe() {
    return env.get('id') // ✅ 小猫自动解析 iframe 地址
  }
}

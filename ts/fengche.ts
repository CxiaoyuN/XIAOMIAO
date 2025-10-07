// import { env, req, kitty } from 'kitty-js'

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

  async getSearch() {
    const keyword = env.get('keyword')
    const page = env.get('page') || '1'
    const url = `${env.baseUrl}/search/${keyword}-${page}.html`
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
    const url = `${env.baseUrl}${id}`
    const html = await req(url)
    const $ = kitty.load(html)

    const title = $('div.con_name h1 span').text().trim()
    const cover = $('div.leftimg .img_wrapper').attr('data-original') ?? ''
    const remark = $('p.zy span').text().trim()

    // 使用“详细剧情”作为简介
    const desc = $('div:contains("详细剧情")').next().text().trim()

    const playlist: IPlaylist[] = []

    $('div.tab-content').each((i, el) => {
      const tabTitle = $(el).attr('id')?.replace('tab_con_playlist_', '') || `线路${i + 1}`
      const videos: IPlaylistVideo[] = $(el).find('ul.con_c2_list li a').toArray().map(a => {
        const $a = $(a)
        const href = $a.attr('href') ?? ''
        return {
          text: $a.text().trim(),
          id: href.startsWith('/') ? `${env.baseUrl}${href}` : href
        }
      })
      if (videos.length > 0) {
        playlist.push({
          title: `线路${tabTitle}`,
          videos
        })
      }
    })

    return {
      id,
      title,
      cover: cover.startsWith('//') ? `https:${cover}` : cover,
      remark,
      desc,
      playlist
    }
  }

  async parseIframe() {
    return env.get('id') // 小猫自动处理 iframe 播放地址
  }
}

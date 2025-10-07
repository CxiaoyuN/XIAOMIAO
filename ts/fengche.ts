// import { env, req, kitty } from 'kitty-js'

export default {
  getConfig() {
    return {
      id: 'fengche',
      name: '风车动漫',
      api: 'https://www.fengche.one',
      type: 1,
      nsfw: false
    }
  },

  async getCategory() {
    return [
      { text: '日本动漫', id: 'ribendongman' },
      { text: '国产动漫', id: 'guochandongman' },
      { text: '动漫电影', id: 'dongmandianying' },
      { text: '欧美动漫', id: 'oumeidongman' }
    ]
  },

  async getHome() {
    const cate = env.get('category') || 'ribendongman'
    const page = env.get('page') || '1'
    const url = `${env.baseUrl}/type/${cate}-${page}.html`
    const html = await req(url)
    const $ = kitty.load(html)

    return $('.c2_list li').toArray().map(item => {
      const el = $(item)
      const a = el.find('a.tcl-img')
      const img = el.find('div.tc_img').attr('data-original') || ''
      const title = a.attr('title') || ''
      const id = a.attr('href') || ''
      const remark = el.find('p.tc_wz').text() || ''
      return {
        id,
        title,
        cover: img.startsWith('//') ? `https:${img}` : img,
        desc: '',
        remark,
        playlist: []
      }
    })
  },

  async getSearch() {
    const keyword = env.get('keyword')
    const page = env.get('page') || '1'
    const url = `${env.baseUrl}/search/${keyword}-${page}.html`
    const html = await req(url)
    const $ = kitty.load(html)

    return $('.c2_list li').toArray().map(item => {
      const el = $(item)
      const a = el.find('a.tcl-img')
      const img = el.find('div.tc_img').attr('data-original') || ''
      const title = a.attr('title') || ''
      const id = a.attr('href') || ''
      const remark = el.find('p.tc_wz').text() || ''
      return {
        id,
        title,
        cover: img.startsWith('//') ? `https:${img}` : img,
        desc: '',
        remark,
        playlist: []
      }
    })
  },

  async getDetail() {
    const id = env.get('movieId')
    const url = `${env.baseUrl}${id}`
    const html = await req(url)
    const $ = kitty.load(html)

    const title = $('div.name a').text()
    const cover = $('div.tc_img').attr('data-original') || ''
    const remark = $('p.tc_wz').text() || ''
    const desc = $('p.time').text() || ''

    const playlist = $('.play_list ul').toArray().map(ul => {
      const name = $(ul).prev('h2').text().trim()
      const list = $(ul).find('li').toArray().map(li => {
        const a = $(li).find('a')
        return {
          text: a.text(),
          id: a.attr('href')
        }
      })
      return {
        title: name,
        videos: list
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
  },

  async parseIframe() {
    return kitty.utils.getM3u8WithIframe(env)
  }
}

export default class LiuYueTingShu implements Handle {
  getConfig() {
    return {
      id: '5weiting',
      name: '六月听书网',
      api: 'http://www.5weiting.com',
      type: 1,
      nsfw: false
    }
  }

  async getCategory() {
    return [
      { text: '玄幻奇幻', id: '/ys/t1' },
      { text: '都市言情', id: '/ys/t2'},
      { text: '修真武侠', id: '/ys/t3'},
      { text: '恐怖灵异', id: '/ys/t4'},
      { text: '古今言情', id: '/ys/t5' },
      { text: '穿越重生', id: '/ys/t6'},
      { text: '评书', id: '/ys/t7'},
      { text: '历史', id: '/ys/t8'},
      { text: '军事', id: '/ys/t9'},
      { text: '粤语', id: '/ys/t10'},
      { text: '悬疑推理', id: '/ys/t11'},
      { text: '儿童读物', id: '/ys/t12'},
      { text: '广播剧', id: '/ys/t13'}
    ]
  }

  async getHome() {
    const html = await req(`${env.api}/`)
    const $ = kitty.load(html)
    return $('.m4-list .item').toArray().map(item => {
      const title = $(item).find('img').attr('alt') ?? ''
      const cover = 'http:' + ($(item).find('img').attr('data-src') ?? '')
      const id = $(item).find('a.link').attr('href') ?? ''
      const remark = $(item).find('.tag1').text().trim()
      return { id, title, cover, desc: '', remark, playlist: [] }
    })
  }

  async getCategoryDetail(id: string, pg: number) {
    const html = await req(`${env.api}${id}/o1/p${pg}`)
    const $ = kitty.load(html)
    return $('.album-list .album-item').toArray().map(item => {
      const title = $(item).find('.book-item-name a').text().trim()
      const cover = $(item).find('.book-item-img img').attr('src') ?? ''
      const id = $(item).find('.book-item-name a').attr('href') ?? ''
      const desc = $(item).find('.book-item-desc').text().trim()
      const remark = $(item).find('.book-item-status').text().trim()
      return { id, title, cover, desc, remark, playlist: [] }
    })
  }

  async getDetail(id: string) {
    const html = await req(`${env.api}${id}`)
    const $ = kitty.load(html)
    const title = $('h1').text().trim()
    const cover = $('img.cover').attr('src') ?? ''
    const desc = $('.desc').text().trim()
    const remark = $('.info').text().trim()
    const playlist = $('.playlist a').toArray().map(a => {
      const href = $(a).attr('href') ?? ''
      const name = $(a).text().trim()
      return { name, id: href }
    })
    return { id, title, cover, desc, remark, playlist }
  }

  async parseIframe(id: string) {
    const html = await req(`${env.api}${id}`)
    const match = html.match(/audioUrl\s*=\s*"([^"]+)"/)
    if (match) {
      return match[1]
    }
    return ''
  }
}

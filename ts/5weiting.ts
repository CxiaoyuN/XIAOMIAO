export default class LiuYueTingShu implements Handle {
  getConfig() {
    return {
      id: '5weiting',
      name: '六月听书网',
      api: 'http://www.5weiting.com',
      type: 1,
      nsfw: false,
      extra: {
        js: {
          category: 'getCategory',
          home: 'getHome',
          detail: 'getDetail',
          search: 'getSearch',
          parseIframe: 'parseIframe'
        }
      }
    }
  }

  async getCategory() {
    return [
      { text: '玄幻奇幻', id: '/ys/t1' },
      { text: '都市言情', id: '/ys/t28' },
      { text: '修真武侠', id: '/ys/t2' },
      { text: '恐怖灵异', id: '/ys/t3' },
      { text: '古今言情', id: '/ys/t4' },
      { text: '穿越重生', id: '/ys/t5' },
      { text: '评书大全', id: '/ys/t8' },
      { text: '历史纪实', id: '/ys/t12' },
      { text: '军事', id: '/ys/t13' },
      { text: '悬疑推理', id: '/ys/t14' },
      { text: '儿童读物', id: '/ys/t16' },
      { text: '广播剧', id: '/ys/t17' }
    ]
  }

  async getHome() {
    const html = await req(`${env.api}/`)
    const $ = kitty.load(html)
    return $('.album-list .album-item').toArray().map(item => {
      const title = $(item).find('.book-item-name a').text().trim()
      const id = $(item).find('.book-item-name a').attr('href') ?? ''
      const cover = $(item).find('.book-item-img img').attr('src') ?? ''
      const remark = $(item).find('.book-item-status').text().replace('状态：', '').trim()
      const desc = $(item).find('.book-item-desc').text().trim()
      return { id, title, cover, desc, remark, playlist: [] }
    })
  }

  async getCategoryDetail(id: string, pg: number) {
    const html = await req(`${env.api}${id}/o1/p${pg}`)
    const $ = kitty.load(html)
    return $('.album-list .album-item').toArray().map(item => {
      const title = $(item).find('.book-item-name a').text().trim()
      const id = $(item).find('.book-item-name a').attr('href') ?? ''
      const cover = $(item).find('.book-item-img img').attr('src') ?? ''
      const remark = $(item).find('.book-item-status').text().replace('状态：', '').trim()
      const desc = $(item).find('.book-item-desc').text().trim()
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

  async getSearch(keyword: string, pg: number) {
    const html = await req(`${env.api}/search/${encodeURIComponent(keyword)}/1/p${pg}`)
    const $ = kitty.load(html)
    return $('.album-list .album-item').toArray().map(item => {
      const title = $(item).find('.book-item-name a').text().trim()
      const id = $(item).find('.book-item-name a').attr('href') ?? ''
      const cover = $(item).find('.book-item-img img').attr('src') ?? ''
      const remark = $(item).find('.book-item-status').text().replace('状态：', '').trim()
      const desc = $(item).find('.book-item-desc').text().trim()
      return { id, title, cover, desc, remark, playlist: [] }
    })
  }
}

export default class LiuYueTingShu implements Handle {
  getConfig() {
    return {
      id: '5weiting',
      name: '六月听书网',
      type: 1,
      api: 'http://www.5weiting.com',
      nsfw: false
    }
  }

  async getCategory() {
    return [
      { text: '玄幻奇幻', id: '/ys/t1' },
      { text: '修真武侠', id: '/ys/t2' },
      { text: '恐怖灵异', id: '/ys/t3' },
      { text: '古今言情', id: '/ys/t4' },
      { text: '都市言情', id: '/ys/t28' },
      { text: '穿越重生', id: '/ys/t5' },
      { text: '粤语古仔', id: '/ys/t6' },
      { text: '网游小说', id: '/ys/t7' },
      { text: '评书大全', id: '/ys/t8' },
      { text: '相声小品', id: '/ys/t9' },
      { text: '百家讲坛', id: '/ys/t10' },
      { text: '通俗文学', id: '/ys/t11' },
      { text: '历史纪实', id: '/ys/t12' },
      { text: '军事', id: '/ys/t13' },
      { text: '悬疑推理', id: '/ys/t14' },
      { text: '官场商战', id: '/ys/t15' },
      { text: '儿童读物', id: '/ys/t16' },
      { text: '广播剧', id: '/ys/t17' },
      { text: 'ebc5系列', id: '/ys/t18' },
      { text: '商业', id: '/ys/t19' },
      { text: '生活', id: '/ys/t20' },
      { text: '教材', id: '/ys/t21' },
      { text: '外文原版', id: '/ys/t22' },
      { text: '期刊杂志', id: '/ys/t23' },
      { text: '脱口秀', id: '/ys/t27' },
      { text: '戏曲', id: '/ys/t24' }
    ]
  }

  async getCategoryDetail() {
    const id = env.get('categoryId')
    const page = env.get('page') || 1
    const html = await req(`${env.baseUrl}${id}/o1/p${page}`)
    const $ = kitty.load(html)
    const result = $('.album-item').toArray().map(item => {
      const title = $(item).find('.book-item-name a').text().trim()
      const id = $(item).find('.book-item-name a').attr('href') ?? ''
      const cover = $(item).find('.book-item-img img').attr('src') ?? ''
      const remark = $(item).find('.book-item-status').text().trim()
      const desc = $(item).find('.book-item-desc').text().trim()
      return { id, title, cover, desc, remark, playlist: [] }
    })
    return result
  }

  async getHome() {
    const html = await req(`${env.baseUrl}/ys/t1/o1/p1`)
    const $ = kitty.load(html)
    const result = $('.album-item').toArray().map(item => {
      const title = $(item).find('.book-item-name a').text().trim()
      const id = $(item).find('.book-item-name a').attr('href') ?? ''
      const cover = $(item).find('.book-item-img img').attr('src') ?? ''
      const remark = $(item).find('.book-item-status').text().trim()
      const desc = $(item).find('.book-item-desc').text().trim()
      return { id, title, cover, desc, remark, playlist: [] }
    })
    return result
  }

  async getDetail() {
    const id = env.get('movieId')
    const html = await req(`${env.baseUrl}${id}`)
    const $ = kitty.load(html)
    const title = $('h1').text().trim()
    const cover = $('.bookimg img').attr('src') ?? ''
    const remark = $('.bookinfo .author').text().trim()
    const desc = $('.bookinfo .intro').text().trim()
    const playlist = [{
      title: '播放列表',
      videos: $('.book-play-list li a').toArray().map(a => {
        const text = $(a).text().trim()
        const url = $(a).attr('href') ?? ''
        return { text, url, type: 'iframe' }
      })
    }]
    return { id, title, cover, remark, desc, playlist }
  }

  async parseIframe() {
    const iframe = env.get('iframe')
    const html = await req(`${env.baseUrl}${iframe}`)
    const match = html.match(/"(http:\/\/61\.160\.194\.89:20001\/[^"]+\.mp3[^"]*)"/)
    if (match) {
      return { type: 'mp3', url: match[1] }
    }
    return null
  }

  async getSearch() {
    const keyword = env.get('keyword')
    const html = await req(`${env.baseUrl}/search?searchword=${encodeURIComponent(keyword)}`)
    const $ = kitty.load(html)
    const result = $('.album-item').toArray().map(item => {
      const title = $(item).find('.book-item-name a').text().trim()
      const id = $(item).find('.book-item-name a').attr('href') ?? ''
      const cover = $(item).find('.book-item-img img').attr('src') ?? ''
      const remark = $(item).find('.book-item-status').text().trim()
      const desc = $(item).find('.book-item-desc').text().trim()
      return { id, title, cover, desc, remark, playlist: [] }
    })
    return result
  }
}

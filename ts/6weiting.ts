export default class LiuYueTingShu implements Handle {
  getConfig() {
    return {
      id: '5weiting',
      name: '六月听书',
      api: 'http://www.5weiting.com',
      type: 1,
      nsfw: false
    }
  }

  async getCategory() {
    return [
      { text: '玄幻奇幻', id: '/ys/t1', extra: { icon: '🌀' } },
      { text: '都市言情', id: '/ys/t28', extra: { icon: '🏙️' } },
      { text: '修真武侠', id: '/ys/t2', extra: { icon: '⚔️' } },
      { text: '恐怖灵异', id: '/ys/t3', extra: { icon: '👻' } },
      { text: '古今言情', id: '/ys/t4', extra: { icon: '📖' } },
      { text: '穿越重生', id: '/ys/t5', extra: { icon: '🕰️' } },
      { text: '粤语古仔', id: '/ys/t6', extra: { icon: '🎧' } },
      { text: '网游小说', id: '/ys/t7', extra: { icon: '🕹️' } },
      { text: '评书大全', id: '/ys/t8', extra: { icon: '🎙️' } },
      { text: '相声小品', id: '/ys/t9', extra: { icon: '😂' } },
      { text: '百家讲坛', id: '/ys/t10', extra: { icon: '📚' } },
      { text: '通俗文学', id: '/ys/t11', extra: { icon: '📘' } },
      { text: '历史纪实', id: '/ys/t12', extra: { icon: '🏺' } },
      { text: '军事', id: '/ys/t13', extra: { icon: '🪖' } },
      { text: '悬疑推理', id: '/ys/t14', extra: { icon: '🕵️‍♂️' } },
      { text: '官场商战', id: '/ys/t15', extra: { icon: '💼' } },
      { text: '儿童读物', id: '/ys/t16', extra: { icon: '🧒' } },
      { text: '广播剧', id: '/ys/t17', extra: { icon: '📻' } },
      { text: 'ebc5系列', id: '/ys/t18', extra: { icon: '🎞️' } },
      { text: '商业', id: '/ys/t19', extra: { icon: '📈' } },
      { text: '生活', id: '/ys/t20', extra: { icon: '🛋️' } },
      { text: '教材', id: '/ys/t21', extra: { icon: '📖' } },
      { text: '外文原版', id: '/ys/t22', extra: { icon: '🌍' } },
      { text: '期刊杂志', id: '/ys/t23', extra: { icon: '📰' } },
      { text: '脱口秀', id: '/ys/t27', extra: { icon: '🎤' } },
      { text: '戏曲', id: '/ys/t24', extra: { icon: '🎭' } }
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
}
